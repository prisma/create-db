import { Studio } from "@prisma/studio-core/ui";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import { useMemo } from "react";

export default function PrismaStudio({ connectionString }: { connectionString: string }) {

  const adapter = useMemo(() => {
    // 1. Create a client that points to your backend endpoint
    const executor = createStudioBFFClient({
      url: "/api/studio", // Point to your backend endpoint, not the connection string
      customHeaders: {
        "X-Connection-String": connectionString, // Pass connection string as header
      },
    });

    // 2. Create a Postgres adapter with the executor
    const adapter = createPostgresAdapter({ executor });
    return adapter;
  }, [connectionString]);

  return <Studio adapter={adapter} />;
}