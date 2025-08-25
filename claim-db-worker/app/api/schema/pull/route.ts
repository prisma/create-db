import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const minimalSchema = `generator client {
  provider = "prisma-client"
  output   = "../app/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

  try {
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
      await writeFile(envPath, `DATABASE_URL="${connectionString}"`);
      await writeFile(schemaPath, minimalSchema);

      console.log("Executing prisma db pull...");
      console.log("Working directory:", tempDir);

      let stdout: string;
      let stderr: string;

      try {
        const result = await execAsync(
          `npx prisma db pull --schema=${schemaPath}`,
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
        console.error(
          "npx prisma pull failed, trying direct prisma command..."
        );
        try {
          const result = await execAsync(
            `prisma db pull --schema=${schemaPath}`,
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
          console.error("Both npx and direct prisma pull commands failed");
          throw error;
        }
      }

      console.log("Prisma stdout:", stdout);
      if (stderr) {
        console.log("Prisma stderr:", stderr);
      }

      const schemaContent = await import("fs").then((fs) =>
        fs.readFileSync(schemaPath, "utf8")
      );

      if (
        stderr &&
        !stderr.includes("warnings") &&
        !stderr.includes("npm warn")
      ) {
        if (stderr.includes("The introspected database was empty")) {
          return NextResponse.json({
            success: true,
            schema: minimalSchema,
            message: "Database is empty - showing minimal schema",
            isEmpty: true,
          });
        }
        throw new Error(stderr);
      }

      return NextResponse.json({
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
    console.error("Pull schema error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("The introspected database was empty")) {
      return NextResponse.json({
        success: true,
        schema: minimalSchema,
        message: "Database is empty - showing minimal schema",
        isEmpty: true,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to pull schema",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
