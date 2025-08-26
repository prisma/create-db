import { Studio } from "@prisma/studio-core/ui";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import "@prisma/studio-core/ui/index.css";
import { useMemo } from "react";

// Not working for some reason. https://www.prisma.io/docs/postgres/database/prisma-studio/embedding-studio#custom-styling
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
  }
}

/* Mobile responsive styles for Prisma Studio */
@media (max-width: 768px) {
  .studio-container {
    min-height: 100vh;
    overflow-x: auto;
  }
  
  .studio-container * {
    font-size: 14px !important;
  }
  
  .studio-container .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .studio-container .sidebar {
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .studio-container .main-content {
    width: 100% !important;
    max-width: 100% !important;
  }
}
`;

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

  return (
    <div className="studio-container w-full h-full overflow-hidden">
      <Studio theme={customTheme} adapter={adapter} />
    </div>
  );
}
