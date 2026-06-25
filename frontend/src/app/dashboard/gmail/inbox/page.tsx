"use client";

import { useEffect, useMemo } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import { useLabels } from "../../../../hooks/gmail/useLabels";
import MessageList from "../../../../components/gmail/MessageList";
import AiBar from "../../../../components/gmail/AiBar";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";
import { gmailApi } from "../../../../lib/api";
import { NEW_EMAIL_EVENT } from "../../../../components/SSEListener";
import type { NewEmailPayload } from "../../../../components/SSEListener";

export default function InboxPage() {
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchMessages,
    loadMore,
    markRead,
    trashMessage,
    toggleStar,
    batchTrash,
    prependMessage,
  } = useMessages();
  const { labels, fetchLabels } = useLabels();

  useEffect(() => {
    fetchMessages(undefined, "INBOX");
  }, [fetchMessages]);
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    const handleNewEmail = async (event: Event) => {
      const { messageId } = (event as CustomEvent<NewEmailPayload>).detail;
      try {
        const message = await gmailApi.getMessage(messageId);
        if (message) prependMessage(message);
      } catch {}
    };

    window.addEventListener(NEW_EMAIL_EVENT, handleNewEmail);
    return () => window.removeEventListener(NEW_EMAIL_EVENT, handleNewEmail);
  }, [prependMessage]);

  const labelsById = useMemo(
    () => new Map(labels.map((l) => [l.data.id, l.data])),
    [labels],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <GmailPageHeader title="Inbox" />

      <AiBar compact />

      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="No messages in inbox"
        onStar={toggleStar}
        onTrash={async (id) => {
          try {
            await trashMessage(id);
          } catch {}
        }}
        onBatchTrash={async (ids) => {
          try {
            await batchTrash(ids);
          } catch {}
        }}
        onBatchMarkRead={async (ids) => {
          try {
            await markRead(ids);
          } catch {}
        }}
        onRefresh={() => fetchMessages(undefined, "INBOX")}
        labelsById={labelsById}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
        hasMore={hasMore}
      />
    </div>
  );
}
