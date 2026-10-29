"use client";

import { Check, Copy, Eye, EyeClosed, Lightbulb, Zap } from "lucide-react";
import React, { useState } from "react";
import { useDatabase } from "../DatabaseContext";
import { customToast } from "@/lib/custom-toast";

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-white border border-border px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded font-mono text-ink text-xs sm:text-sm">
    {children}
  </code>
);

const StepNumber = ({ number }: { number: number }) => (
  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-white border border-border rounded-full flex items-center justify-center font-mono text-ink text-xs sm:text-sm">
    {number}
  </div>
);

type BuildStep = {
  title: string;
  content: React.ReactNode;
  code?: string;
};

const buildSteps: BuildStep[] = [
  {
    title: "Install Dependencies",
    content: null,
    code: `npm pkg set type=module
npm install @prisma/orm-postgres dotenv
npm install prisma @prisma/cli-engine @types/node --save-dev`,
  },
  {
    title: "Initialize Prisma",
    content: null,
    code: "npx prisma orm init --target postgres --authoring psl --skip-install",
  },
  {
    title: "Set connection string in .env",
    content: null,
    code: 'DATABASE_URL="<your-connection-string>"',
  },
  {
    title: "Pull the database schema",
    content: null,
    code: "npx prisma contract infer",
  },
  {
    title: "Emit the contract",
    content: null,
    code: "npx prisma contract emit",
  },
  {
    title: "Start querying",
    content: <span>Import the client from src/prisma/db.ts</span>,
    code: `import { db } from "./src/prisma/db";

// Each model in your schema is on db.orm.public, for example:
const users = await db.orm.public.User.all();`,
  },
];

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
      <div className="leading-relaxed text-sm sm:text-base text-muted-foreground overflow-x-auto min-h-16">
        <span className="text-ink font-semibold">{title}</span>
        {content && <div className="mt-1">{content}</div>}
        {code && (
          <div className="mt-2">
            <pre className="bg-white p-3 rounded-xl border border-border overflow-x-auto">
              <code className="font-mono text-sm text-ink whitespace-pre">{displayCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ConnectPage() {
  const { dbInfo } = useDatabase();
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedAccel, setCopiedAccel] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const connectionString = dbInfo.directConnectionString;

  const handleCopyConnectionString = async (
    copyString: string,
    setCopied: (copied: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(copyString);
      setCopied(true);
      customToast("success", "Connection string copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-paper rounded-2xl rounded-tl-none p-4 sm:p-6 border border-border flex flex-col h-full min-h-[calc(100vh-200px)]">
      {/* Connection type toggle */}
      {/* <div className="flex flex-col sm:flex-row rounded-md p-1 w-full mb-3 gap-2">
        {(["prisma", "direct"] as const).map((type) => (
          <button
            key={type}
            className={`flex-1 px-3 py-2 sm:py-1 text-sm rounded-md transition-colors font-medium border ${
              connectionType === type
                ? "text-ink border-border bg-white"
                : "text-muted-foreground hover:text-ink border-transparent hover:bg-black/[0.03]"
            }`}
            onClick={() => setConnectionType(type)}
          >
            {type === "prisma" ? "With Prisma ORM" : "With any other tool"}
          </button>
        ))}
      </div> */}

      {/* Connection string input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
        <div className="bg-white rounded-full font-mono text-sm flex-1 min-h-[48px] sm:h-12 border border-border min-w-0 flex items-center px-2">
          <input
            type={showPassword ? "text" : "password"}
            value={connectionString || "Loading connection string..."}
            readOnly
            className="bg-transparent p-3 text-ink text-sm flex-1 outline-none font-mono w-full"
            style={
              {
                WebkitTextSecurity: showPassword ? "none" : "disc",
              } as React.CSSProperties
            }
          />
        </div>
        <div className="flex gap-2">
          <button
            className="flex items-center justify-center w-12 h-12 bg-white border border-border rounded-full transition-colors text-muted-foreground hover:text-ink hover:border-black/20"
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
            className={`flex items-center justify-center w-12 h-12 bg-white border rounded-full transition-colors ${
              copiedDirect
                ? "text-prism-cyan-700 border-prism-cyan-400"
                : "border-border text-muted-foreground hover:text-ink hover:border-black/20"
            }`}
            onClick={() =>
              handleCopyConnectionString(
                dbInfo.directConnectionString,
                setCopiedDirect
              )
            }
            title="Copy connection string"
            disabled={!connectionString}
          >
            {copiedDirect ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
          <button
            className={`flex items-center justify-center w-12 h-12 bg-white border rounded-full transition-colors ${
              copiedAccel
                ? "text-prism-cyan-700 border-prism-cyan-400"
                : "border-border text-muted-foreground hover:text-ink hover:border-black/20"
            }`}
            onClick={() =>
              handleCopyConnectionString(
                dbInfo.connectionString,
                setCopiedAccel
              )
            }
            title="Copy accelerate connection string"
            disabled={!connectionString}
          >
            {copiedAccel ? (
              <Check className="h-5 w-5" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="space-y-6">
          <h3 className="text-xl mb-4">
            Connect with Prisma ORM
          </h3>
          <div className="space-y-4">
            {buildSteps.map((step, index) => (
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
          <div className="p-3 bg-prism-cyan-50 border border-prism-cyan-200 rounded-xl">
            <p className="text-xs sm:text-sm text-prism-cyan-900">
              <Lightbulb className="w-4 h-4 mr-1 inline-block text-prism-cyan-700" />
              <strong>Tip:</strong> To create a DB on the fly from any terminal,
              use{" "}
              <InlineCode>
                npx create-db<span className="text-muted-foreground">@latest</span>
              </InlineCode>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
