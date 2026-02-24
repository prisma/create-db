# create-db

`create-db` is an open-source CLI tool and library that provisions [**temporary Prisma Postgres databases**](https://www.prisma.io/postgres?utm_source=create_db_npm_docs) with a single command.

Each database is available for **24 hours** by default. To keep the database permanently, you can **claim it for free** using the URL displayed in the output.

This tool is designed for developers who need a fast way to test, prototype, or integrate Prisma Postgres without manual setup or creating an account.

## Installation and Usage

No installation required. Simply run:

```bash
npx create-db@latest
```

You can also use these aliases:

```bash
npx create-pg@latest
npx create-postgres@latest
```

## CLI Usage

### Commands

```bash
npx create-db [create]   # Create a new database (default command)
npx create-db regions    # List available regions
```

### Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--region <region>` | `-r` | AWS region for the database |
| `--interactive` | `-i` | Interactive mode to select a region |
| `--json` | `-j` | Output machine-readable JSON |
| `--env <path>` | `-e` | Write DATABASE_URL and CLAIM_URL to specified .env file |
| `--ttl <duration>` | `-t` | Custom database TTL (`30m`, `1h` ... `24h`) |
| `--copy` | `-c` | Copy connection string to clipboard |
| `--quiet` | `-q` | Output only the connection string |
| `--open` | `-o` | Open claim URL in browser |
| `--help` | `-h` | Show help message |
| `--version` | | Show version |

### Available Regions

- `ap-southeast-1` - Asia Pacific (Singapore)
- `ap-northeast-1` - Asia Pacific (Tokyo)
- `eu-central-1` - Europe (Frankfurt)
- `eu-west-3` - Europe (Paris)
- `us-east-1` - US East (N. Virginia)
- `us-west-1` - US West (N. California)

### Examples

```bash
# Create database in auto-detected nearest region
npx create-db

# Create database in a specific region
npx create-db --region eu-west-3
npx create-db -r us-east-1

# Interactive region selection
npx create-db --interactive
npx create-db -i

# Output as JSON (useful for scripting)
npx create-db --json
npx create-db -j

# Write connection string to .env file
npx create-db --env .env
npx create-db -e .env.local

# Set custom TTL
npx create-db --ttl 1h
npx create-db -t 12h

# Copy connection string to clipboard
npx create-db --copy
npx create-db -c

# Only print connection string
npx create-db --quiet
npx create-db -q

# Open claim URL in browser
npx create-db --open
npx create-db -o

# Combine flags
npx create-db -r eu-central-1 -j
npx create-db -i -e .env
npx create-db -t 24h -c -o

# List available regions
npx create-db regions

# List available regions as JSON
npx create-db regions --json
```

### JSON Output

When using `--json` with `create`, the output includes:

```json
{
  "success": true,
  "connectionString": "postgresql://user:pass@host:5432/postgres?sslmode=require",
  "claimUrl": "https://create-db.prisma.io/claim?projectID=...",
  "deletionDate": "2025-12-13T12:00:00.000Z",
  "region": "us-east-1",
  "name": "2025-12-12T12:00:00.000Z",
  "projectId": "proj_..."
}
```

When using `--json` with `regions`, the output is an array of region objects:

```json
[
  {
    "id": "us-east-1",
    "name": "US East (N. Virginia)",
    "status": "available"
  }
]
```

### Environment File Output

When using `--env`, the following variables are appended to the specified file:

```env
DATABASE_URL="postgresql://user:pass@host:5432/postgres?sslmode=require"
CLAIM_URL="https://create-db.prisma.io/claim?projectID=..."
```

## Programmatic API

You can also use `create-db` as a library in your Node.js applications:

```bash
npm install create-db
# or
bun add create-db
```

### `create(options?)`

Create a new Prisma Postgres database programmatically.

```typescript
import { create } from "create-db";

const result = await create({ region: "us-east-1" });

if (result.success) {
  console.log(`Connection string: ${result.connectionString}`);
  console.log(`Claim URL: ${result.claimUrl}`);
  console.log(`Expires: ${result.deletionDate}`);
} else {
  console.error(`Error: ${result.message}`);
}
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `region` | `RegionId` | AWS region for the database (optional, defaults to `us-east-1`) |
| `userAgent` | `string` | Custom user agent string for tracking (optional) |

### `regions()`

List available Prisma Postgres regions.

```typescript
import { regions } from "create-db";

const availableRegions = await regions();
console.log(availableRegions);
// [{ id: "us-east-1", name: "US East (N. Virginia)", status: "available" }, ...]
```

### Type Guards

```typescript
import { create, isDatabaseSuccess, isDatabaseError } from "create-db";

const result = await create();

if (isDatabaseSuccess(result)) {
  // result is DatabaseResult
  console.log(result.connectionString);
}

if (isDatabaseError(result)) {
  // result is DatabaseError
  console.error(result.message);
}
```

### Types

```typescript
import type {
  Region,
  RegionId,
  CreateDatabaseResult,
  DatabaseResult,
  DatabaseError,
  ProgrammaticCreateOptions,
} from "create-db";

// RegionId is a union type of available regions
type RegionId = "ap-southeast-1" | "ap-northeast-1" | "eu-central-1" | "eu-west-3" | "us-east-1" | "us-west-1";

// DatabaseResult (success)
interface DatabaseResult {
  success: true;
  connectionString: string | null;
  claimUrl: string;
  deletionDate: string;
  region: string;
  name: string;
  projectId: string;
  userAgent?: string;
}

// DatabaseError (failure)
interface DatabaseError {
  success: false;
  error: string;
  message: string;
  raw?: string;
  details?: unknown;
  status?: number;
}

// CreateDatabaseResult is DatabaseResult | DatabaseError
```

### Region Validation with Zod

```typescript
import { RegionSchema } from "create-db";

// Validate region input
const result = RegionSchema.safeParse("us-east-1");
if (result.success) {
  console.log("Valid region:", result.data);
}
```

## Claiming a Database

When you create a database, it is temporary and will be deleted after **24 hours**.

The output includes a **claim URL** that allows you to keep the database permanently for free.

**What claiming does:**

- Moves the database into your Prisma Data Platform account
- Prevents it from being auto-deleted
- Lets you continue using the database as a long-term instance

## Next Steps

- Refer to the [Prisma Postgres documentation](https://www.prisma.io/docs/postgres/introduction/npx-create-db) for more details.
