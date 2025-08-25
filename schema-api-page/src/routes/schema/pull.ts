import { Hono } from "hono";
import { writeFile, readFile, unlink } from "fs/promises";
import { spawn } from "child_process";

const app = new Hono();

app.post("/", async (c) => {
  const minimalSchema = `generator client {
  provider = "prisma-client"
  output   = "../app/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
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

      let stdout: string;
      let stderr: string;

      try {
        const result = await new Promise<{ stdout: string; stderr: string }>(
          (resolve, reject) => {
            const child = spawn(
              "npx",
              ["prisma", "db", "pull", `--schema=${schemaPath}`],
              {
                env: {
                  ...process.env,
                  DATABASE_URL: connectionString,
                },
                cwd: tempDir,
              }
            );

            let stdoutData = "";
            let stderrData = "";

            child.stdout.on("data", (data) => {
              stdoutData += data.toString();
            });

            child.stderr.on("data", (data) => {
              stderrData += data.toString();
            });

            child.on("close", (code) => {
              if (code === 0) {
                resolve({ stdout: stdoutData, stderr: stderrData });
              } else {
                reject(new Error(`Process exited with code ${code}`));
              }
            });

            child.on("error", reject);
          }
        );

        stdout = result.stdout;
        stderr = result.stderr;
      } catch (error) {
        try {
          const result = await new Promise<{ stdout: string; stderr: string }>(
            (resolve, reject) => {
              const child = spawn(
                "prisma",
                ["db", "pull", `--schema=${schemaPath}`],
                {
                  env: {
                    ...process.env,
                    DATABASE_URL: connectionString,
                  },
                  cwd: tempDir,
                }
              );

              let stdoutData = "";
              let stderrData = "";

              child.stdout.on("data", (data) => {
                stdoutData += data.toString();
              });

              child.stderr.on("data", (data) => {
                stderrData += data.toString();
              });

              child.on("close", (code) => {
                if (code === 0) {
                  resolve({ stdout: stdoutData, stderr: stderrData });
                } else {
                  reject(new Error(`Process exited with code ${code}`));
                }
              });

              child.on("error", reject);
            }
          );

          stdout = result.stdout;
          stderr = result.stderr;
        } catch (directError) {
          throw error;
        }
      }

      if (
        stderr &&
        !stderr.includes("warnings") &&
        !stderr.includes("npm warn")
      ) {
        if (stderr.includes("The introspected database was empty")) {
          return c.json({
            success: true,
            schema: minimalSchema,
            message: "Database is empty - showing minimal schema",
            isEmpty: true,
          });
        }
        throw new Error(stderr);
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
