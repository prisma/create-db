import Image from "next/image";
import { useState } from "react";

export function CodeSnippet({}: {}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const command = "npx create-db@latest";
    try {
      await navigator.clipboard.writeText(command);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1200);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="bg-code border-2 border-accent shadow-lg shadow-cyan-400/20 flex items-center gap-2 p-3 text-white w-full font-mono rounded-3xl font-bold sm:gap-3 sm:p-4 md:max-w-lg lg:max-w-xl">
      <span className="text-dim text-sm font-medium sm:text-base">$</span>
      <span className="text-sm sm:text-base flex-1 text-start">
        npx create-db<span className="text-muted">@latest</span>
      </span>
      <button
        onClick={handleCopy}
        className="bg-button rounded-lg transition-all duration-[100ms] px-2 py-2 cursor-pointer flex active:scale-95 items-center text-muted hover:bg-button-hover active:bg-button-hover hover:text-accent sm:px-3"
        aria-label="Copy command"
      >
        <Image
          src="/copy-icon.svg"
          alt="Copy Icon"
          width={16}
          height={16}
          className="w-4 h-4 sm:w-5 sm:h-5"
        />
      </button>
    </div>
  );
}
