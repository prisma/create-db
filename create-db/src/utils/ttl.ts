const TTL_TO_SECONDS: Record<string, number> = { "30m": 30 * 60 };

for (let hour = 1; hour <= 24; hour += 1) {
  TTL_TO_SECONDS[`${hour}h`] = hour * 60 * 60;
}

export function parseTtlToSeconds(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  return TTL_TO_SECONDS[normalized] ?? null;
}
