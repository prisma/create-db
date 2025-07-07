# Claim DB Worker

## Overview

This Cloudflare Worker enables users to claim ownership of a Prisma database project by providing a connection string. The worker handles authentication, rate limiting, and project transfer, making it easy to securely transfer DB ownership to a user’s Prisma account.

---

## How it Works: Flow & Steps

1. **User visits the claim page** with a `projectID` query parameter (e.g., `/claim?projectID=...`).
2. **Claim Page Rendered:**
   - The worker serves an HTML page with a "Claim" button (see [`src/templates/claim-template.ts`](src/templates/claim-template.ts)).
   - The button links to Prisma’s OAuth login, passing the `projectID` as state.
3. **User Authenticates:**
   - User logs in via Prisma OAuth.
   - On success, Prisma redirects to `/auth/callback` with an auth `code` and the original `projectID` as `state`.
4. **Token Exchange:**
   - The worker exchanges the `code` for an access token using Prisma’s OAuth token endpoint.
5. **Project Transfer:**
   - The worker calls `https://api.prisma.io/projects/{projectID}/transfer` with the user’s access token, using the integration token for authorization.
6. **Success or Error:**
   - On success, a confirmation HTML page is shown (see [`src/templates/claim-success-template.ts`](src/templates/claim-success-template.ts)).
   - On error, a generic error message is shown.

---

## Where to Edit Code

- **Main Logic:** [`src/index.ts`](src/index.ts)
  - Handles routing, OAuth, project transfer, and rate limiting.
  - **Edit rate limit:** See the `checkRateLimit` call near the top of the `fetch` handler.
- **Rate Limiter Implementation:** [`src/rate-limiter.ts`](src/rate-limiter.ts)
  - Custom logic for request limiting (default: 100 requests/minute, global).
- **Claim Page HTML:** [`src/templates/claim-template.ts`](src/templates/claim-template.ts)
  - Edit the UI/UX for the initial claim page.
- **Success Page HTML:** [`src/templates/claim-success-template.ts`](src/templates/claim-success-template.ts)
  - Edit the UI/UX for the post-claim success page.
- **Environment Variables & KV:** [`wrangler.jsonc`](wrangler.jsonc)
  - Configure KV namespace and deployment settings.
  - Secrets (integration token, client secret) are managed in Cloudflare, not in code.

---

## Development & Deployment

1.  **Clone all related projects for best DX:**

    ```bash
    mkdir claim-db-parent-folder
    cd claim-db-parent-folder
    git clone https://github.com/prisma/create-db-worker.git
    git clone https://github.com/prisma/claim-db-worker.git
    git clone https://github.com/prisma/create-db.git
    ```

2.  **Install dependencies:**

    ```bash
    cd claim-db-worker
    npm i
    ```

3.  **Testing Locally**

    **Switch URLs in `create-db`**

    - In your `create-db/.env` file, **comment out the production API URL** and **uncomment the local URL** (or set the base URL to your local worker/dev endpoint).
    - Example:

      ````env # LOCAL # CREATE_DB_WORKER_URL="http://127.0.0.1:8787" # CLAIM_DB_WORKER_URL="http://127.0.0.1:8787"

           # PROD
           CREATE_DB_WORKER_URL="https://create-db-worker.raycast-0ef.workers.dev"
           CLAIM_DB_WORKER_URL="https://claim-db-worker.raycast-0ef.workers.dev"
           ```

      **Start the worker in dev mode:**
      ````

    ```bash
    npx wrangler dev
    ```

    **If running both workers locally:**

    - Use a different port for one of them, e.g. `npx wrangler dev --port 9999`.
    - Update the `URL` in your `.env` to match the port:
      ```env
      CLAIM_DB_WORKER_URL=http://127.0.0.1:9999
      ```

    **Note:** For this worker, the OAuth callback URL (`/auth/callback`) is still set to the deployed version. You only need to update the base part of the URL for local testing; the callback will still hit the deployed worker for OAuth, but you can retain the info from the URL.

    ````txt
    	# Turn
    	https://claim-db-worker.raycast-0ef.workers.dev/auth/callback?state=...&code=...
    	# Into
    	http://127.0.0.1:8787/auth/callback?state=...&code=...
    	```

    ````

4.  **Deploy:**

    ```bash
    npx wrangler deploy
    ```

---

## Credentials & Secrets

- **Integration Token & Client Secret:**
  - Managed as Cloudflare secrets (not in repo).
  - For local use, create a `.dev.vars` file in the root. The integration token and client secret are in 1password.

---

## Monitoring

- [Cloudflare Dashboard](https://dash.cloudflare.com/0ef7f922ce028e16c1a44d98c86511b0/workers/services/view/claim-db-worker/production/metrics)

---

## Quick Reference

- **Edit rate limit:** `src/index.ts` and `src/rate-limiter.ts`
- **Edit claim/success HTML:** `src/templates/claim-template.ts`, `src/templates/claim-success-template.ts`
- **Main logic:** `src/index.ts`
- **KV/Secrets:** `wrangler.jsonc` and Cloudflare dashboard
