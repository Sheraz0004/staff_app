import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const CHECK_IN_SERVICES = {

  scanTicket: (scannedData: string, note?: string) => {
    const parts = scannedData.includes("/api/ticket/scan/")
      ? scannedData.split("/api/ticket/scan/")[1].split("/")
      : [];
    const eventId = parts[0];
    const code = parts[1];
    return HTTP_CLIENT.post(API_CONFIG.CHECK_IN.scanTicket(eventId, code), { note: note || null });
  },

  updateTicketNote: (code: string, note: string, eventUuid: string) =>
    HTTP_CLIENT.patch(API_CONFIG.CHECK_IN.updateTicketNote(eventUuid, code), { note }),

  fetchTicketOrders: (eventUuid: string) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.fetchTicketOrders(eventUuid)),

  fetchTicketOrderDetails: (orderNumber: string, eventUuid: string) =>
    HTTP_CLIENT.get(API_CONFIG.CHECK_IN.fetchTicketOrderDetails(orderNumber, eventUuid)),

  manualCheckin: (eventUuid: string, code: string) =>
    HTTP_CLIENT.post(API_CONFIG.CHECK_IN.manualCheckin(eventUuid, code)),

  // ─── Sell (Box Office) ───────────────────────────────────────────────────────
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
        ...item,
        ...(purchaseCode && purchaseCode.trim() ? { purchaseCode: purchaseCode.trim() } : {}),
      })),
      userIdentifier,
      paymentMethod,
      transactionId,
      name,
    }),

  boxOfficeCheckinAll: (eventUuid: string, orderNumber: string) =>
    HTTP_CLIENT.patch(API_CONFIG.CHECK_IN.boxOfficeCheckinAll(eventUuid, orderNumber)),
};
