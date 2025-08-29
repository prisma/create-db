"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDatabase } from "./DatabaseContext";

export default function WebPage() {
  const router = useRouter();
  const { dbInfo } = useDatabase();

  useEffect(() => {
    if (dbInfo?.connectionString) {
      router.push("/web/connect");
    }
  }, [dbInfo, router]);

  return null;
}
