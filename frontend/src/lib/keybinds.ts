// Shared keybind types, default bindings, and helpers used by the global
// keybind listener and the Settings > Keybinds editor.

export type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

export type KeybindsMap = Record<string, KeyCombo>;

export type KeybindCategory = "General" | "Navigation" | "Chat" | "Gmail";

export interface KeybindAction {
  id: string;
  label: string;
  description: string;
  category: KeybindCategory;
  default: KeyCombo;
}

// The full list of bindable actions. Adding a new action here is enough to
// surface it in the Settings UI and have it fall back to its default combo
// until the user overrides it.
export const KEYBIND_ACTIONS: KeybindAction[] = [
  {
    id: "toggle-theme",
    label: "Toggle theme",
    description: "Switch between light and dark mode",
    category: "General",
    default: { key: "l", ctrl: true, shift: true },
  },
  {
    id: "nav-chat",
    label: "Go to Chat",
    description: "Open the AI chat",
    category: "Navigation",
    default: { key: "1", ctrl: true },
  },
  {
    id: "nav-gmail",
    label: "Go to Gmail",
    description: "Open Gmail",
    category: "Navigation",
    default: { key: "2", ctrl: true },
  },
  {
    id: "nav-calendar",
    label: "Go to Calendar",
    description: "Open Calendar",
    category: "Navigation",
    default: { key: "3", ctrl: true },
  },
  {
    id: "nav-settings",
    label: "Go to Settings",
    description: "Open Settings",
    category: "Navigation",
    default: { key: ",", ctrl: true },
  },
  {
    id: "chat-focus-input",
    label: "Focus chat input",
    description: "Jump to the chat message box",
    category: "Chat",
    default: { key: "/" },
  },
  {
    id: "chat-new",
    label: "New chat",
    description: "Clear the current conversation",
    category: "Chat",
    default: { key: "o", ctrl: true, shift: true },
  },
  {
    id: "gmail-compose",
    label: "Compose email",
    description: "Start a new email",
    category: "Gmail",
    default: { key: "c", ctrl: true, shift: true },
  },
  {
    id: "gmail-search",
    label: "Focus Gmail AI search",
    description: "Jump to the Gmail AI prompt bar",
    category: "Gmail",
    default: { key: "k", ctrl: true },
  },
];

export const DEFAULT_KEYBINDS: KeybindsMap = KEYBIND_ACTIONS.reduce(
  (acc, action) => {
    acc[action.id] = action.default;
    return acc;
  },
  {} as KeybindsMap,
);

/** Merge a user's saved keybinds over the defaults (missing actions fall back). */
export function mergeKeybinds(
  saved: KeybindsMap | null | undefined,
): KeybindsMap {
  return { ...DEFAULT_KEYBINDS, ...(saved ?? {}) };
}

const NAMED_KEYS: Record<string, string> = {
  " ": "Space",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
};

/** Human readable label for a combo, e.g. "Ctrl + Shift + C". */
export function formatCombo(combo: KeyCombo | null | undefined): string {
  if (!combo) return "Unbound";
  const parts: string[] = [];
  if (combo.ctrl) parts.push("Ctrl");
  if (combo.meta) parts.push("Cmd");
  if (combo.alt) parts.push("Alt");
  if (combo.shift) parts.push("Shift");

  const key = combo.key;
  const display = NAMED_KEYS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  parts.push(display);
  return parts.join(" + ");
}

/** Keys that don't make sense as a standalone binding. */
const IGNORED_KEYS = new Set([
  "Control",
  "Shift",
  "Alt",
  "Meta",
  "CapsLock",
  "Tab",
]);

/** Build a KeyCombo from a keydown event, or null if the key isn't bindable. */
export function comboFromEvent(e: KeyboardEvent): KeyCombo | null {
  if (IGNORED_KEYS.has(e.key)) return null;
  return {
    key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
    ctrl: e.ctrlKey || undefined,
    shift: e.shiftKey || undefined,
    alt: e.altKey || undefined,
    meta: e.metaKey || undefined,
  };
}

/**
 * Whether a keydown event matches a saved combo. Ctrl and Cmd (meta) are
 * treated as interchangeable so the same defaults work on Windows/Linux and
 * macOS, unless the combo explicitly requires meta without ctrl.
 */
export function matchesCombo(e: KeyboardEvent, combo: KeyCombo): boolean {
  const eventKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (eventKey !== combo.key) return false;
  if (!!combo.shift !== e.shiftKey) return false;
  if (!!combo.alt !== e.altKey) return false;

  const wantsCtrlLike = !!combo.ctrl || !!combo.meta;
  const hasCtrlLike = e.ctrlKey || e.metaKey;
  if (wantsCtrlLike !== hasCtrlLike) return false;

  return true;
}

/** True if two combos represent the same key + modifier combination. */
export function combosEqual(a: KeyCombo, b: KeyCombo): boolean {
  return (
    a.key === b.key &&
    !!a.ctrl === !!b.ctrl &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt &&
    !!a.meta === !!b.meta
  );
}

/** Returns true if focus is currently in a text input, textarea, or editable element. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}
