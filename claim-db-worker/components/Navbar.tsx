"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDropContext } from "../app/contexts/DropContext";

export function Navbar() {
  const pathname = usePathname();
  const { timeRemaining, handleClaimDatabase } = useDropContext();

  return (
    <nav className="h-[72px] px-4 w-full mb-6 box-border overflow-hidden md:h-[72px] md:px-4 md:mb-6 sm:h-[60px] sm:px-4 sm:py-3 sm:mb-10 xs:h-14 xs:px-3 xs:py-2 xs:mb-8 flex items-center">
      <div className="max-w-[1240px] w-full mx-auto flex justify-between items-center box-border px-4 md:px-4 sm:max-w-full sm:px-4 xs:px-3">
        <a target="_blank" rel="opener noferrer" href="https://prisma.io">
          <Image
            src="/logo-dark.svg"
            alt="Prisma logo"
            width={100}
            height={100}
          />
        </a>

        {pathname === "/drop" && (
          <div className="flex items-center gap-4">
            {timeRemaining ? (
              <button
                onClick={handleClaimDatabase}
                className="inline-flex items-center px-4 py-2 text-sm text-white bg-button rounded-md hover:bg-button-hover font-bold transition-opacity"
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
                Claim Database
              </button>
            ) : (
              <div className="inline-flex items-center px-3 py-1 text-sm font-bold bg-accent/20 text-accent rounded-md">
                Database Claimed
              </div>
            )}
            {timeRemaining !== null && (
              <div
                className={`rounded-full px-3 py-1 flex items-center gap-2 font-bold bg-card ${
                  timeRemaining && timeRemaining > 0
                    ? (() => {
                        const hours = Math.floor(timeRemaining / 3600);
                        if (hours < 2) return "border border-red-400";
                        if (hours < 10) return "border border-yellow-400";
                        return "border border-button";
                      })()
                    : "border border-red-400"
                }`}
              >
                <span
                  className={`text-xs font-bold w-40 text-center font-mono ${
                    timeRemaining && timeRemaining > 0
                      ? (() => {
                          const hours = Math.floor(timeRemaining / 3600);
                          if (hours < 2) return "text-red-400";
                          if (hours < 10) return "text-yellow-400";
                          return "text-accent";
                        })()
                      : "text-accent"
                  }`}
                >
                  {timeRemaining && timeRemaining > 0
                    ? (() => {
                        const hours = Math.floor(timeRemaining / 3600);
                        const minutes = Math.floor((timeRemaining % 3600) / 60);
                        const seconds = timeRemaining % 60;
                        return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s remaining`;
                      })()
                    : "Permanent"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-8 md:gap-8 sm:gap-4">
          <a
            target="_blank"
            rel="opener noferrer"
            href="http://github.com/prisma"
            className="sm:inline-flex hidden"
          >
            <Image src="/github.svg" alt="github" width="31" height="31" />
          </a>
          <div className="flex gap-4 md:gap-4 sm:flex-row sm:gap-3">
            <a
              className="sm:inline-flex hidden justify-center max-w-full text-left z-10 w-max items-center box-border rounded-md no-underline relative bg-transparent text-button font-barlow py-[5px] px-3 text-base font-bold leading-5 border-2 border-button transition-all duration-150 ease-in-out hover:border-button-hover hover:bg-transparent hover:text-button-hover focus-within:after:content-[''] focus-within:after:absolute focus-within:after:rounded-[9px] focus-within:after:box-content focus-within:after:border-2 focus-within:after:border-button-hover focus-within:after:top-[-6px] focus-within:after:w-[calc(100%+8px)] focus-within:after:h-[calc(100%+8px)] focus-within:after:left-[-6px] md:text-base md:py-[5px] md:px-3 sm:text-sm sm:py-1.5 sm:px-3 sm:min-h-[36px] xs:text-[13px] xs:py-[5px] xs:px-2.5 xs:min-h-8 touch-manipulation:min-h-11 touch-manipulation:py-2 touch-manipulation:px-4"
              href="https://console.prisma.io/login?utm_campaign=create_db&utm_source=create_db_web"
              target="_blank"
              rel="opener noferrer"
            >
              Login
            </a>
            <a
              className="inline-flex justify-center max-w-full text-left z-10 w-max items-center box-border rounded-md no-underline relative bg-button text-white font-barlow py-[5px] px-3 text-base font-bold leading-5 border-2 border-button transition-all duration-150 ease-in-out hover:bg-button-hover focus-within:after:content-[''] focus-within:after:absolute focus-within:after:rounded-[9px] focus-within:after:box-content focus-within:after:border-2 focus-within:after:border-white focus-within:after:top-[-4px] focus-within:after:w-[calc(100%+6px)] focus-within:after:h-[calc(100%+6px)] focus-within:after:left-[-4px] md:text-base md:py-[5px] md:px-3 sm:text-sm sm:py-1.5 sm:px-3 sm:min-h-[36px] xs:text-[13px] xs:py-[5px] xs:px-2.5 xs:min-h-8 touch-manipulation:min-h-11 touch-manipulation:py-2 touch-manipulation:px-4"
              href="https://console.prisma.io/sign-up?utm_campaign=create_db&utm_source=create_db_web"
              target="_blank"
              rel="opner noferrer"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
