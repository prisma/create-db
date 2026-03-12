"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface ClientRedirectProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export function ClientRedirect({ searchParams }: ClientRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const projectID = searchParams.projectID;
    if (projectID && projectID !== "undefined") {
      // Redirect to claim API route
      router.push(
        `/api/claim?projectID=${projectID}&utm_source=${searchParams.utm_source || "unknown"}&utm_medium=${searchParams.utm_medium || "unknown"}`
      );
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
