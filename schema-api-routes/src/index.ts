import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import formatRoute from "./routes/schema/format.js";
import pullRoute from "./routes/schema/pull.js";
import pushRoute from "./routes/schema/push.js";
import pushForceRoute from "./routes/schema/push-force.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Connection-String"],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({ message: "Hello World" });
});

app.route("/api/schema/format", formatRoute);
app.route("/api/schema/pull", pullRoute);
app.route("/api/schema/push", pushRoute);
app.route("/api/schema/push-force", pushForceRoute);

const port = process.env.PORT || 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
