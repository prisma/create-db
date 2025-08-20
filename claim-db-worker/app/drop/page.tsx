"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const DropPage = () => {
  const router = useRouter();

  useEffect(() => {
    const createDatabase = async () => {
      try {
        const response = await fetch("/api/create-db", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("response", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as any;

        router.replace(`/drop/${result.projectId}`);
      } catch (error) {
        console.error("Failed to create database:", error);
      }
    };

    createDatabase();
  }, [router]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-16 font-barlow">
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center bg-code rounded-lg border border-subtle p-4 mb-4 w-full justify-center flex-1">
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
            Creating your temporary database...
          </p>
        </div>
      </div>
    </div>
  );
};

export default DropPage;
