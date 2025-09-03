"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "Error";
  const message = searchParams.get("message") || "Something went wrong";
  const details = searchParams.get("details");

  return (
    <div className="flex flex-col items-center justify-center mt-32 text-center px-4 sm:px-6">
      <div className="max-w-4xl w-full">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-5 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 relative">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 96 96"
                fill="none"
                aria-hidden="true"
                className="block"
              >
                <circle cx="48" cy="48" r="40" fill="#FC8181" />
                <line
                  x1="34"
                  y1="34"
                  x2="62"
                  y2="62"
                  stroke="#222B32"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <line
                  x1="62"
                  y1="34"
                  x2="34"
                  y2="62"
                  stroke="#222B32"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="text-error text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              {title}
            </h1>
          </div>

          <p className="text-muted text-xl sm:text-2xl lg:text-3xl font-normal mb-8 sm:mb-10 max-w-2xl">
            {message}
          </p>

          {details && (
            <pre className="bg-step text-white font-mono text-sm sm:text-base rounded-lg p-4 sm:p-6 border border-subtle text-left w-full max-w-4xl overflow-x-auto whitespace-pre-wrap">
              <code className="text-muted">{details}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
