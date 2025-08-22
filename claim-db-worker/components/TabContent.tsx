import React, { useState } from "react";
import PrismaSchemaEditor from "./PrismaSchemaEditor";
import PrismaStudio from "./PrismaStudio";
import DatabaseConnection from "./DatabaseConnection";

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
  connectionStringsVisible: boolean;
  onGetNewConnectionStrings: () => void;
  fetchingNewConnections: boolean;
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
  connectionStringsVisible,
  onGetNewConnectionStrings,
  fetchingNewConnections,
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
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`
  );

  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  return (
    <div className="w-full h-full">
      <div className="flex bg-step rounded-md p-1 mb-4">
        <button
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors font-medium ${
            activeTab === "connection"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => handleTabChange("connection")}
        >
          Database Connection
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors font-medium ${
            activeTab === "schema"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => handleTabChange("schema")}
        >
          Schema Editor
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors font-medium ${
            activeTab === "studio"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => handleTabChange("studio")}
        >
          Prisma Studio
        </button>
      </div>

      {activeTab === "connection" && (
        <div className="w-full">
          <div className="bg-card rounded-lg border border-subtle p-3 mb-4 w-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Project ID:</span>
                <code className="text-sm bg-step px-2 py-1 rounded text-white font-mono">
                  {projectId}
                </code>
              </div>
              <button
                onClick={onCreateNewDatabase}
                className="text-sm text-muted hover:text-white transition-colors"
              >
                Create New Database
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Claim URL:</span>
                <code className="text-sm bg-step px-2 py-1 rounded text-white font-mono">
                  {`${window.location.origin}/claim?projectID=${projectId}`}
                </code>
              </div>
              <button
                onClick={() => {
                  const claimUrl = `${window.location.origin}/claim?projectID=${projectId}`;
                  navigator.clipboard.writeText(claimUrl);
                }}
                className="text-sm text-muted hover:text-white transition-colors"
              >
                Copy Claim URL
              </button>
            </div>
          </div>
          <DatabaseConnection
            connectionType={connectionType}
            setConnectionType={setConnectionType}
            getConnectionString={getConnectionString}
            handleCopyConnectionString={handleCopyConnectionString}
            copied={copied}
            connectionStringsVisible={connectionStringsVisible}
            onGetNewConnectionStrings={onGetNewConnectionStrings}
            fetchingNewConnections={fetchingNewConnections}
          />
        </div>
      )}

      {activeTab === "schema" && (
        <div className="w-full h-screen">
          <PrismaSchemaEditor
            value={schemaContent}
            onChange={setSchemaContent}
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
