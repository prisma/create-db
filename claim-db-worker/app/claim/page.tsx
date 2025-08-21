"use client";

import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, Suspense } from "react";

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectID = searchParams.get("projectID");
  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const [isLoading, setIsLoading] = useState(false);

  if (!projectID && !window.location.pathname.includes('/test/')) {
    router.push("/");
    return null;
  }

  const redirectUri = new URL("/api/auth/callback", window.location.origin);
  redirectUri.searchParams.set("projectID", projectID!);

  function generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  const authParams = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
    redirect_uri: redirectUri.toString(),
    response_type: "code",
    scope: "workspace:admin",
    state: generateState(),
    utm_source: utmSource || "unknown",
    utm_medium: utmMedium || "unknown",
  });

  const authUrl = `https://auth.prisma.io/authorize?${authParams.toString()}`;

  const handleClaimClick = () => {
    if (authUrl) {
      setIsLoading(true);
      window.open(authUrl, "_blank");
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="flex flex-col mt-32 items-center justify-center text-center px-4 sm:px-6">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <PrismaPostgresLogo />

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-16 tracking-tight leading-tight">
          Claim your database
          <span className="text-muted">*</span>
        </h1>

        <button
          onClick={handleClaimClick}
          disabled={!authUrl || isLoading}
          className="flex items-center justify-center gap-3 bg-[#24bfa7] hover:bg-[#16A394] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl sm:text-2xl lg:text-3xl border-none rounded-lg px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 cursor-pointer shadow-lg transition-all duration-200 mb-16 min-h-[44px] sm:min-h-[52px] lg:min-h-[60px] mx-auto"
        >
          <Image
            src="/db-icon.svg"
            alt="Database Icon"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          {isLoading ? "Redirecting..." : "Claim database"}
          <Image
            src="/arrow-right.svg"
            alt="Arrow Right"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </button>

        <p className="text-muted text-sm sm:text-base lg:text-lg italic">
          your <b>database will be deleted 24 hours after creation</b> unless
          you claim it
        </p>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClaimContent />
    </Suspense>
  );
}
