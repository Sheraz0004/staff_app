import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_KEY } from "../config/env";
import { logger } from "../utils/logger";
import { networkService } from "../utils/network";
import { offlineStorage } from "../utils/offlineStorage";
import { offlineQueue } from "../utils/offlineQueue";

const getStore = () => require("../redux/store").default;

export const BASE_URL: string = API_BASE_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  },
});

const endpoints = {
  scanTicket: "/api/ticket/scan/{eventId}/{code}/",
  staffEventAccess: (staffId: string) => `/api/staff-event-access/staff/${staffId}/`,
  eventInfo: (eventId: string) => `/api/ticket/event/${eventId}/info/`,
  updateNote: "/api/ticket/note/{eventId}/{code}/",
  manualDetailChekin: (eventId: string, code: string) => `/api/ticket/scan/${eventId}/${code}/`,
  ticketStats: (eventId: string) => `/api/ticket/${eventId}/stats/`,
  ticketStatslist: "/api/user-tickets/",
  dashboardStats: "/api/event/stats/",
  userProfile: "/api/users/me",
  adminDashboardTerminals: "/api/event/dashboard/terminals/",
  ticketDetails: (ticketNumber: string) => `/api/ticket/${ticketNumber}/details/`,
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token: string | null = getStore()?.getState()?.entities?.user?.userToken ?? null;

    if (!token) {
      try {
        token = await SecureStore.getItemAsync("accessToken");
      } catch (error) {
        logger.error("Error getting token from SecureStore:", error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    networkService.setOnlineStatus(true);
    return response;
  },
  async (error) => {
    if (networkService.isNetworkError(error)) {
      networkService.setOnlineStatus(false);
      logger.log("Network error detected - device appears to be offline");
    } else {
      networkService.setOnlineStatus(true);
    }

    if (error.response?.status === 401) {
      try {
        await Promise.all([
          SecureStore.deleteItemAsync("accessToken").catch(() => {}),
          SecureStore.deleteItemAsync("refreshToken").catch(() => {}),
          offlineStorage.clearAllData(),
          require("../redux/store").persistor?.purge(),
        ]);
      } catch (clearError) {
        logger.error("Error clearing session on 401:", clearError);
      }
      const { logout } = require("../redux/reducers/userReducer");
      getStore()?.dispatch(logout());
      logger.log("Token expired or invalid — session cleared");
    }

    return Promise.reject(error);
  },
);

export const ticketService = {
  scanTicket: async (scannedData: string, note: string | null = null) => {
    try {
      let eventUuidFromScan: string | null = null;
      let ticketCodeFromScan: string | null = null;

      if (scannedData.includes("/api/ticket/scan/")) {
        const parts = scannedData.split("/api/ticket/scan/")[1].split("/");
        if (parts.length >= 2) {
          eventUuidFromScan = parts[0];
          ticketCodeFromScan = parts[1];
        }
      }

      if (!eventUuidFromScan || !ticketCodeFromScan) {
        logger.error("Could not extract event UUID and ticket code from scanned data:", scannedData);
        throw new Error("Invalid QR code format");
      }

      logger.log("Scanned Data:", scannedData);
      logger.log("Extracted Event UUID:", eventUuidFromScan);
      logger.log("Extracted Ticket Code:", ticketCodeFromScan);

      const isOnline = networkService.isConnected();

      if (!isOnline) {
        logger.log("Offline mode: Queueing scan ticket action");

        await offlineQueue.addToQueue(
          "scanTicket",
          { scannedData, note },
          ticketService.scanTicket.toString(),
        );

        await offlineStorage.saveScannedTicket(ticketCodeFromScan, {
          scannedData,
          note,
          eventUuid: eventUuidFromScan,
          ticketCode: ticketCodeFromScan,
          status: "queued",
        });

        try {
          await offlineStorage.updateTicketInCache(
            eventUuidFromScan,
            ticketCodeFromScan,
            {
              checkin_status: "SCANNED",
              scan_count: 1,
              last_scanned_on: new Date().toISOString(),
              last_scanned_by_name: "Queued for sync",
              scanned_by: {
                name: "Queued for sync",
                staff_id: "N/A",
                scanned_on: new Date().toISOString(),
              },
            },
          );
          logger.log("Updated ticket in cached tickets list after offline scan");
        } catch (cacheError) {
          logger.error("Error updating ticket in cache:", cacheError);
        }

        const cachedData = await offlineStorage.getScannedTicket(ticketCodeFromScan);
        if (cachedData && cachedData.scanResponse) {
          logger.log("Returning cached scan data");
          return { data: cachedData.scanResponse, offline: true, queued: true };
        }

        return {
          data: {
            message: "Ticket scan queued for sync",
            ticket_code: ticketCodeFromScan,
            status: "SCANNED",
            scan_count: 1,
            offline: true,
            queued: true,
          },
          offline: true,
          queued: true,
        };
      }

      const token = await SecureStore.getItemAsync("accessToken");
      logger.log("Current token:", token);
      const requestData = { note: note || null };

      const requestUrl = endpoints.scanTicket
        .replace("{eventId}", eventUuidFromScan)
        .replace("{code}", ticketCodeFromScan);

      logger.log("Request Details:", {
        method: "POST",
        url: requestUrl,
        baseURL: BASE_URL,
        fullUrl: `${BASE_URL}${requestUrl}`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: token ? `Bearer ${token}` : "No token",
        },
        data: requestData,
      });

      const response = await apiClient.post(requestUrl, requestData);

      await offlineStorage.saveScannedTicket(ticketCodeFromScan, {
        scannedData,
        note,
        eventUuid: eventUuidFromScan,
        ticketCode: ticketCodeFromScan,
        scanResponse: response.data,
        synced: true,
      });

      try {
        await offlineStorage.updateTicketInCache(
          eventUuidFromScan,
          ticketCodeFromScan,
          {
            checkin_status: "SCANNED",
            scan_count: response.data?.scan_count || 1,
            last_scanned_on: response.data?.scanned_by?.scanned_on || new Date().toISOString(),
            last_scanned_by_name: response.data?.scanned_by?.name || "No Record",
            scanned_by: response.data?.scanned_by || null,
          },
        );
        logger.log("Updated ticket in cached tickets list after scan");
      } catch (cacheError) {
        logger.error("Error updating ticket in cache:", cacheError);
      }

      return response.data;
    } catch (error: any) {
      logger.error("Ticket Scan Error:", {
        status: error.response?.status,
        message: error.message,
        responseType: error.response?.headers?.["content-type"],
        isHtml: error.response?.data?.includes?.("<!DOCTYPE html>"),
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestData: error.config?.data,
      });

      if (networkService.isNetworkError(error) && !networkService.isConnected()) {
        logger.log("Network error - queueing scan for offline sync");

        try {
          const parts = scannedData.split("/api/ticket/scan/")[1].split("/");
          const eventUuidFromScan = parts[0];
          const ticketCodeFromScan = parts[1];

          await offlineQueue.addToQueue(
            "scanTicket",
            { scannedData, note },
            ticketService.scanTicket.toString(),
          );

          await offlineStorage.saveScannedTicket(ticketCodeFromScan, {
            scannedData,
            note,
            eventUuid: eventUuidFromScan,
            ticketCode: ticketCodeFromScan,
            status: "queued",
          });

          try {
            await offlineStorage.updateTicketInCache(
              eventUuidFromScan,
              ticketCodeFromScan,
              {
                checkin_status: "SCANNED",
                scan_count: 1,
                last_scanned_on: new Date().toISOString(),
                last_scanned_by_name: "Queued for sync",
                scanned_by: {
                  name: "Queued for sync",
                  staff_id: "N/A",
                  scanned_on: new Date().toISOString(),
                },
              },
            );
            logger.log("Updated ticket in cached tickets list after network error (queued)");
          } catch (cacheError) {
            logger.error("Error updating ticket in cache:", cacheError);
          }

          const cachedData = await offlineStorage.getScannedTicket(ticketCodeFromScan);
          if (cachedData && cachedData.scanResponse) {
            logger.log("Returning cached scan data");
            return { data: cachedData.scanResponse, offline: true, queued: true };
          }

          return {
            data: {
              message: "Ticket scan queued for sync",
              ticket_code: ticketCodeFromScan,
              status: "SCANNED",
              scan_count: 1,
              offline: true,
              queued: true,
            },
            offline: true,
            queued: true,
          };
        } catch (queueError) {
          logger.error("Error queueing scan:", queueError);
        }
      }

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Server error occurred. Please try again.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  updateTicketNote: async (code: string, note: string, eventUuid: string) => {
    try {
      const isOnline = networkService.isConnected();

      if (!isOnline) {
        logger.log("Offline mode: Queueing update note action");
        await offlineQueue.addToQueue(
          "updateNote",
          { code, note, eventUuid },
          ticketService.updateTicketNote.toString(),
        );
        return {
          success: true,
          offline: true,
          queued: true,
          message: "Note update queued for sync",
        };
      }

      const requestUrl = endpoints.updateNote
        .replace("{eventId}", eventUuid)
        .replace("{code}", code);
      logger.log("update note:", requestUrl);

      const response = await apiClient.patch(requestUrl, { note });
      return response.data;
    } catch (error: any) {
      logger.error("Update note error:", error);

      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, queueing update note");
        await offlineQueue.addToQueue(
          "updateNote",
          { code, note, eventUuid },
          ticketService.updateTicketNote.toString(),
        );
        return {
          success: true,
          offline: true,
          queued: true,
          message: "Note update queued for sync",
        };
      }

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to update note.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  fetchAdminTerminals: async (event_uuid: string) => {
    try {
      const response = await apiClient.get(
        `${endpoints.adminDashboardTerminals}?event_id=${event_uuid}`,
      );
      logger.log("Admin Dashboard Terminals Response:", response.data);
      return response.data;
    } catch (error: any) {
      logger.error("Admin Dashboard Terminals Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch Admin Dashboard Terminals.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  manualDetailCheckin: async (uuid: string, code: string) => {
    logger.log("Manual Checkin Params:", uuid, code);
    try {
      const isOnline = networkService.isConnected();

      if (!isOnline) {
        logger.log("Offline mode: Queueing manual checkin action");
        await offlineQueue.addToQueue(
          "manualCheckin",
          { uuid, code },
          ticketService.manualDetailCheckin.toString(),
        );
        return {
          data: {
            status: "SCANNED",
            message: "Check-in queued for sync",
            offline: true,
            queued: true,
            scan_count: 1,
          },
          offline: true,
          queued: true,
        };
      }

      const response = await apiClient.post(endpoints.manualDetailChekin(uuid, code));
      logger.log("Manual Ticket Details Response:", response.data);
      return response.data;
    } catch (error: any) {
      logger.error("Fetch Manual Ticket Details Error:", error);

      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, queueing manual checkin");
        await offlineQueue.addToQueue(
          "manualCheckin",
          { uuid, code },
          ticketService.manualDetailCheckin.toString(),
        );
        return {
          data: {
            status: "SCANNED",
            message: "Check-in queued for sync",
            offline: true,
            queued: true,
            scan_count: 1,
          },
          offline: true,
          queued: true,
        };
      }

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch manual ticket orders Detail.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  ticketStatsInfo: async (eventUuid: string) => {
    try {
      const isOnline = networkService.isConnected();

      if (!isOnline) {
        logger.log("Offline mode: Returning cached ticket stats");
        const cachedStats = await offlineStorage.getTicketStats(eventUuid);
        if (cachedStats) {
          return { data: { data: cachedStats }, offline: true };
        }
        return {
          data: { data: { total: 0, scanned: 0, unscanned: 0 } },
          offline: true,
        };
      }

      const response = await apiClient.get(endpoints.ticketStats(eventUuid));
      logger.log(" Ticket Tab Response:", response.data);

      if (response.data?.data?.data) {
        await offlineStorage.saveTicketStats(eventUuid, response.data.data);
        await offlineStorage.saveLastSync(eventUuid);
      }

      return response.data;
    } catch (error: any) {
      logger.error("Failed to fetch ticket stats:", error);

      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached stats");
        const cachedStats = await offlineStorage.getTicketStats(eventUuid);
        if (cachedStats) {
          return { data: { data: cachedStats }, offline: true };
        }
        return {
          data: { data: { total: 0, scanned: 0, unscanned: 0 } },
          offline: true,
        };
      }

      throw error;
    }
  },

  ticketStatsListing: async (
    event_uuid: string,
    page: number = 1,
    staffUuid: string | null = null,
    status: string = "PAID",
  ) => {
    try {
      const isOnline = networkService.isConnected();

      let url = `${endpoints.ticketStatslist}?event_id=${event_uuid}&page=${page}&page_size=-1`;

      if (status) {
        url += `&status=${status}`;
      }

      if (staffUuid) {
        url += `&staff_uuid=${staffUuid}`;
      }

      if (!isOnline) {
        logger.log("Offline mode: Returning cached tickets");
        const cachedTickets = await offlineStorage.getTickets(event_uuid);
        return { data: cachedTickets || [], offline: true };
      }

      const response = await apiClient.get(url);
      logger.log("Ticket Tab listing Response:", response.data);

      if (response.data?.data) {
        await offlineStorage.saveTickets(event_uuid, response.data.data);
        await offlineStorage.saveLastSync(event_uuid);
      }

      return response.data;
    } catch (error: any) {
      logger.error("Failed to fetch ticket stats:", error);

      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached tickets");
        const cachedTickets = await offlineStorage.getTickets(event_uuid);
        return { data: cachedTickets || [], offline: true };
      }

      throw error;
    }
  },

  fetchUserTickets: async (params: {
    eventId: string;
    page?: number;
    pageSize?: number;
    status?: string;
    checkinStatus?: string;
    search?: string;
    ticketTypes?: string;
    scannedBy?: string;
    boughtBy?: string;
  }) => {
    const {
      eventId,
      page = 1,
      pageSize = 20,
      status,
      checkinStatus,
      search,
      ticketTypes,
      scannedBy,
      boughtBy,
    } = params;

    let url = `${endpoints.ticketStatslist}?event_id=${eventId}&page=${page}&page_size=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (checkinStatus) url += `&checkin_status=${checkinStatus}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (ticketTypes) url += `&ticket_types=${encodeURIComponent(ticketTypes)}`;
    if (scannedBy) url += `&scanned_by=${scannedBy}`;
    if (boughtBy) url += `&bought_by=${boughtBy}`;

    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.log('[fetchUserTickets] Error:', error?.response?.data || error?.message);
      logger.error('fetchUserTickets error:', error);
      if (error.response?.data) {
        throw { message: error.response.data.message || 'Failed to fetch tickets.', response: error.response };
      }
      throw { message: 'Network error. Please check your connection.', error };
    }
  },

  fetchTicketDetails: async (ticketNumber: string) => {
    try {
      const response = await apiClient.get(endpoints.ticketDetails(ticketNumber));
      logger.log("Ticket Details Response:", response.data);
      return response.data;
    } catch (error: any) {
      logger.error("Fetch Ticket Details Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch ticket details.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  fetchDashboardStats: async (
    eventUuid: string,
    sales: string | null = null,
    ticketType: string | null = null,
    ticketUuid: string | null = null,
    staffUuid: string | null = null,
    paymentChannel: string | null = null,
  ) => {
    try {
      let url = endpoints.dashboardStats;
      const params = new URLSearchParams();

      if (sales) params.append("sales", sales);
      if (ticketType) params.append("ticket_type", ticketType);
      if (ticketUuid) params.append("ticket_uuid", ticketUuid);
      if (staffUuid) params.append("staff_uuid", staffUuid);
      if (paymentChannel) params.append("payment_channel", paymentChannel);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      logger.error("Fetch Dashboard Stats Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch dashboard stats.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },
};

export const eventService = {
  fetchStaffEvents: async (staffId: string) => {
    try {
      const response = await apiClient.get(endpoints.staffEventAccess(staffId));
      const accessList = response.data?.staffEventAccess || [];
      const eventIds = accessList.flatMap((entry: any) => entry.eventIds || []);
      if (eventIds.length === 0) {
        return { data: [] };
      }
      const events = eventIds.map((id: string) => ({ id, eventUuid: id }));
      return { data: events };
    } catch (error: any) {
      logger.error("fetchStaffEvents error:--->", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  fetchEventInfo: async (eventId: string) => {
    try {
      const response = await apiClient.get(endpoints.eventInfo(eventId));
      return response.data;
    } catch (error: any) {
      logger.error("Fetch Event Info Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });

      if (error.response?.status === 403) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.data?.detail;

        if (errorMessage && errorMessage.includes("not published")) {
          logger.error("403 Forbidden - Business logic error:", errorMessage);
          throw {
            message: errorMessage || "Event is not available.",
            status: 403,
            isBusinessError: true,
            response: error.response,
          };
        } else {
          logger.error("403 Forbidden - Possible authentication issue detected");
          await SecureStore.deleteItemAsync("accessToken");
          throw {
            message: "Authentication failed. Please login again.",
            status: 403,
            isAuthError: true,
            response: error.response,
          };
        }
      }

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch event info",
          response: error.response,
        };
      }

      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },
};

export const userService = {
  getProfile: async () => {
    try {
      const response = await apiClient.get(endpoints.userProfile);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};
