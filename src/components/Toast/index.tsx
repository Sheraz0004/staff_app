import React, { useEffect } from "react";
import { ToastProvider, useToast, setToastRef } from "./ToastContext";

const ToastRefSetter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toast = useToast();

  useEffect(() => {
    setToastRef(toast);
  }, [toast]);

  return <>{children}</>;
};

export const GlobalToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ToastProvider>
      <ToastRefSetter>{children}</ToastRefSetter>
    </ToastProvider>
  );
};

export {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  useToast,
} from "./ToastContext";
export { default as CustomToast } from "./CustomToast";
