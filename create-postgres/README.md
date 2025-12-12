# create-postgres

`create-postgres` is an alias for [`create-db`](https://www.npmjs.com/package/create-db) - an open-source CLI tool and library that provisions [**temporary Prisma Postgres databases**](https://www.prisma.io/postgres?utm_source=create_db_npm_docs) with a single command.

Each database is available for **24 hours** by default. To keep the database permanently, you can **claim it for free** using the URL displayed in the output.

## Quick Start

```bash
npx create-postgres@latest
```

## CLI Usage

```bash
# Create database in auto-detected nearest region
npx create-postgres

# Create database in a specific region
npx create-postgres --region eu-west-3
npx create-postgres -r us-east-1

# Interactive region selection
npx create-postgres --interactive
npx create-postgres -i

# Output as JSON
npx create-postgres --json
npx create-postgres -j

# Write connection string to .env file
npx create-postgres --env .env
npx create-postgres -e .env.local

# List available regions
npx create-postgres regions
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--region <region>` | `-r` | AWS region for the database |
| `--interactive` | `-i` | Interactive mode to select a region |
| `--json` | `-j` | Output machine-readable JSON |
| `--env <path>` | `-e` | Write DATABASE_URL and CLAIM_URL to specified .env file |
| `--help` | `-h` | Show help message |

## Programmatic API

```typescript
import { create, regions } from "create-postgres";

// Create a database
const result = await create({ region: "us-east-1" });

if (result.success) {
  console.log(`Connection string: ${result.connectionString}`);
  console.log(`Claim URL: ${result.claimUrl}`);
} else {
  console.error(`Error: ${result.message}`);
}

// List available regions
const availableRegions = await regions();
```

## Aliases

You can also use:

```bash
npx create-db@latest
npx create-pg@latest
```

## Documentation

For full documentation, see the [create-db README](https://github.com/prisma/create-db/tree/main/create-db#readme).
