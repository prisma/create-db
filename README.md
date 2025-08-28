# Create DB

Create temporary Prisma Postgres databases that you can claim permanently.

## Overview

This monorepo contains tools and services that enable developers to quickly provision temporary Prisma Postgres databases and optionally claim ownership to make them permanent. The system consists of:

1. **CLI Tools** - Command-line interfaces for database creation
2. **Cloudflare Workers** - Backend services for database management and OAuth authentication
3. **Monorepo Infrastructure** - Shared tooling and versioning

## CLI Reference

### Available Flags

| Flag             | Description                                       | Example              |
| ---------------- | ------------------------------------------------- | -------------------- |
| `--region`       | Specify database region                           | `--region us-east-1` |
| `--list-regions` | List available regions                            | `--list-regions`     |
| `--interactive`  | Enable interactive region selection               | `--interactive`      |
| `--help`         | Show help information                             | `--help`             |
| `--json`         | Output the info in a JSON format                  | `--json`             |
| `--env`, `-e`    | Print DATABASE_URL to stdout; claim URL to stderr | `--env`              |

### Examples

```bash
# Create database with specific region
npx create-db --region eu-west-1

# List available regions
npx create-db --list-regions

# Interactive mode
npx create-db --interactive

# Output in JSON format
npx create-db --json

# Show help
npx create-db --help

# Get --env response into .env
npx create-db --env > .env # Only DATABASE_URL
npx create-db --env > .env 2>&1 # Both DATABASE_URL and Claim URL

# Alternative command shorthand names work the same way
npx create-pg -r us-east-1
npx create-pg -j
```

## Packages

### CLI Tools

#### `create-db` (Main Package)

- **Purpose**: Primary CLI tool for creating temporary Prisma Postgres databases
- **Commands**: `create-db`, `create-postgres`, `create-pg`
- **Features**:
  - Interactive region selection
  - Custom region specification
  - Connection string output
  - Claim URL generation
  - Analytics tracking

#### `create-pg` & `create-postgres` (Alias Packages)

- **Purpose**: Alternative command names for the same functionality
- **Dependencies**: Workspace dependency on `create-db`
- **Usage**: Provides `create-pg` and `create-postgres` commands

### Backend Services

#### `create-db-worker` (Cloudflare Worker)

- **Purpose**: Handles database creation via Prisma API
- **Features**:
  - Rate limiting (100 requests/minute)
  - Region listing endpoint
  - Automatic 24-hour deletion scheduling
  - Health check endpoint
  - Analytics tracking

**API Endpoints**:

- `GET /health` - Service health check
- `GET /regions` - List available Prisma Postgres regions
- `POST /create` - Create new database project

#### `claim-db-worker` (Cloudflare Worker)

- **Purpose**: Handles OAuth-based database ownership transfer
- **Features**:
  - Prisma OAuth authentication
  - Rate limiting (100 requests/minute)
  - Secure project transfer
  - User-friendly HTML interfaces
  - Analytics tracking

**API Endpoints**:

- `GET /claim?projectID=...` - Show claim page
- `GET /auth/callback` - OAuth callback handler

## Quick Start

### Using the CLI

```bash
# Create a database with default settings
npx create-db

# Create a database in a specific region
npx create-db --region us-east-1

# Interactive mode to select region
npx create-db --interactive

# Alternative command names
npx create-pg --region eu-west-1
npx create-postgres --interactive
```

### Environment Setup

For local development, create a `.env` file in the `create-db/` directory:

```env
# Local development
CREATE_DB_WORKER_URL="http://127.0.0.1:8787"
CLAIM_DB_WORKER_URL="http://127.0.0.1:9999"

# Production (default)
# CREATE_DB_WORKER_URL="https://create-db-temp.prisma.io"
# CLAIM_DB_WORKER_URL="https://create-db.prisma.io"
```

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (for worker development)

### Installation

````bash
# Clone the repository
git clone https://github.com/prisma/create-db.git
cd create-db

# Install dependencies
pnpm install

# Install dependencies for each package
cd create-db-worker && pnpm install
cd ../claim-db-worker && pnpm install
cd ../create-db && pnpm install

### Local Development

#### 1. Configure Environment Variables

**Create DB Worker** (`create-db-worker/.dev.vars`):

```env
INTEGRATION_TOKEN=your_prisma_integration_token
````

**Claim DB Worker** (`claim-db-worker/.dev.vars`):

```env
INTEGRATION_TOKEN=your_prisma_integration_token
CLIENT_SECRET=your_oauth_client_secret
CLIENT_ID=your_oauth_client_id
POSTHOG_API_KEY=your_posthog_key
POSTHOG_API_HOST=your_posthog_host
```

#### 2. Start Workers

```bash
# Start Create DB Worker
cd create-db-worker
npx wrangler dev

