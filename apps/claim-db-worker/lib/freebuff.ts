import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The create-db worker, as this worker calls it through its service binding. */
type CreateDbWorker = {
  reportFreebuffClaim(projectID: string, accountId: string): Promise<string>;
};

/**
 * Tells the create-db worker that a project was claimed. That worker holds
 * the Freebuff click id of a database created from a Freebuff ad, and reports
 * the claim to Freebuff. A database without one is left alone.
 *
 * Runs after the response and never throws: an ad report must not fail or
 * slow down a claim.
 */
export function reportFreebuffClaim(projectID: string, accountId: string): void {
  if (!accountId) {
    return;
  }

  try {
    const { env, ctx } = getCloudflareContext();
    const createDbWorker = (env as { CREATE_DB_WORKER?: CreateDbWorker })
      .CREATE_DB_WORKER;
    if (!createDbWorker) {
      return;
    }

    ctx.waitUntil(
      createDbWorker
        .reportFreebuffClaim(projectID, accountId)
        .catch(() => console.error("Failed to report the claim to Freebuff"))
    );
  } catch {
    console.error("Failed to report the claim to Freebuff");
  }
}
