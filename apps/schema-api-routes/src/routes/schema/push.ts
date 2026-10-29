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

      const update = await prisma.run(["db", "update"]);
      const unanswered = update.error?.meta?.unanswered ?? [];
      // Applying this schema would delete data; the editor asks before pushing
      // again through /push-force. Other questions (a rename, an access change)
      // can't be answered from the editor, so they fall through as a failure.
      if (
        update.error?.code === "CLI.CONSENT_REQUIRED" &&
        unanswered.length > 0 &&
        unanswered.every((consent) => consent.verbs.includes("delete"))
      ) {
        const dataLoss = unanswered.map((consent) => consent.subject);
        return c.json({
          requiresForceReset: true,
          dataLoss,
          message: `This push deletes data in ${dataLoss.join(", ")}. Please confirm to continue.`,
        });
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
