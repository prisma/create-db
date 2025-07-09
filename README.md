# Create DB Monorepo

This monorepo contains three related projects that work together to provide a complete database provisioning and claiming solution:

1. **`create-db-worker`** - Cloudflare Worker that creates Prisma database projects
2. **`claim-db-worker`** - Cloudflare Worker that handles database ownership transfer
3. **`create-db`** - CLI tool for creating temporary databases

## Overview

This system enables users to quickly provision temporary Prisma Postgres databases and optionally claim ownership to make them permanent. The workflow is:

1. **Create Database** → User runs CLI to create a temporary database
2. **Use Database** → User gets 24 hours to work with the database
3. **Claim Database** → User can claim ownership to make it permanent (optional)


## Architecture

### Create DB Worker (`create-db-worker/`)

**Purpose:** Creates Prisma database projects via the Prisma API.

**Key Features:**

- Supports custom project names and regions
- Applies rate limiting (100 requests/minute)
- Automatically schedules deletion after 24 hours
- Provides regions endpoint for available options

**How it Works:**

1. Receives POST request to `/create` with `region` and `name`
2. Calls Prisma API to create database project
3. Triggers `DeleteDbWorkflow` for 24-hour delayed deletion
4. Returns connection string to user

**Key Files:**

- **Main Logic:** [`src/index.ts`](create-db-worker/src/index.ts)
- **Delete Workflow:** [`src/delete-workflow.ts`](create-db-worker/src/delete-workflow.ts)
- **Rate Limiter:** [`src/rate-limiter.ts`](create-db-worker/src/rate-limiter.ts)
- **Configuration:** [`wrangler.jsonc`](create-db-worker/wrangler.jsonc)

### Claim DB Worker (`claim-db-worker/`)

**Purpose:** Handles database ownership transfer via OAuth authentication.

**Key Features:**

- OAuth authentication with Prisma
- Rate limiting (100 requests/minute)
- Secure project transfer
- User-friendly HTML interfaces

**How it Works:**

1. User visits claim page with `projectID` parameter
2. User authenticates via Prisma OAuth
3. Worker exchanges auth code for access token
4. Worker calls Prisma API to transfer project ownership
5. Shows success/error page to user

**Key Files:**

- **Main Logic:** [`src/index.ts`](claim-db-worker/src/index.ts)
- **Rate Limiter:** [`src/rate-limiter.ts`](claim-db-worker/src/rate-limiter.ts)
- **Claim Template:** [`src/templates/claim-template.ts`](claim-db-worker/src/templates/claim-template.ts)
- **Success Template:** [`src/templates/claim-success-template.ts`](claim-db-worker/src/templates/claim-success-template.ts)
- **Configuration:** [`wrangler.jsonc`](claim-db-worker/wrangler.jsonc)

### Create DB CLI (`create-db/`)

**Purpose:** Command-line interface for creating temporary databases.

**Key Features:**

- Interactive region selection
- Custom region specification
- Connection string output
- Claim URL generation

**How it Works:**

1. Parses command line arguments (`--region`, `--i`)
2. Fetches available regions from worker
3. Sends creation request to worker
4. Outputs connection string and claim URL

**Key Files:**

- **Main Logic:** [`index.js`](create-db/index.js)
- **Configuration:** [`package.json`](create-db/package.json)

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prisma/create-db-monorepo.git
cd create-db-monorepo
```

### 2. Install Dependencies

```bash
pnpm i
# Install dependencies for each project
cd create-db-worker && npm install
cd ../claim-db-worker && npm install
cd ../create-db && npm install
```

### 3. Configure Environment

Create a `.env` file in the `create-db/` directory:

```env
# LOCAL DEVELOPMENT
CREATE_DB_WORKER_URL="http://127.0.0.1:8787"
CLAIM_DB_WORKER_URL="http://127.0.0.1:8787"

