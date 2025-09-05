"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendAnalyticsEvent } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
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
