import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The `FreebuffClick` Durable Object of the create-db worker, as this worker uses it. */
type FreebuffClickNamespace = {
  idFromName(name: string): unknown;
  get(id: unknown): { reportClaim(accountId: string): Promise<string> };
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
    const freebuffClick = (env as { FREEBUFF_CLICK?: FreebuffClickNamespace })
      .FREEBUFF_CLICK;
    if (!freebuffClick) {
      return;
    }

    ctx.waitUntil(
      freebuffClick
        .get(freebuffClick.idFromName(projectID))
        .reportClaim(accountId)
        .catch(() => console.error("Failed to report the claim to Freebuff"))
    );
  } catch {
    console.error("Failed to report the claim to Freebuff");
  }
}
