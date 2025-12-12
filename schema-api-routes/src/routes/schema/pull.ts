import { Hono } from "hono";
import { writeFile, readFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import { execSync } from "child_process";

const app = new Hono();

app.post("/", async (c) => {
  const minimalSchema = `generator client {
  provider = "prisma-client"
  output   = "../app/generated/client"
}

datasource db {
  provider = "postgresql"
}`;

  try {
    const connectionString = c.req.header("X-Connection-String");

    if (!connectionString) {
      return c.json(
        { error: "Connection string not provided in headers" },
        400
      );
    }

    const tempDir = "/tmp";
    const schemaPath = `${tempDir}/schema-${Date.now()}.prisma`;
    const envPath = `${tempDir}/.env-${Date.now()}`;

    try {
      await writeFile(envPath, `DATABASE_URL="${connectionString}"`);
      await writeFile(schemaPath, minimalSchema);

      try {
        const result = execSync(`npx prisma db pull --schema=${schemaPath}`, {
          env: {
            ...process.env,
            DATABASE_URL: connectionString,
            npm_config_cache: "/tmp/.npm",
            npm_config_prefix: "/tmp/.npm",
          },
          cwd: process.cwd(),
          encoding: "utf8",
          stdio: "pipe",
        });

        const stdout = result;
        const stderr = "";
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("The introspected database was empty")) {
          return c.json({
            success: true,
            schema: minimalSchema,
            message: "Database is empty - showing minimal schema",
            isEmpty: true,
          });
        }

        throw error;
      }

      const schemaContent = await readFile(schemaPath, "utf-8");

      return c.json({
        success: true,
        schema: schemaContent,
        message: "Schema pulled successfully",
      });
    } finally {
      try {
        await unlink(schemaPath);
        await unlink(envPath);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("The introspected database was empty")) {
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
        details: errorMessage,
      },
      500
    );
  }
});

export default app;
