import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import {resetUserReducer} from '../redux/reducers/userReducer';
import store from '../redux/store';
import API_CONFIG from '../../config';


const controller = new AbortController();

const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const HTTP_CLIENT_UPLOAD: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});
HTTP_CLIENT_UPLOAD.interceptors.request.use(
  async (config: AxiosRequestConfig): Promise<any> => {
    const token = '83a38cc45db9b37259e8bfeda73d2832fbd6fb0f88e39af725448f081a22'
    config.headers = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Type': 'multipart/form-data',
    };
    config.params = config.params || {};
    config.cancelToken = source.token || {};
    config.signal = controller.signal;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);
HTTP_CLIENT_UPLOAD.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: any) => {
    if (error.response && error.status === 403) {
      store.dispatch(resetUserReducer());
    }
    return Promise.reject(error);
  },
);

export default HTTP_CLIENT_UPLOAD;
