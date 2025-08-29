"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cookieUtils } from "@/lib/utils";
import { useDropContext } from "../contexts/DropContext";

const DB_KEY = "temp_db_info";

interface DatabaseInfo {
  connectionString: string;
  directConnectionString: string;
  projectId: string;
  databaseId: string;
  expirationTime: number | null;
}

interface DatabaseContextType {
  dbInfo: DatabaseInfo;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  refreshDatabase: () => Promise<void>;
  clearDatabase: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined
);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo>({
    connectionString: "",
    directConnectionString: "",
    projectId: "",
    databaseId: "",
    expirationTime: null,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setIsLoading } = useDropContext();

  const saveToCookie = (data: DatabaseInfo) => {
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

  const clearDatabase = () => {
    cookieUtils.remove(DB_KEY);
    setDbInfo({
      connectionString: "",
      directConnectionString: "",
      projectId: "",
      databaseId: "",
      expirationTime: null,
    });
  };

  const refreshDatabase = async () => {
    setLoading(true);
    setIsLoading(true);
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
          ? `postgresql://${db.directConnection.user}:${db.directConnection.pass}@${db.directConnection.host}?sslmode=require`
          : "";

        setDbInfo(newDbInfo);
        saveToCookie({
          ...newDbInfo,
          directConnectionString: directConnString,
        });
      }
    } catch (error) {
      router.replace(`/error?title=Error&message=Failed to create database`);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

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
        setLoading(false);
        setIsLoading(false);
        return;
      }

      await refreshDatabase();
    };

    initializeDatabase();
  }, [router, setIsLoading]);

  const value = {
    dbInfo,
    loading,
    setLoading,
    refreshDatabase,
    clearDatabase,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
