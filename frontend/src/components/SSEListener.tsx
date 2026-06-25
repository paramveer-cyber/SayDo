"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { tokenStore } from "../lib/tokenStore";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export type NewEmailPayload = {
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
};

export const AGENT_STEP_EVENT = "corsair:agent-step";
export const NEW_EMAIL_EVENT = "corsair:new-email";

export type AgentToolCallSummary = {
  toolName: string;
  label: string;
};

export type AgentStepEventDetail =
  | { kind: "started"; requestId: string }
  | {
      kind: "step";
      requestId: string;
      stepNumber: number;
      toolCalls: AgentToolCallSummary[];
      toolResultCount: number;
      hasText: boolean;
    }
  | { kind: "done"; requestId: string };

const dispatchAgentStepEvent = (detail: AgentStepEventDetail) => {
  window.dispatchEvent(
    new CustomEvent<AgentStepEventDetail>(AGENT_STEP_EVENT, { detail }),
  );
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

      window.dispatchEvent(
        new CustomEvent<NewEmailPayload>(NEW_EMAIL_EVENT, { detail: payload }),
      );
    });

    source.addEventListener("agent_started", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as {
        requestId: string;
      };
      dispatchAgentStepEvent({ kind: "started", requestId: payload.requestId });
    });

    source.addEventListener("agent_step", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as {
        requestId: string;
        stepNumber: number;
        toolCalls: AgentToolCallSummary[];
        toolResultCount: number;
        hasText: boolean;
      };
      dispatchAgentStepEvent({ kind: "step", ...payload });
    });

    source.addEventListener("agent_done", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as {
        requestId: string;
      };
      dispatchAgentStepEvent({ kind: "done", requestId: payload.requestId });
    });

    return () => source.close();
  }, [auth.status, push]);

  return null;
}
