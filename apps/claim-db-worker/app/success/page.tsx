"use client";

import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import { PrismButton } from "@/components/brand/PrismButton";
import { Mascot } from "@/components/brand/Brand";
import { StatePanel } from "@/components/brand/StatePanel";
import { ArrowUpRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const projectID = searchParams.get("projectID");
  const workspaceId = searchParams.get("workspaceId");
  const databaseId = searchParams.get("databaseId");

  const consoleUrl =
    workspaceId && projectID && databaseId
      ? `https://console.prisma.io/${workspaceId}/${projectID}/${databaseId}`
      : "https://console.prisma.io/";

  return (
    <StatePanel>
      <Mascot expression="happy" alt="Prismo, the Prisma mascot, smiling" className="mb-8 w-28 sm:w-32" />
      <PrismaPostgresLogo />

      <h1 className="text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.06]">
        Congratulations!
      </h1>

      <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
        You have successfully claimed your database
      </p>

      <div className="mt-10">
        <PrismButton href={consoleUrl} external size="lg">
          Go use your database
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </PrismButton>
      </div>
    </StatePanel>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
