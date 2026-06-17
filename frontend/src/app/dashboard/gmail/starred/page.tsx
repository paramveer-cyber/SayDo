"use client";

import { useEffect } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import MessageList from "../../../../components/gmail/MessageList";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function StarredPage() {
  const { messages, loading, error, fetchMessages, toggleStar, trashMessage } = useMessages();

  useEffect(() => { fetchMessages(undefined, "STARRED"); }, [fetchMessages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <GmailPageHeader title="Starred" accent="var(--yellow)" />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="No starred messages"
        onStar={toggleStar}
        onTrash={async (id) => { try { await trashMessage(id); } catch {} }}
        onRefresh={() => fetchMessages(undefined, "STARRED")}
      />
    </div>
  );
}
