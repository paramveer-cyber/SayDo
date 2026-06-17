import type { Response } from "express";

const connectedClientsByUser = new Map<string, Set<Response>>();

export const registerSseClient = (userId: string, res: Response): (() => void) => {
  const existingClients = connectedClientsByUser.get(userId);
  if (existingClients) {
    existingClients.add(res);
  } else {
    connectedClientsByUser.set(userId, new Set([res]));
  }

  return () => {
    const clients = connectedClientsByUser.get(userId);
    if (!clients) return;
    clients.delete(res);
    if (clients.size === 0) connectedClientsByUser.delete(userId);
  };
};

export const sendEventToUser = (
  userId: string,
  eventName: string,
  payload: unknown,
): void => {
  const clients = connectedClientsByUser.get(userId);
  if (!clients || clients.size === 0) return;

  const serializedPayload = JSON.stringify(payload);
  for (const client of clients) {
    client.write(`event: ${eventName}\ndata: ${serializedPayload}\n\n`);
  }
};

export const getConnectedUserCount = (): number => connectedClientsByUser.size;
