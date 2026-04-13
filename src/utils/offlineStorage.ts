import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

interface StorageKeys {
    TICKETS: string;
    TICKET_STATS: string;
    MANUAL_ORDERS: string;
    ORDER_DETAILS: string;
    SCANNED_TICKETS: string;
    EVENT_DATA: string;
    LAST_SYNC: string;
    CACHE_TIMESTAMP: string;
    TICKET_INDEX: string;
}

interface StorageConfig {
    CHUNK_SIZE: number;
    MAX_CACHE_SIZE: number;
    MAX_SCANNED_TICKETS: number;
    CLEANUP_INTERVAL: number;
    CACHE_DURATION: number;
    COMPRESS_THRESHOLD: number;
}

interface GetTicketsOptions {
    limit?: number;
    offset?: number;
    filter?: Record<string, any>;
}

class OfflineStorageService {
    private readonly STORAGE_KEYS: StorageKeys;
    private readonly CONFIG: StorageConfig;

    constructor() {
        this.STORAGE_KEYS = {
            TICKETS: 'offline_tickets',
            TICKET_STATS: 'offline_ticket_stats',
            MANUAL_ORDERS: 'offline_manual_orders',
            ORDER_DETAILS: 'offline_order_details',
            SCANNED_TICKETS: 'offline_scanned_tickets',
            EVENT_DATA: 'offline_event_data',
            LAST_SYNC: 'offline_last_sync',
            CACHE_TIMESTAMP: 'offline_cache_timestamp',
            TICKET_INDEX: 'offline_ticket_index',
        };

        this.CONFIG = {
            CHUNK_SIZE: 1000,
            MAX_CACHE_SIZE: 50 * 1024 * 1024,
            MAX_SCANNED_TICKETS: 10000,
            CLEANUP_INTERVAL: 7 * 24 * 60 * 60 * 1000,
            CACHE_DURATION: 24 * 60 * 60 * 1000,
            COMPRESS_THRESHOLD: 5000,
        };
    }

