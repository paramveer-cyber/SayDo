import * as calendarServices from "./googlecalendar.services.js";
import { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
export class GoogleCalendarController {
    getTenant(req) {
        return getTenantCorsair(req.user);
    }
    createEvent = async (req, res, next) => {
        try {
            const event = await calendarServices.createEvent(this.getTenant(req), req.body);
            return res.status(201).json(event);
        }
        catch (err) {
            next(err);
        }
    };
    getEvent = async (req, res, next) => {
        try {
            const event = await calendarServices.getEvent(this.getTenant(req), req.params.eventId, req.query);
            return res.status(200).json(event);
        }
        catch (err) {
            next(err);
        }
    };
    listEvents = async (req, res, next) => {
        try {
            const events = await calendarServices.listEvents(this.getTenant(req), req.query);
            return res.status(200).json(events);
        }
        catch (err) {
            next(err);
        }
    };
    updateEvent = async (req, res, next) => {
        try {
            const event = await calendarServices.updateEvent(this.getTenant(req), req.params.eventId, req.body);
            return res.status(200).json(event);
        }
        catch (err) {
            next(err);
        }
    };
    deleteEvent = async (req, res, next) => {
        try {
            await calendarServices.deleteEvent(this.getTenant(req), req.params.eventId, req.query);
            return res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    getAvailability = async (req, res, next) => {
        try {
            const availability = await calendarServices.getAvailability(this.getTenant(req), req.body);
            return res.status(200).json(availability);
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=googlecalendar.controller.js.map