"use client";

import React, { useState } from "react";

interface DatabaseConnectionProps {
  connectionType: "prisma" | "direct";
  setConnectionType: (type: "prisma" | "direct") => void;
  getConnectionString: () => string;
  handleCopyConnectionString: () => void;
  copied: boolean;
}

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-step px-3 py-2 rounded text-white text-base">
    {children}
  </code>
);

const StepNumber = ({ number }: { number: number }) => (
  <div className="flex-shrink-0 w-8 h-8 bg-table-header rounded-full flex items-center justify-center text-white text-sm font-medium">
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
  <div className="flex items-start gap-4">
    <StepNumber number={number} />
    <div className="flex-1 leading-relaxed text-lg text-muted">{children}</div>
  </div>
);

export default function DatabaseConnection({
  connectionType,
  setConnectionType,
  getConnectionString,
  handleCopyConnectionString,
  copied,
}: DatabaseConnectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-card rounded-lg border border-subtle p-6 w-full h-full flex flex-col">
      <div className="flex bg-step rounded-md p-1 w-full mb-3">
        <button
          className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors font-medium ${
            connectionType === "prisma"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => setConnectionType("prisma")}
        >
          With Prisma ORM
        </button>
        <button
          className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors font-medium ${
            connectionType === "direct"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => setConnectionType("direct")}
        >
          Direct Connection
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-card rounded-md font-mono text-sm flex-1 h-12 border border-subtle min-w-0 flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={getConnectionString()}
            readOnly
            className="bg-transparent p-3 text-white text-sm flex-1 outline-none"
            style={{ fontFamily: "monospace" }}
          />
        </div>
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
      <p className="text-sm text-muted mb-6">
        {connectionType === "prisma"
          ? "Add this to your .env file as DATABASE_URL for use with Prisma ORM"
          : "Use this connection string directly with your PostgreSQL client"}
      </p>

      <div className="flex-1 space-y-6 bg-dark rounded-lg p-6">
        {connectionType === "prisma" ? (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with Prisma ORM:
            </h3>
            <div className="space-y-6">
              <StepItem number={1}>
                Create a <InlineCode>.env</InlineCode> file in your project root
              </StepItem>
              <StepItem number={2}>
                Add the connection string as{" "}
                <InlineCode>DATABASE_URL</InlineCode>
              </StepItem>
              <StepItem number={3}>
                Install Prisma:{" "}
                <InlineCode>npm install prisma @prisma/client</InlineCode>
              </StepItem>
              <StepItem number={4}>
                Initialize Prisma: <InlineCode>npx prisma init</InlineCode>
              </StepItem>
              <StepItem number={5}>
                Update your <InlineCode>schema.prisma</InlineCode> with your
                models
              </StepItem>
              <StepItem number={6}>
                Push schema to database:{" "}
                <InlineCode>npx prisma db push</InlineCode>
              </StepItem>
              <StepItem number={7}>
                Generate client: <InlineCode>npx prisma generate</InlineCode>
              </StepItem>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with pg (node-postgres):
            </h3>
            <div className="space-y-6">
              <StepItem number={1}>
                Install pg: <InlineCode>npm install pg @types/pg</InlineCode>
              </StepItem>
              <StepItem number={2}>Create a client connection:</StepItem>
              <div className="ml-12">
                <pre className="bg-step p-6 rounded text-white text-base overflow-x-auto leading-relaxed">
                  {`import { Client } from 'pg';

const client = new Client({
  connectionString: '${getConnectionString()}'
});

await client.connect();`}
                </pre>
              </div>
              <StepItem number={3}>
                Execute queries:{" "}
                <InlineCode>
                  const result = await client.query('SELECT * FROM users')
                </InlineCode>
              </StepItem>
              <StepItem number={4}>
                Close connection: <InlineCode>await client.end()</InlineCode>
              </StepItem>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-card rounded border border-subtle">
        <p className="text-sm text-muted">
          <strong>Note:</strong> This database will be automatically deleted
          after 24 hours unless claimed.
        </p>
      </div>
    </div>
  );
}
