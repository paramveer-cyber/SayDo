import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error.js";
import util from "node:util";
import { mapCorsairError } from "../utils/corsair-error.js";

const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError && err.isOperational) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }

  const corsairError = mapCorsairError(err);
  if (corsairError) {
    return res
      .status(corsairError.statusCode)
      .json({ success: false, message: corsairError.message });
  }

  if (typeof err === "object" && err !== null && "code" in err) {
    const dbErr = err as { code: string };
    if (dbErr.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A record with that value already exists",
      });
    }
    if (dbErr.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid reference — related record does not exist",
      });
    }
  }

  console.error("[Unhandled Error]", err);
  console.error(util.inspect(err, { depth: null, colors: false }));

  // console.error("message:", err.message);
  // console.error("cause:", err.cause?.message, err.cause?.code);
  // err.cause?.errors?.forEach((e, i) =>
  //   console.error(`  attempt[${i}]:`, e.message, e.address, e.port)
  // );
  return res
    .status(500)
    .json({ success: false, message: "Internal server error" });
};

export default errorHandler;
