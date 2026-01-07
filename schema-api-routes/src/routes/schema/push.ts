import { Hono } from "hono";
import { writeFile, rm, mkdir } from "fs/promises";
import { execSync } from "child_process";

const app = new Hono();

async function createPrismaWorkspace(
  connectionString: string,
  schema: string
): Promise<{ workDir: string; schemaPath: string; cleanup: () => Promise<void> }> {
  const timestamp = Date.now();
  const workDir = `/tmp/prisma-${timestamp}`;
  const schemaPath = `${workDir}/schema.prisma`;
  const configPath = `${workDir}/prisma.config.ts`;

  await mkdir(workDir, { recursive: true });

  await writeFile(schemaPath, schema);

  const configContent = `import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./schema.prisma",
  datasource: {
    url: "${connectionString}",
  },
});
`;
  await writeFile(configPath, configContent);

  return {
    workDir,
    schemaPath,
    cleanup: async () => {
      try {
        await rm(workDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    },
  };
}

app.post("/", async (c) => {
  const body = await c.req.json();
  const { schema } = body as { schema: string };

  if (!schema) {
    return c.json({ error: "Schema is required" }, 400);
  }

  const connectionString = c.req.header("X-Connection-String");
  if (!connectionString) {
    return c.json({ error: "Connection string not provided in headers" }, 400);
  }

  const workspace = await createPrismaWorkspace(connectionString, schema);

  try {
    execSync("pnpx prisma db push --accept-data-loss", {
      cwd: workspace.workDir,
      encoding: "utf8",
      stdio: "pipe",
    });

    return c.json({
      success: true,
      message: "Schema pushed successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes("data loss") ||
      message.includes("force-reset") ||
      message.includes("reset") ||
      message.includes("neither a built-in type")
    ) {
      return c.json({
        requiresForceReset: true,
        message:
          "This operation will reset your database and lose all data. Please confirm to continue.",
      });
    }

    return c.json(
      {
        error: "Failed to push schema",
        details: message,
      },
      500
    );
  } finally {
    await workspace.cleanup();
  }
});

export default app;
