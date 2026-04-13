export const BUCKET_URL_JOBS = "";
export const GOOGLE_API_KEY = "AIzaSyC54j-hnFZ-oSmvnO1cij96jQy-p5n-n9U";
export const STRIPE_API_KEY =
  "pk_test_51QiA7VD7PqWrjsBql9OtY9OJ0LTqRW8saYKh6HhrIF3c4SIndoDW2znul7vn93TDK9VN5ItDzmke1uvNUTE5rws300Vj06sAjR";

const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL || "https://dev-api.hexallo.com",
  AUTH: {
    twoFactorInitiate: "/login/2fa/initiate",
    twoFactorVerify: "/login/2fa/verify",
    userProfile: "/api/users/me",
    logout: "/identities/logout",
  },
  EVENTS: {
    staffEventAccess: (staffId: string) =>
      `/api/staff-event-access/staff/${staffId}/`,
    eventInfo: (eventId: string) => `/api/ticket/event/${eventId}/info/`,
  },
  DASHBOARD: {
    eventTypes: "/api/event/types/?page_size=-1",
    ticketingTypes: "/api/ticket/ticketing-types/?page_size=-1",
    organizations: (page: number = 0, pageSize: number = 20) =>
      `/api/organization/individual/?page_size=${pageSize}&page=${page}`,
    currencies: "/api/currency/?page_size=-1",
    events: (page: number = 0, pageSize: number = 20) =>
      `/api/event/?page_size=${pageSize}&page=${page}`,
    dashboardStats: (params?: {
      organization_uuid?: string;
      ticketing_type?: string;
      event_type?: string;
      currency?: string;
      event_id?: string;
      year?: number;
    }) => {
      const base = "/api/organization/dashboard/";
      const queryParams: string[] = [];
      if (params?.organization_uuid)
        queryParams.push(`organization_uuid=${params.organization_uuid}`);
      if (params?.ticketing_type)
        queryParams.push(`ticketing_type=${params.ticketing_type}`);
      if (params?.event_type)
        queryParams.push(`event_type=${params.event_type}`);
      if (params?.currency)
        queryParams.push(`currency=${params.currency}`);
      if (params?.event_id)
        queryParams.push(`event_id=${params.event_id}`);
      if (params?.year)
        queryParams.push(`year=${params.year}`);
      return queryParams.length > 0
        ? `${base}?${queryParams.join("&")}`
        : base;
    },
  },
  CHECK_IN: {
    scanTicket: (eventId: string, code: string) =>
      `/api/ticket/scan/${eventId}/${code}/`,
    updateTicketNote: (eventId: string, code: string) =>
      `/api/ticket/note/${eventId}/${code}/`,
    fetchTicketOrders: (eventId: string) =>
      `/api/user-tickets/orders/?event_id=${eventId}`,
    fetchTicketOrderDetails: (orderNumber: string, eventId: string) =>
      `/api/user-tickets/?order_number=${orderNumber}&event_id=${eventId}`,
    manualCheckin: (eventId: string, code: string) =>
      `/api/ticket/scan/${eventId}/${code}/`,
    fetchTicketPricingStats: `/api/ticket/pricing-type/`,
    fetchTicketPricing: (eventId: string) =>
      `/api/pricing/by-event/${eventId}/`,
    boxOfficeGetTicket: `/api/orders/box-office/`,
    boxOfficeCheckinAll: (eventId: string, orderNumber: string) =>
      `/api/ticket/check-in-all/${eventId}/${orderNumber}/`,
  },
};

export default API_CONFIG;
