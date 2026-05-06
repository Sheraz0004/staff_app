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
    eventStatsOverview: (eventId: string) =>
      `/api/event/${eventId}/stats-overview/`,
    eventStats: (page: number = 1, pageSize: number = 10, eventClass: string = '', search: string = '') =>
      `/api/event/stats/?page=${page}&page_size=${pageSize}&event_class=${eventClass}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    myEvents: (params: {
      page?: number;
      page_size?: number;
      sort_by?: string;
      sort_dir?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
    } = {}) => {
      const { page = 1, page_size = 10, sort_by = 'startDate', sort_dir = 'asc', start_date, end_date, search } = params;
      let url = `/api/staff-event-access/my-events/?page=${page}&page_size=${page_size}&sort_by=${sort_by}&sort_dir=${sort_dir}`;
      if (start_date) url += `&start_date=${start_date}`;
      if (end_date) url += `&end_date=${end_date}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return url;
    },
  },
  DASHBOARD: {
    eventTypes: "/api/event/types/?page_size=-1",
    ticketingTypes: "/api/ticket/ticketing-types/?page_size=-1",
    organizations: (page?: number) =>
      page == null
        ? `/api/organization/individual/?page_size=-1`
        : `/api/organization/individual/?page_size=20&page=${page}`,
    currencies: "/api/currency/?page_size=-1",
    events: (page?: number) =>
      page == null
        ? `/api/event/?page_size=-1`
        : `/api/event/?page_size=20&page=${page}`,
    dashboardStats: (params?: {
      organization_uuid?: string;
      ticketing_type?: string;
      event_type?: string;
      currency?: string;
      event_id?: string;
      start_date?: string;
      end_date?: string;
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
      if (params?.start_date)
        queryParams.push(`start_date=${params.start_date}`);
      if (params?.end_date)
        queryParams.push(`end_date=${params.end_date}`);
      const url = queryParams.length > 0 ? `${base}?${queryParams.join("&")}` : base;
      console.log("[Dashboard URL]", url);
      return url;
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
    fetchTicketPricingStats: (eventId: string) =>
      `/api/ticket/pricing-type/${eventId}/`,
    fetchTicketPricing: (eventId: string) =>
      `/api/pricing/by-event/${eventId}/`,
    boxOfficeGetTicket: `/api/orders/box-office/`,
    boxOfficeCheckinAll: (eventId: string, orderNumber: string) =>
      `/api/ticket/check-in-all/${eventId}/${orderNumber}/`,
    orderLookup: `/api/orders/lookup/`,
    orderDetails: (orderId: number) => `/api/orders/${orderId}/order-details/`,
    ordersWithTickets: (eventId: string | number, page: number, pageSize: number) =>
      `/api/orders/event/${eventId}/with-tickets/?page=${page}&page_size=${pageSize}&status=PAID`,
  },
  ORGANIZATION_STAFF: {
    salesStats: (params?: {
      page?: number;
      page_size?: number;
      sort_by?: string;
      sort_dir?: string;
    }) => {
      const { page = 1, page_size = 10, sort_by, sort_dir = 'desc' } = params || {};
      let url = `/api/organization-staff/sales-stats?page=${page}&page_size=${page_size}&sort_dir=${sort_dir}`;
      if (sort_by) url += `&sort_by=${sort_by}`;
      return url;
    },
    staffEventStats: (staffId: string) =>
      `/api/organization-staff/${staffId}/event-stats/`,
  },
  TICKETS: {
    ticketStats: (eventId: string) => `/api/ticket/${eventId}/stats/`,
    ticketList: (eventId: string, page: number, pageSize: number, status: string = "PAID", checkinStatus?: string, search?: string) => {
      let url = `/api/user-tickets/?event_id=${eventId}&page=${page}&page_size=${pageSize}&status=${status}`;
      if (checkinStatus) url += `&checkin_status=${checkinStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return url;
    },
    userTickets: (params: {
      eventId: string;
      page?: number;
      pageSize?: number;
      status?: string;
      checkinStatus?: string;
      search?: string;
      ticketTypes?: string;
      scannedBy?: string;
      boughtBy?: string;
      staffUuid?: string;
    }) => {
      const { eventId, page = 1, pageSize = 20, status, checkinStatus, search, ticketTypes, scannedBy, boughtBy, staffUuid } = params;
      let url = `/api/user-tickets/?event_id=${eventId}&page=${page}&page_size=${pageSize}`;
      if (status) url += `&status=${status}`;
      if (checkinStatus) url += `&checkin_status=${checkinStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (ticketTypes) url += `&ticket_types=${encodeURIComponent(ticketTypes)}`;
      if (scannedBy) url += `&scanned_by=${scannedBy}`;
      if (boughtBy) url += `&bought_by=${boughtBy}`;
      if (staffUuid) url += `&staff_uuid=${staffUuid}`;
      return url;
    },
    ticketDetails: (ticketNumber: string) => `/api/ticket/${ticketNumber}/details/`,
  },
  EVENT_STATS: {
    dashboardStats: (params: {
      eventUuid: string;
      sales?: string | null;
      ticketType?: string | null;
      ticketUuid?: string | null;
      staffUuid?: string | null;
      paymentChannel?: string | null;
    }) => {
      const base = "/api/event/stats/";
      const queryParams: string[] = [`event_id=${params.eventUuid}`];
      if (params.sales) queryParams.push(`sales=${params.sales}`);
      if (params.ticketType) queryParams.push(`ticket_type=${params.ticketType}`);
      if (params.ticketUuid) queryParams.push(`ticket_uuid=${params.ticketUuid}`);
      if (params.staffUuid) queryParams.push(`staff_uuid=${params.staffUuid}`);
      if (params.paymentChannel) queryParams.push(`payment_channel=${params.paymentChannel}`);
      return `${base}?${queryParams.join("&")}`;
    },
    adminTerminals: (eventUuid: string) => `/api/event/dashboard/terminals/?event_id=${eventUuid}`,
  },
};

export default API_CONFIG;
