import { Studio } from "@prisma/studio-core/ui";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import "@prisma/studio-core/ui/index.css";
import { useMemo } from "react";

export default function PrismaStudio({
  connectionString,
}: {
  connectionString: string;
}) {
  console.log(
    "PrismaStudio rendered with connection string:",
    connectionString?.substring(0, 50) + "..."
  );

  const adapter = useMemo(() => {
    console.log(
      "Creating studio adapter with connection string:",
      connectionString?.substring(0, 50) + "..."
    );

    const executor = createStudioBFFClient({
      url: "/api/studio",
      customHeaders: {
        "X-Connection-String": connectionString,
      },
    });

    const adapter = createPostgresAdapter({ executor });
    return adapter;
  }, [connectionString]);

  return <Studio adapter={adapter} />;
}
