import { z } from "zod";

const eventTimeSchema = z.object({
  date: z.string().optional(),
  dateTime: z.string().optional(),
  timeZone: z.string().optional(),
});

const attendeeSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  optional: z.boolean().optional(),
  responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
});

const reminderOverrideSchema = z.object({
  method: z.enum(["email", "popup"]).optional(),
  minutes: z.number().int().min(0).optional(),
});

export const createEventBody = z.object({
  calendarId: z.string().optional(),
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: eventTimeSchema.optional(),
  end: eventTimeSchema.optional(),
  attendees: z.array(attendeeSchema).optional(),
  recurrence: z.array(z.string()).optional(),
  colorId: z.string().optional(),
  transparency: z.enum(["opaque", "transparent"]).optional(),
  visibility: z.enum(["default", "public", "private", "confidential"]).optional(),
  status: z.enum(["tentative", "confirmed", "cancelled"]).optional(),
  reminders: z
    .object({
      useDefault: z.boolean().optional(),
      overrides: z.array(reminderOverrideSchema).optional(),
    })
    .optional(),
  guestsCanModify: z.boolean().optional(),
  guestsCanInviteOthers: z.boolean().optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const getEventParams = z.object({
  eventId: z.string().min(1),
});

export const getEventQuery = z.object({
  calendarId: z.string().optional(),
});

export const listEventsQuery = z.object({
  calendarId: z.string().optional(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  timeZone: z.string().optional(),
  maxResults: z.coerce.number().int().min(1).max(2500).optional(),
  pageToken: z.string().optional(),
  q: z.string().optional(),
  orderBy: z.enum(["startTime", "updated"]).optional(),
  showDeleted: z.coerce.boolean().optional(),
  singleEvents: z.coerce.boolean().optional(),
});

export const updateEventParams = z.object({
  eventId: z.string().min(1),
});

export const updateEventBody = z.object({
  calendarId: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: eventTimeSchema.optional(),
  end: eventTimeSchema.optional(),
  attendees: z.array(attendeeSchema).optional(),
  status: z.enum(["tentative", "confirmed", "cancelled"]).optional(),
  reminders: z
    .object({
      useDefault: z.boolean().optional(),
      overrides: z.array(reminderOverrideSchema).optional(),
    })
    .optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const deleteEventParams = z.object({
  eventId: z.string().min(1),
});

export const deleteEventQuery = z.object({
  calendarId: z.string().optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export const getAvailabilityBody = z.object({
  timeMin: z.string().min(1),
  timeMax: z.string().min(1),
  timeZone: z.string().optional(),
  calendarIds: z.array(z.string()).min(1),
});

export type CreateEventBody = z.infer<typeof createEventBody>;
export type ListEventsQuery = z.infer<typeof listEventsQuery>;
export type UpdateEventBody = z.infer<typeof updateEventBody>;
export type GetEventQuery = z.infer<typeof getEventQuery>;
export type DeleteEventQuery = z.infer<typeof deleteEventQuery>;
export type GetAvailabilityBody = z.infer<typeof getAvailabilityBody>;
