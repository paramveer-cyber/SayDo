import { Router, type Request, type Response } from "express";
import { verifyToken } from "../../common/utils/tokenLogic.js";
import { registerSseClient } from "./sse.service.js";

const sseRouter = Router();

const HEARTBEAT_INTERVAL_MS = 25000;

sseRouter.get("/stream", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;
  const tokenFromQuery = req.query.token as string | undefined;
  const token = tokenFromHeader ?? tokenFromQuery;

  if (!token) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }

  let userId: string;
  try {
    userId = verifyToken(token).userId;
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  const unregister = registerSseClient(userId, res);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, HEARTBEAT_INTERVAL_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    unregister();
  });
});

export { sseRouter };
