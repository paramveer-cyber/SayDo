"use client";

import { useEffect } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import MessageList from "../../../../components/gmail/MessageList";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function TrashPage() {
  const { messages, loading, error, fetchMessages, toggleStar, untrashMessage, deleteMessage } = useMessages();

  const refetch = () => fetchMessages(undefined, "TRASH");

  useEffect(() => { refetch(); }, [fetchMessages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <GmailPageHeader title="Trash" />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="Trash is empty"
        showTrashActions
        onStar={toggleStar}
        onUntrash={async (id) => { try { await untrashMessage(id, refetch); } catch {} }}
        onDelete={async (id) => {
          if (!confirm("Permanently delete? This cannot be undone.")) return;
          try { await deleteMessage(id); } catch {}
        }}
        onRefresh={refetch}
      />
    </div>
  );
}
