"use client";

import React from "react";

type Props = {
  onPush: () => void;
  onPull: () => void;
  onFormat: () => void;
  isPushing: boolean;
  isPulling: boolean;
  isFormatting: boolean;
  hasConnectionString: boolean;
  isMounted: boolean;
};

export default function SidebarActions({
  onPush,
  onPull,
  onFormat,
  isPushing,
  isPulling,
  isFormatting,
  hasConnectionString,
  isMounted,
}: Props) {
  return (
    <div className="w-full lg:w-16 h-auto lg:h-auto rounded-lg bg-step flex flex-row lg:flex-col justify-between items-center py-2 px-2 lg:px-0 gap-2 lg:gap-0">
      <div className="flex flex-row lg:flex-col items-center space-y-0 lg:space-y-1 space-x-2 lg:space-x-0 w-full lg:w-auto justify-between lg:justify-start">
        <button
          onClick={onPush}
          disabled={isPushing || isPulling || !hasConnectionString || !isMounted}
          className="flex flex-row lg:flex-col items-center justify-center rounded-md text-muted hover:text-white hover:bg-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2 lg:aspect-square border border-subtle lg:border-0 w-full lg:w-auto"
          title={!hasConnectionString ? "No connection string available" : !isMounted ? "Editor initializing..." : "Push schema to database (prisma db push)"}
        >
          {isPushing ? (
            <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                <path d="M4 6v6s0 3 7 3s7-3 7-3V6" />
                <path d="M11 3c7 0 7 3 7 3s0 3-7 3s-7-3-7-3s0-3 7-3m0 18c-7 0-7-3-7-3v-6m15 10v-6m0 0l3 3m-3-3l-3 3" />
              </g>
            </svg>
          )}
          <span className="text-xs font-bold ml-2 lg:ml-0 lg:mt-1">Push</span>
        </button>

        <button
          onClick={onPull}
          disabled={isPulling || isPushing || !hasConnectionString || !isMounted}
          className="flex flex-row lg:flex-col items-center justify-center rounded-md text-muted hover:text-white hover:bg-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2 lg:aspect-square border border-subtle lg:border-0 w-full lg:w-auto"
          title={!hasConnectionString ? "No connection string available" : !isMounted ? "Editor initializing..." : "Pull schema from database (prisma db pull)"}
        >
          {isPulling ? (
            <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                <path d="M19 16v6m0 0l3-3m-3 3l-3-3M4 6v6s0 3 7 3s7-3 7-3V6" />
                <path d="M11 3c7 0 7 3 7 3s0 3-7 3s-7-3-7-3s0-3 7-3m0 18c-7 0-7-3-7-3v-6" />
              </g>
            </svg>
          )}
          <span className="text-xs font-bold ml-2 lg:ml-0 lg:mt-1">Pull</span>
        </button>

        <button
          onClick={onFormat}
          disabled={isFormatting || isPulling || isPushing || !isMounted}
          className={`flex flex-row lg:flex-col items-center justify-center text-muted hover:text-white hover:bg-button rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2 lg:aspect-square border border-subtle lg:border-0 w-full lg:w-auto ${
            isFormatting ? "bg-button text-white" : ""
          }`}
          title={isFormatting ? "Formatting schema..." : !isMounted ? "Editor initializing..." : "Format schema (Shift+Alt+F)"}
        >
          {isFormatting ? (
            <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m14.363 5.652l1.48-1.48a2 2 0 0 1 2.829 0l1.414 1.414a2 2 0 0 1 0 2.828l-1.48 1.48m-4.243-4.242l-9.616 9.615a2 2 0 0 0-.578 1.238l-.242 2.74a1 1 0 0 0 1.084 1.085l2.74-.242a2 2 0 0 0 1.24-.578l9.615-9.616m-4.243-4.242l4.243 4.242" />
            </svg>
          )}
          <span className="text-xs font-bold ml-2 lg:ml-0 lg:mt-1">Format</span>
        </button>
      </div>
    </div>
  );
}
