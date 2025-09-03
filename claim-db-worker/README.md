# Claim DB Worker

A Cloudflare Worker for claiming Prisma databases. This worker handles OAuth authentication with Prisma and transfers database projects to authenticated users.

## Features

- ✅ OAuth authentication with Prisma
- ✅ Database project claiming
- ✅ Rate limiting (100 requests per minute)
- ✅ PostHog analytics tracking
- ✅ Cloudflare Analytics Engine integration
- ✅ Error handling and user feedback
- ✅ Responsive UI with Tailwind CSS

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   CLIENT_ID=your_prisma_client_id
   CLIENT_SECRET=your_prisma_client_secret
   INTEGRATION_TOKEN=your_prisma_integration_token
   POSTHOG_API_KEY=your_posthog_api_key
   POSTHOG_API_HOST=https://app.posthog.com
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the flow:**
   Visit `http://localhost:3000/?projectID=test123`

### Production Deployment

1. **Set up Cloudflare secrets:**
   ```bash
   wrangler secret put CLIENT_ID
   wrangler secret put CLIENT_SECRET
   wrangler secret put INTEGRATION_TOKEN
   wrangler secret put POSTHOG_API_KEY
   wrangler secret put POSTHOG_API_HOST
   ```

2. **Build and deploy:**
   ```bash
   npm run deploy
   ```

## API Endpoints

- **`/api/claim`** - Generates OAuth URLs and tracks page views
- **`/api/auth/callback`** - Handles OAuth callback and project transfer
- **`/api/test`** - Rate limit testing endpoint
- **`/api/success-test`** - Test endpoint for success page

## Pages

- **`/`** - Homepage (redirects to claim flow if projectID provided)
- **`/claim`** - Claim page with OAuth button
- **`/success`** - Success page after claiming
- **`/error`** - Error page for various error states

## Flow

1. User visits `/?projectID=123`
2. Homepage redirects to `/api/claim?projectID=123`
3. API generates OAuth URL and redirects to `/claim?projectID=123&authUrl=...`
4. User clicks OAuth, redirects to `/api/auth/callback`
5. API exchanges code for token and transfers project
6. API redirects to `/success?projectID=123`

## Configuration

The project uses Cloudflare Worker bindings:
- Rate limiting via `CLAIM_DB_RATE_LIMITER` binding
- Analytics via `CREATE_DB_DATASET` binding
- Environment variables as secrets

See `wrangler.jsonc` for the complete configuration.

## Development vs Production

- **Development**: Uses `process.env` with graceful fallbacks for rate limiting and analytics
- **Production**: Uses Cloudflare Worker bindings via `globalThis`

The `lib/env.ts` utility handles this automatically.

## Testing

- **Local testing**: `npm run dev` then visit with projectID
- **Rate limit testing**: Visit `/api/test`
- **Success page testing**: Visit `/api/success-test`
