"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { settingsApi } from "../lib/api";
import {
  DEFAULT_KEYBINDS,
  KEYBIND_ACTIONS,
  matchesCombo,
  mergeKeybinds,
  isTypingTarget,
  type KeybindsMap,
} from "../lib/keybinds";
import { toggleTheme } from "../hooks/useTheme";

/** Custom event other components can listen to for keybind-triggered actions. */
export const KEYBIND_ACTION_EVENT = "corsair:keybind-action";

/** Dispatched by the Settings page after saving so this listener picks up new bindings. */
export const KEYBINDS_UPDATED_EVENT = "corsair:keybinds-updated";

export function dispatchKeybindAction(actionId: string) {
  window.dispatchEvent(
    new CustomEvent<string>(KEYBIND_ACTION_EVENT, { detail: actionId }),
  );
}

const NAV_TARGETS: Record<string, string> = {
  "nav-command-center": "/dashboard",
  "nav-chat": "/dashboard/chat",
  "nav-gmail": "/dashboard/gmail",
  "nav-calendar": "/dashboard/calendar",
  "nav-settings": "/dashboard/settings",
  "gmail-compose": "/dashboard/gmail/compose",
};

/**
 * Mounted once near the root of the app. Loads the user's configured
 * keybinds (falling back to defaults), listens for matching keydown events
 * anywhere in the app, and dispatches the corresponding action: either a
 * direct router navigation, a theme toggle, or a `KEYBIND_ACTION_EVENT`
 * custom event that interested components (chat input, Gmail search, etc.)
 * can subscribe to.
 */
export default function GlobalKeybinds() {
  const { status } = useAuth();
  const router = useRouter();
  const keybindsRef = useRef<KeybindsMap>(DEFAULT_KEYBINDS);

  useEffect(() => {
    if (status !== "authenticated") {
      keybindsRef.current = DEFAULT_KEYBINDS;
      return;
    }

    let cancelled = false;
    settingsApi
      .get()
      .then(({ settings }) => {
        if (!cancelled) keybindsRef.current = mergeKeybinds(settings.keybinds);
      })
      .catch(() => {
        keybindsRef.current = DEFAULT_KEYBINDS;
      });

    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<KeybindsMap>).detail;
      keybindsRef.current = mergeKeybinds(detail);
    };
    window.addEventListener(KEYBINDS_UPDATED_EVENT, onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(KEYBINDS_UPDATED_EVENT, onUpdated);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const onKeyDown = (e: KeyboardEvent) => {
      const keybinds = keybindsRef.current;

      for (const action of KEYBIND_ACTIONS) {
        const combo = keybinds[action.id];
        if (!combo) continue;
        if (!matchesCombo(e, combo)) continue;

        // Bare keys with no modifiers (e.g. "/") shouldn't fire while the
        // user is typing in a text field. Combos with a modifier are
        // assumed to be intentional shortcuts and always fire.
        const hasModifier = combo.ctrl || combo.shift || combo.alt || combo.meta;
        if (!hasModifier && isTypingTarget(e.target)) continue;

        e.preventDefault();

        if (action.id === "toggle-theme") {
          toggleTheme();
        } else if (NAV_TARGETS[action.id]) {
          router.push(NAV_TARGETS[action.id]);
        } else {
          dispatchKeybindAction(action.id);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, router]);

  return null;
}
