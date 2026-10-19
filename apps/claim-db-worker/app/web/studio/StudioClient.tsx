'use client';

import { useMemo } from "react";
import { Studio } from "@prisma/studio-core/ui";
import { createPostgresAdapter } from "@prisma/studio-core/data/postgres-core";
import { createStudioBFFClient } from "@prisma/studio-core/data/bff";
import "@prisma/studio-core/ui/index.css";

// Studio on the brand palette (light): ink primary, paper surfaces, prism
// cyan focus ring, prism red for destructive. Applied to both roots because
// Studio may toggle .dark on its own.
const customTheme = `
@layer base {
  :root {
    --background: #ffffff;
    --foreground: #3a3b3c;
    --card: #ffffff;
    --card-foreground: #3a3b3c;
    --popover: #ffffff;
    --popover-foreground: #3a3b3c;
    --primary: #151515;
    --primary-foreground: #f9faf5;
    --secondary: #f6f7f2;
    --secondary-foreground: #3a3b3c;
    --muted: #f6f7f2;
    --muted-foreground: #646567;
    --accent: #eeffff;
    --accent-foreground: #151515;
    --destructive: #d02344;
    --destructive-foreground: #ffffff;
    --border: #e5e5e5;
    --input: #e5e5e5;
    --ring: #01d7e4;
    --radius: 0.625rem;
  }

  .dark {
    --background: #ffffff;
    --foreground: #3a3b3c;
    --card: #ffffff;
    --card-foreground: #3a3b3c;
    --popover: #ffffff;
    --popover-foreground: #3a3b3c;
    --primary: #151515;
    --primary-foreground: #f9faf5;
    --secondary: #f6f7f2;
    --secondary-foreground: #3a3b3c;
    --muted: #f6f7f2;
    --muted-foreground: #646567;
    --accent: #eeffff;
    --accent-foreground: #151515;
    --destructive: #d02344;
    --destructive-foreground: #ffffff;
    --border: #e5e5e5;
    --input: #e5e5e5;
    --ring: #01d7e4;
    --radius: 0.625rem;
  }
}`;

export default function StudioClient({ connectionString }: { connectionString: string }) {
  const adapter = useMemo(() => {
    const executor = createStudioBFFClient({
      url: "/api/studio",
      customHeaders: {
        "X-Connection-String": connectionString,
      },
    });

    return createPostgresAdapter({ executor });
  }, [connectionString]);

  return (
    <div className="w-full h-full overflow-hidden rounded-2xl rounded-tl-none border border-border bg-white">
      <div className="w-full h-full">
        <Studio theme={customTheme} adapter={adapter} />
      </div>
    </div>
  );
}
