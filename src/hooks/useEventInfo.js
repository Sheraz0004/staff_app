import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { eventService } from '../api/apiService';
import { fetchUpdatedScanCount, updateEventInfoScanCount } from '../utils/scanCountUpdater';
import { logger } from '../utils/logger';

/**
 * Manages event info state for the main tab navigator.
 *
 * Responsibilities:
 * - Initialise from route params and keep in sync when they change
 * - Auto-fetch event on mount if none is present (app restart scenario)
 * - Provide handleEventChange — fetches full event info, persists UUID,
 *   updates state, and returns the resolved object so callers can use it
 *   for navigation without a second fetch
 * - Provide updateScanCount for post-scan refreshes
 */
const transformEventInfo = (data, eventUuid) => ({
  staff_name: data?.staff_name,
  event_title: data?.event_title,
  cityName: data?.location?.city,
  date: data?.start_date,
  time: data?.start_time,
  userId: data?.staff_id,
  scanCount: data?.scan_count,
  event_uuid: data?.location?.uuid,
  eventUuid,
});

export const useEventInfo = (routeEventInfo, userId) => {
  const [eventInformation, setEventInformation] = useState(routeEventInfo);

  // Keep in sync when navigation passes a new event via route params
  useEffect(() => {
    if (routeEventInfo) setEventInformation(routeEventInfo);
  }, [routeEventInfo]);

  // Fetch on mount if no event info is available (app restart / cold open)
  useEffect(() => {
    const fetchIfNeeded = async () => {
      if (eventInformation?.eventUuid) return;

      try {
        const lastEventUuid = await SecureStore.getItemAsync('lastSelectedEventUuid');

        if (lastEventUuid) {
          const res = await eventService.fetchEventInfo(lastEventUuid);
          setEventInformation(transformEventInfo(res?.data, lastEventUuid));
          return;
        }

        // No stored UUID — fall back to first event in the user's event list
        const staffRes = await eventService.fetchStaffEvents(userId);
        const list = staffRes?.data;
        if (!list?.length) return;

        const first = list[0];
        const selected = first.events?.length > 0 ? first.events[0] : first;
        if (!selected) return;

        const eventUuid = selected.uuid || selected.eventUuid;
        await SecureStore.setItemAsync('lastSelectedEventUuid', eventUuid);
        const res = await eventService.fetchEventInfo(eventUuid);
        setEventInformation(transformEventInfo(res?.data, eventUuid));
      } catch (error) {
        logger.error('useEventInfo — error fetching event on mount:', error);
      }
    };

    fetchIfNeeded();
  }, []);

  /**
   * Core event-change handler.
   *
   * - Persists the selected event UUID to SecureStore
   * - Fetches full event info from the API
   * - Updates shared eventInformation state
   * - Returns the resolved event object so the caller can use it
   *   immediately (e.g. for navigation params) without waiting for a
   *   re-render
   */
  const handleEventChange = async (newEvent) => {
    const eventUuid = newEvent.uuid || newEvent.eventUuid;

    try {
      if (eventUuid) await SecureStore.setItemAsync('lastSelectedEventUuid', eventUuid);
    } catch (error) {
      logger.error('useEventInfo — error persisting event UUID:', error);
    }

    let resolved;

    try {
      if (eventUuid) {
        const { data } = await eventService.fetchEventInfo(eventUuid);
        resolved = {
          staff_name: data?.staff_name || newEvent.staff_name,
          event_title: data?.event_title || newEvent.event_title || newEvent.title,
          cityName: data?.location?.city || newEvent.cityName,
          date: data?.start_date || newEvent.date,
          time: data?.start_time || newEvent.time,
          userId: data?.staff_id || newEvent.userId,
          scanCount: data?.scan_count ?? newEvent.scanCount ?? 0,
          event_uuid: data?.location?.uuid || newEvent.event_uuid,
          eventUuid,
        };
      }
    } catch (error) {
      logger.error('useEventInfo — error fetching event info:', error);
    }

    // Graceful fallback: use whatever data the caller already has
    if (!resolved) {
      resolved = {
        eventUuid,
        event_title: newEvent.title || newEvent.event_title,
        uuid: eventUuid,
        cityName: newEvent.cityName || eventInformation?.cityName || 'Accra',
        date: newEvent.date || eventInformation?.date,
        time: newEvent.time || eventInformation?.time,
        staff_name: newEvent.staff_name || eventInformation?.staff_name,
        userId: newEvent.userId || eventInformation?.userId,
        scanCount: newEvent.scanCount ?? eventInformation?.scanCount ?? 0,
        event_uuid: newEvent.event_uuid || eventInformation?.event_uuid,
      };
    }

    setEventInformation(resolved);
    return resolved;
  };

  const updateScanCount = async () => {
    if (!eventInformation?.eventUuid) return;
    try {
      const newCount = await fetchUpdatedScanCount(eventInformation.eventUuid);
      if (newCount !== null) {
        setEventInformation((prev) => updateEventInfoScanCount(prev, newCount));
      }
    } catch (error) {
      logger.error('useEventInfo — error updating scan count:', error);
    }
  };

  return { eventInformation, updateScanCount, handleEventChange };
};
