"use client";

import React from "react";

export default function BusyPanel({ isPulling }: { isPulling: boolean }) {
  return (
    <div className="flex-1 p-1 bg-[#181b21] flex flex-col rounded-lg">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="h-8 w-8 animate-spin mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9" />
          </svg>
          <p className="text-white font-medium">
            {isPulling ? "Pulling schema from database..." : "Pushing schema to database..."}
          </p>
        </div>
      </div>
    </div>
  );
}
