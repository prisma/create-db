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
  connectionType: "prisma" | "direct";
  setConnectionType: (type: "prisma" | "direct") => void;
  getConnectionString: () => string;
  handleCopyConnectionString: () => void;
  copied: boolean;
  projectId: string;
  onCreateNewDatabase: () => void;
}

const TabContent = ({
  activeTab = "connection",
  onTabChange = () => {},
  connectionString,
  connectionType,
  setConnectionType,
  getConnectionString,
  handleCopyConnectionString,
  copied,
  projectId,
  onCreateNewDatabase,
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
      <div className="self-stretch w-full inline-flex justify-between items-center">
        <div className="w-[866px] flex justify-start items-center gap-0.5">
          <TabHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabName="connection"
            buttonText="Connect to your database"
            icon="database"
          />
          <TabHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabName="schema"
            buttonText="View your schema"
            icon="code"
          />
          <TabHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabName="studio"
            buttonText="View your database"
            icon="eye"
          />
        </div>
        <div className="p-1 flex justify-end items-center gap-4">
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

      {activeTab === "connection" && (
        <div className="w-full mb-4">
          <DatabaseConnection
            connectionType={connectionType}
            setConnectionType={setConnectionType}
            getConnectionString={getConnectionString}
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
}

const TabHeader = ({
  activeTab,
  onTabChange,
  tabName,
  buttonText,
  icon,
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
      className={`flex-1 px-3 py-2 rounded-tl-md border-b border-brand-surface-main rounded-tr-md flex justify-center items-center gap-2 transition-colors ${
        isActive
          ? "bg-brand-surface-accent border-brand-surface-highlight text-brand-surface-highlight"
          : "bg-brand-surface-main text-muted hover:text-brand-surface-highlight"
      }`}
      onClick={() => onTabChange(tabName)}
    >
      <div className="text-center justify-center text-sm font-black leading-tight">
        {getIcon()}
      </div>
      <div className="text-center justify-center text-sm font-bold leading-tight">
        {buttonText}
      </div>
    </button>
  );
};
