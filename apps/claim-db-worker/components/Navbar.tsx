"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDropContext } from "../app/contexts/DropContext";
import { PrismButton, PrismButtonOutline } from "@/components/brand/PrismButton";

function Logo() {
  return (
    <a target="_blank" rel="noopener noreferrer" href="https://prisma.io" className="shrink-0">
      <Image src="/brand/logo.svg" alt="Prisma logo" width={106} height={27} priority />
    </a>
  );
}

function formatRemaining(timeRemaining: number) {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;
  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s remaining`;
}

export function Navbar() {
  const pathname = usePathname();
  const { timeRemaining, handleClaimDatabase, isLoading } = useDropContext();

  if (pathname.startsWith("/web")) {
    const live = Boolean(timeRemaining && timeRemaining > 0);
    return (
      <nav className="flex h-[72px] w-full items-center border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <Logo />
          <div className="flex min-w-0 items-center justify-center">
            {live ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 whitespace-nowrap font-mono text-sm font-semibold text-ink">
                  <span
                    aria-hidden
                    className="size-2 rounded-full bg-prism-yellow-300 animate-pulse motion-reduce:animate-none"
                  />
                  {formatRemaining(timeRemaining!)}
                </span>
                <p className="hidden text-sm text-muted-foreground xl:block">
                  Deleted after 24 hours unless claimed.{" "}
                  <strong className="font-semibold text-foreground">
                    Do not store sensitive data.
                  </strong>
                </p>
              </div>
            ) : !isLoading ? (
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <span aria-hidden className="size-2 rounded-full bg-prism-cyan-400" />
                Database claimed
              </span>
            ) : null}
          </div>
          <div className="hidden w-40 justify-end lg:flex">
            {!isLoading && live && (
              <PrismButton size="sm" onClick={handleClaimDatabase}>
                Claim database
              </PrismButton>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="relative z-10 flex h-[72px] w-full items-center">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <Logo />

        <div className="flex items-center gap-3 sm:gap-4">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/prisma"
            className="hidden rounded-full p-1.5 transition-colors hover:bg-black/[0.04] sm:inline-flex"
          >
            <Image src="/github.svg" alt="GitHub" width={24} height={24} />
          </a>
          <PrismButtonOutline
            size="sm"
            external
            className="hidden sm:inline-flex"
            href="https://console.prisma.io/login?utm_campaign=create_db&utm_source=create_db_web"
          >
            Log in
          </PrismButtonOutline>
          <PrismButton
            size="sm"
            external
            href="https://console.prisma.io/sign-up?utm_campaign=create_db&utm_source=create_db_web"
          >
            Sign up
          </PrismButton>
        </div>
      </div>
    </nav>
  );
}
