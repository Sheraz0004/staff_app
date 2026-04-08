import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

export const EVENT_SERVICES = {

  fetchStaffEvents: (staffId: string) =>
    HTTP_CLIENT.get(API_CONFIG.EVENTS.staffEventAccess(staffId)),


  fetchEventInfo: (eventId: string) =>
    HTTP_CLIENT.get(API_CONFIG.EVENTS.eventInfo(eventId)),
};
