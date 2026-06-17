"use client";

import { useState, useCallback } from "react";
import { gmailApi, type GmailLabel } from "../../lib/api";

export function useLabels() {
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gmailApi.listLabels();
      setLabels(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load labels");
    } finally {
      setLoading(false);
    }
  }, []);

  const createLabel = useCallback(async (name: string) => {
    const label = await gmailApi.createLabel({
      name,
      messageListVisibility: "show",
      labelListVisibility: "labelShow",
    });
    setLabels((prev) => [...prev, label]);
    return label;
  }, []);

  const deleteLabel = useCallback(async (id: string) => {
    await gmailApi.deleteLabel(id);
    setLabels((prev) => prev.filter((l) => l.data.id !== id));
  }, []);

  return { labels, loading, error, fetchLabels, createLabel, deleteLabel };
}
