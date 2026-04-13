import { offlineStorage } from './offlineStorage';
import { offlineQueue } from './offlineQueue';
import { networkService } from './network';
import { syncService } from './syncService';
import { logger } from './logger';

class OfflineDebugService {
    async getOfflineStatus(): Promise<any> {
        try {
            const isOnline = networkService.isConnected();
            const queueSize = await offlineQueue.getQueueSize();
            const queue = await offlineQueue.getQueue();
            const cachedEvents = await offlineStorage.getCachedEvents();

            const eventsInfo = await Promise.all(
                cachedEvents.map(async (eventUuid) => {
                    const ticketCount = await offlineStorage.getTicketCount(eventUuid);
                    const storageSize = await offlineStorage.getStorageSize(eventUuid);
                    const lastSync = await offlineStorage.getLastSync(eventUuid);

                    return {
                        eventUuid,
                        ticketCount,
                        storageSize: this._formatBytes(storageSize),
                        lastSync: lastSync ? new Date(lastSync).toLocaleString() : 'Never',
                        lastSyncTimestamp: lastSync,
                    };
                }),
            );

            const queueBreakdown = queue.reduce((acc: Record<string, number>, item: any) => {
                acc[item.type] = (acc[item.type] || 0) + 1;
                return acc;
            }, {});

            return {
                network: {
                    isOnline,
                    status: isOnline ? '🟢 Online' : '🔴 Offline',
                },
                queue: {
                    size: queueSize,
                    breakdown: queueBreakdown,
                    items: queue.slice(0, 10),
                },
                storage: {
                    cachedEvents: cachedEvents.length,
                    events: eventsInfo,
                    totalStorage: this._formatBytes(
                        eventsInfo.reduce((sum, e) => {
                            const size = parseInt(e.storageSize.replace(/[^0-9]/g, '')) || 0;
                            return sum + size;
                        }, 0),
                    ),
                },
                sync: {
                    isSyncing: syncService.isSyncingNow(),
                    status: syncService.isSyncingNow() ? '🔄 Syncing' : '✅ Idle',
                },
            };
        } catch (error: any) {
            logger.error('Error getting offline status:', error);
            return { error: error.message };
        }
    }

    async getStorageDetails(eventUuid: string): Promise<any> {
        try {
            const ticketCount = await offlineStorage.getTicketCount(eventUuid);
            const storageSize = await offlineStorage.getStorageSize(eventUuid);
            const lastSync = await offlineStorage.getLastSync(eventUuid);
            const tickets = await offlineStorage.getTickets(eventUuid, { limit: 5 });
            const stats = await offlineStorage.getTicketStats(eventUuid);
            const orders = await offlineStorage.getManualOrders(eventUuid);

            return {
                eventUuid,
                summary: {
                    ticketCount,
                    storageSize: this._formatBytes(storageSize),
                    lastSync: lastSync ? new Date(lastSync).toLocaleString() : 'Never',
                    hasStats: !!stats,
                    orderCount: orders?.length || 0,
                },
                sample: {
                    tickets: tickets?.slice(0, 3) || [],
                    stats: stats || {},
                    orders: orders?.slice(0, 3) || [],
                },
            };
        } catch (error: any) {
            logger.error('Error getting storage details:', error);
            return { error: error.message };
        }
    }

    async testOfflineFunctionality(): Promise<any> {
        const results: any = {
            network: false,
            storage: false,
            queue: false,
            sync: false,
            errors: [],
        };

        try {
            try {
                networkService.isConnected();
                results.network = true;
                logger.log('✅ Network service: OK');
            } catch (error: any) {
                results.errors.push(`Network service: ${error.message}`);
            }

            try {
                const testEventUuid = 'test-event-' + Date.now();
                const testData = [{ id: 1, name: 'Test Ticket' }];
                await offlineStorage.saveTickets(testEventUuid, testData);
                const retrieved = await offlineStorage.getTickets(testEventUuid);
                results.storage = !!(retrieved && retrieved.length > 0);
                await offlineStorage.clearEventData(testEventUuid);
                logger.log('✅ Storage service: OK');
            } catch (error: any) {
                results.errors.push(`Storage service: ${error.message}`);
            }

            try {
                const queueId = await offlineQueue.addToQueue('testAction', { test: true }, () => {});
                const queue = await offlineQueue.getQueue();
                results.queue = queue.some((item: any) => item.id === queueId);
                await offlineQueue.removeFromQueue(queueId);
                logger.log('✅ Queue service: OK');
            } catch (error: any) {
                results.errors.push(`Queue service: ${error.message}`);
            }

            try {
                const isSyncing = syncService.isSyncingNow();
                results.sync = typeof isSyncing === 'boolean';
                logger.log('✅ Sync service: OK');
            } catch (error: any) {
                results.errors.push(`Sync service: ${error.message}`);
            }

            results.allPassed = results.network && results.storage && results.queue && results.sync;
            return results;
        } catch (error: any) {
            results.errors.push(`Test error: ${error.message}`);
            return results;
        }
    }

    async clearAllOfflineData(): Promise<any> {
        try {
            const events = await offlineStorage.getCachedEvents();
            let clearedCount = 0;

            for (const eventUuid of events) {
                await offlineStorage.clearEventData(eventUuid);
                clearedCount++;
            }

            await offlineQueue.clearQueue();

            return {
                success: true,
                clearedEvents: clearedCount,
                clearedQueue: true,
                message: `Cleared ${clearedCount} events and queue`,
            };
        } catch (error: any) {
            logger.error('Error clearing offline data:', error);
            return { success: false, error: error.message };
        }
    }

    async getQueueDetails(): Promise<any> {
        try {
            const queue = await offlineQueue.getQueue();
            const breakdown = queue.reduce((acc: Record<string, any>, item: any) => {
                if (!acc[item.type]) {
                    acc[item.type] = { count: 0, oldest: null, newest: null, retries: 0 };
                }
                acc[item.type].count++;
                if (!acc[item.type].oldest || item.timestamp < acc[item.type].oldest) {
                    acc[item.type].oldest = item.timestamp;
                }
                if (!acc[item.type].newest || item.timestamp > acc[item.type].newest) {
                    acc[item.type].newest = item.timestamp;
                }
                acc[item.type].retries += item.retries || 0;
                return acc;
            }, {});

            return {
                total: queue.length,
                breakdown,
                items: queue.map((item: any) => ({
                    id: item.id,
                    type: item.type,
                    timestamp: new Date(item.timestamp).toLocaleString(),
                    retries: item.retries || 0,
                })),
            };
        } catch (error: any) {
            logger.error('Error getting queue details:', error);
            return { error: error.message };
        }
    }

    private _formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    async printStatus(): Promise<void> {
        const status = await this.getOfflineStatus();
        console.log('\n=== OFFLINE SYNC STATUS ===');
        console.log('Network:', status.network?.status);
        console.log('Queue Size:', status.queue?.size);
        console.log('Cached Events:', status.storage?.cachedEvents);
        console.log('Sync Status:', status.sync?.status);
        console.log('\nQueue Breakdown:', status.queue?.breakdown);
        console.log('\nEvents:', JSON.stringify(status.storage?.events, null, 2));
        console.log('===========================\n');
    }
}

export const offlineDebug = new OfflineDebugService();
export default offlineDebug;
