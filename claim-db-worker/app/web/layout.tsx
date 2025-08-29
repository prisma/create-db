"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDropContext } from "../contexts/DropContext";
import { customToast } from "@/lib/custom-toast";
import Modal from "@/components/Modal";
import { Database, Code, Eye, PlusCircle, Copy } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { DatabaseProvider, useDatabase } from "./DatabaseContext";

interface WebLayoutProps {
  children: React.ReactNode;
}

const WebLayoutContent = ({ children }: WebLayoutProps) => {
  const [showNewDbConfirm, setShowNewDbConfirm] = useState(false);
  const { dbInfo, loading, clearDatabase } = useDatabase();
  const {
    setTimeRemaining,
    setProjectId,
    setIsLoading,
    handleClaimDatabase,
    timeRemaining,
  } = useDropContext();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = pathname.split("/").pop() || "connect";

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
          clearDatabase();
          return;
        }

        setTimeRemaining(Math.floor(timeRemainingMs / 1000));
      };

      calculateTimeRemaining();
      const timer = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, dbInfo.expirationTime, setTimeRemaining, clearDatabase]);

  const handleCreateNewDatabase = () => {
    setShowNewDbConfirm(true);
  };

  const confirmCreateNewDatabase = () => {
    clearDatabase();
    window.location.reload();
  };

  const handleTabChange = (tab: string) => {
    router.push(`/web/${tab}`);
  };

  if (!loading && (timeRemaining === 0 || timeRemaining === null)) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-16 font-barlow">
        <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center h-[calc(100vh-200px)]">
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
          <p className="mt-4 text-lg text-muted text-center px-4">
            Your temporary database has expired or has been claimed. Please
            create a new one.
          </p>
          <button
            onClick={confirmCreateNewDatabase}
            className="px-4 py-2 bg-button-blue font-bold mt-6 hover:bg-button-blue-hover text-white rounded transition-colors"
          >
            Create New Database
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-12 font-barlow">
        <div className="flex-1 min-h-[calc(100vh-280px)]">
          <div className="w-full h-full">
            <div className="flex flex-col md:flex-row-reverse justify-between">
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
                  onClick={handleCreateNewDatabase}
                  className="flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors px-3 py-2 rounded-md border border-brand-surface-highlight/20 md:border-0 hover:bg-brand-surface-highlight/5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Create New Database</span>
                  <span className="md:hidden">New DB</span>
                </button>
                <button
                  onClick={() => {
                    const claimUrl = `${window.location.origin}/claim?projectID=${dbInfo.projectId}`;
                    navigator.clipboard.writeText(claimUrl);
                    customToast("success", "Claim URL copied to clipboard");
                  }}
                  className="hidden md:flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors px-3 py-2 rounded-md border border-brand-surface-highlight/20 md:border-0 hover:bg-brand-surface-highlight/5"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden md:inline">Copy Claim URL</span>
                </button>
              </div>

              <div className="flex w-full">
                <div className="flex min-w-full lg:min-w-0 lg:w-full gap-0.5 lg:justify-between lg:items-center">
                  <div className="flex gap-0.5 w-full max-w-[866px]">
                    <TabHeader
                      activeTab={currentTab}
                      onTabChange={handleTabChange}
                      tabName="connect"
                      buttonText="Connect to your database"
                      icon="database"
                      buttonTextMobile="Connect"
                    />
                    <TabHeader
                      activeTab={currentTab}
                      onTabChange={handleTabChange}
                      tabName="schema"
                      buttonText="Modify your schema"
                      icon="code"
                      buttonTextMobile="Schema"
                    />
                    <TabHeader
                      activeTab={currentTab}
                      onTabChange={handleTabChange}
                      tabName="studio"
                      buttonText="View your database"
                      icon="eye"
                      buttonTextMobile="Database"
                    />
                  </div>

                  <div className="hidden lg:flex gap-4 p-1">
                    <button
                      onClick={handleCreateNewDatabase}
                      className="flex justify-center items-center gap-2 text-brand-surface-highlight text-sm font-bold leading-tight hover:text-brand-surface-highlight/80 transition-colors"
                    >
                      <span>Create New Database</span>
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const claimUrl = `${window.location.origin}/claim?projectID=${dbInfo.projectId}`;
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

            {loading ? (
              <div className="w-full h-[calc(100vh-200px)] mx-auto font-barlow">
                <LoadingScreen />
              </div>
            ) : (
              <div
                className={`w-full ${pathname.includes("/connect") ? "min-h-[calc(100vh-200px)]" : "h-[calc(100vh-200px)]"}`}
              >
                {children}
              </div>
            )}
          </div>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-end font-barlow">
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
      className={`flex-1 px-3 py-2 rounded-tl-md border border-subtle rounded-tr-md flex justify-center items-center gap-2 transition-colors whitespace-nowrap min-w-0 ${
        isActive
          ? "bg-brand-surface-accent border-brand-surface-highlight text-brand-surface-highlight"
          : "bg-brand-surface-main text-muted hover:text-brand-surface-highlight hover:bg-brand-surface-highlight/5"
      }`}
      onClick={() => onTabChange(tabName)}
    >
      <div className="text-center justify-center text-sm font-black leading-tight flex-shrink-0">
        {getIcon()}
      </div>
      <div className="text-center justify-center text-sm font-bold leading-tight hidden md:block">
        {buttonText}
      </div>
      <div className="text-center justify-center text-sm font-bold leading-tight md:hidden">
        {buttonTextMobile}
      </div>
    </button>
  );
};

const WebLayout = ({ children }: WebLayoutProps) => {
  return (
    <DatabaseProvider>
      <Suspense
        fallback={
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-8 sm:pb-16 font-barlow">
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
              <p className="mt-4 text-lg text-muted text-center px-4">
                Loading...
              </p>
            </div>
          </div>
        }
      >
        <WebLayoutContent>{children}</WebLayoutContent>
      </Suspense>
    </DatabaseProvider>
  );
};

export default WebLayout;
