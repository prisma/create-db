import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

function errorResponse(message: string, details?: string, status = 400): Response {
  return NextResponse.json(
    { error: message, details },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const projectID = searchParams.get('projectID');

  const rateLimitResult = await env.CLAIM_DB_RATE_LIMITER.limit({ key: request.url });
  if (!rateLimitResult.success) {
    return errorResponse("We're experiencing high demand. Please try again later.", undefined, 429);
  }

  async function sendPosthogEvent(event: string, properties: Record<string, any>) {
    const POSTHOG_API_KEY = env.POSTHOG_API_KEY;
    const POSTHOG_PROXY_HOST = env.POSTHOG_API_HOST;

    // Skip analytics if PostHog is not configured
    if (!POSTHOG_API_KEY || !POSTHOG_PROXY_HOST) {
      console.log('PostHog not configured, skipping analytics event:', event);
      return;
    }

    try {
      await fetch(`${POSTHOG_PROXY_HOST}/e`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
        },
        body: JSON.stringify({
          api_key: POSTHOG_API_KEY,
          event,
          properties,
          distinct_id: 'web-claim',
        }),
      });
    } catch (error) {
      console.error('Failed to send PostHog event:', error);
    }
  }

  if (!state) {
    return errorResponse('Missing state parameter.', 'Please try again.');
  }
  if (!projectID) {
    return errorResponse(
      'Missing project ID parameter.',
      'Please ensure you are accessing this page with a valid project ID.',
    );
  }

  const tokenResponse = await fetch('https://auth.prisma.io/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code!,
      redirect_uri: new URL('/api/auth/callback', request.url).toString(),
      client_id: env.CLIENT_ID,
      client_secret: env.CLIENT_SECRET,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    console.error('Token exchange failed:', { status: tokenResponse.status, response: text });
    await sendPosthogEvent('create_db:claim_failed', {
      'project-id': projectID,
      status: tokenResponse.status,
      error: text,
    });
    return errorResponse(
      'Failed to authenticate with Prisma. Please try again.',
      `Status: ${tokenResponse.status}\nResponse: ${text}`,
      500,
    );
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };

  const transferResponse = await fetch(`https://api.prisma.io/v1/projects/${projectID}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
    },
    body: JSON.stringify({ recipientAccessToken: tokenData.access_token }),
  });

  if (transferResponse.ok) {
    try {
      env.CREATE_DB_DATASET.writeDataPoint({
        blobs: ['database_claimed'],
        indexes: ['claim_db'],
      });
    } catch (error) {
      console.error('Failed to write analytics data point:', error);
    }
    
    await sendPosthogEvent('create_db:claim_successful', {
      'project-id': projectID,
    });
    return NextResponse.json({ success: true, projectId: projectID });
  } else {
    const responseText = await transferResponse.text();
    await sendPosthogEvent('create_db:claim_failed', {
      'project-id': projectID,
      status: transferResponse.status,
      error: responseText,
    });
    return errorResponse(
      'Failed to transfer the project. Please try again.',
      `Status: ${transferResponse.status}\nResponse: ${responseText}`,
      500,
    );
  }
  } catch (error) {
    console.error('Callback error:', error);
    return errorResponse(
      'An unexpected error occurred. Please try again.',
      error instanceof Error ? error.message : 'Unknown error',
      500,
    );
  }
}