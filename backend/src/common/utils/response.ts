import type { Response } from "express";

export const ok = (res: Response, message: string, data: unknown = null, status = 200) => {
  const body: Record<string, unknown> = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};

export const created = (res: Response, message: string, data: unknown = null) =>
  ok(res, message, data, 201);

export const fail = (res: Response, message: string, status = 400, errors: unknown = null) => {
  const body: Record<string, unknown> = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(status).json(body);
};
