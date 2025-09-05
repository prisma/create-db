"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendAnalyticsEvent } from "@/lib/analytics";

function PageViewTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname) {
      const url = window.location.href;
      const search = searchParams?.toString();
      const fullPath = search ? `${pathname}?${search}` : pathname;

      sendAnalyticsEvent("create_db:claim_page_viewed", {
        path: pathname,
        full_path: fullPath,
        url: url,
        referrer: document.referrer || "",
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerContent />
    </Suspense>
  );
}
