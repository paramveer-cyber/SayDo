"use client";

import { useState, useEffect, useCallback } from "react";
import { calendarApi, type CalEvent } from "../lib/api";
import CalendarWorkflowButtons from "./calendar/CalendarWorkflowButtons";

type CalView = "month" | "list" | "create" | "event";

function parseDate(ev: CalEvent): Date {
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

export default function CalendarSection() {
  const [view, setView] = useState<CalView>("list");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  const today = new Date();
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

  const fetchEvents = async (offset = 0) => {
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
      });
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(monthOffset);
  }, [monthOffset]);

  const createEvent = async () => {
    if (!summary || !startDt || !endDt) {
      setSaveMsg("Summary, start, and end required.");
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
        start: {
          dateTime: new Date(startDt).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: new Date(endDt).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
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
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
    const key = isoDate(parseDate(ev));
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setMonthOffset((p) => p - 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-dim)",
                padding: "2px 4px",
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                minWidth: 130,
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
                padding: "2px 4px",
              }}
            >
              ›
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["list", "month"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: view === v ? "var(--fg)" : "transparent",
                color: view === v ? "var(--bg)" : "var(--fg-dim)",
                fontSize: "0.775rem",
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize",
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
              padding: "0.3rem 0.75rem",
              borderRadius: 6,
              border: "none",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              fontSize: "0.775rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + New
          </button>
        </div>
      </div>

      {(view === "list" || view === "month") && (
        <div
          style={{
            padding: "0.6rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.775rem",
              color: "var(--fg-dim)",
              flexShrink: 0,
            }}
          >
            Check availability:
          </span>
          <input
            type="datetime-local"
            value={availStart}
            onChange={(e) => setAvailStart(e.target.value)}
            style={{
              fontSize: "0.775rem",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.25rem 0.5rem",
              background: "var(--bg)",
              color: "var(--fg)",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <span style={{ fontSize: "0.775rem", color: "var(--fg-dim)" }}>
            to
          </span>
          <input
            type="datetime-local"
            value={availEnd}
            onChange={(e) => setAvailEnd(e.target.value)}
            style={{
              fontSize: "0.775rem",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0.25rem 0.5rem",
              background: "var(--bg)",
              color: "var(--fg)",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            onClick={checkAvailability}
            disabled={availLoading || !availStart || !availEnd}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: 6,
              border: "none",
              background: "var(--fg)",
              color: "var(--bg)",
              fontSize: "0.775rem",
              cursor: "pointer",
              fontFamily: "inherit",
              opacity: !availStart || !availEnd ? 0.4 : 1,
            }}
          >
            {availLoading ? "…" : "Check"}
          </button>
          {availResult && (
            <span
              style={{
                fontSize: "0.775rem",
                padding: "0.25rem 0.625rem",
                borderRadius: 6,
                background: availResult.startsWith("Free")
                  ? "var(--accent-dim)"
                  : "var(--error-dim)",
                color: availResult.startsWith("Free")
                  ? "var(--accent)"
                  : "var(--error)",
                border: `1px solid ${availResult.startsWith("Free") ? "rgba(45,122,79,0.2)" : "#fecaca"}`,
              }}
            >
              {availResult}
            </span>
          )}
        </div>
      )}

      {(view === "list" || view === "month") && <CalendarWorkflowButtons />}

      {error && (
        <div
          style={{
            margin: "0.75rem 1.25rem",
            padding: "0.6rem 0.875rem",
            background: "var(--error-dim)",
            border: "1px solid #fecaca",
            borderRadius: 8,
            fontSize: "0.8rem",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              color: "var(--fg-dim)",
              fontSize: "0.85rem",
            }}
          >
            Loading…
          </div>
        )}

        {!loading && view === "list" && (
          <div style={{ padding: "1rem 1.25rem" }}>
            {sortedDates.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "var(--fg-dim)",
                  fontSize: "0.85rem",
                }}
              >
                No events this month.
              </div>
            )}
            {sortedDates.map((dateKey) => (
              <div key={dateKey} style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--fg-dim)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                  }}
                >
                  {formatDateStr(new Date(dateKey + "T00:00:00"))}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
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
                        gap: "0.75rem",
                        padding: "0.625rem 0.875rem",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          "var(--accent-dim)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background =
                          "var(--surface)")
                      }
                    >
                      <div
                        style={{
                          width: 4,
                          height: 36,
                          borderRadius: 2,
                          flexShrink: 0,
                          background:
                            COLOR_MAP[ev.colorId ?? ""] ?? "var(--accent)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--fg)",
                          }}
                        >
                          {ev.summary || "(no title)"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.775rem",
                            color: "var(--fg-dim)",
                          }}
                        >
                          {formatTime(ev)}
                        </div>
                        {ev.location && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--fg-dim)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            📍 {ev.location}
                          </div>
                        )}
                      </div>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--fg-dim)",
                            flexShrink: 0,
                          }}
                        >
                          {ev.attendees.length} attendee
                          {ev.attendees.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && view === "month" && (
          <div style={{ padding: "0.75rem 1.25rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 1,
                marginBottom: 4,
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--fg-dim)",
                    padding: "0.3rem 0",
                    letterSpacing: "0.05em",
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
                      minHeight: 80,
                      padding: "0.3rem",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: day ? "var(--surface)" : "transparent",
                      opacity: day ? 1 : 0,
                    }}
                  >
                    {day && (
                      <>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: isToday ? 700 : 400,
                            color: isToday ? "var(--bg)" : "var(--fg)",
                            background: isToday
                              ? "var(--accent)"
                              : "transparent",
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
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
                              fontSize: "0.65rem",
                              padding: "1px 4px",
                              borderRadius: 3,
                              background:
                                COLOR_MAP[ev.colorId ?? ""] ??
                                "var(--accent-dim)",
                              color: COLOR_MAP[ev.colorId ?? ""]
                                ? "#fff"
                                : "var(--accent)",
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
                              fontSize: "0.65rem",
                              color: "var(--fg-dim)",
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

        {!loading && view === "event" && selectedEvent && (
          <div style={{ padding: "1.5rem", maxWidth: 600 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {selectedEvent.summary || "(no title)"}
              </h2>
              <button
                onClick={() => deleteEvent(selectedEvent.id)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  border: "1px solid #fecaca",
                  background: "var(--error-dim)",
                  color: "var(--error)",
                  fontSize: "0.775rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <EventDetail
                icon="🕐"
                label="Time"
                value={formatTime(selectedEvent)}
              />
              <EventDetail
                icon="📅"
                label="Date"
                value={formatDateStr(parseDate(selectedEvent))}
              />
              {selectedEvent.location && (
                <EventDetail
                  icon="📍"
                  label="Location"
                  value={selectedEvent.location}
                />
              )}
              {selectedEvent.description && (
                <EventDetail
                  icon="📝"
                  label="Description"
                  value={selectedEvent.description}
                />
              )}
              {selectedEvent.status && (
                <EventDetail
                  icon="●"
                  label="Status"
                  value={selectedEvent.status}
                />
              )}
              {selectedEvent.attendees &&
                selectedEvent.attendees.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "0.775rem",
                        color: "var(--fg-dim)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      👥 Attendees
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      {selectedEvent.attendees.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span>{a.displayName ?? a.email}</span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "1px 6px",
                              borderRadius: 100,
                              background:
                                a.responseStatus === "accepted"
                                  ? "var(--accent-dim)"
                                  : "var(--border)",
                              color:
                                a.responseStatus === "accepted"
                                  ? "var(--accent)"
                                  : "var(--fg-dim)",
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
                    fontSize: "0.8rem",
                    color: "var(--accent)",
                    textDecoration: "underline",
                  }}
                >
                  Open in Google Calendar ↗
                </a>
              )}
            </div>
          </div>
        )}

        {view === "create" && (
          <div style={{ padding: "1.5rem", maxWidth: 560 }}>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "1.25rem",
              }}
            >
              New Event
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <CalField
                label="Title *"
                value={summary}
                onChange={setSummary}
                placeholder="Event title"
              />
              <CalField
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Optional"
              />
              <CalField
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
                <div>
                  <label
                    style={{
                      fontSize: "0.775rem",
                      color: "var(--fg-dim)",
                      display: "block",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Start *
                  </label>
                  <input
                    type="datetime-local"
                    value={startDt}
                    onChange={(e) => setStartDt(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.525rem 0.75rem",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--fg)",
                      fontSize: "0.825rem",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.775rem",
                      color: "var(--fg-dim)",
                      display: "block",
                      marginBottom: "0.3rem",
                    }}
                  >
                    End *
                  </label>
                  <input
                    type="datetime-local"
                    value={endDt}
                    onChange={(e) => setEndDt(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.525rem 0.75rem",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--surface)",
                      color: "var(--fg)",
                      fontSize: "0.825rem",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <CalField
                label="Attendees (comma-separated emails)"
                value={attendeeStr}
                onChange={setAttendeeStr}
                placeholder="a@x.com, b@y.com"
              />
              <div>
                <label
                  style={{
                    fontSize: "0.775rem",
                    color: "var(--fg-dim)",
                    display: "block",
                    marginBottom: "0.3rem",
                  }}
                >
                  Color
                </label>
                <div
                  style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}
                >
                  {Object.entries(COLOR_MAP).map(([id, hex]) => (
                    <div
                      key={id}
                      onClick={() => setColorId(id)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: hex,
                        cursor: "pointer",
                        border:
                          colorId === id
                            ? "2px solid var(--fg)"
                            : "2px solid transparent",
                        boxSizing: "border-box",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <button
                  onClick={createEvent}
                  disabled={saving}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--fg)",
                    color: "var(--bg)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Creating…" : "Create Event"}
                </button>
                <button
                  onClick={() => setView("list")}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--fg)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                {saveMsg && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color:
                        saveMsg === "Event created!"
                          ? "var(--accent)"
                          : "var(--error)",
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

function CalField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: "0.775rem",
          color: "var(--fg-dim)",
          display: "block",
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.525rem 0.875rem",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--fg)",
          fontSize: "0.875rem",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

function EventDetail({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
      <span style={{ fontSize: "0.875rem", flexShrink: 0, opacity: 0.7 }}>
        {icon}
      </span>
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--fg-dim)",
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--fg)",
            lineHeight: 1.5,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
