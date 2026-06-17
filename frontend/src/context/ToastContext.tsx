"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  variant?: "default" | "success" | "error";
};

type ToastContext = {
  push: (toast: Omit<Toast, "id">) => void;
};

const Ctx = createContext<ToastContext | null>(null);

const TOAST_DURATION_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className="text-left rounded-[var(--radius-md)] border px-4 py-3 shadow-lg backdrop-blur-sm transition-all animate-[toast-in_0.2s_ease-out]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-strong)",
              color: "var(--fg)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  background:
                    toast.variant === "error" ? "var(--red)" : "var(--accent)",
                }}
              />
              <span className="text-sm font-medium truncate">
                {toast.title}
              </span>
            </div>
            {toast.message && (
              <p
                className="mt-1 text-xs truncate"
                style={{ color: "var(--fg-dim)" }}
              >
                {toast.message}
              </p>
            )}
          </button>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
