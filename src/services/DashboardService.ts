import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

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
  fetchDashboardStats: (params?: {
    organization_uuid?: string;
    ticketing_type?: string;
    event_type?: string;
    currency?: string;
    event_id?: string;
    start_date?: string;
    end_date?: string;
  }) => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.dashboardStats(params)),
};
