# Create DB CLI Command

## Overview

This CLI tool provisions a temporary Prisma Postgres database project via the `create-db-worker` Cloudflare Worker. It supports custom regions, interactive prompts, and outputs a connection string. Databases created with this tool are **temporary** and will be deleted automatically after 24 hours unless claimed.

---

## How it Works: Flow & Steps

1. **User runs the CLI:**
   - `npx create-db`
2. **Argument Parsing:**
   - Supports `--region <region>` to specify a region (default: `us-east-1`).
   - Supports `--i` for interactive region selection.
3. **Region Fetch:**
   - The CLI fetches available regions from the `create-db-worker`'s `/regions` endpoint.
4. **Database Creation:**
   - Sends a POST request to the worker’s `/create` endpoint with the selected region and a timestamp as the name.
   - Handles rate limiting and error responses.
5. **Output:**
   - Prints the connection string for the new database.
   - Warns the user that the database will be deleted in 24 hours.
   - Prints a claim URL (served by the `claim-db-worker`) to transfer ownership and make the DB permanent.

---

## Supported Flags

| Flag       | Description                  | Default     |
| ---------- | ---------------------------- | ----------- |
| `--region` | Region for the database      | `us-east-1` |
| `--i`      | Interactive region selection | (off)       |

---

## Where to Edit Code

- **Main CLI Logic:** [`index.js`](index.js)
  - Handles argument parsing, prompts, API requests, and output.
- **Dependencies:** [`package.json`](package.json)
  - CLI entry point, dependencies, and bin configuration.
- **Environment Variables:**
  - Reads `CREATE_DB_WORKER_URL` and `CLAIM_DB_WORKER_URL` from `.env` (see below).

---

## Development & Local Testing

1. **Clone all related projects for best DX:**

   ```bash
   mkdir create-db-parent-folder
   cd create-db-parent-folder
   git clone https://github.com/prisma/create-db-worker.git
   git clone https://github.com/prisma/claim-db-worker.git
   git clone https://github.com/prisma/create-db.git
   ```

2. **Install dependencies:**

   ```bash
   cd create-db
   npm i
   ```

3. **Configure Environment:**

   - Copy or create a `.env` file in the root:

     ```env
     # LOCAL
     CREATE_DB_WORKER_URL="http://127.0.0.1:8787"
     CLAIM_DB_WORKER_URL="http://127.0.0.1:8787"

     # PROD
     # CREATE_DB_WORKER_URL="https://create-db-worker.raycast-0ef.workers.dev"
     # CLAIM_DB_WORKER_URL="https://claim-db-worker.raycast-0ef.workers.dev"
     ```

   - If running both workers locally, use a different port for one and update the URL:
     ```env
     CREATE_DB_WORKER_URL="http://127.0.0.1:9999"
     ```

4. **Run the CLI:**

   ```bash
   npx create-db
   npx create-db --region eu-west-1
   npx create-db --i
   ```

---

## Credentials & Secrets

- No secrets are required for the CLI itself.
- The workers require integration tokens, managed as secrets in Cloudflare (see their READMEs).

---

## Quick Reference

- **Edit CLI logic:** `index.js`
- **Edit dependencies/bin:** `package.json`
- **Configure endpoints:** `.env`
- **Related workers:** `create-db-worker`, `claim-db-worker`
