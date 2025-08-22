"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TabContent from "@/components/TabContent";
import { useDropContext } from "../contexts/DropContext";
import toast from "react-hot-toast";
import { customToast } from "@/lib/custom-toast";
import { cookieUtils } from "@/lib/utils";

const DB_KEY = "temp_db_info";

const dbStorage = {
  save: (data: any) => {
    try {
      cookieUtils.set(DB_KEY, JSON.stringify(data), 1);
    } catch {}
  },
  load: () => {
    try {
      const stored = cookieUtils.get(DB_KEY);
      if (!stored) return null;
      const data = JSON.parse(stored);
      return Date.now() > data.expirationTime ? null : data;
    } catch {
      return null;
    }
  },
  clear: () => cookieUtils.remove(DB_KEY),
};

const WebPage = () => {
  const [state, setState] = useState(() => {
    return {
      dbData: {
        connectionString: "",
        directConnectionString: "",
        projectId: "",
        databaseId: "",
        expirationTime: null as number | null,
      },
      loading: true,
      activeTab: "connection",
      connectionType: "prisma" as "prisma" | "direct",
      copied: false,
      fetchingNewConnections: false,
      showNewDbConfirm: false,
    };
  });

  const { setTimeRemaining, setProjectId, setIsLoading } = useDropContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateState = (updates: Partial<typeof state>) =>
    setState((prev) => ({ ...prev, ...updates }));

  const updateDbData = (updates: Partial<typeof state.dbData>) =>
    setState((prev) => ({
      ...prev,
      dbData: { ...prev.dbData, ...updates },
    }));

  const currentTab = searchParams.get("tab") || "connection";

  useEffect(() => {
    const initializeDatabase = async () => {
      const stored = dbStorage.load();

      if (stored) {
        updateDbData(stored);
        updateState({ loading: false });
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
            databaseId: result.databaseId,
          };

          const persistentData = {
            projectId: result.projectId,
            connectionString,
            directConnectionString,
            expirationTime,
            databaseId: result.databaseId,
          };

          updateDbData(newDbData);
          dbStorage.save(persistentData);
        }
        updateState({ loading: false });
        setIsLoading(false);
      } catch (error) {
        router.replace(`/error?title=Error&message=Failed to create database`);
      }
    };

    initializeDatabase();
  }, [router]);

  useEffect(() => {
    if (state.dbData.projectId) {
      setProjectId(state.dbData.projectId);
    }
  }, [state.dbData.projectId, setProjectId]);

  useEffect(() => {
    if (!state.loading && state.dbData.expirationTime) {
      const calculateTimeRemaining = () => {
        const now = new Date().getTime();
        const timeRemainingMs = state.dbData.expirationTime! - now;

        if (timeRemainingMs <= 0) {
          setTimeRemaining(0);
          dbStorage.clear();
          return;
        }

        setTimeRemaining(Math.floor(timeRemainingMs / 1000));
      };

      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [state.loading, state.dbData.expirationTime, setTimeRemaining]);

  const getConnectionString = () => {
    const connectionString =
      state.connectionType === "prisma"
        ? state.dbData.connectionString
        : state.dbData.directConnectionString;

    return (
      connectionString ||
      "Connection string hidden, if you need one please generate a new one."
    );
  };

  const handleCopyConnectionString = async () => {
    const hasConnectionStrings =
      state.dbData.connectionString && state.dbData.directConnectionString;
    if (!hasConnectionStrings) return;
    customToast("success", "Connection string copied to clipboard");
    try {
      await navigator.clipboard.writeText(getConnectionString());
      updateState({ copied: true });
      setTimeout(() => updateState({ copied: false }), 2000);
    } catch {}
  };

  const handleGetNewConnectionStrings = async () => {
    if (!state.dbData.databaseId) return;

    updateState({ fetchingNewConnections: true });
    try {
      const response = await fetch("/api/get-connection-string", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseId: state.dbData.databaseId }),
      });

      if (response.ok) {
        const result = (await response.json()) as any;
        const newConnectionStrings = {
          connectionString: result.data?.connectionString || "",
          directConnectionString:
            result.directConnectionString ||
            "Direct connection string not available",
        };
        updateDbData(newConnectionStrings);

        const stored = dbStorage.load();
        if (stored) {
          const updatedData = {
            ...stored,
            ...newConnectionStrings,
          };
          dbStorage.save(updatedData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch new connection strings:", error);
    } finally {
      updateState({ fetchingNewConnections: false });
    }
  };

  const handleCreateNewDatabase = () => {
    updateState({ showNewDbConfirm: true });
  };

  const confirmCreateNewDatabase = () => {
    dbStorage.clear();
    window.location.reload();
  };

  const cancelCreateNewDatabase = () => {
    updateState({ showNewDbConfirm: false });
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

  if (state.loading) {
    return (
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
          <p className="mt-4 text-lg text-muted">
            Setting up your temporary database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 pb-16 font-barlow">
        <div className="flex-1 min-h-[calc(100vh-280px)]">
          <TabContent
            activeTab={currentTab}
            onTabChange={handleTabChange}
            connectionString={getConnectionString()}
            connectionType={state.connectionType}
            setConnectionType={(type) => updateState({ connectionType: type })}
            getConnectionString={getConnectionString}
            handleCopyConnectionString={handleCopyConnectionString}
            copied={state.copied}
            projectId={state.dbData.projectId}
            onCreateNewDatabase={handleCreateNewDatabase}
            connectionStringsVisible={
              !!(
                state.dbData.connectionString &&
                state.dbData.directConnectionString
              )
            }
            onGetNewConnectionStrings={handleGetNewConnectionStrings}
            fetchingNewConnections={state.fetchingNewConnections}
          />
        </div>
      </div>

      {state.showNewDbConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-card border border-subtle rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">
              Create New Database?
            </h3>
            <p className="text-muted mb-6">
              This will delete your current database and create a new one. Your
              current connection strings and data will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelCreateNewDatabase}
                className="px-4 py-2 text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateNewDatabase}
                className="px-4 py-2 bg-button hover:bg-button-hover text-white rounded transition-colors"
              >
                Create New Database
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WebPage;
