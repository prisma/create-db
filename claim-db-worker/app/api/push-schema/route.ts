import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { schema } = (await request.json()) as {
      schema: string;
    };

    if (!schema) {
      return NextResponse.json(
        { error: "Schema is required" },
        { status: 400 }
      );
    }

    const connectionString = request.headers.get("X-Connection-String");

    if (!connectionString) {
      return NextResponse.json(
        { error: "Connection string not provided in headers" },
        { status: 400 }
      );
    }

    const tempDir = tmpdir();
    const schemaPath = join(tempDir, `schema-${Date.now()}.prisma`);
    const envPath = join(tempDir, `.env-${Date.now()}`);

    try {
      await writeFile(schemaPath, schema);
      await writeFile(envPath, `DATABASE_URL="${connectionString}"`);

      console.log("Executing prisma db push...");
      console.log("Schema path:", schemaPath);
      console.log("Working directory:", tempDir);

      let stdout: string;
      let stderr: string;

      try {
        const result = await execAsync(
          `npx prisma db push --schema=${schemaPath} --accept-data-loss`,
          {
            env: {
              ...process.env,
              DATABASE_URL: connectionString,
            },
            cwd: tempDir,
            timeout: 30000,
          }
        );
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (error) {
        console.error("npx prisma error:", error);
        console.error(
          "Error message:",
          error instanceof Error ? error.message : "Unknown error"
        );

        if (
          error instanceof Error &&
          (error.message.includes("data loss") ||
            error.message.includes("force-reset") ||
            error.message.includes("reset") ||
            error.message.includes("neither a built-in type"))
        ) {
          console.log("Detected operation requiring force reset");
          return NextResponse.json({
            requiresForceReset: true,
            message:
              "This operation will reset your database and lose all data. Please confirm to continue.",
          });
        } else {
          console.log("npx prisma failed, trying direct prisma command...");
          try {
            const result = await execAsync(
              `prisma db push --schema=${schemaPath} --accept-data-loss`,
              {
                env: {
                  ...process.env,
                  DATABASE_URL: connectionString,
                },
                cwd: tempDir,
                timeout: 30000,
              }
            );
            stdout = result.stdout;
            stderr = result.stderr;
          } catch (directError) {
            console.error("Both npx and direct prisma commands failed");
            throw error;
          }
        }
      }

      console.log("Prisma stdout:", stdout);
      if (stderr) {
        console.log("Prisma stderr:", stderr);
      }

      if (
        stderr &&
        !stderr.includes("warnings") &&
        !stderr.includes("npm warn")
      ) {
        throw new Error(stderr);
      }

      return NextResponse.json({
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
    console.error("Push schema error:", error);
    return NextResponse.json(
      {
        error: "Failed to push schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
