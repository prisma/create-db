import { Hono } from "hono";
import { writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";

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

      let stdout: string;
      let stderr: string;

      try {
        const result = await new Promise<{ stdout: string; stderr: string }>(
          (resolve, reject) => {
            const child = spawn(
              "npx",
              [
                "prisma",
                "db",
                "push",
                `--schema=${schemaPath}`,
                "--accept-data-loss",
              ],
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
          try {
            const result = await new Promise<{
              stdout: string;
              stderr: string;
            }>((resolve, reject) => {
              const child = spawn(
                "prisma",
                ["db", "push", `--schema=${schemaPath}`, "--accept-data-loss"],
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
            });

            stdout = result.stdout;
            stderr = result.stderr;
          } catch (directError) {
            throw error;
          }
        }
      }

      if (
        stderr &&
        !stderr.includes("warnings") &&
        !stderr.includes("npm warn")
      ) {
        throw new Error(stderr);
      }

      return c.json({
        success: true,
        message: "Schema pushed successfully",
        output: stdout,
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
        error: "Failed to push schema",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
