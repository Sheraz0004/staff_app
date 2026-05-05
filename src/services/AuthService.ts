import API_CONFIG from "../../config";
import HTTP_CLIENT from "../utils/config";

interface TWO_FACTOR_INITIATE {
  key: string;
  secret: string;
}

interface TWO_FACTOR_VERIFY {
  traceId: string;
  otp: string;
}

export const AUTH_SERVICES = {
  twoFactorInitiate: (payload: TWO_FACTOR_INITIATE) =>
    HTTP_CLIENT.post(API_CONFIG.AUTH.twoFactorInitiate, payload),

  twoFactorVerify: (payload: TWO_FACTOR_VERIFY) =>
    HTTP_CLIENT.post(API_CONFIG.AUTH.twoFactorVerify, payload),

  fetchUserProfile: () => HTTP_CLIENT.get(API_CONFIG.AUTH.userProfile),

  fetchProfileMe: () => HTTP_CLIENT.get("/api/users/me"),

  updateProfile: (formData: FormData) =>
    HTTP_CLIENT.patch("/api/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  logout: () => HTTP_CLIENT.post(API_CONFIG.AUTH.logout),
};
