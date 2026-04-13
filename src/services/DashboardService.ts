import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const DASHBOARD_SERVICES = {
  fetchEventTypes: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.eventTypes),
  fetchTicketingTypes: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.ticketingTypes),
  fetchOrganizations: (page: number = 0, pageSize: number = 20) =>
    HTTP_CLIENT.get(API_CONFIG.DASHBOARD.organizations(page, pageSize)),
  fetchCurrencies: () => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.currencies),
  fetchEvents: (page: number = 0, pageSize: number = 20) =>
    HTTP_CLIENT.get(API_CONFIG.DASHBOARD.events(page, pageSize)),
  fetchDashboardStats: (params?: {
    organization_uuid?: string;
    ticketing_type?: string;
    event_type?: string;
    currency?: string;
    event_id?: string;
    year?: number;
  }) => HTTP_CLIENT.get(API_CONFIG.DASHBOARD.dashboardStats(params)),
};
