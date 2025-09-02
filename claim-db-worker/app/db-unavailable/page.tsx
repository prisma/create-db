"use client";

import { useRouter } from "next/navigation";
import { cookieUtils } from "@/lib/utils";
import { Info } from "lucide-react";

const DB_KEY = "temp_db_info";

export default function DBUnavailablePage() {
  const router = useRouter();

  const handleCreateNew = () => {
    cookieUtils.remove(DB_KEY);
    router.push("/web/connect");
  };

  return (
    <div className="w-fit min-h-[calc(100vh-200px)] max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-16 font-barlow">
      <div className="bg-code text-center gap-6 h-fit rounded-lg p-4 sm:p-6 border border-subtle flex flex-col">
        <h1 className="text-2xl gap-2 font-bold flex items-center">
          <Info className="inline text-brand-surface-highlight" /> Database
          already claimed or deleted
        </h1>
        <p className="text-muted">Please create a new one</p>
        <button
          className="h-16 w-full flex items-center justify-center gap-3 bg-button-blue hover:bg-button-blue-hover text-white font-bold text-lg rounded-lg px-6 py-3 cursor-pointer transition-all duration-200"
          onClick={handleCreateNew}
        >
          Create New Database
        </button>
      </div>
    </div>
  );
}
