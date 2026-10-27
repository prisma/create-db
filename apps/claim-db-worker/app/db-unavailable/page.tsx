"use client";

import { cookieUtils } from "@/lib/utils";
import { Mascot } from "@/components/brand/Brand";
import { PrismButton } from "@/components/brand/PrismButton";
import { StatePanel } from "@/components/brand/StatePanel";

const DB_KEY = "temp_db_info";

export default function DBUnavailablePage() {
  const handleCreateNew = () => {
    cookieUtils.remove(DB_KEY);
  };

  return (
    <StatePanel>
      <Mascot expression="sad" alt="Prismo, the Prisma mascot, looking sad" className="mb-8 w-28 sm:w-32" />
      <h1 className="text-balance text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1]">
        Database already claimed or deleted
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">Please create a new one</p>
      <div className="mt-10">
        <PrismButton href="/web/connect" reload onClick={handleCreateNew} size="lg">
          Create new database
        </PrismButton>
      </div>
    </StatePanel>
  );
}
