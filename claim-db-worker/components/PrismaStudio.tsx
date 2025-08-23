import { Studio } from "@prisma/studio-core/ui";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import "@prisma/studio-core/ui/index.css";
import { useMemo } from "react";

const customTheme = `
@layer base {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --card: #161a20;
    --card-foreground: #ededed;
    --popover: #161a20;
    --popover-foreground: #ededed;
    --primary: #71e8df;
    --primary-foreground: #0a0a0a;
    --secondary: #2d3138;
    --secondary-foreground: #ededed;
    --muted: #1c1f26;
    --muted-foreground: #a0aec0;
    --accent: #71e8df;
    --accent-foreground: #0a0a0a;
    --destructive: #fc8181;
    --destructive-foreground: #0a0a0a;
    --border: #202734;
    --input: #2d3138;
    --ring: #71e8df;
    --radius: 0.5rem;
  }
}
`;

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

  return <Studio theme={customTheme} adapter={adapter} />;
}
