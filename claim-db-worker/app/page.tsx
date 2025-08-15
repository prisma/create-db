"use client";

import Image from "next/image";
import { useEffect, Suspense } from "react";
import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import { useSearchParams, useRouter } from "next/navigation";
import { CodeSnippet } from "@/components/CodeSnippet";

const steps = [
  {
    number: "1",
    title: "Provision instantly",
    description: (
      <>
        Run{" "}
        <span className="text-white font-mono font-bold">
          npx create-db@latest
        </span>{" "}
        in your terminal to get a Prisma Postgres database. No account or other
        setup needed.
      </>
    ),
  },
  {
    number: "2",
    title: "Get the connection string",
    description:
      "Use the connection string for anything you need: testing, AI agents, prototypes.",
  },
  {
    number: "3",
    title: "Claim it if you want to keep it",
    description: (
      <>
        Transfer the database to your Prisma account to make sure it doesn't get
        deleted. Otherwise,{" "}
        <span className="italic">it will expire after 24 hours.</span>
      </>
    ),
  },
];

const options = [
  { flag: "--region", description: "Specify the database region" },
  { flag: "--interactive", description: "Run in interactive mode" },
  { flag: "--help", description: "Show all available options" },
];

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const projectID = searchParams.get('projectID');
    if (projectID && projectID !== 'undefined') {
      // Redirect to claim API route
      router.push(`/api/claim?projectID=${projectID}&utm_source=${searchParams.get('utm_source') || 'unknown'}&utm_medium=${searchParams.get('utm_medium') || 'unknown'}`);
    }
  }, [searchParams, router]);

  return (
    <div>
      <div className="flex flex-col items-center text-center max-w-4xl w-full px-4 sm:px-6">
        <PrismaPostgresLogo />

        <PillBadge />

        <h1 className="text-3xl font-[800] text-white mb-6 tracking-tight sm:text-3xl md:text-4xl lg:text-7xl">
          Want a free, instant Prisma Postgres database?
        </h1>

        <CodeSnippet />

        <p className="text-xs text-muted italic mt-2 text-center max-w-2xl px-2 sm:text-xs md:text-xs lg:text-sm">
          your <b>database will be deleted 24 hours after creation</b> unless
          you claim it
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-2xl mx-auto sm:gap-8 sm:py-10 md:py-16 md:px-5 lg:gap-10 lg:py-32 lg:px-6">
        <div className="flex flex-col gap-4 w-full sm:gap-5 md:gap-5 lg:gap-6">
          {steps.map((step, index) => (
            <Step key={index} step={step} />
          ))}
          <OptionsTable />
        </div>
      </div>
    </div>
  );
}

function PillBadge() {
  return (
    <div className="rounded-full p-px bg-gradient-to-b from-gradient-start to-gradient-end mb-8">
      <div className="rounded-full px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-2 font-bold bg-card">
        <Image
          src="/magic-wand-icon.svg"
          alt="Magic Wand Icon"
          width={20}
          height={20}
          className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
        />
        <p className="uppercase font-extrabold text-white text-sm sm:text-base">
          No account or config needed
        </p>
      </div>
    </div>
  );
}


function Step({ step }: { step: (typeof steps)[0] }) {
  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-3">
        <div className="bg-step rounded text-white font-bold w-7 h-7 flex items-center justify-center sm:w-7 md:w-8 lg:w-9 sm:text-base md:text-lg lg:text-xl">
          {step.number}
        </div>
        <div className="text-white uppercase font-bold sm:text-base md:text-lg lg:text-xl">
          {step.title}
        </div>
      </div>
      <div className="text-muted ml-8 sm:ml-10 md:ml-11 lg:ml-12 md:text-base lg:text-lg">
        {step.description}
      </div>
    </div>
  );
}

function OptionsTable() {
  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-3">
        <div className="bg-step rounded text-white font-bold w-7 h-7 flex items-center justify-center sm:w-7 md:w-8 lg:w-9 sm:text-base md:text-lg lg:text-xl">
          +
        </div>
        <div className="text-white uppercase font-bold sm:text-base md:text-lg lg:text-xl">
          Options
        </div>
      </div>

      <div className="rounded-lg border border-subtle flex flex-col ml-8 overflow-hidden sm:ml-10 md:ml-11 lg:ml-12">
        <div className="bg-table-header flex items-center">
          <div
            className="w-2/5 px-2 py-2 bg-table-header text-white text-xs font-bold flex items-center sm:w-1/3 sm:px-3 sm:text-sm"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Flag
          </div>
          <div
            className="flex-1 min-h-10 px-2 py-2 bg-table-header text-white text-xs flex items-center sm:min-h-12 sm:px-3 sm:text-sm"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Description
          </div>
        </div>

        {options.map((option, index) => (
          <div
            key={index}
            className="bg-step min-h-10 flex items-center sm:min-h-12"
          >
            <div className="bg-step w-2/5 px-2 min-h-10 flex items-center sm:w-1/3 sm:px-3 sm:py-2 sm:min-h-12">
              <span
                className="bg-table-header rounded text-error text-xs font-bold px-2 py-1 sm:text-sm sm:px-3 md:px-4 lg:px-6"
                style={{ fontFamily: "'Roboto Mono', monospace" }}
              >
                {option.flag}
              </span>
            </div>
            <div className="bg-step flex-1 px-2 min-h-10 flex items-center text-white text-xs sm:px-3 sm:text-sm sm:min-h-12">
              {option.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