# PRODUCTION
# CREATE_DB_WORKER_URL="https://create-db-worker.raycast-0ef.workers.dev"
# CLAIM_DB_WORKER_URL="https://claim-db-worker.raycast-0ef.workers.dev"
```

### 4. Set Up Secrets

For local development, create `.dev.vars` files in both worker directories:

**`create-db-worker/.dev.vars`:**

```env
INTEGRATION_TOKEN=your_integration_token_here
```

**`claim-db-worker/.dev.vars`:**

```env
INTEGRATION_TOKEN=your_integration_token_here
CLIENT_SECRET=your_client_secret_here
```

_Note: Integration tokens and client secrets are stored in 1Password._

### 5. Run Locally

**Start Create DB Worker:**

```bash
cd create-db-worker
npx wrangler dev
```

**Start Claim DB Worker _(different port if also running Create DB Worker)_:**

```bash
cd claim-db-worker
npx wrangler dev --port 9999
```

**Update environment for different ports if needed:**

```env
CREATE_DB_WORKER_URL="http://127.0.0.1:8787"
CLAIM_DB_WORKER_URL="http://127.0.0.1:9999"
```

**Test CLI:**

```bash
cd create-db
npx create-db
npx create-db --region eu-west-1
npx create-db --i
```

## Deployment

### Deploy Workers

```bash
# Deploy Create DB Worker
cd create-db-worker
npx wrangler deploy

# Deploy Claim DB Worker
cd ../claim-db-worker
npx wrangler deploy
```

### Publish CLI

```bash
cd create-db
git add .
git commit -m "..."
git push
```

## Configuration

### Rate Limiting

Both workers use the same rate limiting logic:

- **Default:** 100 requests per minute (global)
- **Location:** `src/rate-limiter.ts` in each worker
- **Configuration:** Edit the `checkRateLimit` call in `src/index.ts`

### OAuth Configuration

The claim worker requires OAuth setup:

- **Callback URL:** Must be configured in Prisma OAuth settings
- **Client Secret:** Stored as Cloudflare secret
- **Integration Token:** Stored as Cloudflare secret

### Database Deletion

Temporary databases are automatically deleted after 24 hours:

- **Implementation:** `DeleteDbWorkflow` class in `create-db-worker/src/delete-workflow.ts`
- **Duration:** 24 hours (configurable)
- **Safety:** Gracefully handles already-deleted projects

## Monitoring

- **Create DB Worker:** [Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/create-db-worker/production/metrics)
- **Claim DB Worker:** [Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/claim-db-worker/production/metrics)

## API Endpoints

### Create DB Worker

- `POST /create` - Create a new database project
- `GET /regions` - List available regions

### Claim DB Worker

- `GET /claim?projectID=...` - Show claim page
- `GET /auth/callback` - OAuth callback handler

## Quick Reference

### Common Tasks

| Task                     | Location                                                |
| ------------------------ | ------------------------------------------------------- |
| Edit rate limits         | `src/index.ts` and `src/rate-limiter.ts` in each worker |
| Edit delete workflow     | `create-db-worker/src/delete-workflow.ts`               |
| Edit claim/success pages | `claim-db-worker/src/templates/`                        |
| Edit CLI logic           | `create-db/index.js`                                    |
| Configure secrets        | Cloudflare dashboard or `.dev.vars`                     |

### Environment Variables

| Variable               | Purpose                | Location             |
| ---------------------- | ---------------------- | -------------------- |
| `CREATE_DB_WORKER_URL` | Create worker endpoint | `create-db/.env`     |
| `CLAIM_DB_WORKER_URL`  | Claim worker endpoint  | `create-db/.env`     |
| `INTEGRATION_TOKEN`    | API access             | Worker secrets       |
| `CLIENT_SECRET`        | OAuth secret           | Claim worker secrets |

## Troubleshooting

### Local Development Issues

1. **Port Conflicts:** Use different ports for workers (`--port 9999`)
3. **Secrets:** Ensure `.dev.vars` files are properly configured

### Common Errors

- **Rate Limit Exceeded:** Wait 1 minute or increase limits
- **OAuth Errors:** Check client secret and callback URL configuration
- **Database Creation Failed:** Verify integration token permissions

## Contributing

1. Clone all three repositories
2. Set up local development environment
3. Make changes in the appropriate project
4. Test locally with the CLI
5. Deploy workers and publish CLI as needed
