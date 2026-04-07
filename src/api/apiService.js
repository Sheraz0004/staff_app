import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_KEY } from "../config/env";
import { logger } from "../utils/logger";
import { networkService } from "../utils/network";
import { offlineStorage } from "../utils/offlineStorage";
import { offlineQueue } from "../utils/offlineQueue";
const getStore = () => require("../redux/store").default;

// Base URL configuration (kept exported for backwards compatibility)
export const BASE_URL = API_BASE_URL;
// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  },
});

// Request interceptor — attaches Bearer token to every non-public request
apiClient.interceptors.request.use(
  async (config) => {
    const publicEndpoints = [
      endpoints.otpRequest,
      endpoints.verifyOtp,
      endpoints.twoFactorInitiate,
      endpoints.twoFactorVerify,
      endpoints.refreshToken,
      endpoints.login,
      endpoints.organizerSignup,
    ];

    if (!publicEndpoints.some((endpoint) => config.url?.includes(endpoint))) {
      // Primary: read from Redux store (in-memory, synchronous)
      let token = getStore()?.getState()?.entities?.user?.userToken;

      // Fallback: SecureStore for the brief window before initializeAuth runs
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
    // Mark as online when we get a successful response
    networkService.setOnlineStatus(true);
    return response;
  },
  async (error) => {
    // Check if it's a network error (offline)
    if (networkService.isNetworkError(error)) {
      networkService.setOnlineStatus(false);
      logger.log("Network error detected - device appears to be offline");
    } else {
      networkService.setOnlineStatus(true);
    }

    // 401 — token expired or invalid: clear everywhere
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync("accessToken");
      } catch (clearError) {
        logger.error("Error clearing token from SecureStore:", clearError);
      }
      // Clear Redux auth state so the navigator sends user back to Login
      const { logout } = require("../redux/reducers/userReducer");
      getStore()?.dispatch(logout());
      logger.log("Token expired or invalid — auth cleared");
    }

    return Promise.reject(error);
  },
);

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
  staffEventAccess: (staffId) => `/api/staff-event-access/staff/${staffId}/`,
  eventInfo: (eventId) => `/api/ticket/event/${eventId}/info/`,
  updateNote: "/api/ticket/note/{eventId}/{code}/",
  userTicketOrdersManual: "/api/user-tickets/orders/",
  userTicketOrdersManualDetail: (orderNumber, eventId) =>
    `/api/user-tickets/?order_number=${orderNumber}&event_id=${eventId}`,
  manualDetailChekin: (eventId, code) => `/api/ticket/scan/${eventId}/${code}/`,
  ticketStats: (eventId) => `/api/ticket/${eventId}/stats/`,
  ticketStatslist: "/api/user-tickets/",
  ticketPricingStats: (eventId) => `/api/ticket/pricing-type/${eventId}/`,
  ticketPricing: (eventId) => `/api/pricing/by-event/${eventId}/`,
  boxOfficeGetTicket: "/api/orders/box-office/",
  boxOfficeCheckInAllTicket: (eventId, orderNumber) =>
    `/api/ticket/check-in-all/${eventId}/${orderNumber}/`,
  dashboardStats: "/api/event/stats/",
  userProfile: "/api/users/me",
  logout: "/identities/logout",
  updateProfile: "/api/users/profile",
  adminDashboardTerminals: "/api/event/dashboard/terminals/",
};

