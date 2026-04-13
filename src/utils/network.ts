import { logger } from './logger';

type NetworkListener = (isOnline: boolean) => void;

class NetworkService {
    private isOnline: boolean;
    private listeners: NetworkListener[];

    constructor() {
        this.isOnline = true;
        this.listeners = [];
    }

    isConnected(): boolean {
        return this.isOnline;
    }

    setOnlineStatus(status: boolean): void {
        const wasOnline = this.isOnline;
        this.isOnline = status;

        if (wasOnline !== status) {
            logger.log(`Network status changed: ${status ? 'ONLINE' : 'OFFLINE'}`);
            this.notifyListeners(status);
        }
    }

    async checkConnectivity(): Promise<boolean> {
        try {
            return this.isOnline;
        } catch (error) {
            this.setOnlineStatus(false);
            return false;
        }
    }

    addListener(callback: NetworkListener): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((listener) => listener !== callback);
        };
    }

    notifyListeners(isOnline: boolean): void {
        this.listeners.forEach((listener) => {
            try {
                listener(isOnline);
            } catch (error) {
                logger.error('Error in network listener:', error);
            }
        });
    }

    isNetworkError(error: any): boolean {
        if (!error) return false;

        const networkErrorMessages = [
            'Network Error',
            'network error',
            'Network request failed',
            'Failed to fetch',
            'timeout',
            'ECONNABORTED',
            'ENOTFOUND',
            'ECONNREFUSED',
            'ERR_INTERNET_DISCONNECTED',
            'ERR_NETWORK_CHANGED',
        ];

        const errorMessage = error.message?.toLowerCase() || '';
        const isNetworkError = networkErrorMessages.some((msg) =>
            errorMessage.includes(msg.toLowerCase()),
        );

        const noResponse = !error.response && error.request;

        return isNetworkError || noResponse;
    }
}

export const networkService = new NetworkService();
export default networkService;
