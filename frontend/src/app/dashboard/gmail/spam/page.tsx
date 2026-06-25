"use client";

import { useEffect } from "react";
import { useMessages } from "../../../../hooks/gmail/useMessages";
import MessageList from "../../../../components/gmail/MessageList";
import { gmailApi } from "../../../../lib/api";
import GmailPageHeader from "../../../../components/gmail/GmailPageHeader";

export default function SpamPage() {
  const {
    messages,
    loading,
    error,
    fetchMessages,
    toggleStar,
    batchMoveToInbox,
  } = useMessages();

  const refetch = () => fetchMessages(undefined, "SPAM");

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
            await gmailApi.modifyMessage(id, {
              addLabelIds: ["INBOX"],
              removeLabelIds: ["SPAM"],
            });
            refetch();
          } catch {}
        }}
        onBatchMoveToInbox={async (ids) => {
          try {
            await batchMoveToInbox(ids, refetch);
          } catch {}
        }}
        onRefresh={refetch}
      />
    </div>
  );
}
