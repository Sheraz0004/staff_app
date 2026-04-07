export const BUCKET_URL_JOBS = "";
export const GOOGLE_API_KEY = "AIzaSyC54j-hnFZ-oSmvnO1cij96jQy-p5n-n9U";
export const STRIPE_API_KEY =
  "pk_test_51QiA7VD7PqWrjsBql9OtY9OJ0LTqRW8saYKh6HhrIF3c4SIndoDW2znul7vn93TDK9VN5ItDzmke1uvNUTE5rws300Vj06sAjR";

const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL || "https://dev-api.hexallo.com",
  AUTH: {
    twoFactorInitiate: "/login/2fa/initiate",
    twoFactorVerify: "/login/2fa/verify",
    userProfile: "/api/users/me",
    logout: "/identities/logout",
  },
};

export default API_CONFIG;
