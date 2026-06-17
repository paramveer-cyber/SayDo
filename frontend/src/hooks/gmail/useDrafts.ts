"use client";

import { useState, useCallback } from "react";
import { gmailApi, type GmailDraft } from "../../lib/api";

export function useDrafts() {
  const [drafts, setDrafts] = useState<GmailDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gmailApi.listDrafts();
      setDrafts(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDraft = useCallback(
    async (
      id: string,
      fields: { to: string; subject: string; body: string },
    ) => {
      const updated = await gmailApi.updateDraft(id, fields);
      setDrafts((prev) => prev.map((d) => (d.data.id === id ? updated : d)));
      return updated;
    },
    [],
  );

  const deleteDraft = useCallback(async (id: string) => {
    await gmailApi.deleteDraft(id);
    setDrafts((prev) => prev.filter((d) => d.data.id !== id));
  }, []);

  const sendDraft = useCallback(async (id: string) => {
    await gmailApi.sendDraft(id);
    setDrafts((prev) => prev.filter((d) => d.data.id !== id));
  }, []);

  return {
    drafts,
    loading,
    error,
    fetchDrafts,
    updateDraft,
    deleteDraft,
    sendDraft,
  };
}
