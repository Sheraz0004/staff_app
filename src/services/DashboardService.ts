import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const DASHBOARD_SERVICES = {
  fetchEventTypes: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.eventTypes),
  fetchTicketingTypes: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.ticketingTypes),
  fetchOrganizations: (page?: number) =>
    HTTP_CLIENT.get(API_CONFIG.DASHBOARD.organizations(page)),
  fetchCurrencies: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.currencies),
  fetchEvents: (page?: number) =>
    HTTP_CLIENT.get(API_CONFIG.DASHBOARD.events(page)),
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
