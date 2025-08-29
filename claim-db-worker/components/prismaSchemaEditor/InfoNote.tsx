"use client";

import React from "react";
import { Info } from "lucide-react";

export default function InfoNote() {
  return (
    <div className="mt-2 p-3 bg-brand-surface-highlight/10 border border-brand-surface-highlight/20 rounded-md">
      <p className="text-xs sm:text-sm text-brand-surface-highlight">
        <Info className="w-4 h-4 mr-1 inline-block" /> <strong>Note:</strong> If your schema is out of sync with the
        database, you can reset it with the <strong>Pull</strong> button.
      </p>
    </div>
  );
}
