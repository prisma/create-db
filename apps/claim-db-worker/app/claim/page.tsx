"use client";

import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import { PrismButton } from "@/components/brand/PrismButton";
import { Mascot } from "@/components/brand/Brand";
import { StatePanel } from "@/components/brand/StatePanel";
import { ArrowRight } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const projectID = searchParams.get("projectID");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectID && !pathname.includes("/test/")) {
      router.push("/");
    }
  }, [pathname, projectID, router]);

  if (!projectID && !pathname.includes("/test/")) {
    return null;
  }

  const handleClaimClick = async () => {
    try {
      if (!projectID) {
        throw new Error("Missing project ID");
      }

      setIsLoading(true);
      const redirectUri = new URL("/api/auth/callback", window.location.origin);
      redirectUri.searchParams.set("projectID", projectID);

      const response = await fetch("/api/auth/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ redirectUri: redirectUri.toString() }),
      });

      if (!response.ok) {
        throw new Error("Failed to get auth URL");
      }

      const data = (await response.json()) as { authUrl?: string };
      if (!data.authUrl) {
        throw new Error("Missing auth URL");
      }
      // Sign in in this tab, with the button left disabled: two sign-ins for
      // one database run two transfers at once, and the one that loses shows
      // "Transfer Failed" for a claim that worked.
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <StatePanel>
      <Mascot expression="salute" alt="Prismo, the Prisma mascot, saluting" className="mb-8 w-28 sm:w-32" />
      <PrismaPostgresLogo />

      <h1 className="text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.06]">
        Claim your database
        <span className="text-muted-foreground">*</span>
      </h1>

      <div className="mt-10">
        <PrismButton onClick={handleClaimClick} disabled={isLoading} size="lg">
          Claim database
          <ArrowRight className="h-5 w-5" aria-hidden />
        </PrismButton>
      </div>

      <p className="mt-10 max-w-[48ch] text-pretty text-muted-foreground">
        *Your database will be{" "}
        <strong className="font-semibold text-foreground">
          deleted 24 hours after creation
        </strong>{" "}
        unless you claim it.
      </p>
    </StatePanel>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClaimContent />
    </Suspense>
  );
}
