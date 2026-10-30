import { Hono } from "hono";

import { withPrismaProject } from "../../prisma.js";

const app = new Hono();

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { schema, dataLoss } = body as {
      schema: string;
      dataLoss?: string[];
    };

    if (!schema) {
      return c.json({ error: "Schema is required" }, 400);
    }
    if (!Array.isArray(dataLoss)) {
      return c.json(
        { error: "dataLoss is required: the subjects the user confirmed deleting" },
        400
      );
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
      const unanswered = update.error?.meta?.unanswered ?? [];
      if (
        update.error?.code === "CLI.CONSENT_REQUIRED" &&
        unanswered.length > 0 &&
        unanswered.every((consent) => consent.verbs.includes("delete"))
      ) {
        // Delete only what the user saw and confirmed. If the database
        // changed since, ask again with the new list.
        const confirmed = new Set(dataLoss);
        if (!unanswered.every((consent) => confirmed.has(consent.subject))) {
          const subjects = unanswered.map((consent) => consent.subject);
          return c.json({
            requiresForceReset: true,
            dataLoss: subjects,
            message: `This push deletes data in ${subjects.join(", ")}. Please confirm to continue.`,
          });
        }
        update = await prisma.run([
          "db",
          "update",
          ...unanswered.flatMap((consent) => ["--delete", consent.subject]),
        ]);
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
