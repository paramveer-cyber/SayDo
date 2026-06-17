import type { Request, Response, NextFunction } from "express";
import type { CreateEventBody, UpdateEventBody, GetEventQuery, DeleteEventQuery, GetAvailabilityBody } from "./googlecalendar.modals.js";
export declare class GoogleCalendarController {
    private getTenant;
    createEvent: (req: Request<{}, {}, CreateEventBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getEvent: (req: Request<{
        eventId: string;
    }, {}, {}, GetEventQuery>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listEvents: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateEvent: (req: Request<{
        eventId: string;
    }, {}, UpdateEventBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteEvent: (req: Request<{
        eventId: string;
    }, {}, {}, DeleteEventQuery>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getAvailability: (req: Request<{}, {}, GetAvailabilityBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=googlecalendar.controller.d.ts.map