# Start Claim DB Worker (in another terminal)
cd claim-db-worker
npx wrangler dev --port 9999
```

#### 3. Test CLI

```bash
cd create-db
npx create-db
npx create-db --region us-east-1
npx create-db --interactive
```

### Testing

```bash
# Test workers
cd create-db-worker && pnpm test
cd ../claim-db-worker && pnpm test

# Test CLI (manual testing)
cd create-db
npx create-db --help
```

## Architecture

### Database Lifecycle

1. **Creation**: User runs CLI → Worker creates Prisma project → Returns connection string
2. **Usage**: User gets 24 hours to work with the database
3. **Claiming**: User can claim ownership via OAuth (optional)
4. **Deletion**: Unclaimed databases are automatically deleted after 24 hours

### Rate Limiting

Both workers implement rate limiting:

- **Limit**: 100 requests per minute
- **Scope**: Global per worker
- **Configuration**: Managed via Cloudflare Rate Limit bindings

### Analytics

The system tracks usage via PostHog:

- Database creation events
- Claim attempts and successes
- Error tracking
- Usage patterns

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

### Publish CLI Packages

```bash
# Version and publish all packages
pnpm changeset version
pnpm changeset publish --filter create-db
pnpm changeset publish --filter create-pg
pnpm changeset publish --filter create-postgres
```

## Configuration

### Worker Configuration

**Create DB Worker** (`create-db-worker/wrangler.jsonc`):

- Rate limiting: 100 requests/minute
- Workflow: Delete DB workflow for 24-hour deletion
- Analytics: Create DB dataset tracking

**Claim DB Worker** (`claim-db-worker/wrangler.jsonc`):

- Rate limiting: 100 requests/minute
- Assets: Static files for HTML templates
- Analytics: Create DB dataset tracking

### Environment Variables

| Variable               | Purpose                | Location             |
| ---------------------- | ---------------------- | -------------------- |
| `CREATE_DB_WORKER_URL` | Create worker endpoint | `create-db/.env`     |
| `CLAIM_DB_WORKER_URL`  | Claim worker endpoint  | `create-db/.env`     |
| `INTEGRATION_TOKEN`    | Prisma API access      | Worker secrets       |
| `CLIENT_SECRET`        | OAuth secret           | Claim worker secrets |
| `CLIENT_ID`            | OAuth client ID        | Claim worker secrets |
| `POSTHOG_API_KEY`      | Analytics key          | Claim worker secrets |
| `POSTHOG_API_HOST`     | Analytics host         | Claim worker secrets |

## API Reference

### Create DB Worker

#### `GET /health`

Health check endpoint.

**Response**:

```json
{
  "status": "ok",
  "service": "create-db",
  "timestamp": 1234567890
}
```

#### `GET /regions`

List available Prisma Postgres regions.

**Response**: Array of region objects from Prisma API

#### `POST /create`

Create a new database project.

**Request Body**:

```json
{
  "region": "us-east-1",
  "name": "my-project"
}
```

**Response**: Prisma API project creation response

### Claim DB Worker

#### `GET /claim?projectID=<id>`

Show claim page for a specific project.

#### `GET /auth/callback`

OAuth callback handler for Prisma authentication.

## Project Structure

```
create-db/
├── create-db/                 # Main CLI package
│   ├── index.js              # CLI entry point
│   ├── analytics.js          # Analytics tracking
│   └── package.json
├── create-db-worker/         # Database creation worker
│   ├── src/
│   │   ├── index.ts         # Main worker logic
│   │   └── delete-workflow.ts # 24-hour deletion workflow
│   └── wrangler.jsonc
├── claim-db-worker/          # Database claiming worker
│   ├── src/
│   │   ├── index.ts         # Main worker logic
│   │   └── templates/       # HTML templates
│   └── wrangler.jsonc
├── create-pg/               # CLI alias package
├── create-postgres/         # CLI alias package
├── package.json            # Monorepo configuration
└── pnpm-workspace.yaml     # Workspace definition
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with the development setup
5. Submit a pull request

### Development Workflow

1. **Local Testing**: Use `wrangler dev` for worker development
2. **CLI Testing**: Test changes in the `create-db` package
3. **Versioning**: Use changesets for version management
4. **Deployment**: Deploy workers and publish packages as needed
