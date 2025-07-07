# Create DB Worker

## Overview

This Cloudflare Worker creates a Prisma database project via the Prisma API. It supports custom project names and regions, applies rate limiting, and automatically schedules deletion of test/temporary databases after 24 hours.

---

## How it Works: Flow & Steps

1. **User sends a POST request to `/create`** with `region` and `name` in the body.
2. **Project Creation:**
   - The worker calls `https://api.prisma.io/projects` to create a new database project.
3. **Delete Workflow Scheduled:**
   - After creation, the worker triggers the `DeleteDbWorkflow` (see [`src/delete-workflow.ts`](src/delete-workflow.ts)), passing the new `projectID`.
   - The workflow waits 24 hours, then attempts to delete the project via the Prisma API.
   - If the project is already deleted, the workflow errors safely (no issues caused).
4. **Regions Endpoint:**
   - A GET request to `/regions` returns available regions from the Prisma API.
5. **Rate Limiting:**
   - All requests are rate-limited to 100 per minute (see [`src/rate-limiter.ts`](src/rate-limiter.ts)).

---

## Where to Edit Code

- **Main Logic:** [`src/index.ts`](src/index.ts)
  - Handles routing, project creation, region listing, rate limiting, and triggers the delete workflow.
- **Delete Workflow:** [`src/delete-workflow.ts`](src/delete-workflow.ts)
  - Implements the 24-hour delayed deletion logic as the `DeleteDbWorkflow` class.
- **Rate Limiter Implementation:** [`src/rate-limiter.ts`](src/rate-limiter.ts)
  - Custom logic for request limiting (default: 100 requests/minute, global).
- **Environment Variables & KV:** [`wrangler.jsonc`](wrangler.jsonc)
  - Configure KV namespace and deployment settings.
  - Secrets (integration token) are managed in Cloudflare, not in code.

---

## Development & Deployment

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
   cd create-db-worker
   npm i
   ```

3. **Testing Locally**

   **Switch URLs in `create-db`**
   - In your `create-db/.env` file, **comment out the production URLs** and **uncomment the local URLs** (or set the base URLs to your local worker/dev endpoints).
   - Example:

     ```env
     # LOCAL
     CREATE_DB_WORKER_URL="http://127.0.0.1:8787"
     CLAIM_DB_WORKER_URL="http://127.0.0.1:8787"

     # PROD
     CREATE_DB_WORKER_URL="https://create-db-worker.raycast-0ef.workers.dev"
     CLAIM_DB_WORKER_URL="https://claim-db-worker.raycast-0ef.workers.dev"
     ```

   **Start the worker in dev mode:**

   ```bash
   npx wrangler dev
   ```

   **If running both workers locally:**
   - Use a different port for one of them, e.g. `npx wrangler dev --port 9999`.
   - Update the corresponding URL in your `.env` to match the port:
     ```env
     CREATE_DB_WORKER_URL="http://127.0.0.1:9999"
     ```

4. **Deploy:**

   ```bash
   npx wrangler deploy
   ```

---

## Credentials & Secrets

- **Integration Token:**
  - Managed as a Cloudflare secret (not in repo).
  - For local use, create a `.dev.vars` file in the root. The integration token is in 1password.

---

## Monitoring

- [Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/create-db-worker/production/metrics)

---

## Quick Reference

- **Edit rate limit:** `src/index.ts` and `src/rate-limiter.ts`
- **Edit delete workflow:** `src/delete-workflow.ts`
- **Main logic:** `src/index.ts`
- **KV/Secrets:** `wrangler.jsonc` and Cloudflare dashboard
