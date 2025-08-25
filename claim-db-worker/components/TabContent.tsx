import React, { useState } from "react";
import PrismaSchemaEditor from "./PrismaSchemaEditor";
import PrismaStudio from "./PrismaStudio";
import DatabaseConnection from "./DatabaseConnection";
import { customToast } from "@/lib/custom-toast";
import { Database, Code } from "lucide-react";
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
      <div className="flex bg-step rounded-md p-1 mb-4">
        <TabHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabName="connection"
          buttonText="Connect to your database"
          icon={<Database className="w-4 h-4" />}
        />
        <TabHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabName="schema"
          buttonText="View your schema"
          icon={<Code className="w-4 h-4" />}
        />
        <TabHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabName="studio"
          buttonText="View your database"
          icon={<Database className="w-4 h-4" />}
        />
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
          <div className="flex items-center justify-end gap-4 p-1">
            <button
              onClick={onCreateNewDatabase}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Create New Database
            </button>
            <button
              onClick={() => {
                const claimUrl = `${window.location.origin}/claim?projectID=${projectId}`;
                navigator.clipboard.writeText(claimUrl);
                customToast("success", "Claim URL copied to clipboard");
              }}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              Copy Claim URL
            </button>
          </div>
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
        <div className="w-full h-screen">
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
  icon: React.ReactNode;
}

const TabHeader = ({
  activeTab,
  onTabChange,
  tabName,
  buttonText,
  icon,
}: TabHeaderProps) => {
  return (
    <button
      className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors font-medium flex justify-center items-center gap-2 w-full h-full ${
        activeTab === tabName
          ? "bg-table-header text-white"
          : "text-muted hover:text-white"
      }`}
      onClick={() => onTabChange(tabName)}
    >
      {icon}
      {buttonText}
    </button>
  );
};
