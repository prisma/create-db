# Create DB CLI

CLI tool for provisioning a temporary Prisma Postgres databases.

## Usage

```bash
npx create-pg                    # Default region (us-east-1)
npx create-pg --region eu-west-1 # Custom region
npx create-pg --i               # Interactive region selection
```

## Key Files

- **Main Logic:** [`index.js`](index.js) - Argument parsing, API requests, and output
- **Configuration:** [`package.json`](package.json) - CLI entry point and dependencies
- **Environment:** `.env` - Worker endpoints configuration

## Development

```bash
npm install
```

Create `.env` for local development:

```env
# LOCAL
CREATE_DB_WORKER_URL="http://127.0.0.1:8787"
CLAIM_DB_WORKER_URL="http://127.0.0.1:8787"

# PROD
# CLAIM_DB_WORKER_URL="https://create-db.prisma.io"
# CREATE_DB_WORKER_URL="https://create-db-temp.prisma.io"
```

If running both workers locally, use a different port for one and update the URL:

```env
CREATE_DB_WORKER_URL="http://127.0.0.1:9999"
CLAIM_DB_WORKER_URL="http://127.0.0.1:8787"
```

## Test Locally

```bash
npx create-pg
npx create-pg --region eu-west-1
npx create-pg --i
```
