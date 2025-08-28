"use client";

import Link from "next/link";
import React, { useState } from "react";

interface DatabaseConnectionProps {
  connectionType: "prisma" | "direct";
  setConnectionType: (type: "prisma" | "direct") => void;
  ormConnectionString: string;
  directConnectionString: string;
  handleCopyConnectionString: () => void;
  copied: boolean;
}

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-step px-2 py-1 sm:px-1.5 sm:py-0.5 rounded text-white text-xs sm:text-sm">
    {children}
  </code>
);

const StepNumber = ({ number }: { number: number }) => (
  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-table-header rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
    {number}
  </div>
);

const StepItem = ({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-2 sm:gap-4">
    <StepNumber number={number} />
    <div className="flex-1 leading-relaxed text-sm sm:text-lg text-muted">
      {children}
    </div>
  </div>
);

export default function DatabaseConnection({
  connectionType,
  setConnectionType,
  ormConnectionString,
  directConnectionString,
  handleCopyConnectionString,
  copied,
}: DatabaseConnectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const displayed =
    connectionType === "prisma" ? ormConnectionString : directConnectionString;

  return (
    <div className="bg-code rounded-lg rounded-tl-none p-4 sm:p-6 w-full h-full border-subtle border flex flex-col">
      {/* Connection type toggle - responsive */}
      <div className="flex flex-col sm:flex-row rounded-md p-1 w-full mb-3 gap-2">
        <button
          className={`flex-1 px-3 py-2 sm:py-1 text-sm rounded-md transition-colors font-medium border ${
            connectionType === "prisma"
              ? "text-brand-surface-highlight border-brand-surface-highlight bg-brand-surface-highlight/10"
              : "text-muted hover:text-white border-transparent bg-table-header hover:bg-brand-surface-highlight/5"
          }`}
          onClick={() => setConnectionType("prisma")}
        >
          With Prisma ORM
        </button>
        <button
          className={`flex-1 px-3 py-2 sm:py-1 text-sm rounded-md transition-colors font-medium border ${
            connectionType === "direct"
              ? "text-brand-surface-highlight border-brand-surface-highlight bg-brand-surface-highlight/10"
              : "text-muted hover:text-white border-transparent bg-table-header hover:bg-brand-surface-highlight/5"
          }`}
          onClick={() => setConnectionType("direct")}
        >
          With Prisma ORM or any other tool
        </button>
      </div>

      {/* Connection string input - responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="bg-card rounded-md font-mono text-sm flex-1 min-h-[48px] sm:h-12 border border-subtle min-w-0 flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={displayed}
            readOnly
            className="bg-transparent p-3 text-white text-sm flex-1 outline-none"
            style={{ fontFamily: "monospace" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center justify-center w-12 h-12 border border-subtle rounded-md transition-colors text-muted hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
            title={
              showPassword ? "Hide connection string" : "Show connection string"
            }
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 9c-2.4 2.667 -5.4 4 -9 4c-3.6 0 -6.6 -1.333 -9 -4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15l2.5 -3.8"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 14.976l-2.492 -3.776"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17l.5 -4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17l-.5 -4"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
          <button
            className="flex items-center justify-center w-12 h-12 border border-subtle rounded-md transition-colors text-muted hover:text-white"
            onClick={handleCopyConnectionString}
            title="Copy connection string"
          >
            {copied ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted mb-6 sm:text-sm">
        {connectionType === "prisma"
          ? "Add this to your .env file as DATABASE_URL for Prisma ORM"
          : "Use this connection string directly with your PostgreSQL client"}
      </p>

      <div className="flex-1 space-y-6 bg-dark rounded-lg p-4 sm:p-6">
        {connectionType === "prisma" ? (
          <div className="h-full">
            <div className="flex flex-col h-full">
              <h3 className="text-2xl font-bold text-white mb-4">
                Quick Start with Prisma:
              </h3>
              <div className="space-y-4 sm:space-y-10">
                <StepItem number={1}>
                  Install Prisma:{" "}
                  <InlineCode>
                    npm install prisma --save-dev && npm install @prisma/client
                  </InlineCode>
                </StepItem>
                <StepItem number={2}>
                  Add to your <InlineCode>.env</InlineCode> file:
                </StepItem>
                <div className="ml-6 sm:ml-8 lg:ml-12">
                  <pre className="bg-step p-3 sm:p-4 rounded text-white text-xs sm:text-sm overflow-x-auto leading-relaxed">
                    {`DATABASE_URL=<your-connection-string>`}
                  </pre>
                </div>
                <StepItem number={3}>
                  Initialize and pull schema:{" "}
                  <InlineCode>npx prisma init && npx prisma db pull</InlineCode>
                </StepItem>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <div className="flex flex-col h-full">
              <h3 className="text-2xl font-bold text-white mb-4">
                Quick Start with PostgreSQL:
              </h3>
              <div className="space-y-4 sm:space-y-6">
                <StepItem number={1}>
                  Install PostgreSQL client:{" "}
                  <InlineCode>npm install pg</InlineCode>
                </StepItem>
                <StepItem number={2}>Create connection:</StepItem>
                <div className="ml-6 sm:ml-8 lg:ml-12">
                  <pre className="bg-step p-3 sm:p-4 rounded text-white text-xs sm:text-sm overflow-x-auto leading-relaxed">
                    {`import { Pool } from 'pg'

const pool = new Pool({
  connectionString: '<your-connection-string>'
})`}
                  </pre>
                </div>
                <StepItem number={3}>
                  Query your database:{" "}
                  <InlineCode>
                    const result = await pool.query('SELECT NOW()')
                  </InlineCode>
                </StepItem>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-subtle space-y-4">
        <div className="p-3 bg-brand-surface-highlight/10 border border-brand-surface-highlight/20 rounded-md">
          <p className="text-xs sm:text-sm text-brand-surface-highlight">
            💡 <strong>Tip:</strong> You can also create databases using the CLI
            with{" "}
            <Link href="/" className="hover:underline">
              <InlineCode>npx create-db@latest</InlineCode>
            </Link>
          </p>
        </div>
        <p className="text-xs sm:text-sm text-muted">
          Need more help? Check out{" "}
          {connectionType === "prisma" ? (
            <a
              href="https://www.prisma.io/docs/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Prisma Getting Started
            </a>
          ) : (
            <a
              href="https://node-postgres.com/guides/async-express"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              node-postgres Guide
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
