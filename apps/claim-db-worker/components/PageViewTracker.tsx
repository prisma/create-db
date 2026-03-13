"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendAnalyticsEvent } from "@/lib/analytics-client";

function PageViewTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;

    const fullPath = search ? `${pathname}?${search}` : pathname;
    void sendAnalyticsEvent("create_db:claim_page_viewed", {
      path: pathname,
      full_path: fullPath,
      url: window.location.href,
      referrer: document.referrer || "",
      timestamp: new Date().toISOString(),
    });
  }, [pathname, search]);

  return null;
}

export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerContent />
    </Suspense>
  );
}
