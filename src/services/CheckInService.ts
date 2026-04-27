import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const CHECK_IN_SERVICES = {

  scanTicket: (scannedData: string, note?: string) => {
    const [eventId, code] = scannedData.split(":");
    return HTTP_CLIENT.post(API_CONFIG.CHECK_IN.scanTicket(eventId, code), { note: note || null });
  },

  updateTicketNote: (code: string, note: string, eventUuid: string) =>
    HTTP_CLIENT.patch(API_CONFIG.CHECK_IN.updateTicketNote(eventUuid, code), { note }),

  fetchTicketOrders: (eventUuid: string) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.fetchTicketOrders(eventUuid)),

  fetchTicketOrderDetails: (orderNumber: string, eventUuid: string) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.fetchTicketOrderDetails(orderNumber, eventUuid)),

  manualCheckin: (eventUuid: string, code: string) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.CHECK_IN.manualCheckin(eventUuid, code)}`;
    console.log('[Single Check-In] URL:', url);
    return HTTP_CLIENT.post(API_CONFIG.CHECK_IN.manualCheckin(eventUuid, code));
  },

  fetchTicketPricingStats: (eventId: string) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.fetchTicketPricingStats(eventId)),

  fetchTicketPricing: (eventUuid: string) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.fetchTicketPricing(eventUuid)),

  boxOfficeGetTicket: (
    eventUuid: string,
    items: any[],
    userIdentifier: string,
    paymentMethod: string,
    transactionId?: string | null,
    name?: string | null,
    purchaseCode?: string | null,
  ) =>
    HTTP_CLIENT.post(API_CONFIG.CHECK_IN.boxOfficeGetTicket, {
      eventId: eventUuid,
      items: items.map((item) => ({
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        purchaseCode: purchaseCode?.trim() || null,
      })),
      userIdentifier,
      name,
      paymentMethod,
      transactionId,
    }),

  boxOfficeCheckinAll: (eventUuid: string, orderNumber: string) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.CHECK_IN.boxOfficeCheckinAll(eventUuid, orderNumber)}`;
    console.log('[Check-In All] URL:', url);
    return HTTP_CLIENT.patch(API_CONFIG.CHECK_IN.boxOfficeCheckinAll(eventUuid, orderNumber));
  },

  lookupOrders: (searchFor: string) =>
    HTTP_CLIENT.post(API_CONFIG.CHECK_IN.orderLookup, { searchFor }),

  fetchOrderDetails: (orderId: number) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.orderDetails(orderId)),

  fetchOrdersWithTickets: (eventId: string | number, page: number, pageSize: number) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.ordersWithTickets(eventId, page, pageSize)),
};
