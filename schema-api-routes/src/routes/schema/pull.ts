import { Hono } from "hono";
import { writeFile, readFile, rm, mkdir } from "fs/promises";
import { execSync } from "child_process";

const app = new Hono();

const minimalSchema = `generator client {
  provider = "prisma-client"
  output   = "../app/generated/client"
}

datasource db {
  provider = "postgresql"
}`;

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
  const connectionString = c.req.header("X-Connection-String");
  if (!connectionString) {
    return c.json({ error: "Connection string not provided in headers" }, 400);
  }

  const workspace = await createPrismaWorkspace(connectionString, minimalSchema);

  try {
    execSync("pnpx prisma db pull", {
      cwd: workspace.workDir,
      encoding: "utf8",
      stdio: "pipe",
    });

    const schemaContent = await readFile(workspace.schemaPath, "utf-8");

    return c.json({
      success: true,
      schema: schemaContent,
      message: "Schema pulled successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("The introspected database was empty")) {
      return c.json({
        success: true,
        schema: minimalSchema,
        message: "Database is empty - showing minimal schema",
        isEmpty: true,
      });
    }

    return c.json(
      {
        error: "Failed to pull schema",
        details: message,
      },
      500
    );
  } finally {
    await workspace.cleanup();
  }
});

export default app;
