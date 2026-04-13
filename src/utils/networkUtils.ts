import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';

export const isOnline = async (): Promise<boolean> => {
    try {
        const state = await NetInfo.fetch();
        return !!(state.isConnected && state.isInternetReachable);
    } catch (error) {
        logger.error('Error checking network status:', error);
        return false;
    }
};

interface NetworkState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
}

export const getNetworkState = async (): Promise<NetworkState> => {
    try {
        const state = await NetInfo.fetch();
        return {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
        };
    } catch (error) {
        logger.error('Error getting network state:', error);
        return {
            isConnected: false,
            isInternetReachable: false,
            type: 'unknown',
        };
    }
};

interface NetworkChangeState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    isOnline: boolean;
    type: string;
}

export const subscribeToNetworkChanges = (
    callback: (state: NetworkChangeState) => void,
): (() => void) => {
    return NetInfo.addEventListener((state) => {
        const online = !!(state.isConnected && state.isInternetReachable);
        callback({
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            isOnline: online,
            type: state.type,
        });
    });
};
