import { Hono } from "hono";

import { withPrismaProject } from "../../prisma.js";

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

    return await withPrismaProject(connectionString, schema, async (prisma) => {
      const emit = await prisma.run(["contract", "emit"]);
      if (!emit.ok) {
        return c.json(
          { error: "Invalid schema", details: prisma.describe(emit) },
          400
        );
      }

      let update = await prisma.run(["db", "update"]);
      if (update.error?.code === "CLI.CONSENT_REQUIRED") {
        // The user confirmed the data loss, so answer each question with
        // --delete. Anything else (a rename, an access change) can't be
        // answered from a yes, so it stays a failure.
        const unanswered = update.error.meta?.unanswered ?? [];
        if (unanswered.every((consent) => consent.verbs.includes("delete"))) {
          update = await prisma.run([
            "db",
            "update",
            ...unanswered.flatMap((consent) => ["--delete", consent.subject]),
          ]);
        }
      }
      if (!update.ok) {
        throw new Error(prisma.describe(update));
      }

      return c.json({
        success: true,
        message: "Schema pushed successfully",
      });
    });
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
