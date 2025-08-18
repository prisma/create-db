"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DropContextType {
  timeRemaining: number | null;
  setTimeRemaining: (time: number | null | ((prev: number | null) => number | null)) => void;
  handleClaimDatabase: () => void;
}

const DropContext = createContext<DropContextType | undefined>(undefined);

export function DropProvider({ children }: { children: ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(24);

  const handleClaimDatabase = () => {
    // Simulate claiming the database
    alert("Database claimed successfully! It will no longer expire.");
    setTimeRemaining(null); // Remove expiration
  };

  return (
    <DropContext.Provider value={{
      timeRemaining,
      setTimeRemaining,
      handleClaimDatabase,
    }}>
      {children}
    </DropContext.Provider>
  );
}

export function useDropContext() {
  const context = useContext(DropContext);
  if (context === undefined) {
    throw new Error('useDropContext must be used within a DropProvider');
  }
  return context;
}
