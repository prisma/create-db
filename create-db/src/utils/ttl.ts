const HOUR_TTL_PATTERN = /^([1-9]|1\d|2[0-4])h$/;
export const MIN_TTL_MS = 30 * 60 * 1000;
export const MAX_TTL_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
export const TTL_HELP_DESCRIPTION = "Auto-delete after (30m, 1h-24h)";
export const TTL_ALLOWED_VALUES_TEXT = "30m, or 1h-24h";
export const TTL_RANGE_TEXT = "30m to 24h";
export const TTL_EXAMPLES_TEXT = [
  "Examples:",
  "npx create-db --ttl 24h",
  "npx create-db --ttl 8h",
  "npx create-db --ttl 1h",
  "npx create-db --ttl 30m",
].join("\n");

export function parseTtlToMilliseconds(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "30m") {
    return MIN_TTL_MS;
  }

  const match = HOUR_TTL_PATTERN.exec(normalized);
  if (!match) {
    return null;
  }

  return Number(match[1]) * ONE_HOUR_MS;
}

export function buildTtlCliError(message: string): string {
  return [
    message,
    `Allowed values are ${TTL_ALLOWED_VALUES_TEXT}.`,
    "",
    TTL_EXAMPLES_TEXT,
  ].join("\n");
}
