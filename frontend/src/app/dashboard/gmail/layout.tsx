"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import LoadingScreen from "../../../components/LoadingScreen";
import NbBackdrop from "../../../components/NbBackdrop";
import { gmailApi } from "../../../lib/api";

export default function GmailLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Sidebar variant="gmail" />
        <button
          className="nb-btn-secondary"
          onClick={() => gmailApi.syncDB()}
          style={{
            margin: "0 0.75rem 0.75rem",
            justifyContent: "center",
            fontSize: "0.65rem",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M14 8A6 6 0 0 1 2.5 11.5M2 8A6 6 0 0 1 13.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 5v3h-3M2 11v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sync
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <NbBackdrop />
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
