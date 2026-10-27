import React from "react";
import { Info } from "lucide-react";

export default function InfoNote() {
  return (
    <div className="mt-2 p-3 bg-prism-cyan-50 border border-prism-cyan-200 rounded-xl">
      <p className="text-xs sm:text-sm text-prism-cyan-900">
        <Info
          className="w-4 h-4 mr-1 inline-block text-prism-cyan-700"
          aria-hidden="true"
          focusable="false"
        />
        <strong>Note:</strong> If your schema is out of sync with the database,
        you can reset it with the <strong>Pull</strong> button.
      </p>
    </div>
  );
}
