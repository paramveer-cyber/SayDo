export const createEvent = (tenantCorsair, fields) => tenantCorsair.googlecalendar.api.events.create({
    calendarId: fields.calendarId,
    event: {
        summary: fields.summary,
        description: fields.description,
        location: fields.location,
        start: fields.start,
        end: fields.end,
        attendees: fields.attendees,
        recurrence: fields.recurrence,
        colorId: fields.colorId,
        transparency: fields.transparency,
        visibility: fields.visibility,
        status: fields.status,
        reminders: fields.reminders,
        guestsCanModify: fields.guestsCanModify,
        guestsCanInviteOthers: fields.guestsCanInviteOthers,
    },
    sendUpdates: fields.sendUpdates,
});
export const getEvent = (tenantCorsair, eventId, query) => tenantCorsair.googlecalendar.api.events.get({
    id: eventId,
    calendarId: query.calendarId,
});
export const listEvents = (tenantCorsair, query) => tenantCorsair.googlecalendar.api.events.getMany({
    calendarId: query.calendarId,
    timeMin: query.timeMin,
    timeMax: query.timeMax,
    timeZone: query.timeZone,
    maxResults: query.maxResults,
    pageToken: query.pageToken,
    q: query.q,
    orderBy: query.orderBy,
    showDeleted: query.showDeleted,
    singleEvents: query.singleEvents,
});
export const updateEvent = (tenantCorsair, eventId, fields) => tenantCorsair.googlecalendar.api.events.update({
    id: eventId,
    calendarId: fields.calendarId,
    event: {
        summary: fields.summary,
        description: fields.description,
        location: fields.location,
        start: fields.start,
        end: fields.end,
        attendees: fields.attendees,
        status: fields.status,
        reminders: fields.reminders,
    },
    sendUpdates: fields.sendUpdates,
});
export const deleteEvent = (tenantCorsair, eventId, query) => tenantCorsair.googlecalendar.api.events.delete({
    id: eventId,
    calendarId: query.calendarId,
    sendUpdates: query.sendUpdates,
});
export const getAvailability = (tenantCorsair, fields) => tenantCorsair.googlecalendar.api.calendar.getAvailability({
    timeMin: fields.timeMin,
    timeMax: fields.timeMax,
    timeZone: fields.timeZone,
    items: fields.calendarIds.map((id) => ({ id })),
});
//# sourceMappingURL=googlecalendar.services.js.map