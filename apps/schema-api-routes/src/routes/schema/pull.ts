import { Hono } from "hono";

import { withPrismaProject } from "../../prisma.js";

const app = new Hono();

app.post("/", async (c) => {
  try {
    const connectionString = c.req.header("X-Connection-String");

    if (!connectionString) {
      return c.json(
        { error: "Connection string not provided in headers" },
        400
      );
    }

    return await withPrismaProject(connectionString, undefined, async (prisma) => {
      const infer = await prisma.run(["contract", "infer"]);
      if (!infer.ok) {
        throw new Error(prisma.describe(infer));
      }

      const schema = await prisma.readContract();
      // An empty database infers a contract with no declarations.
      const isEmpty = !/^\s*(model|enum|view|type)\s/m.test(schema);

      return c.json({
        success: true,
        schema,
        message: isEmpty
          ? "Database is empty - showing minimal schema"
          : "Schema pulled successfully",
        isEmpty,
      });
    });
  } catch (error) {
    return c.json(
      {
        error: "Failed to pull schema",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default app;
