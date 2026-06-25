"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { gmailApi, type GmailMessage } from "../../lib/api";

const DEFAULT_PAGE_SIZE = 30;

const messageTimestamp = (m: GmailMessage) =>
  Number(m.data.internalDate ?? 0) || new Date(m.data.createdAt ?? 0).getTime();

export function useMessages() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentScope = useRef<{ q?: string; labelIds?: string }>({});
  const currentPageSize = useRef(DEFAULT_PAGE_SIZE);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => messageTimestamp(b) - messageTimestamp(a)),
    [messages],
  );

  const fetchMessages = useCallback(async (q?: string, labelIds?: string) => {
    setLoading(true);
    setError(null);
    currentScope.current = { q, labelIds };
    currentPageSize.current = DEFAULT_PAGE_SIZE;
    setHasMore(true);
    try {
      const data = await gmailApi.listMessages({
        q,
        labelIds,
        maxResults: DEFAULT_PAGE_SIZE,
      });
      const fetched = Array.isArray(data) ? data : [];
      setMessages(fetched);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { q, labelIds } = currentScope.current;

      await gmailApi.syncDB({ labelIds, q, maxPages: 2, fetchFull: true });

      const data = await gmailApi.listMessages({
        q,
        labelIds,
        maxResults: DEFAULT_PAGE_SIZE,
        pageOffset: currentPageSize.current,
      });
      const fetched = Array.isArray(data) ? data : [];

      if (fetched.length > 0) {
        currentPageSize.current += DEFAULT_PAGE_SIZE;
        setMessages((prev) => [...prev, ...fetched]);
      }

      setHasMore(fetched.length === DEFAULT_PAGE_SIZE);
    } catch {
      setError("Failed to load more messages");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 1) {
      await gmailApi.modifyMessage(ids[0]!, { removeLabelIds: ["UNREAD"] });
    } else {
      await gmailApi.batchModify({ ids, removeLabelIds: ["UNREAD"] });
    }
    setMessages((prev) =>
      prev.map((m) =>
        ids.includes(m.data.id)
          ? {
              ...m,
              data: {
                ...m.data,
                labelIds: m.data.labelIds.filter((l) => l !== "UNREAD"),
              },
            }
          : m,
      ),
    );
  }, []);

  const trashMessage = useCallback(async (id: string) => {
    await gmailApi.trashMessage(id);
    setMessages((prev) => prev.filter((m) => m.data.id !== id));
  }, []);

  const untrashMessage = useCallback(
    async (id: string, refetch: () => void) => {
      await gmailApi.untrashMessage(id);
      refetch();
    },
    [],
  );

  const deleteMessage = useCallback(async (id: string) => {
    await gmailApi.deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m.data.id !== id));
  }, []);

  const toggleStar = useCallback(async (msg: GmailMessage) => {
    const isStarred = msg.data.labelIds?.includes("STARRED");
    const optimisticLabelIds = isStarred
      ? (msg.data.labelIds ?? []).filter((l) => l !== "STARRED")
      : [...(msg.data.labelIds ?? []), "STARRED"];

    setMessages((prev) =>
      prev.map((m) =>
        m.data.id === msg.data.id
          ? { ...m, data: { ...m.data, labelIds: optimisticLabelIds } }
          : m,
      ),
    );

    try {
      const updated = await gmailApi.modifyMessage(
        msg.data.id,
        isStarred
          ? { removeLabelIds: ["STARRED"] }
          : { addLabelIds: ["STARRED"] },
      );
      if (updated?.data?.labelIds) {
        setMessages((prev) =>
          prev.map((m) =>
            m.data.id === msg.data.id
              ? { ...m, data: { ...m.data, labelIds: updated.data.labelIds } }
              : m,
          ),
        );
        return updated;
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.data.id === msg.data.id
            ? { ...m, data: { ...m.data, labelIds: msg.data.labelIds } }
            : m,
        ),
      );
    }
    return { ...msg, data: { ...msg.data, labelIds: optimisticLabelIds } };
  }, []);

  const prependMessage = useCallback((message: GmailMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.data.id === message.data.id)) return prev;
      return [message, ...prev];
    });
  }, []);

  const batchTrash = useCallback(async (ids: string[]) => {
    await gmailApi.batchModify({
      ids,
      addLabelIds: ["TRASH"],
      removeLabelIds: ["INBOX"],
    });
    setMessages((prev) => prev.filter((m) => !ids.includes(m.data.id)));
  }, []);

  const batchUntrash = useCallback(
    async (ids: string[], refetch: () => void) => {
      await gmailApi.batchModify({
        ids,
        addLabelIds: ["INBOX"],
        removeLabelIds: ["TRASH"],
      });
      refetch();
    },
    [],
  );

  const batchDelete = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map((id) => gmailApi.deleteMessage(id)));
    setMessages((prev) => prev.filter((m) => !ids.includes(m.data.id)));
  }, []);

  const batchMoveToInbox = useCallback(
    async (ids: string[], refetch: () => void) => {
      await gmailApi.batchModify({
        ids,
        addLabelIds: ["INBOX"],
        removeLabelIds: ["SPAM"],
      });
      refetch();
    },
    [],
  );

  const batchStar = useCallback(async (ids: string[]) => {
    await gmailApi.batchModify({ ids, addLabelIds: ["STARRED"] });
    setMessages((prev) =>
      prev.map((m) =>
        ids.includes(m.data.id) && !m.data.labelIds?.includes("STARRED")
          ? {
              ...m,
              data: {
                ...m.data,
                labelIds: [...(m.data.labelIds ?? []), "STARRED"],
              },
            }
          : m,
      ),
    );
  }, []);

  return {
    messages: sortedMessages,
    loading,
    loadingMore,
    hasMore,
    error,
    setError,
    setMessages,
    fetchMessages,
    loadMore,
    markRead,
    trashMessage,
    untrashMessage,
    deleteMessage,
    toggleStar,
    prependMessage,
    batchTrash,
    batchUntrash,
    batchDelete,
    batchMoveToInbox,
    batchStar,
  };
}
