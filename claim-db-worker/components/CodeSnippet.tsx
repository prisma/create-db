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
    <div className="bg-code border-2 border-accent shadow-lg shadow-cyan-400/20 flex items-center gap-2 p-3 text-white w-full h-full font-mono rounded-xl font-bold sm:gap-3 sm:p-4">
      <span className="text-dim text-sm font-medium sm:text-base">$</span>
      <span className="text-sm sm:text-base flex-1 text-start">
        npx create-db<span className="text-muted">@latest</span>
      </span>
      <button
        onClick={handleCopy}
        className="bg-button rounded-lg px-2 py-2 cursor-pointer transition-all duration-50 flex items-center text-muted hover:bg-button-hover hover:text-accent sm:px-3"
        aria-label="Copy command"
      >
        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
