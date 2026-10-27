"use client";

import React from "react";
import { LoadingMark } from "@/components/brand/Brand";

export default function InitOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white pointer-events-none">
      <LoadingMark label="Loading editor..." />
    </div>
  );
}
