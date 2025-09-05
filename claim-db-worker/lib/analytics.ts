export const sendAnalyticsEvent = async (
  event: string,
  properties: Record<string, any>
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, properties }),
    }
  );

  if (!response.ok) {
    console.error("Failed to send analytics event:", response);
  }
};
