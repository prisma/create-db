# Claim DB Worker

## What it does

This worker accepts database connection strings. The user is prompted to log in, then the DB will be claimed and transferred to their account via `https://api.prisma.io/projects/{id}/transfer`

## Rate Limiting

Not implemented yet. The goal is to set up rate limiting at 100 requests per minute. IP rate limiting is not an option due to places like universities sharing the same IP accross many students. A possible idea is to set local rate limiting within the CLI command itself

[CF Rate Limiting on Workers Docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## Development

Clone all 3 projects into one parent folder (for testing. These 3 don't need to be together, but the DX is much better to just swap between all 3 in the same IDE (imo))

```bash
mkdir claim-db-parent-folder
cd claim-db-parent-folder
```

```bash
git clone https://github.com/prisma/create-db-worker.git
git clone https://github.com/prisma/claim-db-worker.git
git clone https://github.com/prisma/create-db.git
```

As this is specifically `claim-db-worker`, cd into it.

```bash
cd claim-db-worker
npm i
```

```bash
# Deploy to staging (change the endpoints in `create-db` to use the staging URL)
npx wrangler deploy --staging

# Deploy to production
npx wrangler deploy
```

## Credentials

The integration token is located as a secret within cloudflare itself, there is nothing local that needs to be set up.

## Monitoring

[Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/claim-db-worker/production/metrics)
