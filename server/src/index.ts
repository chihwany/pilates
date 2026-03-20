import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { checkDbConnection } from "./db/index";
import auth from "./routes/auth";
import membersRouter from "./routes/members";

const app = new Hono();

// ---------------------
// Middleware
// ---------------------
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:8081"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ---------------------
// Health Check
// ---------------------
app.get("/health", async (c) => {
  const dbConnected = await checkDbConnection();

  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: dbConnected ? "connected" : "disconnected",
  });
});

// ---------------------
// Routes
// ---------------------
app.route("/api/auth", auth);
app.route("/api/members", membersRouter);

// ---------------------
// Global Error Handler
// ---------------------
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "An unexpected error occurred",
        statusCode: 500,
      },
    },
    500
  );
});

// ---------------------
// 404 Handler
// ---------------------
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
        statusCode: 404,
      },
    },
    404
  );
});

// ---------------------
// Start Server
// ---------------------
const port = Number(process.env["PORT"]) || 3000;

console.log(`Starting Pilates AI server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server is running on http://localhost:${port}`);
console.log(`Health check: http://localhost:${port}/health`);

export default app;
