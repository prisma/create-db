const pendingAnalytics: Promise<void>[] = [];

export async function sendAnalytics(
  eventName: string,
  properties: Record<string, unknown>,
  cliRunId: string,
  workerUrl: string
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  const promise = (async () => {
    try {
      await fetch(`${workerUrl}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          properties: { distinct_id: cliRunId, ...properties },
        }),
        signal: controller.signal,
      });
    } catch {
      // Analytics failures should not block CLI
    } finally {
      clearTimeout(timer);
    }
  })();

  pendingAnalytics.push(promise);
}

export async function flushAnalytics(maxWaitMs = 500): Promise<void> {
  if (pendingAnalytics.length === 0) return;
  await Promise.race([
    Promise.all(pendingAnalytics),
    new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs)),
  ]);
}
