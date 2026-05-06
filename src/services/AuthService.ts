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

  getUploadRequest: (fileName: string) =>
    HTTP_CLIENT.get(`/files/upload-request/${encodeURIComponent(fileName)}`),

  uploadImageToS3: async (uploadUrl: string, fileUri: string, mimeType: string): Promise<void> => {
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();
    const s3Response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: blob,
    });
    if (!s3Response.ok) {
      throw new Error(`S3 upload failed with status ${s3Response.status}`);
    }
  },

  updateProfile: (body: { profileImage?: string; firstName?: string; lastName?: string }) =>
    HTTP_CLIENT.patch("/api/users/profile", body),

  logout: () => HTTP_CLIENT.delete(API_CONFIG.AUTH.logout),
};
