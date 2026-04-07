import { useState } from 'react';
import { showErrorToast, showSuccessToast } from '../components/Toast';

export const useApi = (
  apiFunction: any,
  shouldShowSuccessToast: boolean = true,
  shouldShowErrorToast: boolean = true,
) => {
  const [response, setresponse] = useState<any>({});
  const [loading, setloading] = useState(false);
  const [error, seterror] = useState<any>('');

  const requestCall = async (...args: any) => {
    let res: any = '';
    try {
      setloading(true);
      res = await apiFunction(...args);
      setresponse(res?.data);
      setloading(false);
      if (shouldShowSuccessToast) {
        if (res?.status === 200 || res?.status === 201) {
          showSuccessToast(res?.data?.message || 'Success');
        } else {
          showErrorToast(res?.data?.message || 'Something went wrong');
        }
      }
      return res;
    } catch (err: any) {
      setloading(false);
      seterror(err);
      if (shouldShowErrorToast) {
        const serverMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.response?.data?.reason ||
          err?.message ||
          'Something went wrong';
        showErrorToast(serverMsg);
      }
      throw err;
    }
  };

  return { loading, error, response, requestCall };
};
