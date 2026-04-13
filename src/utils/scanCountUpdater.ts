import { eventService } from '../api/apiService';
import { logger } from './logger';

export const fetchUpdatedScanCount = async (eventUuid: string): Promise<number | null> => {
    try {
        const eventInfoData = await eventService.fetchEventInfo(eventUuid);
        return eventInfoData?.data?.scan_count || 0;
    } catch (error) {
        logger.error('Error fetching updated scan count:', error);
        return null;
    }
};

export const updateEventInfoScanCount = (eventInfo: any, newScanCount: number | null): any => {
    if (!eventInfo || newScanCount === null) return eventInfo;
    return { ...eventInfo, scanCount: newScanCount };
};
