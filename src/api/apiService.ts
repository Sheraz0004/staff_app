import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_KEY } from "../config/env";
import { logger } from "../utils/logger";
import { networkService } from "../utils/network";
import { offlineStorage } from "../utils/offlineStorage";
import { offlineQueue } from "../utils/offlineQueue";

const getStore = () => require("../redux/store").default;

// Base URL configuration (kept exported for backwards compatibility)
export const BASE_URL: string = API_BASE_URL;

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  },
});

// API endpoints
const endpoints = {
  otpRequest: "/otp/request",
  verifyOtp: "/otp/verify",
  twoFactorInitiate: "/login/2fa/initiate",
  twoFactorVerify: "/login/2fa/verify",
  login: "/login",
  organizerSignup: "/identities/organizer/signup",
  refreshToken: "/login/refresh",
  scanTicket: "/api/ticket/scan/{eventId}/{code}/",
  staffEventAccess: (staffId: string) => `/api/staff-event-access/staff/${staffId}/`,
  eventInfo: (eventId: string) => `/api/ticket/event/${eventId}/info/`,
  updateNote: "/api/ticket/note/{eventId}/{code}/",
  userTicketOrdersManual: "/api/user-tickets/orders/",
  userTicketOrdersManualDetail: (orderNumber: string, eventId: string) =>
    `/api/user-tickets/?order_number=${orderNumber}&event_id=${eventId}`,
  manualDetailChekin: (eventId: string, code: string) => `/api/ticket/scan/${eventId}/${code}/`,
  ticketStats: (eventId: string) => `/api/ticket/${eventId}/stats/`,
  ticketStatslist: "/api/user-tickets/",
  ticketPricingStats: (eventId: string) => `/api/ticket/pricing-type/${eventId}/`,
  ticketPricing: (eventId: string) => `/api/pricing/by-event/${eventId}/`,
  boxOfficeGetTicket: "/api/orders/box-office/",
  boxOfficeCheckInAllTicket: (eventId: string, orderNumber: string) =>
    `/api/ticket/check-in-all/${eventId}/${orderNumber}/`,
  dashboardStats: "/api/event/stats/",
  userProfile: "/api/users/me",
  logout: "/identities/logout",
  updateProfile: "/api/users/profile",
  adminDashboardTerminals: "/api/event/dashboard/terminals/",
  ticketDetails: (ticketNumber: string) => `/api/ticket/${ticketNumber}/details/`,
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const publicEndpoints = [
      endpoints.otpRequest,
      endpoints.verifyOtp,
      endpoints.twoFactorInitiate,
      endpoints.twoFactorVerify,
      endpoints.refreshToken,
      endpoints.login,
      endpoints.organizerSignup,
    ];

    if (!publicEndpoints.some((endpoint) => config.url?.includes(endpoint as string))) {
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
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for handling auth errors and network status
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
        await SecureStore.deleteItemAsync("accessToken");
      } catch (clearError) {
        logger.error("Error clearing token from SecureStore:", clearError);
      }
      const { logout } = require("../redux/reducers/userReducer");
      getStore()?.dispatch(logout());
      logger.log("Token expired or invalid — auth cleared");
    }

    return Promise.reject(error);
  },
);

