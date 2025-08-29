'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase } from "./DatabaseContext";

export default function WebPage() {
  const router = useRouter();
  const { dbInfo } = useDatabase();
  
  useEffect(() => {
    // Only redirect to connect page if we have a connection string
    if (dbInfo?.connectionString) {
      router.push("/web/connect");
    }
  }, [dbInfo, router]);
  
  // Show nothing while checking
  return null;
}
