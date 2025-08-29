"use client";

import { PrismaPostgresLogo } from "@/components/PrismaPostgresLogo";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const projectID = searchParams.get("projectID");

  return (
    <div className="flex flex-col mt-32 items-center justify-center text-center px-4 sm:px-6">
      <div className="max-w-2xl w-full flex flex-col items-center space-y-10">
        <PrismaPostgresLogo />

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
          Congratulations!
        </h1>

        <p className="text-muted text-lg sm:text-xl lg:text-2xl font-normal max-w-2xl">
          You have successfully claimed your database
        </p>

        <a
          href="https://console.prisma.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-[#24bfa7] hover:bg-[#16A394] text-white font-bold text-xl sm:text-xl lg:text-2xl border-none rounded-lg px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 cursor-pointer shadow-lg transition-all duration-200 min-h-[44px] sm:min-h-[52px] lg:min-h-[60px] mx-auto"
        >
          Go use your database
          <Image
            src="/arrow-up.svg"
            alt="Arrow up"
            width={24}
            height={24}
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
        </a>

        <div className="relative flex justify-center items-center">
          <Image
            src="/db-img.svg"
            alt="Database Success"
            width={120}
            height={120}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 filter"
            style={{
              filter: "drop-shadow(0 0 24px rgba(94,234,212,0.8))",
            }}
          />
          <div className="absolute right-1/2 bottom-1/2 transform translate-x-[150%] translate-y-1/2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
            >
              <circle cx="32" cy="32" r="28" fill="#5eead4" />
              <path
                d="M20 34l8 8 16-16"
                stroke="#222B32"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
