# Create DB

## What it does

This CLI tool creates and claims Prisma Postgres databases. By default, a set name and region are used. The user can use flags to have an interactive interface or change the defaults.

## Commands

### Create Database
```bash
npx create-db
```

Creates a new database project with interactive prompts for:
- Database name (default: `My Prisma Postgres Database`)
- Region (default: `us-east-1`)

#### Flags

| Flag | Description | Default | Implemented |
|------|-------------|---------|-------------|
| `--name` | Name of the database project | `My Prisma Project` | ❌ |
| `--region` | Region for the database | `us-east-1` | ❌ |
| `--prompt` | Whether to prompt for user input | `false` | ❌ |

### Claim Database
```bash
npx create-db claim <connection_string>
```

Prompts the user to log in, then claims an existing database to their account using the transfer API endpoint.

## Development

Clone all 3 projects into one parent folder (these 3 don't need to be together, but I find the DX better to just swap between all 3 in the same IDE during development)

```bash
mkdir create-db-parent-folder
cd create-db-parent-folder
```

```bash
git clone https://github.com/prisma/create-db-worker.git
git clone https://github.com/prisma/claim-db-worker.git
git clone https://github.com/prisma/create-db.git
```

As this is specifically `create-db`, cd into it.

```bash
cd create-db
npm i
```

## Usage

```bash
# Install globally
npm install -g create-db

# Or use npx
npx create-db
npx create-db claim
```

## Dependencies

- `chalk` - Terminal styling
- `commonjs-ora` - Loading spinners
- `enquirer` - Interactive prompts


