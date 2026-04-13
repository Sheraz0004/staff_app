import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

interface QueueItem {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: number;
    retries: number;
    actionFunction: string;
}

class OfflineQueueService {
    private readonly QUEUE_KEY: string;
    private readonly MAX_RETRIES: number;
    private readonly MAX_QUEUE_SIZE: number;
    private readonly DEDUPLICATE_WINDOW: number;

    constructor() {
        this.QUEUE_KEY = 'offline_action_queue';
        this.MAX_RETRIES = 3;
        this.MAX_QUEUE_SIZE = 10000;
        this.DEDUPLICATE_WINDOW = 5 * 60 * 1000;
    }

    async addToQueue(
        actionType: string,
        actionData: Record<string, any>,
        actionFunction: Function,
    ): Promise<string> {
        try {
            const queue = await this.getQueue();

            if (queue.length >= this.MAX_QUEUE_SIZE) {
                logger.warn(`Queue size (${queue.length}) exceeds max, cleaning up old items`);
                await this._cleanupOldItems(queue);
            }

            const now = Date.now();
            const duplicate = queue.find((item) => {
                if (item.type !== actionType) return false;
                if (now - item.timestamp > this.DEDUPLICATE_WINDOW) return false;

                if (actionType === 'scanTicket') {
                    return item.data?.scannedData === actionData?.scannedData;
                }
                if (actionType === 'updateNote') {
                    return (
                        item.data?.code === actionData?.code &&
                        item.data?.eventUuid === actionData?.eventUuid
                    );
                }
                return false;
            });

            if (duplicate) {
                logger.log(`Duplicate ${actionType} action found, skipping`);
                return duplicate.id;
            }

            const queueItem: QueueItem = {
                id: `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: actionType,
                data: actionData,
                timestamp: now,
                retries: 0,
                actionFunction: actionFunction.toString(),
            };

            queue.push(queueItem);

            if (queue.length % 10 === 0 || actionType === 'scanTicket') {
                await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
            } else {
                setTimeout(async () => {
                    await AsyncStorage.setItem(
                        this.QUEUE_KEY,
                        JSON.stringify(await this.getQueue()),
                    );
                }, 100);
            }

            logger.log(`Added ${actionType} to queue. Queue size: ${queue.length}`);
            return queueItem.id;
        } catch (error) {
            logger.error('Error adding to queue:', error);
            throw error;
        }
    }

    async getQueue(): Promise<QueueItem[]> {
        try {
            const data = await AsyncStorage.getItem(this.QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            logger.error('Error getting queue:', error);
            return [];
        }
    }

    async removeFromQueue(itemIds: string | string[]): Promise<void> {
        try {
            const queue = await this.getQueue();
            const idsToRemove = Array.isArray(itemIds) ? itemIds : [itemIds];
            const filteredQueue = queue.filter((item) => !idsToRemove.includes(item.id));

            if (filteredQueue.length < queue.length) {
                await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(filteredQueue));
                logger.log(
                    `Removed ${queue.length - filteredQueue.length} item(s) from queue. Remaining: ${filteredQueue.length}`,
                );
            }
        } catch (error) {
            logger.error('Error removing from queue:', error);
        }
    }

    async removeBatch(itemIds: string[]): Promise<void> {
        return this.removeFromQueue(itemIds);
    }

    async incrementRetry(itemId: string): Promise<void> {
        try {
            const queue = await this.getQueue();
            const item = queue.find((q) => q.id === itemId);
            if (item) {
                item.retries += 1;
                await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
            }
        } catch (error) {
            logger.error('Error incrementing retry:', error);
        }
    }

    async clearQueue(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.QUEUE_KEY);
            logger.log('Queue cleared');
        } catch (error) {
            logger.error('Error clearing queue:', error);
        }
    }

    async getQueueSize(): Promise<number> {
        try {
            const queue = await this.getQueue();
            return queue.length;
        } catch (error) {
            logger.error('Error getting queue size:', error);
            return 0;
        }
    }

    shouldRetry(item: QueueItem): boolean {
        return item.retries < this.MAX_RETRIES;
    }

    private async _cleanupOldItems(queue: QueueItem[]): Promise<void> {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
        const cleaned = queue.filter((item) => item.timestamp > cutoff);
        await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(cleaned));
    }
}

export const offlineQueue = new OfflineQueueService();
export default offlineQueue;
