# Claim DB Worker

Cloudflare Worker that handles database ownership transfer via OAuth authentication.

## API Endpoints

- `GET /claim?projectID=...` - Show claim page
- `GET /auth/callback` - OAuth callback handler

## Key Files

- **Main Logic:** [`src/index.ts`](src/index.ts) - OAuth flow, project transfer, and rate limiting
- **Rate Limiter:** [`src/rate-limiter.ts`](src/rate-limiter.ts) - 100 requests/minute limit
- **Claim Template:** [`src/templates/claim-template.ts`](src/templates/claim-template.ts) - Initial claim page
- **Success Template:** [`src/templates/claim-success-template.ts`](src/templates/claim-success-template.ts) - Success page
- **Configuration:** [`wrangler.jsonc`](wrangler.jsonc) - KV namespace and deployment settings

## Development

```bash
npm install
npx wrangler dev
```

## Secrets

Create `.dev.vars` for local development:
```env
INTEGRATION_TOKEN=your_integration_token_here
CLIENT_SECRET=your_client_secret_here
```

## Deployment

```bash
npx wrangler deploy
```

## Monitoring

[Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/claim-db-worker/production/metrics)
