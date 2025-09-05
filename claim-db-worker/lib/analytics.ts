"use client";

export const sendAnalyticsEvent = async (
  event: string,
  properties: Record<string, any>
) => {
  const response = await fetch(`${window.location.origin}/api/analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event, properties }),
  });

  if (!response.ok) {
    console.error("Failed to send analytics event:", response);
  }
};
