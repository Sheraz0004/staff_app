import { useEffect, useState } from 'react';
import { networkService } from '../utils/network';
import { syncService } from '../utils/syncService';
import { offlineQueue } from '../utils/offlineQueue';
import { logger } from '../utils/logger';

interface SyncProgress {
    current: number;
    total: number;
    item: string;
    batch: number;
    totalBatches: number;
}

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState<boolean>(networkService.isConnected());
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
    const [queueSize, setQueueSize] = useState<number>(0);

    useEffect(() => {
        const unsubscribeNetwork = networkService.addListener((online: boolean) => {
            setIsOnline(online);

            if (online) {
                logger.log('Device came back online, starting sync...');
                triggerSync();
            }
        });

        updateQueueSize();

        const queueInterval = setInterval(updateQueueSize, 5000);

        return () => {
            unsubscribeNetwork();
            clearInterval(queueInterval);
        };
    }, []);

    const updateQueueSize = async (): Promise<void> => {
        const size = await offlineQueue.getQueueSize();
        setQueueSize(size);
    };

    const triggerSync = async (): Promise<void> => {
        if (isSyncing || !isOnline) return;

        setIsSyncing(true);
        setSyncProgress(null);

        try {
            const result = await syncService.sync((progress) => {
                setSyncProgress(progress);
            });

            if (result.success) {
                logger.log(`Sync completed: ${result.synced} synced, ${result.failed} failed`);
                await updateQueueSize();
            }
        } catch (error) {
            logger.error('Sync error:', error);
        } finally {
            setIsSyncing(false);
            setSyncProgress(null);
        }
    };

    return {
        isOnline,
        isSyncing,
        syncProgress,
        queueSize,
        triggerSync,
    };
};

export default useOfflineSync;
