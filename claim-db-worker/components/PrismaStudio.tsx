import { Studio } from "@prisma/studio-core/ui";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import { useMemo } from "react";

export default function PrismaStudio({
  connectionString,
}: {
  connectionString: string;
}) {
  const adapter = useMemo(() => {
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
