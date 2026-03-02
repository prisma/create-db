"use client";

import { PageViewTracker } from "@/components/PageViewTracker";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewTracker />
      {children}
    </>
  );
}