// API services
export const authService = {
  // POST /otp/request — { identityKey, channel }  → { traceId }
  requestOtp: async ({ identityKey, channel }) => {
    try {
      const response = await apiClient.post(endpoints.otpRequest, {
        identityKey,
        channel,
      });
      logger.log("OTP Request Response:", response.data);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Swagger returns { traceId: "..." }
      return { success: true, data: { traceId: response.data.traceId } };
    } catch (error) {
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
        error: error,
      };
    }
  },

  // POST /otp/verify — { traceId, otp }  → { authToken, refreshToken }
  verifyOtp: async ({ traceId, otp, role }) => {
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

      // Return shape that OtpLoginScreen expects: { data: { access_token } }
      return { data: { access_token: authToken }, refreshToken };
    } catch (error) {
      logger.error("❌ OTP Verification Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });

      if (error.response?.data) {
        const data = error.response.data;
        // Prefer `reason` (e.g. "OTP expired") over the generic `message`
        const message =
          data.reason || data.message || data.error || "Server error";
        throw {
          message,
          response: error.response,
          status: error.response?.status,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  // POST /login — { key, secret }  → { authToken, refreshToken }
  login: async ({ key, secret }) => {
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
    } catch (error) {
      logger.error("Password Login Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        const data = error.response.data;
        throw {
          message:
            data.reason || data.message || data.error || "Invalid credentials",
          response: error.response,
          status: error.response?.status,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  // POST /identities/organizer/signup — { email, password }  → { authToken, refreshToken }
  organizerSignup: async ({ email, password }) => {
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
    } catch (error) {
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
        error: error,
      };
    }
  },

  // POST /login/2fa/initiate — { key, secret, role? }  → { traceId, maskedContact }
  twoFactorInitiate: async ({ key, secret, role }) => {
    try {
      const body = { key, secret };
      if (role) body.role = role;
      const response = await apiClient.post(endpoints.twoFactorInitiate, body);
      logger.log("2FA Initiate Response:", response.data);

      const { traceId, maskedContact } = response.data;
      return { traceId, maskedContact };
    } catch (error) {
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
          message:
            data.reason || data.message || data.error || "Invalid credentials",
          code,
          response: error.response,
          status: error.response?.status,
        };
      }
      throw { message: "Network error. Please check your connection.", error };
    }
  },

  // POST /login/2fa/verify — { traceId, otp }  → { authToken, refreshToken }
  twoFactorVerify: async ({ traceId, otp }) => {
    try {
      const response = await apiClient.post(endpoints.twoFactorVerify, {
        traceId,
        otp,
      });
      logger.log(
        "2FA Verify Response:",
        JSON.stringify(response.data, null, 2),
      );

      const { authToken, refreshToken } = response.data;

      if (authToken) {
        await SecureStore.setItemAsync("accessToken", authToken);
        if (refreshToken) {
          await SecureStore.setItemAsync("refreshToken", refreshToken);
        }
      }

      // Return shape consistent with existing OtpLoginScreen expectations
      return { data: { access_token: authToken }, refreshToken };
    } catch (error) {
      logger.error("2FA Verify Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.data) {
        const data = error.response.data;
        const message =
          data.reason || data.message || data.error || "Invalid or expired OTP";
        throw {
          message,
          response: error.response,
          status: error.response?.status,
        };
      }
      throw { message: "Network error. Please check your connection.", error };
    }
  },

  // POST /login/refresh — { refreshToken }  → { authToken, refreshToken }
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

// Add ticket service
export const ticketService = {
  // Scan ticket service
  scanTicket: async (scannedData, note = null) => {
    try {
      let eventUuidFromScan = null;
      let ticketCodeFromScan = null;

      // Assuming the scanned data is a full URL like:
      // https://dev-api.hexallo.com/ticket/scan/b25e2a8b-ebc4-4872-b7a3-347bef5466a5/R04LERYMWD79R2PI/
      if (scannedData.includes("/api/ticket/scan/")) {
        const parts = scannedData.split("/api/ticket/scan/")[1].split("/");
        if (parts.length >= 2) {
          eventUuidFromScan = parts[0];
          ticketCodeFromScan = parts[1];
        }
      }

      if (!eventUuidFromScan || !ticketCodeFromScan) {
        logger.error(
          "Could not extract event UUID and ticket code from scanned data:",
          scannedData,
        );
        throw new Error("Invalid QR code format");
      }

      logger.log("Scanned Data:", scannedData);
      logger.log("Extracted Event UUID:", eventUuidFromScan);
      logger.log("Extracted Ticket Code:", ticketCodeFromScan);

      // Check if offline
      const isOnline = networkService.isConnected();

      // If offline, queue the action and return cached data if available
      if (!isOnline) {
        logger.log("Offline mode: Queueing scan ticket action");

        // Queue the action for later sync
        await offlineQueue.addToQueue(
          "scanTicket",
          { scannedData, note },
          ticketService.scanTicket.toString(),
        );

        // Save to offline storage
        await offlineStorage.saveScannedTicket(ticketCodeFromScan, {
          scannedData,
          note,
          eventUuid: eventUuidFromScan,
          ticketCode: ticketCodeFromScan,
          status: "queued",
        });

        // IMPORTANT: Update the cached tickets list to reflect the scan (offline)
        try {
          await offlineStorage.updateTicketInCache(
            eventUuidFromScan,
            ticketCodeFromScan,
            {
              checkin_status: "SCANNED",
              scan_count: 1, // Will be updated after sync
              last_scanned_on: new Date().toISOString(),
              last_scanned_by_name: "Queued for sync",
              scanned_by: {
                name: "Queued for sync",
                staff_id: "N/A",
                scanned_on: new Date().toISOString(),
              },
            },
          );
          logger.log(
            "Updated ticket in cached tickets list after offline scan",
          );
        } catch (cacheError) {
          logger.error("Error updating ticket in cache:", cacheError);
        }

        // Try to get cached scan data
        const cachedData =
          await offlineStorage.getScannedTicket(ticketCodeFromScan);
        if (cachedData && cachedData.scanResponse) {
          logger.log("Returning cached scan data");
          return {
            data: cachedData.scanResponse,
            offline: true,
            queued: true,
          };
        }

        // Return a pending response
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
      const requestData = {
        note: note || null,
      };

      // Construct URL using the extracted values
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
        data: requestData, // eventUuid is NOT here
      });

      const response = await apiClient.post(requestUrl, requestData);

      // Save successful scan to offline storage
      await offlineStorage.saveScannedTicket(ticketCodeFromScan, {
        scannedData,
        note,
        eventUuid: eventUuidFromScan,
        ticketCode: ticketCodeFromScan,
        scanResponse: response.data,
        synced: true,
      });

      // IMPORTANT: Update the cached tickets list to reflect the scan
      try {
        await offlineStorage.updateTicketInCache(
          eventUuidFromScan,
          ticketCodeFromScan,
          {
            checkin_status: "SCANNED",
            scan_count: response.data?.scan_count || 1,
            last_scanned_on:
              response.data?.scanned_by?.scanned_on || new Date().toISOString(),
            last_scanned_by_name:
              response.data?.scanned_by?.name || "No Record",
            scanned_by: response.data?.scanned_by || null,
          },
        );
        logger.log("Updated ticket in cached tickets list after scan");
      } catch (cacheError) {
        logger.error("Error updating ticket in cache:", cacheError);
      }

      return response.data;

      // ... rest of your response handling ...
    } catch (error) {
      logger.error("Ticket Scan Error:", {
        status: error.response?.status,
        message: error.message,
        responseType: error.response?.headers?.["content-type"],
        isHtml: error.response?.data?.includes?.("<!DOCTYPE html>"),
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestData: error.config?.data,
      });

      // If network error and we're offline, queue it
      if (
        networkService.isNetworkError(error) &&
        !networkService.isConnected()
      ) {
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

          // IMPORTANT: Update the cached tickets list to reflect the scan (offline)
          try {
            await offlineStorage.updateTicketInCache(
              eventUuidFromScan,
              ticketCodeFromScan,
              {
                checkin_status: "SCANNED",
                scan_count: 1, // Will be updated after sync
                last_scanned_on: new Date().toISOString(),
                last_scanned_by_name: "Queued for sync",
                scanned_by: {
                  name: "Queued for sync",
                  staff_id: "N/A",
                  scanned_on: new Date().toISOString(),
                },
              },
            );
            logger.log(
              "Updated ticket in cached tickets list after network error (queued)",
            );
          } catch (cacheError) {
            logger.error("Error updating ticket in cache:", cacheError);
          }

          // Try to get cached scan data
          const cachedData =
            await offlineStorage.getScannedTicket(ticketCodeFromScan);
          if (cachedData && cachedData.scanResponse) {
            logger.log("Returning cached scan data");
            return {
              data: cachedData.scanResponse,
              offline: true,
              queued: true,
            };
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
          message:
            error.response.data.message ||
            "Server error occurred. Please try again.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },
  // Update ticket note service
  updateTicketNote: async (code, note, eventUuid) => {
    try {
      const isOnline = networkService.isConnected();

      // If offline, queue the action
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
    } catch (error) {
      logger.error("Update note error:", error);

      // If network error, queue the action
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
        error: error,
      };
    }
  },

  fetchAdminTerminals: async (event_uuid) => {
    try {
      const response = await apiClient.get(
        `${endpoints.adminDashboardTerminals}?event_id=${event_uuid}`,
      ); // Include event_uuid as a query parameter
      logger.log("Admin Dashboard Terminals Response:", response.data);
      return response.data;
    } catch (error) {
      logger.error("Admin Dashboard Terminals Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.data) {
        throw {
          message:
            error.response.data.message ||
            "Failed to fetch Admin Dashboard Terminals.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  fetchUserTicketOrders: async (event_uuid) => {
    try {
      const isOnline = networkService.isConnected();

      // If offline, return cached data
      if (!isOnline) {
        logger.log("Offline mode: Returning cached manual orders");
        const cachedOrders = await offlineStorage.getManualOrders(event_uuid);
        return {
          data: cachedOrders || [],
          offline: true,
        };
      }

      const response = await apiClient.get(
        `${endpoints.userTicketOrdersManual}?event_id=${event_uuid}`,
      ); // Include event_uuid as a query parameter
      logger.log("User Ticket Orders Response:", response.data);

      // Cache the response for offline use
      if (response.data?.data) {
        await offlineStorage.saveManualOrders(event_uuid, response.data.data);
        await offlineStorage.saveLastSync(event_uuid);
      }

      return response.data;
    } catch (error) {
      logger.error("Fetch User Ticket Orders Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // If network error, try to return cached data
      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached orders");
        const cachedOrders = await offlineStorage.getManualOrders(event_uuid);
        return {
          data: cachedOrders || [],
          offline: true,
        };
      }

      if (error.response?.data) {
        throw {
          message:
            error.response.data.message || "Failed to fetch ticket orders.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  fetchUserTicketOrdersDetail: async (orderNumber, eventUuid) => {
    try {
      const isOnline = networkService.isConnected();

      // If offline, return cached data
      if (!isOnline) {
        logger.log("Offline mode: Returning cached order details");
        const cachedDetails = await offlineStorage.getOrderDetails(
          orderNumber,
          eventUuid,
        );
        if (cachedDetails) {
          return {
            data: cachedDetails,
            offline: true,
          };
        }
        // Return empty if no cache
        return {
          data: [],
          offline: true,
        };
      }

      const response = await apiClient.get(
        endpoints.userTicketOrdersManualDetail(orderNumber, eventUuid),
      ); // Use the endpoint definition
      logger.log("Ticket Details Response:", response.data);

      // Cache the response for offline use
      if (response.data?.data) {
        await offlineStorage.saveOrderDetails(
          orderNumber,
          eventUuid,
          response.data.data,
        );
        await offlineStorage.saveLastSync(eventUuid);
      }

      return response.data;
    } catch (error) {
      logger.error("Fetch Ticket Details Error:", error);

      // If network error, try to return cached data
      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached order details");
        const cachedDetails = await offlineStorage.getOrderDetails(
          orderNumber,
          eventUuid,
        );
        if (cachedDetails) {
          return {
            data: cachedDetails,
            offline: true,
          };
        }
        // Return empty if no cache
        return {
          data: [],
          offline: true,
        };
      }

      if (error.response?.data) {
        throw {
          message:
            error.response.data.message ||
            "Failed to fetch ticket orders Detail.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  manualDetailCheckin: async (uuid, code) => {
    logger.log("Manual Checkin Params:", uuid, code);
    try {
      const isOnline = networkService.isConnected();

      // If offline, queue the action
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

      const response = await apiClient.post(
        endpoints.manualDetailChekin(uuid, code),
      );
      logger.log("Manual Ticket Details Response:", response.data);

      // After successful check-in, we should clear cached order details
      // so fresh data is fetched next time. We need orderNumber to clear cache,
      // but we don't have it here. The screen will handle refreshing.
      // For now, we'll let the screen refresh after sync.

      return response.data;
    } catch (error) {
      logger.error("Fetch Manual Ticket Details Error:", error);

      // If network error, queue the action
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
          message:
            error.response.data.message ||
            "Failed to fetch manual ticket orders Detail.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  boxOfficeDetailCheckinAll: async (eventUuid, orderNumber) => {
    logger.log("box office checkin all Params:", eventUuid, orderNumber);
    try {
      const response = await apiClient.patch(
        endpoints.boxOfficeCheckInAllTicket(eventUuid, orderNumber),
      );
      logger.log("box office checkin all Response:", response.data);
      return response.data;
    } catch (error) {
      logger.error("box office checkin all Details Error:", error);
      if (error.response?.data) {
        throw {
          message:
            error.response.data.message || "box office checkin all error",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  ticketStatsInfo: async (eventUuid) => {
    try {
      const isOnline = networkService.isConnected();

      // If offline, return cached data
      if (!isOnline) {
        logger.log("Offline mode: Returning cached ticket stats");
        const cachedStats = await offlineStorage.getTicketStats(eventUuid);
        if (cachedStats) {
          return {
            data: { data: cachedStats },
            offline: true,
          };
        }
        // Return empty stats if no cache
        return {
          data: { data: { total: 0, scanned: 0, unscanned: 0 } },
          offline: true,
        };
      }

      const response = await apiClient.get(endpoints.ticketStats(eventUuid));
      logger.log(" Ticket Tab Response:", response.data);

      // Cache the response for offline use
      if (response.data?.data?.data) {
        await offlineStorage.saveTicketStats(eventUuid, response.data.data);
        await offlineStorage.saveLastSync(eventUuid);
      }

      return response.data;
    } catch (error) {
      logger.error("Failed to fetch ticket stats:", error);

      // If network error, try to return cached data
      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached stats");
        const cachedStats = await offlineStorage.getTicketStats(eventUuid);
        if (cachedStats) {
          return {
            data: { data: cachedStats },
            offline: true,
          };
        }
        // Return empty stats if no cache
        return {
          data: { data: { total: 0, scanned: 0, unscanned: 0 } },
          offline: true,
        };
      }

      throw error;
    }
  },

  ticketStatsListing: async (
    event_uuid,
    page = 1,
    staffUuid = null,
    status = "PAID",
  ) => {
    try {
      const isOnline = networkService.isConnected();

      let url = `${endpoints.ticketStatslist}?event_id=${event_uuid}&page=${page}&page_size=-1`;

      // Add status filter
      if (status) {
        url += `&status=${status}`;
      }

      // Add staff_uuid parameter if provided
      if (staffUuid) {
        url += `&staff_uuid=${staffUuid}`;
      }

      // If offline, return cached data
      if (!isOnline) {
        logger.log("Offline mode: Returning cached tickets");
        const cachedTickets = await offlineStorage.getTickets(event_uuid);
        return {
          data: cachedTickets || [],
          offline: true,
        };
      }

      const response = await apiClient.get(url);
      logger.log("Ticket Tab listing Response:", response.data);

      // Cache the response for offline use
      if (response.data?.data) {
        await offlineStorage.saveTickets(event_uuid, response.data.data);
        await offlineStorage.saveLastSync(event_uuid);
      }

      return response.data;
    } catch (error) {
      logger.error("Failed to fetch ticket stats:", error);

      // If network error, try to return cached data
      if (networkService.isNetworkError(error)) {
        networkService.setOnlineStatus(false);
        logger.log("Network error, returning cached tickets");
        const cachedTickets = await offlineStorage.getTickets(event_uuid);
        return {
          data: cachedTickets || [],
          offline: true,
        };
      }

      throw error;
    }
  },
  fetchTicketPricingStats: async (eventId) => {
    try {
      const response = await apiClient.get(
        endpoints.ticketPricingStats(eventId),
      );
      logger.log("Ticket Pricing Stats API Response:", response.data);
      return response.data;
    } catch (error) {
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
          message:
            error.response.data.message ||
            "Failed to fetch ticket pricing stats.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  fetchTicketPricing: async (eventUuid) => {
    try {
      if (!eventUuid) {
        throw new Error("event_uuid is required");
      }

      logger.log("Fetching ticket pricing for event:", eventUuid);
      const response = await apiClient.get(endpoints.ticketPricing(eventUuid));

      // Log the complete response
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

      // Extract the actual pricing data from the nested structure
      const pricingData = response.data?.data?.data;

      // Log the data structure
      logger.log("Ticket Pricing Data Structure:", {
        hasData: !!pricingData,
        eventTitle: pricingData?.event_title,
        pricingTypeOptions: pricingData?.pricing_type_options,
        saleStartDate: pricingData?.sale_start_date_time,
        saleEndDate: pricingData?.sale_end_date_time,
      });

      return pricingData;
    } catch (error) {
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
          message:
            error.response.data.message || "Failed to fetch ticket pricing.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  fetchBoxOfficeGetTicket: async (
    eventUuid,
    items,
    userIdentifier,
    paymentMethod,
    transactionId = null,
    name = null,
    purchaseCode = null,
  ) => {
    try {
      // Add purchaseCode to items if provided
      const itemsWithPurchaseCode = items.map((item) => ({
        ...item,
        // Only add purchaseCode if it's provided and not empty
        ...(purchaseCode &&
          purchaseCode.trim() && { purchaseCode: purchaseCode.trim() }),
      }));

      const requestBody = {
        eventId: eventUuid,
        items: itemsWithPurchaseCode,
        userIdentifier: userIdentifier,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        name: name,
      };

      logger.log("BoxOffice get ticket request body:", requestBody);
      logger.log("Purchase code being sent:", purchaseCode);
      logger.log("Items with purchase code:", itemsWithPurchaseCode);
      const response = await apiClient.post(
        endpoints.boxOfficeGetTicket,
        requestBody,
      );
      logger.log("BoxOffice get ticket DetailsResponse:", {
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
      logger.log("BoxOffice get ticket API Response:", response.data);
      return response.data;
    } catch (error) {
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

        // Handle specific validation errors
        if (
          error.response.status === 400 &&
          error.response.data?.data?.purchaseCode
        ) {
          const purchaseCodeErrors = error.response.data.data.purchaseCode;
          if (
            Array.isArray(purchaseCodeErrors) &&
            purchaseCodeErrors.length > 0
          ) {
            logger.error("Purchase code validation failed:", {
              purchaseCode: purchaseCode,
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
          message:
            error.response.data.message ||
            "Failed to fetch get box office ticket",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },

  fetchDashboardStats: async (
    eventUuid,
    sales = null,
    ticketType = null,
    ticketUuid = null,
    staffUuid = null,
    paymentChannel = null,
  ) => {
    try {
      let url = endpoints.dashboardStats;

      const params = new URLSearchParams();

      // Add sales query parameter for ADMIN users
      if (sales) {
        params.append("sales", sales);
      }

      // Add ticket_type query parameter for filtering by category
      if (ticketType) {
        params.append("ticket_type", ticketType);
      }

      // Add ticket_uuid query parameter for filtering specific ticket analytics
      if (ticketUuid) {
        params.append("ticket_uuid", ticketUuid);
      }

      // Add staff_uuid query parameter for staff-specific data
      if (staffUuid) {
        params.append("staff_uuid", staffUuid);
      }

      // Add payment_channel query parameter for filtering by payment channel
      if (paymentChannel) {
        params.append("payment_channel", paymentChannel);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Log the API call details
      // logger.log('================================================');
      // logger.log('📡 API CALL - fetchDashboardStats');
      // logger.log('Base URL:', BASE_URL);
      // logger.log('Endpoint:', url);
      // logger.log('Full URL:', BASE_URL + url);
      // logger.log('HTTP Method: GET');
      // logger.log('Parameters:', {
      //   eventUuid,
      //   sales,
      //   ticketType,
      //   ticketUuid,
      //   staffUuid,
      //   paymentChannel
      // });
      logger.log('================================================',url);

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      logger.error("❌ Fetch Dashboard Stats Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      if (error.response?.data) {
        throw {
          message:
            error.response.data.message || "Failed to fetch dashboard stats.",
          response: error.response,
        };
      }
      throw {
        message: "Network error. Please check your connection.",
        error: error,
      };
    }
  },
};
export const eventService = {
  fetchStaffEvents: async (staffId) => {
    try {
      const response = await apiClient.get(endpoints.staffEventAccess(staffId));
      const accessList = response.data?.staffEventAccess || [];
      const eventIds = accessList.flatMap((entry) => entry.eventIds || []);
      if (eventIds.length === 0) {
        return { data: [] };
      }
      const events = eventIds.map((id) => ({ id, eventUuid: id }));
      return { data: events };
    } catch (error) {
      logger.error("fetchStaffEvents error:--->", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  fetchEventInfo: async (eventId) => {
    try {
      const response = await apiClient.get(endpoints.eventInfo(eventId));
      logger.log("Fetch Event Info Response:", response.data);
      return response.data;
    } catch (error) {
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

      // Handle 403 Forbidden error specifically
      if (error.response?.status === 403) {
        const errorMessage =
          error.response?.data?.message || error.response?.data?.data?.detail;

        // Check if it's a business logic error (like "Event is not published")
        if (errorMessage && errorMessage.includes("not published")) {
          logger.error("403 Forbidden - Business logic error:", errorMessage);
          throw {
            message: errorMessage || "Event is not available.",
            status: 403,
            isBusinessError: true,
            response: error.response,
          };
        } else {
          // This might be an authentication error
          logger.error(
            "403 Forbidden - Possible authentication issue detected",
          );
          // Clear the stored token as it might be invalid
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
        error: error,
      };
    }
  },
};
// Example of another service group
export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get(endpoints.userProfile);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (formData) => {
    try {
      const response = await apiClient.patch(
        endpoints.updateProfile,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      logger.log("image profile:", response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  Userlogout: async () => {
    try {
      const response = await apiClient.delete(endpoints.logout);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
//     // Update user profile
//     updateProfile: async (userData) => {
//         try {
//             const response = await apiClient.put('/user/profile', userData);
//             return response.data;
//         } catch (error) {
//             throw error.response?.data || error.message;
//         }
//     },
// };

// You can add more service groups as needed
