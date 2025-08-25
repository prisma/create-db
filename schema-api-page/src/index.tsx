import { Hono } from "hono";
import { cors } from "hono/cors";
import { renderer } from "./renderer";
import formatRoute from "./routes/schema/format";
import pullRoute from "./routes/schema/pull";
import pushRoute from "./routes/schema/push";
import pushForceRoute from "./routes/schema/push-force";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Connection-String"],
    credentials: true,
  })
);

app.use(renderer);

app.get("/", (c) => {
  return c.render(<h1>Hello!</h1>);
});

app.route("/api/schema/format", formatRoute);
app.route("/api/schema/pull", pullRoute);
app.route("/api/schema/push", pushRoute);
app.route("/api/schema/push-force", pushForceRoute);

export default app;
