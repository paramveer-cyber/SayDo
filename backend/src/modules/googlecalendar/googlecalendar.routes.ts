import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { GoogleCalendarController } from "./googlecalendar.controller.js";
import {
  createEventBody,
  updateEventBody,
  getAvailabilityBody,
} from "./googlecalendar.modals.js";

const calendarController = new GoogleCalendarController();
const googleCalendarRouter = Router();

googleCalendarRouter.use(authMiddleware);

googleCalendarRouter.get("/events", calendarController.listEvents);
googleCalendarRouter.get("/events/:eventId", calendarController.getEvent);
googleCalendarRouter.post("/events", validate(createEventBody), calendarController.createEvent);
googleCalendarRouter.patch("/events/:eventId", validate(updateEventBody), calendarController.updateEvent);
googleCalendarRouter.delete("/events/:eventId", calendarController.deleteEvent);
googleCalendarRouter.post("/availability", validate(getAvailabilityBody), calendarController.getAvailability);

export { googleCalendarRouter };
