"use client";

import { useEffect } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import MessageList from "../../../../components/gmail/MessageList";
import { gmailApi } from "../../../../lib/api";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function SpamPage() {
  const { messages, loading, error, fetchMessages, toggleStar, deleteMessage } = useMessages();

  const refetch = () => fetchMessages(undefined, "SPAM");

  useEffect(() => { refetch(); }, [fetchMessages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <GmailPageHeader title="Spam" />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="No spam here"
        showTrashActions
        onStar={toggleStar}
        onUntrash={async (id) => {
          try {
            await gmailApi.modifyMessage(id, { addLabelIds: ["INBOX"], removeLabelIds: ["SPAM"] });
            refetch();
          } catch {}
        }}
        onDelete={async (id) => {
          if (!confirm("Permanently delete? This cannot be undone.")) return;
          try { await deleteMessage(id); } catch {}
        }}
        onRefresh={refetch}
      />
    </div>
  );
}

