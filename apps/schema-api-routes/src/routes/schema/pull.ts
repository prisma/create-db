import { Hono } from "hono";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
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
    const timestamp = Date.now();
    const projectDir = `${tempDir}/prisma-${timestamp}`;
    const schemaPath = `${projectDir}/schema.prisma`;
    const configPath = `${projectDir}/prisma.config.ts`;

    try {
      await mkdir(projectDir, { recursive: true });
      await writeFile(schemaPath, minimalSchema);

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
        const result = execSync(`npx prisma db pull --schema=${schemaPath}`, {
          env: {
            ...process.env,
            DATABASE_URL: connectionString,
          },
          cwd: projectDir,
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
        await rm(projectDir, { recursive: true, force: true });
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
