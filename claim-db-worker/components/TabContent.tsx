import React, { useState } from "react";
import PrismaSchemaEditor from "./PrismaSchemaEditor";

interface TabContentProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TabContent = ({
  activeTab = "schema",
  onTabChange = () => {},
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
            <div className="w-full h-full border border-subtle rounded-lg bg-card">
              <div className="w-full h-full flex flex-col items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold mb-2 text-white">Prisma Studio</h3>
                  <p className="text-muted mb-4">
                    This would be an embedded version of Prisma Studio for
                    browsing and editing database records.
                  </p>
                  <div className="border border-subtle rounded-md p-4 bg-step">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex space-x-2">
                        <div className="bg-accent/20 text-accent px-3 py-1 rounded-md text-sm font-medium">
                          User
                        </div>
                        <div className="bg-table-header px-3 py-1 rounded-md text-sm text-white">
                          Post
                        </div>
                      </div>
                      <button className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-button rounded-md hover:bg-button-hover transition-colors">
                        New Record
                      </button>
                    </div>
                    <div className="border border-subtle rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-table-header">
                            <th className="p-2 text-left text-white font-medium">id</th>
                            <th className="p-2 text-left text-white font-medium">email</th>
                            <th className="p-2 text-left text-white font-medium">name</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-subtle">
                            <td className="p-2 text-white">1</td>
                            <td className="p-2 text-white">user1@example.com</td>
                            <td className="p-2 text-white">User One</td>
                          </tr>
                          <tr className="border-t border-subtle">
                            <td className="p-2 text-white">2</td>
                            <td className="p-2 text-white">user2@example.com</td>
                            <td className="p-2 text-white">User Two</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabContent;
