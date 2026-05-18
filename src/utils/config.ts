import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import API_CONFIG from "../../config";
import store from "../redux/store";
import { logout } from "../redux/reducers/userReducer";
import { API_KEY } from "../config/env";

const controller = new AbortController();
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const HTTP_CLIENT: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

HTTP_CLIENT.interceptors.request.use(
  async (config: AxiosRequestConfig): Promise<any> => {
    let token: string | null = (store.getState() as any)?.entities?.user?.userToken ?? null;
    // // if (!token) {
    // //   token = await SecureStore.getItemAsync("accessToken");
    // // }
    // console.log("token-->",token)

    config.headers = {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    };
    config.params = config.params || {};
    config.cancelToken = source.token || {};
    config.signal = controller.signal;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log("here is ---> ", error.response.data);
    return Promise.reject(error);
  },
);
HTTP_CLIENT.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    console.error("[HTTP_CLIENT] API error:", {
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.errorCode === "invalid.token"
    ) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);

export default HTTP_CLIENT;
