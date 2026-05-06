import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

type EventStatsParams = {
  eventUuid: string;
  sales?: string | null;
  ticketType?: string | null;
  ticketUuid?: string | null;
  staffUuid?: string | null;
  paymentChannel?: string | null;
};

export const DASHBOARD_SERVICES = {
  fetchEventStatsOverview: (eventId: string) =>
    HTTP_CLIENT.get(API_CONFIG.EVENTS.eventStatsOverview(eventId)),
  fetchEventTypes: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.eventTypes),
  fetchTicketingTypes: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.ticketingTypes),
  fetchOrganizations: (page?: number) =>
    HTTP_CLIENT.get(API_CONFIG.DASHBOARD.organizations(page)),
  fetchCurrencies: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.currencies),
  fetchEvents: (page?: number) =>
    HTTP_CLIENT.get(API_CONFIG.DASHBOARD.events(page)),
  fetchOrganizationStaffSalesStats: (params?: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_dir?: string;
  }) => HTTP_CLIENT.get(API_CONFIG.ORGANIZATION_STAFF.salesStats(params)),
  fetchStaffEventStats: (staffId: string) =>
    HTTP_CLIENT.get(API_CONFIG.ORGANIZATION_STAFF.staffEventStats(staffId)),
  fetchStaffStatsOverview: (params: { eventId: string; staffUuid: string }) =>
    HTTP_CLIENT.get(`/api/event/${params.eventId}/stats-overview/?staff_uuid=${params.staffUuid}`),
  fetchDashboardStats: (params?: {
    organization_uuid?: string;
    ticketing_type?: string;
    event_type?: string;
    currency?: string;
    event_id?: string;
    start_date?: string;
    end_date?: string;
  }) => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.dashboardStats(params)),

  fetchEventStats: (params: EventStatsParams) =>
    HTTP_CLIENT.get(API_CONFIG.EVENT_STATS.dashboardStats(params)),

  fetchAdminTerminals: (eventUuid: string) =>
    HTTP_CLIENT.get(API_CONFIG.EVENT_STATS.adminTerminals(eventUuid)),
};
