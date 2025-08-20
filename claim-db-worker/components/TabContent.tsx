import React, { useState } from "react";
import PrismaSchemaEditor from "./PrismaSchemaEditor";
import PrismaStudio from "./PrismaStudio";

interface TabContentProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  connectionString: string;
}

const TabContent = ({
  activeTab = "schema",
  onTabChange = () => {},
  connectionString,
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
}`);

  const handleTabChange = (value: string) => {
    onTabChange(value);
  };

  return (
    <div className="w-full h-full">
      <div className="w-full h-full">
        <div className="flex bg-step rounded-md p-1 mb-4">
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

        {activeTab === "schema" && (
          <div className="w-full h-[calc(100%-40px)]">
            <PrismaSchemaEditor
              value={schemaContent}
              onChange={setSchemaContent}
            />
          </div>
        )}

        {activeTab === "studio" && (
          <div className="w-full h-[calc(100%-40px)]">
            <PrismaStudio connectionString={connectionString} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TabContent;
