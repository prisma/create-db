"use client";

import { Copy } from "lucide-react";
import { customToast } from "@/lib/custom-toast";

export function CodeSnippet() {
  const handleCopy = async () => {
    const command = "npx create-db@latest";
    try {
      await navigator.clipboard.writeText(command);
      customToast("success", "Copied to clipboard");
    } catch (err) {
      customToast("error", "Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex h-full w-full items-center gap-2 rounded-full border border-border bg-code py-2 pl-5 pr-2 font-mono text-ink sm:gap-3">
      <span className="text-sm text-muted-foreground sm:text-base">$</span>
      <span className="flex-1 text-start text-sm font-semibold sm:text-base">
        npx create-db<span className="font-normal text-muted-foreground">@latest</span>
      </span>
      <button
        onClick={handleCopy}
        className="flex items-center rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-ink"
        aria-label="Copy command"
      >
        <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
}
