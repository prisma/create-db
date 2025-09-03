"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDropContext } from "../app/contexts/DropContext";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const pathname = usePathname();
  const { timeRemaining, handleClaimDatabase, isLoading } = useDropContext();

  if (pathname.startsWith("/web")) {
    return (
      <nav className="h-[72px] w-full box-border overflow-hidden md:h-[72px] sm:h-[60px] sm:py-3 xs:h-14 xs:py-2 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex justify-between items-center box-border px-4 md:px-4 sm:px-4 xs:px-3">
          <div className="w-[1245px] inline-flex justify-between items-center">
            <div className="inline-flex flex-col justify-start items-start">
              <a target="_blank" rel="opener noferrer" href="https://prisma.io">
                <Image
                  src="/logo-dark.svg"
                  alt="Prisma logo"
                  width={100}
                  height={100}
                />
              </a>
            </div>
            <div className="text-center inline-flex justify-center">
              {timeRemaining && timeRemaining > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-teal-300 text-sm font-bold font-mono leading-none w-48 inline-block whitespace-nowrap">
                    {(() => {
                      const hours = Math.floor(timeRemaining / 3600);
                      const minutes = Math.floor((timeRemaining % 3600) / 60);
                      const seconds = timeRemaining % 60;
                      return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s remaining`;
                    })()}
                  </span>
                  <MoveRight className="w-4 h-4 text-muted text-sm flex-shrink-0 hidden lg:block" />
                  <p className="text-muted text-sm leading-none hidden lg:block">
                    This database will be automatically deleted after 24 hours
                    unless claimed.{" "}
                    <strong>Do not store sensitive data.</strong>
                  </p>
                </div>
              ) : !isLoading ? (
                <span className="text-muted text-sm font-bold leading-none">
                  Database Claimed
                </span>
              ) : null}
            </div>
            {!isLoading && timeRemaining && timeRemaining > 0 && (
              <div
                className="w-40 px-4 py-2 bg-teal-600 hidden lg:flex rounded-md justify-center items-center cursor-pointer hover:bg-teal-700 transition-colors"
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
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="h-[72px] w-full mb-6 box-border overflow-hidden md:h-[72px] md:mb-6 sm:h-[60px] sm:py-3 sm:mb-10 xs:h-14 xs:py-2 xs:mb-8 flex items-center">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center box-border px-4 md:px-4 sm:px-4 xs:px-3">
        <a target="_blank" rel="opener noferrer" href="https://prisma.io">
          <Image
            src="/logo-dark.svg"
            alt="Prisma logo"
            width={100}
            height={100}
          />
        </a>

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
              className="sm:inline-flex hidden justify-center max-w-full text-left z-10 w-max items-center box-border rounded-md no-underline relative bg-transparent text-button-blue font-barlow py-[5px] px-3 text-base font-bold leading-5 border-2 border-button-blue transition-all duration-150 ease-in-out hover:border-button-blue-hover hover:bg-transparent hover:text-button-blue-hover focus-within:after:content-[''] focus-within:after:absolute focus-within:after:rounded-[9px] focus-within:after:box-content focus-within:after:border-2 focus-within:after:border-button-blue-hover focus-within:after:top-[-6px] focus-within:after:w-[calc(100%+8px)] focus-within:after:h-[calc(100%+8px)] focus-within:after:left-[-6px] md:text-base md:py-[5px] md:px-3 sm:text-sm sm:py-1.5 sm:px-3 sm:min-h-[36px] xs:text-[13px] xs:py-[5px] xs:px-2.5 xs:min-h-8 touch-manipulation:min-h-11 touch-manipulation:py-2 touch-manipulation:px-4"
              href="https://console.prisma.io/login?utm_campaign=create_db&utm_source=create_db_web"
              target="_blank"
              rel="opener noferrer"
            >
              Login
            </a>
            <a
              className="inline-flex justify-center hover:border-button-blue-hover max-w-full text-left z-10 w-max items-center box-border rounded-md no-underline relative bg-button-blue text-white font-barlow py-[5px] px-3 text-base font-bold leading-5 border-2 border-button-blue transition-all duration-150 ease-in-out hover:bg-button-blue-hover focus-within:after:content-[''] focus-within:after:absolute focus-within:after:rounded-[9px] focus-within:after:box-content focus-within:after:border-2 focus-within:after:border-white focus-within:after:top-[-4px] focus-within:after:w-[calc(100%+6px)] focus-within:after:h-[calc(100%+6px)] focus-within:after:left-[-4px] md:text-base md:py-[5px] md:px-3 sm:text-sm sm:py-1.5 sm:px-3 sm:min-h-[36px] xs:text-[13px] xs:py-[5px] xs:px-2.5 xs:min-h-8 touch-manipulation:min-h-11 touch-manipulation:py-2 touch-manipulation:px-4"
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
