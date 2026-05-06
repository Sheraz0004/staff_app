import { persistor } from '../redux/store';
import offlineStorage from './offlineStorage';

export const clearUserSession = async (): Promise<void> => {
  await Promise.all([
    offlineStorage.clearAllData(),
    persistor.purge(),
  ]);
};
