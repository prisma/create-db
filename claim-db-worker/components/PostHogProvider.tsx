"use client";

import posthog, { PostHog } from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

declare global {
  interface Window {
    posthog: PostHog;
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_POSTHOG_API_KEY
  ) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || "", {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_API_HOST ||
        "https://proxyhog.prisma-data.net",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      debug: process.env.NODE_ENV === "development", // Enable debug in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog initialized in debug mode");
          // Make posthog available globally for debugging
          window.posthog = posthog;
        }
      },
    });
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
