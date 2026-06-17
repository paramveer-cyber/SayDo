"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { calendarApi, type CalEvent } from "../../../lib/api";
import gsap from "gsap";

type CalView = "month" | "list" | "create" | "event";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function parseStart(ev: CalEvent): Date {
  const raw = ev.start?.dateTime ?? ev.start?.date;
  return raw ? new Date(raw) : new Date();
}

function formatTime(ev: CalEvent): string {
  if (ev.start?.dateTime) {
    const s = new Date(ev.start.dateTime);
    const e = new Date(ev.end?.dateTime ?? ev.start.dateTime);
    return `${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return "All day";
}

function formatDateStr(d: Date): string {
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const COLOR_MAP: Record<string, string> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6bf26",
  "6": "#f4511e",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#d50000",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div
        style={{
          width: 3,
          height: 3,
          background: "var(--blue)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "0.52rem",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function CalInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.55rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
          marginBottom: "0.35rem",
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.6rem 0.875rem",
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--fg)",
          fontSize: "0.825rem",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--blue)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-strong)";
        }}
      />
    </div>
  );
}

function EventDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "0.75rem",
      }}
    >
      <div
        style={{
          fontSize: "0.52rem",
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
          width: 72,
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{ fontSize: "0.82rem", color: "var(--fg)", lineHeight: 1.55 }}
      >
        {value}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<CalView>("list");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDt, setStartDt] = useState("");
  const [endDt, setEndDt] = useState("");
  const [attendeeStr, setAttendeeStr] = useState("");
  const [colorId, setColorId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");
  const [availResult, setAvailResult] = useState<string | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const today = new Date();

  useEffect(() => {
    const targets = [headerRef.current, contentRef.current].filter(Boolean);
    gsap.fromTo(
      targets,
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "power4.out",
        stagger: 0.07,
        delay: 0.2,
      },
    );
  }, []);

  const fetchEvents = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const next = new Date(
      today.getFullYear(),
      today.getMonth() + offset + 1,
      1,
    );
    try {
      const data = await calendarApi.listEvents({
        timeMin: base.toISOString(),
        timeMax: next.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
        timeZone: TZ,
      });
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setEvents(items);
    } catch {
      setError(
        "Failed to load events. Make sure Google Calendar is connected.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(monthOffset);
  }, [monthOffset, fetchEvents]);

  const createEvent = async () => {
    if (!summary || !startDt || !endDt) {
      setSaveMsg("Title, start, and end are required.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const attendees = attendeeStr
        ? attendeeStr.split(",").map((e) => ({ email: e.trim() }))
        : undefined;
      await calendarApi.createEvent({
        summary,
        description: description || undefined,
        location: location || undefined,
        start: { dateTime: new Date(startDt).toISOString(), timeZone: TZ },
        end: { dateTime: new Date(endDt).toISOString(), timeZone: TZ },
        colorId: colorId || undefined,
        attendees,
      });
      setSaveMsg("Event created!");
      setSummary("");
      setDescription("");
      setLocation("");
      setStartDt("");
      setEndDt("");
      setAttendeeStr("");
      setColorId("");
      setTimeout(() => {
        setView("list");
        fetchEvents(monthOffset);
      }, 1000);
    } catch {
      setSaveMsg("Failed to create event.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await calendarApi.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (view === "event") setView("list");
    } catch {
      setError("Delete failed");
    }
  };

  const checkAvailability = async () => {
    if (!availStart || !availEnd) return;
    setAvailLoading(true);
    setAvailResult(null);
    try {
      const data = await calendarApi.checkAvailability({
        timeMin: new Date(availStart).toISOString(),
        timeMax: new Date(availEnd).toISOString(),
        timeZone: TZ,
        calendarIds: ["primary"],
      });
      const busy = data.calendars?.primary?.busy ?? [];
      if (busy.length === 0) {
        setAvailResult("Free during this window.");
      } else {
        const slots = busy
          .map(
            (b) =>
              `${new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          )
          .join(", ");
        setAvailResult(`Busy: ${slots}`);
      }
    } catch {
      setAvailResult("Availability check failed.");
    } finally {
      setAvailLoading(false);
    }
  };

  const grouped: Record<string, CalEvent[]> = {};
  events.forEach((ev) => {
    const key = isoDate(parseStart(ev));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });
  const sortedDates = Object.keys(grouped).sort();

  const curMonth = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1,
  );
  const monthLabel = curMonth.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(
    curMonth.getFullYear(),
    curMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDow = new Date(
    curMonth.getFullYear(),
    curMonth.getMonth(),
    1,
  ).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsForDay = (day: number) => {
    const key = `${curMonth.getFullYear()}-${String(curMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return grouped[key] ?? [];
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {view === "event" && (
            <button
              onClick={() => {
                setView("list");
                setSelectedEvent(null);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-dim)",
                padding: 4,
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fg-dim)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <button
              onClick={() => setMonthOffset((p) => p - 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-dim)",
                padding: "2px 6px",
                fontSize: "1rem",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fg-dim)";
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "1.1rem",
                letterSpacing: "-0.02em",
                minWidth: 160,
                textAlign: "center",
              }}
            >
              {monthLabel}
            </span>
            <button
              onClick={() => setMonthOffset((p) => p + 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-dim)",
                padding: "2px 6px",
                fontSize: "1rem",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--fg-dim)";
              }}
            >
              ›
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 4, height: 4, background: "var(--blue)" }} />
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              Calendar
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {(["list", "month"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "0.35rem 0.875rem",
                border: "1px solid var(--border-strong)",
                background: view === v ? "var(--fg)" : "transparent",
                color: view === v ? "var(--bg)" : "var(--fg-dim)",
                fontSize: "0.6rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {v}
            </button>
          ))}
          <button
            onClick={() => {
              setView("create");
              setSaveMsg("");
            }}
            style={{
              padding: "0.35rem 0.875rem",
              border: "1px solid var(--blue)",
              background: "var(--blue-dim)",
              color: "var(--blue)",
              fontSize: "0.6rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              clipPath:
                "polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--blue)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--blue-dim)";
              e.currentTarget.style.color = "var(--blue)";
            }}
          >
            + New event
          </button>
        </div>
      </div>

      {/* Availability bar */}
      {(view === "list" || view === "month") && (
        <div
          style={{
            padding: "0.6rem 1.75rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: "0.6rem",
            alignItems: "center",
            flexWrap: "wrap",
            background: "var(--bg)",
          }}
        >
          <span
            style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-dim)",
              flexShrink: 0,
            }}
          >
            Check availability
          </span>
          <div
            style={{ width: 1, height: 14, background: "var(--border-strong)" }}
          />
          <input
            type="datetime-local"
            value={availStart}
            onChange={(e) => setAvailStart(e.target.value)}
            style={{
              fontSize: "0.72rem",
              border: "1px solid var(--border-strong)",
              padding: "0.25rem 0.6rem",
              background: "var(--surface)",
              color: "var(--fg)",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--blue)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
          />
          <span
            style={{
              fontSize: "0.58rem",
              color: "var(--fg-dim)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            to
          </span>
          <input
            type="datetime-local"
            value={availEnd}
            onChange={(e) => setAvailEnd(e.target.value)}
            style={{
              fontSize: "0.72rem",
              border: "1px solid var(--border-strong)",
              padding: "0.25rem 0.6rem",
              background: "var(--surface)",
              color: "var(--fg)",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--blue)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
          />
          <button
            onClick={checkAvailability}
            disabled={availLoading || !availStart || !availEnd}
            style={{
              padding: "0.28rem 0.875rem",
              border: "none",
              background:
                !availStart || !availEnd ? "var(--border)" : "var(--fg)",
              color: !availStart || !availEnd ? "var(--fg-dim)" : "var(--bg)",
              fontSize: "0.6rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: !availStart || !availEnd ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {availLoading ? "…" : "Check"}
          </button>
          {availResult && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "0.25rem 0.7rem",
                background: availResult.startsWith("Free")
                  ? "var(--green-dim)"
                  : "var(--red-dim)",
                color: availResult.startsWith("Free")
                  ? "var(--green)"
                  : "var(--red)",
                border: `1px solid ${availResult.startsWith("Free") ? "var(--green)" : "var(--red)"}`,
              }}
            >
              {availResult}
            </span>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            margin: "0.75rem 1.75rem",
            padding: "0.6rem 0.875rem",
            background: "var(--red-dim)",
            border: "1px solid var(--red)",
            fontSize: "0.75rem",
            color: "var(--red)",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* Main content */}
      <div
        ref={contentRef}
        style={{ flex: 1, overflowY: "auto" }}
        className="scrollbar-thin"
      >
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem",
              gap: "0.6rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {["var(--blue)", "var(--yellow)", "var(--red)"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    background: c,
                    animation: `thinkPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-dim)",
              }}
            >
              Loading events
            </span>
          </div>
        )}

        {/* List view */}
        {!loading && view === "list" && (
          <div style={{ padding: "1.25rem 1.75rem" }}>
            {sortedDates.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <div
                  style={{
                    fontFamily: "'Movement', sans-serif",
                    fontSize: "2.5rem",
                    letterSpacing: "-0.03em",
                    color: "var(--border-strong)",
                    marginBottom: "0.75rem",
                    lineHeight: 1,
                  }}
                >
                  Nothing here.
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--fg-dim)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  No events this month
                </p>
              </div>
            )}
            {sortedDates.map((dateKey) => (
              <div key={dateKey} style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 3,
                      background: "var(--blue)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--fg-dim)",
                    }}
                  >
                    {formatDateStr(new Date(dateKey + "T00:00:00"))}
                  </span>
                  <div
                    style={{ flex: 1, height: 1, background: "var(--border)" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  {grouped[dateKey].map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev);
                        setView("event");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.875rem",
                        padding: "0.7rem 0.875rem",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        cursor: "pointer",
                        transition: "border-color 0.12s, background 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--blue)";
                        e.currentTarget.style.background = "var(--blue-dim)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.background = "var(--surface)";
                      }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: 32,
                          flexShrink: 0,
                          background:
                            COLOR_MAP[ev.colorId ?? ""] ?? "var(--blue)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "var(--fg)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {ev.summary || "(no title)"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--fg-dim)",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {formatTime(ev)}
                        </div>
                        {ev.location && (
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: "var(--fg-dim)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ev.location}
                          </div>
                        )}
                      </div>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <div
                          style={{
                            fontSize: "0.55rem",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--fg-dim)",
                            flexShrink: 0,
                            padding: "0.2rem 0.5rem",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {ev.attendees.length} attendee
                          {ev.attendees.length > 1 ? "s" : ""}
                        </div>
                      )}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        style={{ flexShrink: 0, color: "var(--fg-dim)" }}
                      >
                        <path
                          d="M3 1l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Month view */}
        {!loading && view === "month" && (
          <div style={{ padding: "1rem 1.75rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 1,
                marginBottom: 6,
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: "0.55rem",
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--fg-dim)",
                    padding: "0.4rem 0",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
              }}
            >
              {cells.map((day, idx) => {
                const dayEvents = day ? eventsForDay(day) : [];
                const isToday =
                  day !== null && monthOffset === 0 && day === today.getDate();
                return (
                  <div
                    key={idx}
                    style={{
                      minHeight: 86,
                      padding: "0.35rem",
                      border: "1px solid var(--border)",
                      background: day ? "var(--surface)" : "transparent",
                      opacity: day ? 1 : 0,
                    }}
                  >
                    {day && (
                      <>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: isToday ? 900 : 500,
                            color: isToday ? "var(--bg)" : "var(--fg)",
                            background: isToday ? "var(--blue)" : "transparent",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 4,
                          }}
                        >
                          {day}
                        </div>
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => {
                              setSelectedEvent(ev);
                              setView("event");
                            }}
                            title={ev.summary}
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              padding: "1px 5px",
                              background:
                                COLOR_MAP[ev.colorId ?? ""] ??
                                "var(--blue-dim)",
                              color: COLOR_MAP[ev.colorId ?? ""]
                                ? "#fff"
                                : "var(--blue)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginBottom: 2,
                              cursor: "pointer",
                            }}
                          >
                            {ev.summary || "(no title)"}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div
                            style={{
                              fontSize: "0.58rem",
                              color: "var(--fg-dim)",
                              fontWeight: 700,
                            }}
                          >
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event detail */}
        {!loading && view === "event" && selectedEvent && (
          <div style={{ padding: "1.75rem", maxWidth: 580 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.75rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.52rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--blue)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Event detail
                </div>
                <h2
                  style={{
                    fontFamily: "'Movement', sans-serif",
                    fontSize: "2rem",
                    letterSpacing: "-0.03em",
                    lineHeight: 0.95,
                    margin: 0,
                  }}
                >
                  {selectedEvent.summary || "(no title)"}
                </h2>
              </div>
              <button
                onClick={() => deleteEvent(selectedEvent.id)}
                style={{
                  padding: "0.35rem 0.75rem",
                  border: "1px solid var(--red)",
                  background: "var(--red-dim)",
                  color: "var(--red)",
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--red)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--red-dim)";
                  e.currentTarget.style.color = "var(--red)";
                }}
              >
                Delete
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "1.25rem",
              }}
            >
              <EventDetailRow label="Time" value={formatTime(selectedEvent)} />
              <EventDetailRow
                label="Date"
                value={formatDateStr(parseStart(selectedEvent))}
              />
              {selectedEvent.location && (
                <EventDetailRow
                  label="Location"
                  value={selectedEvent.location}
                />
              )}
              {selectedEvent.description && (
                <EventDetailRow
                  label="Description"
                  value={selectedEvent.description}
                />
              )}
              {selectedEvent.status && (
                <EventDetailRow label="Status" value={selectedEvent.status} />
              )}

              {selectedEvent.attendees &&
                selectedEvent.attendees.length > 0 && (
                  <div
                    style={{
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.52rem",
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--fg-dim)",
                        marginBottom: "0.6rem",
                      }}
                    >
                      Attendees
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.3rem",
                      }}
                    >
                      {selectedEvent.attendees.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.78rem",
                          }}
                        >
                          <span>{a.displayName ?? a.email}</span>
                          <span
                            style={{
                              fontSize: "0.52rem",
                              fontWeight: 800,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              padding: "0.2rem 0.5rem",
                              background:
                                a.responseStatus === "accepted"
                                  ? "var(--green-dim)"
                                  : "var(--surface)",
                              color:
                                a.responseStatus === "accepted"
                                  ? "var(--green)"
                                  : "var(--fg-dim)",
                              border: `1px solid ${a.responseStatus === "accepted" ? "var(--green)" : "var(--border-strong)"}`,
                            }}
                          >
                            {a.responseStatus ?? "needsAction"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedEvent.htmlLink && (
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--blue)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  Open in Google Calendar
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 8L8 2M8 2H3M8 2v5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Create event */}
        {view === "create" && (
          <div style={{ padding: "1.75rem", maxWidth: 540 }}>
            <div style={{ marginBottom: "1.75rem" }}>
              <div
                style={{
                  fontSize: "0.52rem",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--blue)",
                  marginBottom: "0.5rem",
                }}
              >
                New event
              </div>
              <h2
                style={{
                  fontFamily: "'Movement', sans-serif",
                  fontSize: "2rem",
                  letterSpacing: "-0.03em",
                  lineHeight: 0.95,
                  margin: 0,
                }}
              >
                Schedule it.
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <CalInput
                label="Title *"
                value={summary}
                onChange={setSummary}
                placeholder="Event title"
              />
              <CalInput
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Optional"
              />
              <CalInput
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="Optional"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <CalInput
                  label="Start *"
                  value={startDt}
                  onChange={setStartDt}
                  placeholder=""
                  type="datetime-local"
                />
                <CalInput
                  label="End *"
                  value={endDt}
                  onChange={setEndDt}
                  placeholder=""
                  type="datetime-local"
                />
              </div>
              <CalInput
                label="Attendees (comma-separated emails)"
                value={attendeeStr}
                onChange={setAttendeeStr}
                placeholder="a@x.com, b@y.com"
              />

              <div>
                <div
                  style={{
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--fg-dim)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Color
                </div>
                <div
                  style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                >
                  {Object.entries(COLOR_MAP).map(([id, hex]) => (
                    <div
                      key={id}
                      onClick={() => setColorId(id)}
                      style={{
                        width: 20,
                        height: 20,
                        background: hex,
                        cursor: "pointer",
                        outline:
                          colorId === id
                            ? `2px solid var(--fg)`
                            : "2px solid transparent",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  paddingTop: "0.25rem",
                }}
              >
                <button
                  onClick={createEvent}
                  disabled={saving}
                  style={{
                    padding: "0.6rem 1.5rem",
                    border: "none",
                    background: saving ? "var(--border)" : "var(--fg)",
                    color: saving ? "var(--fg-dim)" : "var(--bg)",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                >
                  {saving ? "Creating…" : "Create Event"}
                </button>
                <button
                  onClick={() => setView("list")}
                  style={{
                    padding: "0.6rem 1.25rem",
                    border: "1px solid var(--border-strong)",
                    background: "transparent",
                    color: "var(--fg-dim)",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                {saveMsg && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:
                        saveMsg === "Event created!"
                          ? "var(--green)"
                          : "var(--red)",
                    }}
                  >
                    {saveMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
