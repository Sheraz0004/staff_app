import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CustomToast from './CustomToast';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
    visible: boolean;
    type: ToastType;
    title: string;
    message: string;
    duration: number;
}

interface ToastContextType {
    showSuccessToast: (message: string, title?: string, duration?: number) => void;
    showErrorToast: (message: string, title?: string, duration?: number) => void;
    showInfoToast: (message: string, title?: string, duration?: number) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const initialState: ToastState = {
    visible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 3000,
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastState>(initialState);

    const showSuccessToast = useCallback((message: string, title: string = 'Success', duration: number = 3000) => {
        setToast({
            visible: true,
            type: 'success',
            title,
            message,
            duration,
        });
    }, []);

    const showErrorToast = useCallback((message: string, title: string = 'Error', duration: number = 3000) => {
        setToast({
            visible: true,
            type: 'error',
            title,
            message,
            duration,
        });
    }, []);

    const showInfoToast = useCallback((message: string, title: string = 'Info', duration: number = 3000) => {
        setToast({
            visible: true,
            type: 'info',
            title,
            message,
            duration,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showSuccessToast, showErrorToast, showInfoToast, hideToast }}>
            {children}
            <CustomToast
                visible={toast.visible}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                duration={toast.duration}
                onClose={hideToast}
            />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

let toastRef: ToastContextType | null = null;

export const setToastRef = (ref: ToastContextType) => {
    toastRef = ref;
};

export const showSuccessToast = (message: string, title?: string, duration?: number) => {
    if (toastRef) {
        toastRef.showSuccessToast(message, title, duration);
    }
};

export const showErrorToast = (message: string, title?: string, duration?: number) => {
    if (toastRef) {
        toastRef.showErrorToast(message, title, duration);
    }
};

export const showInfoToast = (message: string, title?: string, duration?: number) => {
    if (toastRef) {
        toastRef.showInfoToast(message, title, duration);
    }
};
