import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const EVENT_SERVICES = {

  fetchStaffEvents: (staffId: string) =>
    HTTP_CLIENT.get(API_CONFIG.EVENTS.staffEventAccess(staffId)),

  fetchEventInfo: (eventId: string) =>
    HTTP_CLIENT.get(API_CONFIG.EVENTS.eventInfo(eventId)),

  fetchEventStats: (params: { page: number; pageSize?: number; eventClass?: string; search?: string }) =>
    HTTP_CLIENT.get(
      API_CONFIG.EVENTS.eventStats(params.page, params.pageSize ?? 10, params.eventClass ?? '', params.search ?? '')
    ),

  fetchMyEvents: (params: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_dir?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  } = {}) =>
    HTTP_CLIENT.get(API_CONFIG.EVENTS.myEvents(params)),
};
