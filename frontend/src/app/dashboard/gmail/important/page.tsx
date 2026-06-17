"use client";

import { useEffect } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import MessageList from "../../../../components/gmail/MessageList";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function ImportantPage() {
  const { messages, loading, error, fetchMessages, markRead, toggleStar, trashMessage, batchTrash } = useMessages();

  useEffect(() => { fetchMessages(undefined, "IMPORTANT"); }, [fetchMessages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <GmailPageHeader title="Important" />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="No important messages"
        onStar={toggleStar}
        onTrash={async (id) => { try { await trashMessage(id); } catch {} }}
        onBatchTrash={async (ids) => { try { await batchTrash(ids); } catch {} }}
        onBatchMarkRead={async (ids) => { try { await markRead(ids); } catch {} }}
        onRefresh={() => fetchMessages(undefined, "IMPORTANT")}
      />
    </div>
  );
}
