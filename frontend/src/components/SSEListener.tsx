"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { tokenStore } from "../lib/tokenStore";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type NewEmailPayload = {
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
};

export default function SseListener() {
  const auth = useAuth();
  const { push } = useToast();

  useEffect(() => {
    if (auth.status !== "authenticated") return;

    const token = tokenStore.get();
    if (!token) return;

    const source = new EventSource(
      `${BASE}/sse/stream?token=${encodeURIComponent(token)}`,
    );

    source.addEventListener("new_email", (event) => {
      const payload = JSON.parse(
        (event as MessageEvent).data,
      ) as NewEmailPayload;

      push({
        title: payload.subject || "New email",
        message: payload.from,
      });
    });

    return () => source.close();
  }, [auth.status, push]);

  return null;
}
