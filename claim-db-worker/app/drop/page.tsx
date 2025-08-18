"use client";

import React, { useState, useEffect } from "react";
import TabContent from "@/components/TabContent";
import { useDropContext } from "../contexts/DropContext";

const DropPage = () => {
  const [connectionString, setConnectionString] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schema");
  const [databaseId, setDatabaseId] = useState("");
  const [connectionType, setConnectionType] = useState<"prisma" | "direct">("prisma");
  const [copied, setCopied] = useState(false);
  const { setTimeRemaining } = useDropContext();

  // Simulate database provisioning on component mount
  useEffect(() => {
    const provisionDatabase = async () => {
      setLoading(true);
      try {
        // Simulate API call to provision database
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockDbId = `db_${Math.random().toString(36).substring(2, 10)}`;
        const mockConnectionString = `postgresql://prisma:password@db.prisma-drop.com:5432/${mockDbId}?schema=public`;

        setConnectionString(mockConnectionString);
        setDatabaseId(mockDbId);
        setLoading(false);
      } catch (error) {
        console.error("Failed to provision database:", error);
        setLoading(false);
      }
    };

    provisionDatabase();
  }, [setTimeRemaining]);

  // Simulate countdown timer for database expiration
  useEffect(() => {
    if (!loading) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev > 0) {
            return prev - 1 / 60; // Decrease by 1 minute
          }
          return prev;
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [loading, setTimeRemaining]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleCopyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(getConnectionString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy connection string:", error);
    }
  };

  const getConnectionString = () => {
    if (connectionType === "prisma") {
      return connectionString;
    } else {
      // Direct connection string (same for now, but could be different)
      return connectionString;
    }
  };

  const getConnectionInstructions = () => {
    if (connectionType === "prisma") {
      return "Add this to your .env file as DATABASE_URL for use with Prisma ORM";
    } else {
      return "Use this connection string directly with your PostgreSQL client";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 font-barlow">
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {loading ? (
          <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center flex-1">
            <div className="animate-pulse">
              <svg width="48" height="60" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
              </svg>
            </div>
            <p className="mt-4 text-lg text-muted">
              Provisioning your temporary database...
            </p>
          </div>
        ) : (
          <>
            {/* Compact Database Connection Header */}
            <div className="bg-code rounded-lg border border-subtle p-4 mb-4 w-full">
              {/* Connection Type Tabs */}
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
              
              {/* Connection String */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-card p-2 rounded-md font-mono text-sm overflow-x-auto flex-1 h-10 text-white border border-subtle min-w-0">
                  <div className="truncate">{getConnectionString()}</div>
                </div>
                <button
                  className="flex items-center justify-center w-10 h-10 text-muted border border-subtle rounded-md hover:text-white transition-colors"
                  onClick={handleCopyConnectionString}
                  title="Copy connection string"
                >
                  {copied ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted mt-1">
                {getConnectionInstructions()}
              </p>
            </div>

            {/* Main Content Area - Schema Editor & Studio */}
            <div className="flex-1 min-h-0">
              <TabContent
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DropPage;