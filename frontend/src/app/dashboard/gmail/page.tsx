"use client";

import AiBar from "../../../components/gmail/AiBar";
import WorkflowButtons from "../../../components/gmail/WorkflowButtons";
import GmailPageHeader from "../../../components/gmail/GmailPageHeader";

export default function GmailHomePage() {
  return (
    <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
      <GmailPageHeader title="Home" />
      <WorkflowButtons />
      <AiBar compact={false} />
    </div>
  );
}
