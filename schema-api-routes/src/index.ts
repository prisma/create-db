import { Hono } from "hono";
import { cors } from "hono/cors";
import formatRoute from "./routes/schema/format.js";
import pullRoute from "./routes/schema/pull.js";
import pushRoute from "./routes/schema/push.js";
import pushForceRoute from "./routes/schema/push-force.js";

const app = new Hono();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8787",
  "https://create-db.prisma.io",
  "https://claim-db-worker.raycast-0ef.workers.dev",
  "https://claim-db-worker-staging.raycast-0ef.workers.dev",
  "https://cloudflare-booth-git-feat-create-main-page-prisma.vercel.app",
  /^https:\/\/claim-db-worker.*\.vercel\.app$/,
  /^https:\/\/create-db-schema-api-routes(-\w+)?\.vercel\.app$/,
  /^https:\/\/.*-claim-db-worker\.datacdn\.workers\.dev/,
  /^https:\/\/.*-claim-db-worker\.raycast-0ef\.workers\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === "string") {
          return origin === allowedOrigin;
        }
        return allowedOrigin.test(origin);
      });
      return isAllowed ? origin : null;
    },
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

export default app;
