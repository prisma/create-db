import { Hono } from "hono";
import { writeFile, mkdir, rm } from "fs/promises";
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
    const timestamp = Date.now();
    const projectDir = `${tempDir}/prisma-${timestamp}`;
    const schemaPath = `${projectDir}/schema.prisma`;
    const configPath = `${projectDir}/prisma.config.ts`;

    try {
      await mkdir(projectDir, { recursive: true });
      await writeFile(schemaPath, schema);

      const prismaConfig = `import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
})`;
      await writeFile(configPath, prismaConfig);

      const packageJson = `{
  "name": "temp-prisma-project",
  "type": "module",
  "dependencies": {
    "prisma": "7.2.0"
  }
}`;
      await writeFile(`${projectDir}/package.json`, packageJson);

      execSync('npm install --no-save', {
        cwd: projectDir,
        encoding: 'utf8',
        stdio: 'pipe',
        env: {
          ...process.env,
          HOME: tempDir,
          npm_config_cache: `${tempDir}/.npm-cache`,
          npm_config_userconfig: `${tempDir}/.npmrc`,
        },
      });

      try {
        const result = execSync(
          `npx prisma db push --schema=${schemaPath} --accept-data-loss`,
          {
            env: {
              ...process.env,
              DATABASE_URL: connectionString,
            },
            cwd: projectDir,
            encoding: "utf8",
            stdio: "pipe",
          }
        );
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("data loss") ||
            error.message.includes("force-reset") ||
            error.message.includes("reset") ||
            error.message.includes("neither a built-in type"))
        ) {
          return c.json({
            requiresForceReset: true,
            message:
              "This operation will reset your database and lose all data. Please confirm to continue.",
          });
        } else {
          throw error;
        }
      }

      return c.json({
        success: true,
        message: "Schema pushed successfully",
      });
    } finally {
      try {
        await rm(projectDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  } catch (error) {
    return c.json(
      {
        error: "Failed to push schema",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
