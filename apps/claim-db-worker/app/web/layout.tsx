"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDropContext } from "../contexts/DropContext";
import { customToast } from "@/lib/custom-toast";
import Modal from "@/components/Modal";
import { Database, Code, Eye, PlusCircle, Copy } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { LoadingMark, Mascot } from "@/components/brand/Brand";
import { PrismButton, PrismButtonOutline } from "@/components/brand/PrismButton";
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
      <div className="mx-auto w-full max-w-7xl px-2 py-8 sm:px-8 sm:py-12">
        <div className="mb-4 flex h-[calc(100vh-200px)] w-full flex-col items-center justify-center rounded-2xl border border-border bg-paper p-4 text-center">
          <Mascot expression="sad" alt="Prismo, the Prisma mascot, looking sad" className="mb-6 w-28" />
          <p className="max-w-[44ch] px-4 text-lg text-muted-foreground">
            Your temporary database has expired or has been claimed. Please create a new one.
          </p>
          <div className="mt-8">
            <PrismButton onClick={confirmCreateNewDatabase}>Create new database</PrismButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-8 py-8 sm:py-12">
        <div className="flex-1 min-h-[calc(100vh-280px)]">
          <div className="w-full h-full">
            <div className="flex flex-col md:flex-row-reverse justify-between">
              <div className="flex lg:hidden flex-row gap-1 mb-4 lg:mb-0 lg:justify-end lg:items-center">
                <PrismButton size="sm" fullWidth className="flex-1" onClick={handleClaimDatabase}>
                  Claim database
                </PrismButton>
                <button
                  onClick={handleCreateNewDatabase}
                  className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.04] hover:text-ink border border-border md:border-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Create new database</span>
                  <span className="md:hidden">New DB</span>
                </button>
                <button
                  onClick={() => {
                    const claimUrl = `${window.location.origin}/claim?projectID=${dbInfo.projectId}`;
                    navigator.clipboard.writeText(claimUrl);
                    customToast("success", "Claim URL copied to clipboard");
                  }}
                  className="hidden md:flex flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.04] hover:text-ink"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden md:inline">Copy claim URL</span>
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

                  <div className="hidden lg:flex gap-1 p-1">
                    <button
                      onClick={handleCreateNewDatabase}
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.04] hover:text-ink"
                    >
                      <span>Create new database</span>
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const claimUrl = `${window.location.origin}/claim?projectID=${dbInfo.projectId}`;
                        navigator.clipboard.writeText(claimUrl);
                        customToast("success", "Claim URL copied to clipboard");
                      }}
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-black/[0.04] hover:text-ink"
                    >
                      <span>Copy claim URL</span>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="w-full h-[calc(100vh-200px)] mx-auto">
                <LoadingScreen />
              </div>
            ) : (
              <div
                className={`w-full ${pathname.includes("/connect") ? "" : "h-[calc(100vh-200px)]"}`}
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
        <p className="text-muted-foreground mb-6">
          This will delete your current database and create a new one. Your
          current connection strings and data will be lost.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <PrismButtonOutline size="sm" onClick={() => setShowNewDbConfirm(false)}>
            Cancel
          </PrismButtonOutline>
          <PrismButton size="sm" onClick={confirmCreateNewDatabase}>
            Create new database
          </PrismButton>
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
      className={`relative flex-1 px-3 py-2.5 rounded-t-xl border border-b-0 flex justify-center items-center gap-2 transition-colors whitespace-nowrap min-w-0 overflow-hidden ${
        isActive
          ? "bg-paper border-border text-ink"
          : "bg-white border-transparent text-muted-foreground hover:text-ink hover:bg-black/[0.03]"
      }`}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onTabChange(tabName)}
    >
      {/* The prism bands mark where you are. */}
      {isActive && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background:
              "linear-gradient(to right, var(--color-prism-cyan-400) 0% 33%, var(--color-prism-yellow-300) 33% 66%, var(--color-prism-red-500) 66% 100%)",
          }}
        />
      )}
      <div className="text-center justify-center text-sm leading-tight flex-shrink-0">
        {getIcon()}
      </div>
      <div className="text-center justify-center text-sm font-semibold leading-tight hidden md:block">
        {buttonText}
      </div>
      <div className="text-center justify-center text-sm font-semibold leading-tight md:hidden">
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
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-8 pb-8 sm:pb-16">
            <div className="mb-4 flex min-h-[calc(100vh-280px)] w-full flex-col items-center justify-center rounded-2xl border border-border bg-paper p-4">
              <LoadingMark label="Loading..." />
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
