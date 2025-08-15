import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'success',
      service: 'claim-db-worker',
      timestamp: Date.now(),
      message: 'Rate limit test endpoint - if you see this, rate limiting passed',
    },
    { status: 200 }
  );
}