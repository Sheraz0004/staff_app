import { networkService } from './network';
import { offlineQueue } from './offlineQueue';
import { ticketService } from '../api/apiService';
import { logger } from './logger';

interface SyncProgress {
    current: number;
    total: number;
    item: string;
    batch: number;
    totalBatches: number;
}

interface SyncResult {
    success: boolean;
    synced?: number;
    failed?: number;
    total?: number;
    message?: string;
    errors?: Array<{ item: string; error: string }>;
}

type SyncListener = (result: SyncResult) => void;

class SyncService {
    private isSyncing: boolean;
    private syncListeners: SyncListener[];
    private readonly BATCH_SIZE: number;
    private readonly DELAY_BETWEEN_BATCHES: number;

    constructor() {
        this.isSyncing = false;
        this.syncListeners = [];
        this.BATCH_SIZE = 50;
        this.DELAY_BETWEEN_BATCHES = 1000;
    }

    async sync(onProgress?: (progress: SyncProgress) => void): Promise<SyncResult> {
        if (this.isSyncing) {
            logger.log('Sync already in progress');
            return { success: false, message: 'Sync already in progress' };
        }

        if (!networkService.isConnected()) {
            logger.log('Cannot sync: device is offline');
            return { success: false, message: 'Device is offline' };
        }

        this.isSyncing = true;
        const queue = await offlineQueue.getQueue();

        if (queue.length === 0) {
            this.isSyncing = false;
            return { success: true, synced: 0, failed: 0, message: 'No items to sync' };
        }

        logger.log(`Starting sync of ${queue.length} queued actions`);
        let synced = 0;
        let failed = 0;
        const errors: Array<{ item: string; error: string }> = [];

        try {
            const totalBatches = Math.ceil(queue.length / this.BATCH_SIZE);

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const batchStart = batchIndex * this.BATCH_SIZE;
                const batchEnd = Math.min(batchStart + this.BATCH_SIZE, queue.length);
                const batch = queue.slice(batchStart, batchEnd);

                logger.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} items)`);

                const batchPromises = batch.map(async (item: any, itemIndex: number) => {
                    const globalIndex = batchStart + itemIndex;

                    if (onProgress) {
                        onProgress({
                            current: globalIndex + 1,
                            total: queue.length,
                            item: item.type,
                            batch: batchIndex + 1,
                            totalBatches,
                        });
                    }

                    try {
                        await this.processQueueItem(item);
                        await offlineQueue.removeFromQueue(item.id);
                        synced++;
                        logger.log(`Synced ${item.type} (${globalIndex + 1}/${queue.length})`);
                        return { success: true, item };
                    } catch (error: any) {
                        logger.error(`Failed to sync ${item.type}:`, error);

                        if (offlineQueue.shouldRetry(item)) {
                            await offlineQueue.incrementRetry(item.id);
                            failed++;
                            errors.push({ item: item.type, error: error.message });
                            return { success: false, item, error: error.message };
                        } else {
                            await offlineQueue.removeFromQueue(item.id);
                            failed++;
                            errors.push({ item: item.type, error: 'Max retries reached' });
                            return { success: false, item, error: 'Max retries reached' };
                        }
                    }
                });

                await Promise.all(batchPromises);

                if (batchIndex < totalBatches - 1) {
                    await new Promise((resolve) => setTimeout(resolve, this.DELAY_BETWEEN_BATCHES));
                }
            }

            const result: SyncResult = {
                success: true,
                synced,
                failed,
                total: queue.length,
                errors: errors.length > 0 ? errors : undefined,
            };

            logger.log(`Sync completed: ${synced} synced, ${failed} failed`);
            this.notifyListeners(result);
            return result;
        } catch (error: any) {
            logger.error('Sync error:', error);
            return { success: false, message: error.message, synced, failed };
        } finally {
            this.isSyncing = false;
        }
    }

    async processQueueItem(item: any): Promise<void> {
        switch (item.type) {
            case 'scanTicket':
                await this.syncScanTicket(item.data);
                break;
            case 'updateNote':
                await this.syncUpdateNote(item.data);
                break;
            case 'manualCheckin':
                await this.syncManualCheckin(item.data);
                break;
            default:
                throw new Error(`Unknown action type: ${item.type}`);
        }
    }

    async syncScanTicket(data: { scannedData: string; note: string | null }): Promise<void> {
        const { scannedData, note } = data;
        await ticketService.scanTicket(scannedData, note);
    }

    async syncUpdateNote(data: { code: string; note: string; eventUuid: string }): Promise<void> {
        const { code, note, eventUuid } = data;
        await ticketService.updateTicketNote(code, note, eventUuid);
    }

    async syncManualCheckin(data: { uuid: string; code: string }): Promise<any> {
        const { uuid, code } = data;
        const response = await ticketService.manualDetailCheckin(uuid, code);
        logger.log('Manual checkin synced successfully:', response);
        return response;
    }

    addListener(callback: SyncListener): () => void {
        this.syncListeners.push(callback);
        return () => {
            this.syncListeners = this.syncListeners.filter((listener) => listener !== callback);
        };
    }

    notifyListeners(result: SyncResult): void {
        this.syncListeners.forEach((listener) => {
            try {
                listener(result);
            } catch (error) {
                logger.error('Error in sync listener:', error);
            }
        });
    }

    isSyncingNow(): boolean {
        return this.isSyncing;
    }
}

export const syncService = new SyncService();
export default syncService;
