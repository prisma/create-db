# Create DB Worker

## What it does

This worker creates a db with `https://api.prisma.io/projects` with a default name of `My Prisma Postres Database` in the `us-east-1` region. The user may use flags to change those default values.

## Flags

| Flag                    | Description                      | Default             | Implemented |
| ----------------------- | -------------------------------- | ------------------- | ----------- |
| `--name`                | Name of the database project     | `My Prisma Project` | ✅          |
| `--region`              | Region for the database          | `us-east-1`         | ✅          |
| `--prompt or --prompts` | Whether to prompt for user input | `false`             | ✅          |

## Delete Workflow

The delete workflow works, one a DB is created, it passed the DB `id` to the `DELETE-DB-WORKFLOW`. The `DELETE-DB-WORKFLOW` starts a 24 hour timer, which deletes the DB once over. If the DB is no longer there, it should error out but cause no problems.

## Rate Limiting

## Rate Limiting

Set up for 100 requests per minute max. You can edit the amount here, in `src/index.ts`:

```typescript
const { allowed, reset } = await checkRateLimit({
	kv: env.CREATE_DB_RATE_LIMIT_KV,
	key: 'global-rate-limit',
	limit: 100,
	period: 60,
});
```

I opted for a custom solution in `src/rate-limiter.ts` instead as I could not get their version to work. It is in beta/unsafe so that could be the reasoning. [CF Rate Limiting on Workers Docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## Development

Clone all 3 projects into one parent folder (for testing. These 3 don't need to be together, but the DX is much better to just swap between all 3 in the same IDE (imo))

```bash
mkdir create-db-parent-folder
cd create-db-parent-folder
```

```bash
git clone https://github.com/prisma/create-db-worker.git
git clone https://github.com/prisma/claim-db-worker.git
git clone https://github.com/prisma/create-db.git
```

As this is specifically `create-db-worker`, cd into it.

```bash
cd create-db-worker
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

[Cloudflare Link](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/create-db-worker/production/metrics)
