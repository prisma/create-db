"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TabContent from "@/components/TabContent";
import { useDropContext } from "../contexts/DropContext";
import { customToast } from "@/lib/custom-toast";
import Modal from "@/components/Modal";
import { cookieUtils } from "@/lib/utils";

const DB_KEY = "temp_db_info";

const WebPageContent = () => {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showNewDbConfirm, setShowNewDbConfirm] = useState(false);
  const [connectionType, setConnectionType] = useState<"prisma" | "direct">(
    "prisma"
  );

  const [dbInfo, setDbInfo] = useState({
    connectionString: "",
    directConnectionString: "",
    projectId: "",
    databaseId: "",
    expirationTime: null as number | null,
  });

  const [directConnectionString, setDirectConnectionString] = useState("");

  const { setTimeRemaining, setProjectId, setIsLoading, timeRemaining } =
    useDropContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab") || "connection";

  const saveToCookie = (data: typeof dbInfo) => {
    cookieUtils.set(DB_KEY, JSON.stringify(data), 1);
  };

  const loadFromCookie = () => {
    try {
      const stored = cookieUtils.get(DB_KEY);
      if (!stored) return null;
      const data = JSON.parse(stored);
      return Date.now() > data.expirationTime ? null : data;
    } catch {
      return null;
    }
  };

  const clearCookie = () => cookieUtils.remove(DB_KEY);

  useEffect(() => {
    const initializeDatabase = async () => {
      const stored = loadFromCookie();

      if (stored) {
        setDbInfo({
          connectionString: stored.connectionString || "",
          directConnectionString: stored.directConnectionString || "",
          projectId: stored.projectId || "",
          databaseId: stored.databaseId || "",
          expirationTime: stored.expirationTime || null,
        });
        setDirectConnectionString(stored.directConnectionString || "");
        setLoading(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/create-db", { method: "POST" });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = (await response.json()) as any;
        const db = result.response?.data?.database;

        if (db) {
          const newDbInfo = {
            projectId: result.projectId,
            connectionString: db.connectionString,
            directConnectionString: db.directConnectionString,
            expirationTime: Date.now() + 24 * 60 * 60 * 1000,
            databaseId: result.databaseId,
          };

          const directConnString = db.directConnection
            ? `postgresql://${db.directConnection.user}:${db.directConnection.pass}@${db.directConnection.host}`
            : "";

          setDbInfo(newDbInfo);
          setDirectConnectionString(directConnString);
          saveToCookie({
            ...newDbInfo,
            directConnectionString: directConnString,
          });
        }
        setLoading(false);
        setIsLoading(false);
      } catch (error) {
        router.replace(`/error?title=Error&message=Failed to create database`);
      }
    };

    initializeDatabase();
  }, [router, setIsLoading]);

  useEffect(() => {
    if (dbInfo.projectId) {
      setProjectId(dbInfo.projectId);
    }
  }, [dbInfo.projectId, setProjectId]);

  useEffect(() => {
    if (!loading && dbInfo.expirationTime) {
      const calculateTimeRemaining = () => {
        const now = Date.now();
        const timeRemainingMs = dbInfo.expirationTime! - now;
        if (timeRemainingMs <= 0) {
          setTimeRemaining(0);
          clearCookie();
          return;
        }

        setTimeRemaining(Math.floor(timeRemainingMs / 1000));
      };

      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, dbInfo.expirationTime, setTimeRemaining]);

  const getCopyConnectionString = () => {
    const connectionString =
      connectionType === "prisma"
        ? dbInfo.connectionString
        : directConnectionString;
    return connectionString || "Loading connection string...";
  };

  const handleCopyConnectionString = async () => {
    try {
      await navigator.clipboard.writeText(getCopyConnectionString());
      setCopied(true);
      customToast("success", "Connection string copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCreateNewDatabase = () => {
    setShowNewDbConfirm(true);
  };

  const confirmCreateNewDatabase = () => {
    clearCookie();
    window.location.reload();
  };

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "connection") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.push(`/web?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 font-barlow">
        <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center min-h-[calc(100vh-280px)]">
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
      </div>
    );
  }

  if (timeRemaining === 0 || timeRemaining === null) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 font-barlow">
        <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center min-h-[calc(100vh-280px)]">
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
            Your temporary database has expired or has been claimed. Please
            create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 py-12 font-barlow">
        <div className="flex-1 min-h-[calc(100vh-280px)]">
          <TabContent
            activeTab={currentTab}
            onTabChange={handleTabChange}
            connectionType={connectionType}
            setConnectionType={setConnectionType}
            connectionString={dbInfo.connectionString}
            directConnectionString={directConnectionString}
            handleCopyConnectionString={handleCopyConnectionString}
            copied={copied}
            projectId={dbInfo.projectId}
            onCreateNewDatabase={handleCreateNewDatabase}
          />
        </div>
      </div>

      <Modal
        isOpen={showNewDbConfirm}
        onClose={() => setShowNewDbConfirm(false)}
        title="Create New Database?"
      >
        <p className="text-muted mb-6">
          This will delete your current database and create a new one. Your
          current connection strings and data will be lost.
        </p>
        <div className="flex gap-3 justify-end font-barlow">
          <button
            onClick={() => setShowNewDbConfirm(false)}
            className="px-4 py-2 text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmCreateNewDatabase}
            className="px-4 py-2 bg-button-blue font-bold hover:bg-button-blue-hover text-white rounded transition-colors"
          >
            Create New Database
          </button>
        </div>
      </Modal>
    </>
  );
};

const WebPage = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 pb-16 font-barlow">
          <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center min-h-[calc(100vh-280px)]">
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
            <p className="mt-4 text-lg text-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <WebPageContent />
    </Suspense>
  );
};

export default WebPage;
