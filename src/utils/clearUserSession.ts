import * as SecureStore from 'expo-secure-store';
import { persistor } from '../redux/store';
import offlineStorage from './offlineStorage';

export const clearUserSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync('accessToken').catch(() => {}),
    SecureStore.deleteItemAsync('refreshToken').catch(() => {}),
    offlineStorage.clearAllData(),
    persistor.purge(),
  ]);
};
