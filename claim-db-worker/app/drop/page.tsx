"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TabContent from "@/components/TabContent";
import { useDropContext } from "../contexts/DropContext";

const DB_KEY = "temp_db_info";

const dbStorage = {
  save: (data: any) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
    } catch {}
  },
  load: () => {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (!stored) return null;
      const data = JSON.parse(stored);
      return Date.now() > data.expirationTime ? null : data;
    } catch {
      return null;
    }
  },
  clear: () => localStorage.removeItem(DB_KEY),
};

const DropPage = () => {
  const [dbData, setDbData] = useState({
    connectionString: "",
    directConnectionString: "",
    projectId: "",
    expirationTime: null as number | null,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("connection");
  const [connectionType, setConnectionType] = useState<"prisma" | "direct">(
    "prisma"
  );
  const [copied, setCopied] = useState(false);
  const { setTimeRemaining, setProjectId } = useDropContext();
  const router = useRouter();

  useEffect(() => {
    const initializeDatabase = async () => {
      const stored = dbStorage.load();

      if (stored) {
        setDbData(stored);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/create-db", { method: "POST" });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = (await response.json()) as any;
        const db = result.response?.data?.database;

        if (db) {
          const expirationTime =
            new Date(db.createdAt).getTime() + 24 * 60 * 60 * 1000;
          const connectionString =
            db.connectionString || result.connectionString;
          const directConnectionString = db.apiKeys?.[0]?.directConnection
            ? `postgresql://${db.apiKeys[0].directConnection.user}:${db.apiKeys[0].directConnection.pass}@${db.apiKeys[0].directConnection.host}`
            : "";

          const newDbData = {
            projectId: result.projectId,
            connectionString,
            directConnectionString,
            expirationTime,
          };

          setDbData(newDbData);
          dbStorage.save(newDbData);
        }
        setLoading(false);
      } catch (error) {
        router.replace(`/error?title=Error&message=Failed to create database`);
      }
    };

    initializeDatabase();
  }, [router]);

  useEffect(() => {
    if (dbData.projectId) {
      setProjectId(dbData.projectId);
    }
  }, [dbData.projectId, setProjectId]);

  useEffect(() => {
    if (!loading && dbData.expirationTime) {
      const calculateTimeRemaining = () => {
        const now = new Date().getTime();
        const timeRemainingMs = dbData.expirationTime! - now;

        if (timeRemainingMs <= 0) {
          setTimeRemaining(0);
          dbStorage.clear();
          return;
        }

        const totalSeconds = Math.floor(timeRemainingMs / 1000);
        setTimeRemaining(totalSeconds);
      };

      calculateTimeRemaining();

      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, dbData.expirationTime, setTimeRemaining]);

  const getConnectionString = () =>
    connectionType === "prisma"
      ? dbData.connectionString
      : dbData.directConnectionString;

  const handleCopyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(getConnectionString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCreateNewDatabase = () => {
    dbStorage.clear();
    window.location.reload();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 font-barlow">
      <div className="flex flex-col min-h-[calc(100vh-280px)]">
        {loading ? (
          <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center flex-1">
            <div className="animate-pulse">
              <svg
                width="48"
                height="60"
                viewBox="0 0 58 72"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z"
                  fill="white"
                />
              </svg>
            </div>
            <p className="mt-4 text-lg text-muted">
              Setting up your temporary database...
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-[calc(100vh-280px)]">
            <TabContent
              activeTab={activeTab}
              onTabChange={setActiveTab}
              connectionString={getConnectionString()}
              connectionType={connectionType}
              setConnectionType={setConnectionType}
              getConnectionString={getConnectionString}
              handleCopyConnectionString={handleCopyConnectionString}
              copied={copied}
              projectId={dbData.projectId}
              onCreateNewDatabase={handleCreateNewDatabase}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DropPage;
