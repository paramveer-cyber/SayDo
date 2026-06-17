import type { Request, Response, NextFunction } from "express";
import * as calendarServices from "./googlecalendar.services.js";
import { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import type {
  CreateEventBody,
  ListEventsQuery,
  UpdateEventBody,
  GetEventQuery,
  DeleteEventQuery,
  GetAvailabilityBody,
} from "./googlecalendar.modals.js";

export class GoogleCalendarController {
  private getTenant(req: Request) {
    return getTenantCorsair(req.user);
  }

  createEvent = async (
    req: Request<{}, {}, CreateEventBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const event = await calendarServices.createEvent(
        this.getTenant(req),
        req.body,
      );
      return res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  };

  getEvent = async (
    req: Request<{ eventId: string }, {}, {}, GetEventQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const event = await calendarServices.getEvent(
        this.getTenant(req),
        req.params.eventId,
        req.query,
      );
      return res.status(200).json(event);
    } catch (err) {
      next(err);
    }
  };

  listEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await calendarServices.listEvents(
        this.getTenant(req),
        req.query,
      );
      return res.status(200).json(events);
    } catch (err) {
      next(err);
    }
  };

  updateEvent = async (
    req: Request<{ eventId: string }, {}, UpdateEventBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const event = await calendarServices.updateEvent(
        this.getTenant(req),
        req.params.eventId,
        req.body,
      );
      return res.status(200).json(event);
    } catch (err) {
      next(err);
    }
  };

  deleteEvent = async (
    req: Request<{ eventId: string }, {}, {}, DeleteEventQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await calendarServices.deleteEvent(
        this.getTenant(req),
        req.params.eventId,
        req.query,
      );
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getAvailability = async (
    req: Request<{}, {}, GetAvailabilityBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const availability = await calendarServices.getAvailability(
        this.getTenant(req),
        req.body,
      );
      return res.status(200).json(availability);
    } catch (err) {
      next(err);
    }
  };
}
