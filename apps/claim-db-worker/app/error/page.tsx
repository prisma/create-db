"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mascot } from "@/components/brand/Brand";
import { StatePanel } from "@/components/brand/StatePanel";

function ErrorContent() {
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "Error";
  const message = searchParams.get("message") || "Something went wrong";
  const details = searchParams.get("details");

  return (
    <StatePanel className="max-w-4xl">
      <Mascot expression="sad" alt="Prismo, the Prisma mascot, looking sad" className="mb-8 w-28 sm:w-32" />
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/70">
        <span aria-hidden className="size-2 rounded-full bg-prism-red-500" />
        Something went wrong
      </p>
      <h1 className="text-balance text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.06]">{title}</h1>

      <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
        {message}
      </p>

      {details && (
        <pre className="mt-10 w-full max-w-4xl overflow-x-auto whitespace-pre-wrap rounded-2xl border border-border bg-code p-4 text-left font-mono text-sm sm:p-6">
          <code className="text-foreground">{details}</code>
        </pre>
      )}
    </StatePanel>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
