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
  /**
   * POST /login/2fa/initiate — { key, secret }
   * Response: { traceId, maskedContact }
   */
  twoFactorInitiate: (payload: TWO_FACTOR_INITIATE) =>
    HTTP_CLIENT.post(API_CONFIG.AUTH.twoFactorInitiate, payload),

  /**
   * POST /login/2fa/verify — { traceId, otp }
   * Response: { authToken, refreshToken }
   */
  twoFactorVerify: (payload: TWO_FACTOR_VERIFY) =>
    HTTP_CLIENT.post(API_CONFIG.AUTH.twoFactorVerify, payload),

  /**
   * GET /api/users/me
   * Response: user profile object
   */
  fetchUserProfile: () =>
    HTTP_CLIENT.get(API_CONFIG.AUTH.userProfile),

  /**
   * POST /identities/logout
   */
  logout: () =>
    HTTP_CLIENT.post(API_CONFIG.AUTH.logout),
};
