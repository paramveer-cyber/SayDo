"use client";

export const runtime = "edge";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMessages } from "../../../../../hooks/gmail/useMessages";
import MessageList from "../../../../../components/gmail/MessageList";
import GmailPageHeader from "../../../../../components/gmail/GmailPageHeader";

export default function LabelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const labelId = params.labelId as string;
  const {
    messages,
    loading,
    error,
    fetchMessages,
    toggleStar,
    trashMessage,
    batchTrash,
    markRead,
  } = useMessages();

  useEffect(() => {
    if (labelId) fetchMessages(undefined, labelId);
  }, [labelId, fetchMessages]);

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
      <GmailPageHeader
        title={`Label: ${labelId}`}
        onBack={() => router.push("/dashboard/gmail/labels")}
      />
      <MessageList
        messages={messages}
        loading={loading}
        error={error}
        emptyLabel="No messages with this label"
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
        onRefresh={() => fetchMessages(undefined, labelId)}
      />
    </div>
  );
}
