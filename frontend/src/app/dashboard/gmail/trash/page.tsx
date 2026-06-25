"use client";

import { useEffect } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import MessageList from "../../../../components/gmail/MessageList";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function TrashPage() {
  const {
    messages,
    loading,
    error,
    fetchMessages,
    toggleStar,
    untrashMessage,
    batchUntrash,
  } = useMessages();

  const refetch = () => fetchMessages(undefined, "TRASH");

  useEffect(() => {
    refetch();
  }, [fetchMessages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minWidth: 0,
      }}
    >
      <GmailPageHeader title="Trash" />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="Trash is empty"
        showTrashActions
        onStar={toggleStar}
        onUntrash={async (id) => {
          try {
            await untrashMessage(id, refetch);
          } catch {}
        }}
        onBatchUntrash={async (ids) => {
          try {
            await batchUntrash(ids, refetch);
          } catch {}
        }}
        onRefresh={refetch}
      />
    </div>
  );
}
