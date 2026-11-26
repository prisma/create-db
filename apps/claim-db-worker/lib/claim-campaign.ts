/**
 * Campaign tags for the sign-in link the claim button opens.
 *
 * The CLI tags the claim URL with the command that made the database
 * (`utm_source=create-db`, `create-pg` or `create-postgres`), `utm_medium=cli`
 * and the output mode (`utm_content`). Passing those on to sign-in lets a
 * signup be credited to the command instead of the generic claim button.
 *
 * The CLI's `utm_source` can also be a free-text value: the hidden
 * `--user-agent` flag, or `PRISMA_ACTOR_NAME/PRISMA_ACTOR_PROJECT` from the
 * user's env file, which can name a person or a project. Only known values
 * are passed on; anything else is replaced, so no value from a user's
 * environment reaches the signup.
 */

export type ClaimCampaign = {
  utm_source: string;
  utm_medium: string;
  utm_content?: string;
};

const KNOWN_SOURCES = new Set([
  "create-db",
  "create-pg",
  "create-postgres",
  "create-db-frontend",
  "create_db_web",
]);
const KNOWN_MEDIUMS = new Set(["cli", "claim_button"]);
const KNOWN_CONTENT = new Set(["default", "json", "env", "quiet"]);

/** The tags the claim button used before it passed the CLI's on. */
export const DEFAULT_CLAIM_CAMPAIGN: ClaimCampaign = {
  utm_source: "create-db-frontend",
  utm_medium: "claim_button",
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function claimCampaign(input: unknown): ClaimCampaign {
  const tags =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const source = normalize(tags.utm_source);
  const medium = normalize(tags.utm_medium);
  const content = normalize(tags.utm_content);

  const utmMedium = KNOWN_MEDIUMS.has(medium)
    ? medium
    : DEFAULT_CLAIM_CAMPAIGN.utm_medium;
  const utmSource = KNOWN_SOURCES.has(source)
    ? source
    : // A CLI claim whose tag was a custom user agent: keep that it came from
      // the CLI, drop the custom value.
      utmMedium === "cli"
      ? "create-db"
      : DEFAULT_CLAIM_CAMPAIGN.utm_source;

  return {
    utm_source: utmSource,
    utm_medium: utmMedium,
    ...(KNOWN_CONTENT.has(content) && { utm_content: content }),
  };
}
