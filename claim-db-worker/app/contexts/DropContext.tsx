"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface DropContextType {
  projectId: string;
  setProjectId: (projectId: string) => void;
  timeRemaining: number | null;
  setTimeRemaining: (
    time: number | null | ((prev: number | null) => number | null)
  ) => void;
  handleClaimDatabase: () => void;
}

const DropContext = createContext<DropContextType | undefined>(undefined);

export function DropProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const handleClaimDatabase = () => {
    const claimUrl = `${window.location.origin}/claim?projectID=${projectId}&utm_source=create-db-frontend&utm_medium=claim_button`;
    window.open(claimUrl, "_blank");
    setTimeRemaining(null);
  };

  return (
    <DropContext.Provider
      value={{
        projectId,
        setProjectId,
        timeRemaining,
        setTimeRemaining,
        handleClaimDatabase,
      }}
    >
      {children}
    </DropContext.Provider>
  );
}

export function useDropContext() {
  const context = useContext(DropContext);
  if (context === undefined) {
    throw new Error("useDropContext must be used within a DropProvider");
  }
  return context;
}
