import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const TICKET_SERVICES = {
  fetchStats: (eventId: string) =>
    HTTP_CLIENT.get(API_CONFIG.TICKETS.ticketStats(eventId)),

  fetchList: (eventId: string, page: number = 1, pageSize: number = 20, status: string = "PAID", checkinStatus?: string, search?: string) =>
    HTTP_CLIENT.get(API_CONFIG.TICKETS.ticketList(eventId, page, pageSize, status, checkinStatus, search)),

  fetchUserTickets: (params: {
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
  }) => HTTP_CLIENT.get(API_CONFIG.TICKETS.userTickets(params)),

  fetchTicketDetails: (ticketNumber: string) =>
    HTTP_CLIENT.get(API_CONFIG.TICKETS.ticketDetails(ticketNumber)),
};
