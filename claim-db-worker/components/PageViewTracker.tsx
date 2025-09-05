"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendAnalyticsEvent } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      sendAnalyticsEvent("create_db:claim_page_viewed", {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname]);

  return null;
}
