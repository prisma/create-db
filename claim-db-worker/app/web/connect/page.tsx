"use client";

import { Check, Copy, Eye, EyeClosed, Lightbulb } from "lucide-react";
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

type BuildStep = {
  title: string;
  content: React.ReactNode;
  code?: string;
};

type ConnectionType = "prisma" | "direct";

const buildSteps: Record<ConnectionType, BuildStep[]> = {
  prisma: [
    {
      title: "Install Prisma",
      content: null,
      code: "npm install prisma @prisma/client",
    },
    {
      title: "Initialize Prisma",
      content: null,
      code: "npx prisma init",
    },
    {
      title: "Set connection string in .env",
      content: null,
      code: 'DATABASE_URL="<your-connection-string>"',
    },
    {
      title: "Pull the database schema",
      content: null,
      code: "npx prisma db pull",
    },
    {
      title: "Generate Prisma Client",
      content: null,
      code: "npx prisma generate",
    },
    {
      title: "Start querying",
      content: <span>Import and use Prisma Client in your application</span>,
      code: `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const users = await prisma.user.findMany();
console.log(users);`,
    },
  ],
  direct: [
    {
      title: "Install node-postgres",
      content: null,
      code: "npm install pg",
    },
    {
      title: "Set connection string in .env",
      content: null,
      code: 'DATABASE_URL="<your-connection-string>"',
    },
    {
      title: "Set up connection",
      content: null,
      code: `import { Pool } from "pg";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});`,
    },
    {
      title: "Query your database",
      content: null,
      code: `const { rows } = await pool.query('SELECT * FROM "User"');

console.log(rows);`,
    },
  ],
};

const StepItem = ({
  number,
  title,
  content,
  code,
  showPassword,
  connectionString,
}: {
  number: number;
  title: string;
  content: React.ReactNode;
  code?: string;
  showPassword: boolean;
  connectionString: string;
}) => {
  const displayCode = (() => {
    if (!code) return "";

    let processedConnectionString = connectionString;
    if (!showPassword) {
      processedConnectionString = connectionString.replace(/./g, "•");
    }

    return code.replace("<your-connection-string>", processedConnectionString);
  })();

  return (
    <div className="flex items-start gap-2 sm:gap-4 w-full">
      <StepNumber number={number} />
      <div className="leading-relaxed text-sm sm:text-lg text-muted overflow-x-auto min-h-16">
        <span className="text-white font-medium">{title}</span>
        {content && <div className="mt-1">{content}</div>}
        {code && (
          <div className="mt-2">
            <pre className="bg-card p-3 rounded border border-subtle overflow-x-auto">
              <code className="text-sm whitespace-pre">{displayCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ConnectPage() {
  const { dbInfo } = useDatabase();
  const [connectionType, setConnectionType] =
    useState<ConnectionType>("prisma");
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const connectionString =
    connectionType === "prisma"
      ? dbInfo.connectionString
      : dbInfo.directConnectionString;

  const handleCopyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(connectionString || "");
      setCopied(true);
      customToast("success", "Connection string copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-code rounded-lg rounded-tl-none p-4 sm:p-6 border border-subtle flex flex-col h-full min-h-[calc(100vh-200px)]">
      {/* Connection type toggle */}
      <div className="flex flex-col sm:flex-row rounded-md p-1 w-full mb-3 gap-2">
        {(["prisma", "direct"] as const).map((type) => (
          <button
            key={type}
            className={`flex-1 px-3 py-2 sm:py-1 text-sm rounded-md transition-colors font-medium border ${
              connectionType === type
                ? "text-brand-surface-highlight border-brand-surface-highlight bg-brand-surface-highlight/10"
                : "text-muted hover:text-white border-transparent bg-table-header hover:bg-brand-surface-highlight/5"
            }`}
            onClick={() => setConnectionType(type)}
          >
            {type === "prisma" ? "With Prisma ORM" : "With any other tool"}
          </button>
        ))}
      </div>

      {/* Connection string input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
        <div className="bg-card rounded-md font-mono text-sm flex-1 min-h-[48px] sm:h-12 border border-subtle min-w-0 flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={connectionString || "Loading connection string..."}
            readOnly
            className="bg-transparent p-3 text-white text-sm flex-1 outline-none font-mono w-full"
            style={
              {
                ["WebkitTextSecurity" as any]: showPassword ? "none" : "disc",
              } as React.CSSProperties
            }
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
              <Eye className="h-5 w-5" />
            ) : (
              <EyeClosed className="h-5 w-5" />
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
            disabled={!connectionString}
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
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
            {buildSteps[connectionType].map((step, index) => (
              <StepItem
                key={index}
                number={index + 1}
                title={step.title}
                content={step.content}
                code={step.code}
                showPassword={showPassword}
                connectionString={connectionString || ""}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="p-3 bg-brand-surface-highlight/10 border border-brand-surface-highlight/20 rounded-md">
            <p className="text-xs sm:text-sm text-brand-surface-highlight">
              <Lightbulb className="w-4 h-4 mr-1 inline-block" />
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