// API services
export const authService = {
  requestOtp: async ({ identityKey, channel }: { identityKey: string; channel: string }) => {
    try {
      const response = await apiClient.post(endpoints.otpRequest, {
        identityKey,
        channel,
      });
      logger.log("OTP Request Response:", response.data);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      return { success: true, data: { traceId: response.data.traceId } };
    } catch (error: any) {
      logger.error("OTP Request Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Server error",
          response: error.response,
        };
      }

      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  verifyOtp: async ({ traceId, otp, role }: { traceId: string; otp: string; role?: string }) => {
    try {
      logger.log("verifyOtp payload:", { traceId, otp, role });
      const response = await apiClient.post(endpoints.verifyOtp, {
        traceId,
        otp,
        role,
      });
      logger.log("verifyOtp response:", JSON.stringify(response.data, null, 2));

      const { authToken, refreshToken } = response.data;

      if (authToken) {
        await SecureStore.setItemAsync("accessToken", authToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }
      }

      return { data: { access_token: authToken }, refreshToken };
    } catch (error: any) {
      logger.error("OTP Verification Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });

      if (error.response?.data) {
        const data = error.response.data;
        const message = data.reason || data.message || data.error || "Server error";
        throw {
          message,
          response: error.response,
          status: error.response?.status,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  login: async ({ key, secret }: { key: string; secret: string }) => {
    try {
      const response = await apiClient.post(endpoints.login, { key, secret });
      logger.log("Password Login Response:", response.data);

      const { authToken, refreshToken } = response.data;

      if (authToken) {
        await SecureStore.setItemAsync("accessToken", authToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }
      }

      return { data: { access_token: authToken }, refreshToken };
    } catch (error: any) {
      logger.error("Password Login Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        const data = error.response.data;
        throw {
          message: data.reason || data.message || data.error || "Invalid credentials",
          response: error.response,
          status: error.response?.status,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  organizerSignup: async ({ email, password }: { email: string; password: string }) => {
    try {
      const response = await apiClient.post(endpoints.organizerSignup, {
        email,
        password,
      });
      logger.log("Organizer Signup Response:", response.data);

      const { authToken, refreshToken } = response.data;

      if (authToken) {
        await SecureStore.setItemAsync("accessToken", authToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }
      }

      return { data: { access_token: authToken }, refreshToken };
    } catch (error: any) {
      logger.error("Organizer Signup Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        const data = error.response.data;
        throw {
          message: data.reason || data.message || data.error || "Signup failed",
          response: error.response,
          status: error.response?.status,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  twoFactorInitiate: async ({ key, secret, role }: { key: string; secret: string; role?: string }) => {
    try {
      const body: Record<string, string> = { key, secret };
      if (role) body.role = role;
      const response = await apiClient.post(endpoints.twoFactorInitiate, body);
      logger.log("2FA Initiate Response:", response.data);

      const { traceId, maskedContact } = response.data;
      return { traceId, maskedContact };
    } catch (error: any) {
      logger.error("2FA Initiate Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        const data = error.response.data;
        const code = data.code || data.error;
        if (code === "ACCOUNT_BLOCKED") {
          throw {
            message: "Account blocked due to too many failed attempts.",
            code,
            response: error.response,
          };
        }
        throw {
          message: data.reason || data.message || data.error || "Invalid credentials",
          code,
          response: error.response,
          status: error.response?.status,
        };
      }
      throw { message: "Network error. Please check your connection.", error };
    }
  },

  twoFactorVerify: async ({ traceId, otp }: { traceId: string; otp: string }) => {
    try {
      const response = await apiClient.post(endpoints.twoFactorVerify, {
        traceId,
        otp,
      });
      logger.log("2FA Verify Response:", JSON.stringify(response.data, null, 2));

      const { authToken, refreshToken } = response.data;

      if (authToken) {
        await SecureStore.setItemAsync("accessToken", authToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }
      }

      return { data: { access_token: authToken }, refreshToken };
    } catch (error: any) {
      logger.error("2FA Verify Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        const data = error.response.data;
        const message = data.reason || data.message || data.error || "Invalid or expired OTP";
        throw {
          message,
          response: error.response,
          status: error.response?.status,
        };
      }
      throw { message: "Network error. Please check your connection.", error };
    }
  },

  refreshToken: async () => {
    try {
      const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!storedRefreshToken) throw new Error("No refresh token available");

      const response = await apiClient.post(endpoints.refreshToken, {
        refreshToken: storedRefreshToken,
      });
      const { authToken, refreshToken } = response.data;

      if (authToken) {
        await SecureStore.setItemAsync("accessToken", authToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }
      }

      return response.data;
    } catch (error) {
      logger.error("Token refresh error:", error);
      throw error;
    }
  },
};

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

  fetchUserTicketOrders: async (event_uuid: string) => {
    try {
      const isOnline = networkService.isConnected();

      if (!isOnline) {
        logger.log("Offline mode: Returning cached manual orders");
        const cachedOrders = await offlineStorage.getManualOrders(event_uuid);
        return { data: cachedOrders || [], offline: true };
      }

      const response = await apiClient.get(
        `${endpoints.userTicketOrdersManual}?event_id=${event_uuid}`,
      );
      logger.log("User Ticket Orders Response:", response.data);

      if (response.data?.data) {
        await offlineStorage.saveManualOrders(event_uuid, response.data.data);
        await offlineStorage.saveLastSync(event_uuid);
      }

      return response.data;
    } catch (error: any) {
      logger.error("Fetch User Ticket Orders Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached orders");
        const cachedOrders = await offlineStorage.getManualOrders(event_uuid);
        return { data: cachedOrders || [], offline: true };
      }

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch ticket orders.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  fetchUserTicketOrdersDetail: async (orderNumber: string, eventUuid: string) => {
    try {
      const isOnline = networkService.isConnected();

      if (!isOnline) {
        logger.log("Offline mode: Returning cached order details");
        const cachedDetails = await offlineStorage.getOrderDetails(orderNumber, eventUuid);
        if (cachedDetails) {
          return { data: cachedDetails, offline: true };
        }
        return { data: [], offline: true };
      }

      const response = await apiClient.get(
        endpoints.userTicketOrdersManualDetail(orderNumber, eventUuid),
      );
      logger.log("Ticket Details Response:", response.data);

      if (response.data?.data) {
        await offlineStorage.saveOrderDetails(orderNumber, eventUuid, response.data.data);
        await offlineStorage.saveLastSync(eventUuid);
      }

      return response.data;
    } catch (error: any) {
      logger.error("Fetch Ticket Details Error:", error);

      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached order details");
        const cachedDetails = await offlineStorage.getOrderDetails(orderNumber, eventUuid);
        if (cachedDetails) {
          return { data: cachedDetails, offline: true };
        }
        return { data: [], offline: true };
      }

      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch ticket orders Detail.",
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

  boxOfficeDetailCheckinAll: async (eventUuid: string, orderNumber: string) => {
    logger.log("box office checkin all Params:", eventUuid, orderNumber);
    try {
      const response = await apiClient.patch(
        endpoints.boxOfficeCheckInAllTicket(eventUuid, orderNumber),
      );
      logger.log("box office checkin all Response:", response.data);
      return response.data;
    } catch (error: any) {
      logger.error("box office checkin all Details Error:", error);
      if (error.response?.data) {
        throw {
          message: error.response.data.message || "box office checkin all error",
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

  fetchTicketPricingStats: async (eventId: string) => {
    try {
      const response = await apiClient.get(endpoints.ticketPricingStats(eventId));
      logger.log("Ticket Pricing Stats API Response:", response.data);
      return response.data;
    } catch (error: any) {
      logger.error("Fetch Ticket Pricing Stats Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch ticket pricing stats.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  fetchTicketPricing: async (eventUuid: string) => {
    try {
      if (!eventUuid) {
        throw new Error("event_uuid is required");
      }

      logger.log("Fetching ticket pricing for event:", eventUuid);
      const response = await apiClient.get(endpoints.ticketPricing(eventUuid));

      logger.log("Ticket Pricing API Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        config: {
          url: response.config.url,
          method: response.config.method,
          headers: response.config.headers,
        },
      });

      const pricingData = response.data?.data?.data;

      logger.log("Ticket Pricing Data Structure:", {
        hasData: !!pricingData,
        eventTitle: pricingData?.event_title,
        pricingTypeOptions: pricingData?.pricing_type_options,
        saleStartDate: pricingData?.sale_start_date_time,
        saleEndDate: pricingData?.sale_end_date_time,
      });

      return pricingData;
    } catch (error: any) {
      logger.error("Fetch Ticket Pricing Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
      if (error.response?.data) {
        throw {
          message: error.response.data.message || "Failed to fetch ticket pricing.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
    }
  },

  fetchBoxOfficeGetTicket: async (
    eventUuid: string,
    items: Array<Record<string, any>>,
    userIdentifier: string,
    paymentMethod: string,
    transactionId: string | null = null,
    name: string | null = null,
    purchaseCode: string | null = null,
  ) => {
    try {
      const itemsWithPurchaseCode = items.map((item) => ({
        ...item,
        ...(purchaseCode && purchaseCode.trim() && { purchaseCode: purchaseCode.trim() }),
      }));

      const requestBody = {
        eventId: eventUuid,
        items: itemsWithPurchaseCode,
        userIdentifier,
        paymentMethod,
        transactionId,
        name,
      };

      logger.log("BoxOffice get ticket request body:", requestBody);
      logger.log("Purchase code being sent:", purchaseCode);
      logger.log("Items with purchase code:", itemsWithPurchaseCode);
      const response = await apiClient.post(endpoints.boxOfficeGetTicket, requestBody);
      logger.log("BoxOffice get ticket API Response:", response.data);
      return response.data;
    } catch (error: any) {
      logger.error("BoxOffice get ticket Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
      if (error.response?.data) {
        logger.log("BoxOffice Response:", error.response?.data);

        if (
          error.response.status === 400 &&
          error.response.data?.data?.purchaseCode
        ) {
          const purchaseCodeErrors = error.response.data.data.purchaseCode;
          if (Array.isArray(purchaseCodeErrors) && purchaseCodeErrors.length > 0) {
            logger.error("Purchase code validation failed:", {
              purchaseCode,
              errors: purchaseCodeErrors,
              fullResponse: error.response.data,
            });
            throw {
              message: `Purchase code error: ${purchaseCodeErrors[0]}`,
              response: error.response,
              isPurchaseCodeError: true,
            };
          }
        }

        throw {
          message: error.response.data.message || "Failed to fetch get box office ticket",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error,
      };
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

      // logger.log('================================================', url);
      // console.log('📊 Dashboard Stats URL:', `${BASE_URL}${url}`);

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
      // logger.log("Fetch Event Info Response:", response.data);
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

  updateProfile: async (formData: FormData) => {
    try {
      const response = await apiClient.patch(endpoints.updateProfile, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      logger.log("image profile:", response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  Userlogout: async () => {
    try {
      const response = await apiClient.delete(endpoints.logout);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};
