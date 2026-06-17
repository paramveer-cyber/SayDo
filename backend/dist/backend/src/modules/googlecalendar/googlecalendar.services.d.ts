import type { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import type { CreateEventBody, ListEventsQuery, UpdateEventBody, GetEventQuery, DeleteEventQuery, GetAvailabilityBody } from "./googlecalendar.modals.js";
type TenantCorsair = ReturnType<typeof getTenantCorsair>;
export declare const createEvent: (tenantCorsair: TenantCorsair, fields: CreateEventBody) => any;
export declare const getEvent: (tenantCorsair: TenantCorsair, eventId: string, query: GetEventQuery) => any;
export declare const listEvents: (tenantCorsair: TenantCorsair, query: ListEventsQuery) => any;
export declare const updateEvent: (tenantCorsair: TenantCorsair, eventId: string, fields: UpdateEventBody) => any;
export declare const deleteEvent: (tenantCorsair: TenantCorsair, eventId: string, query: DeleteEventQuery) => any;
export declare const getAvailability: (tenantCorsair: TenantCorsair, fields: GetAvailabilityBody) => any;
export {};
//# sourceMappingURL=googlecalendar.services.d.ts.map