    async saveTickets(eventUuid: string, tickets: any[]): Promise<void> {
        try {
            if (!tickets || tickets.length === 0) return;

            const totalTickets = tickets.length;
            const useChunking = totalTickets > this.CONFIG.CHUNK_SIZE;

            if (useChunking) {
                const chunks: any[][] = [];
                const chunkCount = Math.ceil(totalTickets / this.CONFIG.CHUNK_SIZE);

                for (let i = 0; i < chunkCount; i++) {
                    const start = i * this.CONFIG.CHUNK_SIZE;
                    const end = Math.min(start + this.CONFIG.CHUNK_SIZE, totalTickets);
                    chunks.push(tickets.slice(start, end));
                }

                const chunkKeys: string[] = [];
                for (let i = 0; i < chunks.length; i++) {
                    const chunkKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_chunk_${i}`;
                    await AsyncStorage.setItem(
                        chunkKey,
                        JSON.stringify({ tickets: chunks[i], chunkIndex: i, timestamp: Date.now() }),
                    );
                    chunkKeys.push(chunkKey);
                }

                const metadataKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_meta`;
                await AsyncStorage.setItem(
                    metadataKey,
                    JSON.stringify({
                        totalCount: totalTickets,
                        chunkCount,
                        chunkSize: this.CONFIG.CHUNK_SIZE,
                        chunkKeys,
                        timestamp: Date.now(),
                        isChunked: true,
                    }),
                );

                logger.log(`Saved ${totalTickets} tickets in ${chunkCount} chunks for event ${eventUuid}`);
            } else {
                const key = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}`;
                await AsyncStorage.setItem(
                    key,
                    JSON.stringify({ tickets, timestamp: Date.now(), isChunked: false }),
                );
                logger.log(`Saved ${tickets.length} tickets for event ${eventUuid}`);
            }

            await this._createTicketIndex(eventUuid, tickets);
        } catch (error: any) {
            logger.error('Error saving tickets:', error);
            if (error.message?.includes('size') || error.message?.includes('quota')) {
                await this._cleanupOldData(eventUuid);
                logger.log('Retrying save after cleanup...');
                await this.saveTickets(eventUuid, tickets);
            }
        }
    }

    async getTickets(eventUuid: string, options: GetTicketsOptions = {}): Promise<any[] | null> {
        try {
            const { limit, offset = 0, filter } = options;

            const metadataKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_meta`;
            const metadata = await AsyncStorage.getItem(metadataKey);

            if (metadata) {
                const meta = JSON.parse(metadata);

                if (limit && limit < meta.totalCount) {
                    return await this._getPaginatedTickets(eventUuid, meta, limit, offset, filter);
                }

                const allTickets: any[] = [];
                for (let i = 0; i < meta.chunkCount; i++) {
                    const chunkKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_chunk_${i}`;
                    const chunkData = await AsyncStorage.getItem(chunkKey);
                    if (chunkData) {
                        const parsed = JSON.parse(chunkData);
                        allTickets.push(...parsed.tickets);
                    }
                }

                if (filter) return this._applyFilter(allTickets, filter);
                return allTickets;
            } else {
                const key = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}`;
                const data = await AsyncStorage.getItem(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    let tickets = parsed.tickets || [];
                    if (limit) tickets = tickets.slice(offset, offset + limit);
                    if (filter) tickets = this._applyFilter(tickets, filter);
                    return tickets;
                }
            }

            return null;
        } catch (error) {
            logger.error('Error getting tickets:', error);
            return null;
        }
    }

    private async _getPaginatedTickets(
        eventUuid: string,
        meta: any,
        limit: number,
        offset: number,
        filter?: Record<string, any>,
    ): Promise<any[]> {
        const startChunk = Math.floor(offset / this.CONFIG.CHUNK_SIZE);
        const endChunk = Math.floor((offset + limit) / this.CONFIG.CHUNK_SIZE);
        const tickets: any[] = [];

        for (let i = startChunk; i <= endChunk && i < meta.chunkCount; i++) {
            const chunkKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_chunk_${i}`;
            const chunkData = await AsyncStorage.getItem(chunkKey);
            if (chunkData) {
                const parsed = JSON.parse(chunkData);
                tickets.push(...parsed.tickets);
            }
        }

        let result = tickets.slice(offset % this.CONFIG.CHUNK_SIZE);
        result = result.slice(0, limit);
        if (filter) result = this._applyFilter(result, filter);
        return result;
    }

    private _applyFilter(tickets: any[], filter: Record<string, any>): any[] {
        if (!filter || typeof filter !== 'object') return tickets;
        return tickets.filter((ticket) => {
            for (const [key, value] of Object.entries(filter)) {
                if (ticket[key] !== value) return false;
            }
            return true;
        });
    }

    private async _createTicketIndex(eventUuid: string, tickets: any[]): Promise<void> {
        try {
            const index: any = {
                byId: {},
                byStatus: { SCANNED: [], UNSCANNED: [] },
                timestamp: Date.now(),
            };

            tickets.forEach((ticket, idx) => {
                if (ticket.ticket_number) index.byId[ticket.ticket_number] = idx;
                if (ticket.checkin_status === 'SCANNED') {
                    index.byStatus.SCANNED.push(idx);
                } else {
                    index.byStatus.UNSCANNED.push(idx);
                }
            });

            const indexKey = `${this.STORAGE_KEYS.TICKET_INDEX}_${eventUuid}`;
            await AsyncStorage.setItem(indexKey, JSON.stringify(index));
        } catch (error) {
            logger.error('Error creating ticket index:', error);
        }
    }

    async saveTicketStats(eventUuid: string, stats: any): Promise<void> {
        try {
            const key = `${this.STORAGE_KEYS.TICKET_STATS}_${eventUuid}`;
            await AsyncStorage.setItem(key, JSON.stringify({ stats, timestamp: Date.now() }));
            logger.log(`Saved ticket stats for event ${eventUuid}`);
        } catch (error) {
            logger.error('Error saving ticket stats:', error);
        }
    }

    async getTicketStats(eventUuid: string): Promise<any | null> {
        try {
            const key = `${this.STORAGE_KEYS.TICKET_STATS}_${eventUuid}`;
            const data = await AsyncStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.stats;
            }
            return null;
        } catch (error) {
            logger.error('Error getting ticket stats:', error);
            return null;
        }
    }

    async saveManualOrders(eventUuid: string, orders: any[]): Promise<void> {
        try {
            const key = `${this.STORAGE_KEYS.MANUAL_ORDERS}_${eventUuid}`;
            await AsyncStorage.setItem(key, JSON.stringify({ orders, timestamp: Date.now() }));
            logger.log(`Saved ${orders.length} manual orders for event ${eventUuid}`);
        } catch (error) {
            logger.error('Error saving manual orders:', error);
        }
    }

    async getManualOrders(eventUuid: string): Promise<any[] | null> {
        try {
            const key = `${this.STORAGE_KEYS.MANUAL_ORDERS}_${eventUuid}`;
            const data = await AsyncStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.orders;
            }
            return null;
        } catch (error) {
            logger.error('Error getting manual orders:', error);
            return null;
        }
    }

    async saveScannedTicket(ticketCode: string, scanData: Record<string, any>): Promise<void> {
        try {
            const key = `${this.STORAGE_KEYS.SCANNED_TICKETS}_${ticketCode}`;
            await AsyncStorage.setItem(
                key,
                JSON.stringify({ ...scanData, timestamp: Date.now(), synced: false }),
            );

            const scannedCount = await this._getScannedTicketsCount();
            if (scannedCount > this.CONFIG.MAX_SCANNED_TICKETS) {
                await this._cleanupOldScannedTickets();
            }

            logger.log(`Saved scanned ticket ${ticketCode}`);
        } catch (error) {
            logger.error('Error saving scanned ticket:', error);
        }
    }

    private async _getScannedTicketsCount(): Promise<number> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            return keys.filter((key) => key.startsWith(this.STORAGE_KEYS.SCANNED_TICKETS)).length;
        } catch {
            return 0;
        }
    }

    private async _cleanupOldScannedTickets(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const scannedKeys = keys.filter((key) =>
                key.startsWith(this.STORAGE_KEYS.SCANNED_TICKETS),
            );

            const ticketsWithTime = await Promise.all(
                scannedKeys.map(async (key) => {
                    const data = await AsyncStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        return { key, timestamp: parsed.timestamp || 0, synced: parsed.synced || false };
                    }
                    return null;
                }),
            );

            ticketsWithTime
                .filter((t): t is NonNullable<typeof t> => t !== null)
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(0, scannedKeys.length - this.CONFIG.MAX_SCANNED_TICKETS)
                .forEach(async (ticket) => {
                    if (ticket.synced) {
                        await AsyncStorage.removeItem(ticket.key);
                    }
                });

            logger.log('Cleaned up old scanned tickets');
        } catch (error) {
            logger.error('Error cleaning up scanned tickets:', error);
        }
    }

    async getScannedTicket(ticketCode: string): Promise<any | null> {
        try {
            const key = `${this.STORAGE_KEYS.SCANNED_TICKETS}_${ticketCode}`;
            const data = await AsyncStorage.getItem(key);
            if (data) return JSON.parse(data);
            return null;
        } catch (error) {
            logger.error('Error getting scanned ticket:', error);
            return null;
        }
    }

    async saveLastSync(eventUuid: string): Promise<void> {
        try {
            const key = `${this.STORAGE_KEYS.LAST_SYNC}_${eventUuid}`;
            await AsyncStorage.setItem(key, Date.now().toString());
        } catch (error) {
            logger.error('Error saving last sync:', error);
        }
    }

    async getLastSync(eventUuid: string): Promise<number | null> {
        try {
            const key = `${this.STORAGE_KEYS.LAST_SYNC}_${eventUuid}`;
            const timestamp = await AsyncStorage.getItem(key);
            return timestamp ? parseInt(timestamp, 10) : null;
        } catch (error) {
            logger.error('Error getting last sync:', error);
            return null;
        }
    }

    async clearEventData(eventUuid: string): Promise<void> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const eventKeys = allKeys.filter((key) => key.includes(eventUuid));
            if (eventKeys.length > 0) await AsyncStorage.multiRemove(eventKeys);
            logger.log(`Cleared ${eventKeys.length} offline data items for event ${eventUuid}`);
        } catch (error) {
            logger.error('Error clearing event data:', error);
        }
    }

    private async _cleanupOldData(eventUuid: string): Promise<void> {
        try {
            await this._cleanupOldScannedTickets();

            const lastSync = await this.getLastSync(eventUuid);
            if (lastSync && Date.now() - lastSync > this.CONFIG.CLEANUP_INTERVAL) {
                logger.log(`Cleaning up old cache for event ${eventUuid}`);
                const metadataKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_meta`;
                const metadata = await AsyncStorage.getItem(metadataKey);
                if (metadata) {
                    const meta = JSON.parse(metadata);
                    const chunksToKeep = Math.min(5, meta.chunkCount);
                    for (let i = 0; i < meta.chunkCount - chunksToKeep; i++) {
                        const chunkKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_chunk_${i}`;
                        await AsyncStorage.removeItem(chunkKey);
                    }
                }
            }
        } catch (error) {
            logger.error('Error in cleanup:', error);
        }
    }

    async getStorageSize(eventUuid: string): Promise<number> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const eventKeys = allKeys.filter((key) => key.includes(eventUuid));

            let totalSize = 0;
            for (const key of eventKeys) {
                const data = await AsyncStorage.getItem(key);
                if (data) totalSize += data.length * 2;
            }

            return totalSize;
        } catch (error) {
            logger.error('Error calculating storage size:', error);
            return 0;
        }
    }

    async getTicketCount(eventUuid: string): Promise<number> {
        try {
            const metadataKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_meta`;
            const metadata = await AsyncStorage.getItem(metadataKey);

            if (metadata) {
                const meta = JSON.parse(metadata);
                return meta.totalCount || 0;
            }

            const key = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}`;
            const data = await AsyncStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.tickets?.length || 0;
            }

            return 0;
        } catch (error) {
            logger.error('Error getting ticket count:', error);
            return 0;
        }
    }

    isCacheValid(timestamp: number): boolean {
        if (!timestamp) return false;
        return Date.now() - timestamp < this.CONFIG.CACHE_DURATION;
    }

    async getCachedEvents(): Promise<string[]> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const eventUuids = new Set<string>();

            allKeys.forEach((key) => {
                const match = key.match(/_([a-f0-9-]{36})/);
                if (match) eventUuids.add(match[1]);
            });

            return Array.from(eventUuids);
        } catch (error) {
            logger.error('Error getting cached events:', error);
            return [];
        }
    }

    async saveOrderDetails(orderNumber: string, eventUuid: string, orderDetails: any[]): Promise<void> {
        try {
            const key = `${this.STORAGE_KEYS.ORDER_DETAILS}_${eventUuid}_${orderNumber}`;
            await AsyncStorage.setItem(key, JSON.stringify({ orderDetails, timestamp: Date.now() }));
            logger.log(`Saved order details for order ${orderNumber}`);
        } catch (error) {
            logger.error('Error saving order details:', error);
        }
    }

    async getOrderDetails(orderNumber: string, eventUuid: string): Promise<any[] | null> {
        try {
            const key = `${this.STORAGE_KEYS.ORDER_DETAILS}_${eventUuid}_${orderNumber}`;
            const data = await AsyncStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.orderDetails;
            }
            return null;
        } catch (error) {
            logger.error('Error getting order details:', error);
            return null;
        }
    }

    async clearOrderDetails(orderNumber: string, eventUuid: string): Promise<void> {
        try {
            const key = `${this.STORAGE_KEYS.ORDER_DETAILS}_${eventUuid}_${orderNumber}`;
            await AsyncStorage.removeItem(key);
            logger.log(`Cleared order details cache for order ${orderNumber}`);
        } catch (error) {
            logger.error('Error clearing order details:', error);
        }
    }

    async cleanupAllOldData(): Promise<number> {
        try {
            const events = await this.getCachedEvents();
            let cleanedCount = 0;

            for (const eventUuid of events) {
                const lastSync = await this.getLastSync(eventUuid);
                if (lastSync && Date.now() - lastSync > this.CONFIG.CLEANUP_INTERVAL) {
                    await this._cleanupOldData(eventUuid);
                    cleanedCount++;
                }
            }

            logger.log(`Cleaned up old data for ${cleanedCount} events`);
            return cleanedCount;
        } catch (error) {
            logger.error('Error in global cleanup:', error);
            return 0;
        }
    }

    async updateTicketInCache(
        eventUuid: string,
        ticketCode: string,
        updates: Record<string, any>,
    ): Promise<void> {
        try {
            const metadataKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_meta`;
            const metadata = await AsyncStorage.getItem(metadataKey);

            if (metadata) {
                const meta = JSON.parse(metadata);
                let ticketFound = false;

                for (let i = 0; i < meta.chunkCount; i++) {
                    const chunkKey = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}_chunk_${i}`;
                    const chunkData = await AsyncStorage.getItem(chunkKey);

                    if (chunkData) {
                        const parsed = JSON.parse(chunkData);
                        const ticketIndex = parsed.tickets.findIndex((t: any) => t.code === ticketCode);

                        if (ticketIndex !== -1) {
                            parsed.tickets[ticketIndex] = { ...parsed.tickets[ticketIndex], ...updates };
                            await AsyncStorage.setItem(chunkKey, JSON.stringify(parsed));
                            ticketFound = true;
                            logger.log(`Updated ticket ${ticketCode} in chunk ${i}`);
                            break;
                        }
                    }
                }

                if (!ticketFound) logger.warn(`Ticket ${ticketCode} not found in cached chunks`);
            } else {
                const key = `${this.STORAGE_KEYS.TICKETS}_${eventUuid}`;
                const data = await AsyncStorage.getItem(key);

                if (data) {
                    const parsed = JSON.parse(data);
                    const tickets = parsed.tickets || [];
                    const ticketIndex = tickets.findIndex((t: any) => t.code === ticketCode);

                    if (ticketIndex !== -1) {
                        tickets[ticketIndex] = { ...tickets[ticketIndex], ...updates };
                        await AsyncStorage.setItem(key, JSON.stringify({ ...parsed, tickets }));
                        logger.log(`Updated ticket ${ticketCode} in cached tickets list`);
                    } else {
                        logger.warn(`Ticket ${ticketCode} not found in cached tickets`);
                    }
                }
            }
        } catch (error) {
            logger.error('Error updating ticket in cache:', error);
        }
    }
}

export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
