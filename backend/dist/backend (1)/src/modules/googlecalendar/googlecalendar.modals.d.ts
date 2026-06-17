import { z } from "zod";
export declare const createEventBody: z.ZodObject<{
    calendarId: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    start: z.ZodOptional<z.ZodObject<{
        date: z.ZodOptional<z.ZodString>;
        dateTime: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    end: z.ZodOptional<z.ZodObject<{
        date: z.ZodOptional<z.ZodString>;
        dateTime: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    attendees: z.ZodOptional<z.ZodArray<z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        optional: z.ZodOptional<z.ZodBoolean>;
        responseStatus: z.ZodOptional<z.ZodEnum<{
            needsAction: "needsAction";
            declined: "declined";
            tentative: "tentative";
            accepted: "accepted";
        }>>;
    }, z.core.$strip>>>;
    recurrence: z.ZodOptional<z.ZodArray<z.ZodString>>;
    colorId: z.ZodOptional<z.ZodString>;
    transparency: z.ZodOptional<z.ZodEnum<{
        opaque: "opaque";
        transparent: "transparent";
    }>>;
    visibility: z.ZodOptional<z.ZodEnum<{
        default: "default";
        public: "public";
        private: "private";
        confidential: "confidential";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        tentative: "tentative";
        confirmed: "confirmed";
        cancelled: "cancelled";
    }>>;
    reminders: z.ZodOptional<z.ZodObject<{
        useDefault: z.ZodOptional<z.ZodBoolean>;
        overrides: z.ZodOptional<z.ZodArray<z.ZodObject<{
            method: z.ZodOptional<z.ZodEnum<{
                email: "email";
                popup: "popup";
            }>>;
            minutes: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    guestsCanModify: z.ZodOptional<z.ZodBoolean>;
    guestsCanInviteOthers: z.ZodOptional<z.ZodBoolean>;
    sendUpdates: z.ZodOptional<z.ZodEnum<{
        none: "none";
        all: "all";
        externalOnly: "externalOnly";
    }>>;
}, z.core.$strip>;
export declare const getEventParams: z.ZodObject<{
    eventId: z.ZodString;
}, z.core.$strip>;
export declare const getEventQuery: z.ZodObject<{
    calendarId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listEventsQuery: z.ZodObject<{
    calendarId: z.ZodOptional<z.ZodString>;
    timeMin: z.ZodOptional<z.ZodString>;
    timeMax: z.ZodOptional<z.ZodString>;
    timeZone: z.ZodOptional<z.ZodString>;
    maxResults: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    orderBy: z.ZodOptional<z.ZodEnum<{
        updated: "updated";
        startTime: "startTime";
    }>>;
    showDeleted: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    singleEvents: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export declare const updateEventParams: z.ZodObject<{
    eventId: z.ZodString;
}, z.core.$strip>;
export declare const updateEventBody: z.ZodObject<{
    calendarId: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    start: z.ZodOptional<z.ZodObject<{
        date: z.ZodOptional<z.ZodString>;
        dateTime: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    end: z.ZodOptional<z.ZodObject<{
        date: z.ZodOptional<z.ZodString>;
        dateTime: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    attendees: z.ZodOptional<z.ZodArray<z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        optional: z.ZodOptional<z.ZodBoolean>;
        responseStatus: z.ZodOptional<z.ZodEnum<{
            needsAction: "needsAction";
            declined: "declined";
            tentative: "tentative";
            accepted: "accepted";
        }>>;
    }, z.core.$strip>>>;
    status: z.ZodOptional<z.ZodEnum<{
        tentative: "tentative";
        confirmed: "confirmed";
        cancelled: "cancelled";
    }>>;
    reminders: z.ZodOptional<z.ZodObject<{
        useDefault: z.ZodOptional<z.ZodBoolean>;
        overrides: z.ZodOptional<z.ZodArray<z.ZodObject<{
            method: z.ZodOptional<z.ZodEnum<{
                email: "email";
                popup: "popup";
            }>>;
            minutes: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    sendUpdates: z.ZodOptional<z.ZodEnum<{
        none: "none";
        all: "all";
        externalOnly: "externalOnly";
    }>>;
}, z.core.$strip>;
export declare const deleteEventParams: z.ZodObject<{
    eventId: z.ZodString;
}, z.core.$strip>;
export declare const deleteEventQuery: z.ZodObject<{
    calendarId: z.ZodOptional<z.ZodString>;
    sendUpdates: z.ZodOptional<z.ZodEnum<{
        none: "none";
        all: "all";
        externalOnly: "externalOnly";
    }>>;
}, z.core.$strip>;
export declare const getAvailabilityBody: z.ZodObject<{
    timeMin: z.ZodString;
    timeMax: z.ZodString;
    timeZone: z.ZodOptional<z.ZodString>;
    calendarIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type CreateEventBody = z.infer<typeof createEventBody>;
export type ListEventsQuery = z.infer<typeof listEventsQuery>;
export type UpdateEventBody = z.infer<typeof updateEventBody>;
export type GetEventQuery = z.infer<typeof getEventQuery>;
export type DeleteEventQuery = z.infer<typeof deleteEventQuery>;
export type GetAvailabilityBody = z.infer<typeof getAvailabilityBody>;
//# sourceMappingURL=googlecalendar.modals.d.ts.map