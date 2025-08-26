import React, { useState } from "react";
import PrismaSchemaEditor from "./PrismaSchemaEditor";
import PrismaStudio from "./PrismaStudio";
import DatabaseConnection from "./DatabaseConnection";
import { customToast } from "@/lib/custom-toast";
import { Database, Code, Eye, PlusCircle, Copy } from "lucide-react";
interface TabContentProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  connectionString: string;
  directConnectionString?: string;
  connectionType: "prisma" | "direct";
  setConnectionType: (type: "prisma" | "direct") => void;
  handleCopyConnectionString: () => void;
  copied: boolean;
  projectId: string;
  onCreateNewDatabase: () => void;
  handleClaimDatabase: () => void;
}

const TabContent = ({
  activeTab = "connection",
  onTabChange = () => {},
  connectionString,
  directConnectionString = "",
  connectionType,
  setConnectionType,
  handleCopyConnectionString,
  copied,
  projectId,
  onCreateNewDatabase,
  handleClaimDatabase,
}: TabContentProps) => {
  const [schemaContent, setSchemaContent] = useState<string>(
    `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  );

  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col sm:flex-row-reverse justify-between">
        <div className="flex lg:hidden flex-row gap-1 mb-4 lg:mb-0 lg:justify-end lg:items-center">
          <div
            className="flex-1 px-4 py-2 bg-teal-600 rounded-md flex justify-center items-center cursor-pointer hover:bg-teal-700 transition-colors"
            onClick={handleClaimDatabase}
          >
            <svg
              width="14"
              height="18"
              viewBox="0 0 58 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z"
                fill="currentColor"
              />
            </svg>
            <div className="text-center justify-center text-white text-sm font-bold font-['Barlow'] leading-tight">
              Claim Database
            </div>
          </div>
          <button
            onClick={onCreateNewDatabase}
            className="flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors px-3 py-2 rounded-md border border-brand-surface-highlight/20 sm:border-0 hover:bg-brand-surface-highlight/5"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create New Database</span>
            <span className="sm:hidden">New DB</span>
          </button>
          <button
            onClick={() => {
              const claimUrl = `${window.location.origin}/claim?projectID=${projectId}`;
              navigator.clipboard.writeText(claimUrl);
              customToast("success", "Claim URL copied to clipboard");
            }}
            className="hidden sm:flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors px-3 py-2 rounded-md border border-brand-surface-highlight/20 sm:border-0 hover:bg-brand-surface-highlight/5"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy Claim URL</span>
          </button>
        </div>

        <div className="flex w-full">
          <div className="flex min-w-full lg:min-w-0 lg:w-full gap-0.5 lg:justify-between lg:items-center">
            <div className="flex gap-0.5 w-full max-w-[866px] -mb-px">
              <TabHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabName="connection"
                buttonText="Connect to your database"
                icon="database"
                buttonTextMobile="Connect"
              />
              <TabHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabName="schema"
                buttonText="View your schema"
                icon="code"
                buttonTextMobile="Schema"
              />
              <TabHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabName="studio"
                buttonText="View your database"
                icon="eye"
                buttonTextMobile="Database"
              />
            </div>

            <div className="hidden lg:flex gap-4 p-1">
              <button
                onClick={onCreateNewDatabase}
                className="flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors"
              >
                <span>Create New Database</span>
                <PlusCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const claimUrl = `${window.location.origin}/claim?projectID=${projectId}`;
                  navigator.clipboard.writeText(claimUrl);
                  customToast("success", "Claim URL copied to clipboard");
                }}
                className="flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors"
              >
                <span>Copy Claim URL</span>
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "connection" && (
        <div className="w-full mb-4">
          <DatabaseConnection
            connectionType={connectionType}
            setConnectionType={setConnectionType}
            ormConnectionString={connectionString}
            directConnectionString={directConnectionString}
            handleCopyConnectionString={handleCopyConnectionString}
            copied={copied}
          />
        </div>
      )}

      {activeTab === "schema" && (
        <div className="w-full h-screen">
          <PrismaSchemaEditor
            value={schemaContent}
            onChange={setSchemaContent}
            connectionString={connectionString}
          />
        </div>
      )}

      {activeTab === "studio" && (
        <div className="w-full h-screen bg-white rounded-lg rounded-tl-none">
          <PrismaStudio connectionString={connectionString} />
        </div>
      )}
    </div>
  );
};

export default TabContent;

interface TabHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabName: string;
  buttonText: string;
  icon: string;
  buttonTextMobile: string;
}

const TabHeader = ({
  activeTab,
  onTabChange,
  tabName,
  buttonText,
  icon,
  buttonTextMobile,
}: TabHeaderProps) => {
  const isActive = activeTab === tabName;

  const getIcon = () => {
    switch (icon) {
      case "database":
        return <Database className="w-4 h-4" />;
      case "code":
        return <Code className="w-4 h-4" />;
      case "eye":
        return <Eye className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  return (
    <button
      className={`flex-1 px-3 py-2 rounded-tl-md border-b border-brand-surface-main rounded-tr-md flex justify-center items-center gap-2 transition-colors whitespace-nowrap min-w-0 ${
        isActive
          ? "bg-brand-surface-accent border-brand-surface-highlight text-brand-surface-highlight"
          : "bg-brand-surface-main text-muted hover:text-brand-surface-highlight hover:bg-brand-surface-highlight/5"
      }`}
      onClick={() => onTabChange(tabName)}
    >
      <div className="text-center justify-center text-sm font-black leading-tight flex-shrink-0">
        {getIcon()}
      </div>
      <div className="text-center justify-center text-sm font-bold leading-tight hidden sm:block">
        {buttonText}
      </div>
      <div className="text-center justify-center text-sm font-bold leading-tight sm:hidden">
        {buttonTextMobile}
      </div>
    </button>
  );
};
