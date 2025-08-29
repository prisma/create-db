"use client";

import { Lightbulb } from "lucide-react";
import React, { useState } from "react";
import { useDatabase } from "../DatabaseContext";
import { customToast } from "@/lib/custom-toast";

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-step px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded text-white text-xs sm:text-sm">
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
  <div className="flex items-start gap-2 sm:gap-4 w-full">
    <StepNumber number={number} />
    <div className="leading-relaxed text-sm sm:text-lg text-muted overflow-x-auto min-h-16">
      {children}
    </div>
  </div>
);

export default function ConnectPage() {
  const { dbInfo } = useDatabase();
  const [connectionType, setConnectionType] = useState<"prisma" | "direct">(
    "prisma"
  );
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getCopyConnectionString = () => {
    const connectionString =
      connectionType === "prisma"
        ? dbInfo.connectionString
        : dbInfo.directConnectionString;
    return connectionString || "Loading connection string...";
  };

  const handleCopyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(getCopyConnectionString());
      setCopied(true);
      customToast("success", "Connection string copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const displayed =
    connectionType === "prisma"
      ? dbInfo.connectionString
      : dbInfo.directConnectionString;

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
          With any other tool
        </button>
      </div>

      {/* Connection string input - responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="bg-card rounded-md font-mono text-sm flex-1 min-h-[48px] sm:h-12 border border-subtle min-w-0 flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={displayed}
            readOnly
            className="bg-transparent p-3 text-white text-sm flex-1 outline-none font-mono"
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
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          <button
            className={`flex items-center justify-center w-12 h-12 border border-subtle rounded-md transition-colors ${
              copied
                ? "text-green-400 border-green-400"
                : "text-muted hover:text-white"
            }`}
            onClick={handleCopyConnectionString}
            title="Copy connection string"
          >
            {copied ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {connectionType === "prisma"
              ? "Connect with Prisma ORM"
              : "Connect with node-postgres"}
          </h3>
          <div className="space-y-4">
            {connectionType === "prisma" ? (
              <>
                <StepItem number={1}>
                  <span className="text-white font-medium">Install Prisma</span>
                  <div className="mt-1">
                    <code className="text-sm bg-card p-1.5 rounded border border-subtle">
                      npm install prisma @prisma/client
                    </code>
                  </div>
                </StepItem>

                <StepItem number={2}>
                  <span className="text-white font-medium">
                    Set connection string in <InlineCode>.env</InlineCode>
                  </span>
                  <div className="w-full overflow-x-auto mt-2">
                    <code className="text-sm bg-card p-2 rounded border border-subtle block overflow-x-auto">
                      DATABASE_URL="
                      <span
                        className="whitespace-nowrap"
                        style={{
                          ["WebkitTextSecurity" as any]: showPassword
                            ? "none"
                            : "disc",
                        }}
                      >
                        {displayed}
                      </span>
                      "
                    </code>
                  </div>
                </StepItem>

                <StepItem number={3}>
                  <span className="text-white font-medium">
                    Pull the database schema
                  </span>
                  <div className="mt-1">
                    <code className="text-sm bg-card p-1.5 rounded border border-subtle">
                      npx prisma db pull
                    </code>
                  </div>
                </StepItem>

                <StepItem number={4}>
                  <span className="text-white font-medium">
                    Generate Prisma Client
                  </span>
                  <div className="mt-1">
                    <code className="text-sm bg-card p-1.5 rounded border border-subtle">
                      npx prisma generate
                    </code>
                  </div>
                </StepItem>

                <StepItem number={5}>
                  <span className="text-white font-medium">Start querying</span>
                  <div className="bg-card p-3 rounded border border-subtle mt-2 overflow-x-scroll">
                    <code className="text-sm whitespace-pre overflow-x-auto">
                      {`import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const users = await prisma.user.findMany()
console.log(users)`}
                    </code>
                  </div>
                </StepItem>
              </>
            ) : (
              <>
                <StepItem number={1}>
                  <span className="text-white font-medium">
                    Install node-postgres
                  </span>
                  <div className="mt-1">
                    <code className="text-sm bg-card p-1.5 rounded border border-subtle">
                      npm install pg
                    </code>
                  </div>
                </StepItem>

                <StepItem number={2}>
                  <span className="text-white font-medium">
                    Set connection string in <InlineCode>.env</InlineCode>
                  </span>
                  <div className="w-full mt-2">
                    <code className="text-sm bg-card p-2 rounded border border-subtle block overflow-x-auto">
                      DATABASE_URL="
                      <span
                        className="whitespace-nowrap"
                        style={{
                          ["WebkitTextSecurity" as any]: showPassword
                            ? "none"
                            : "disc",
                        }}
                      >
                        {displayed}
                      </span>
                      "
                    </code>
                  </div>
                </StepItem>

                <StepItem number={3}>
                  <span className="text-white font-medium">
                    Set up connection
                  </span>
                  <div className="w-full mt-2">
                    <code className="text-sm bg-card p-2 rounded border border-subtle block overflow-x-auto whitespace-pre">
                      {`import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})`}
                    </code>
                  </div>
                </StepItem>

                <StepItem number={4}>
                  <span className="text-white font-medium">Basic query</span>
                  <div className="w-full mt-2">
                    <code className="text-sm bg-card p-2 rounded border border-subtle block overflow-x-auto whitespace-pre">
                      {`const { rows } = await pool.query('SELECT * FROM users')
console.log(rows)`}
                    </code>
                  </div>
                </StepItem>

                <StepItem number={5}>
                  <span className="text-white font-medium">
                    Parameterized query
                  </span>
                  <div className="bg-card p-3 rounded border border-subtle mt-2 overflow-x-auto">
                    <code className="text-sm whitespace-pre">
                      {`const { rows } = await pool.query('SELECT * FROM users WHERE id = $1')
console.log(rows[0])`}
                    </code>
                  </div>
                </StepItem>
              </>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="p-3 bg-brand-surface-highlight/10 border border-brand-surface-highlight/20 rounded-md">
            <p className="text-xs sm:text-sm text-brand-surface-highlight">
              <Lightbulb className="w-4 h-4 mr-1 inline-block" />{" "}
              <strong>Tip:</strong> To create a DB on the fly from any terminal,
              use{" "}
              <InlineCode>
                npx create-db<span className="text-muted">@latest</span>
              </InlineCode>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
