# Create DB Worker

Cloudflare Worker that creates Prisma database projects via the Prisma API.

## API Endpoints

- `POST /create` - Create a new database project
- `GET /regions` - List available regions

## Key Files

- **Main Logic:** [`src/index.ts`](src/index.ts) - Handles routing, project creation, and rate limiting
- **Delete Workflow:** [`src/delete-workflow.ts`](src/delete-workflow.ts) - 24-hour delayed deletion logic
- **Rate Limiter:** [`src/rate-limiter.ts`](src/rate-limiter.ts) - 100 requests/minute limit
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
```

## Deployment

```bash
npx wrangler deploy
```

## Monitoring

[Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/create-db-worker/production/metrics)
