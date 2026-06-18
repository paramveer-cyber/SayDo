"use client";

import { useState, useCallback } from "react";
import { aiApi } from "../../lib/api";

export function useAiPrompt() {
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const sendPrompt = useCallback(async (promptOverride?: string) => {
    const text = (promptOverride ?? aiInput).trim();
    if (!text) return;
    if (promptOverride) setAiInput(promptOverride);
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await aiApi.prompt({ prompt: text });
      setAiResult(result ?? "Done.");
    } catch {
      setAiResult("AI request failed.");
    } finally {
      setAiLoading(false);
    }
  }, [aiInput]);

  const reset = useCallback(() => {
    setAiResult(null);
    setAiInput("");
  }, []);

  return { aiInput, setAiInput, aiLoading, aiResult, sendPrompt, reset };
}
