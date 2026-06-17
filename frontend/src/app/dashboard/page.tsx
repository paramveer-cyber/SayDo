"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import ChatSection from "../../components/ChatSection";
import Sidebar from "../../components/Sidebar";
import LoadingScreen from "../../components/LoadingScreen";
import { allPluginsConnected } from "../../lib/plugins";
import gsap from "gsap";

export default function Home() {
  const auth = useAuth();
  const { status } = auth;
  const router = useRouter();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    } else if (
      status === "authenticated" &&
      !allPluginsConnected(auth.user.plugins)
    ) {
      router.replace("/dashboard/connect");
    }
  }, [status, auth, router]);

  useEffect(() => {
    if (!mainRef.current || status !== "authenticated") return;
    gsap.fromTo(
      mainRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.45, ease: "power2.out", delay: 0.1 },
    );
  }, [status]);

  if (status === "loading" || status === "unauthenticated") {
    return <LoadingScreen />;
  }

  if (!allPluginsConnected(auth.user.plugins)) {
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
      <Sidebar variant="main" />
      <main
        ref={mainRef}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle, var(--border-strong) 1.3px, transparent 1.3px)`,
            backgroundSize: "24px 24px",
            opacity: 0.22,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            overflow: "hidden",
          }}
        >
          <ChatSection />
        </div>
      </main>
    </div>
  );
}
