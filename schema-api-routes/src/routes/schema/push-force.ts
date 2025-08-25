import { Hono } from "hono";
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import { execSync } from "child_process";

const app = new Hono();

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { schema } = body as {
      schema: string;
    };

    if (!schema) {
      return c.json({ error: "Schema is required" }, 400);
    }

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
      await writeFile(schemaPath, schema);
      await writeFile(envPath, `DATABASE_URL="${connectionString}"`);

      try {
        const result = execSync(
          `npx prisma db push --schema=${schemaPath} --accept-data-loss --force-reset`,
          {
            env: {
              ...process.env,
              DATABASE_URL: connectionString,
              npm_config_cache: "/tmp/.npm",
              npm_config_prefix: "/tmp/.npm",
            },
            cwd: process.cwd(),
            encoding: "utf8",
            stdio: "pipe",
          }
        );
      } catch (error) {
        throw error;
      }

      return c.json({
        success: true,
        message: "Schema pushed successfully with force reset",
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
    return c.json(
      {
        error: "Failed to push schema with force reset",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
