import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as SecureStore from "expo-secure-store";
import { EVENT_SERVICES } from "../services/EventService";
import {
  fetchUpdatedScanCount,
  updateEventInfoScanCount,
} from "../utils/scanCountUpdater";
import { logger } from "../utils/logger";
import { logout } from "../redux/reducers/userReducer";
import { resetDashboard } from "../redux/reducers/dashboardReducer";
import { clearUserSession } from "../utils/clearUserSession";

interface EventInformation {
  staff_name?: string;
  event_title?: string;
  cityName?: string;
  date?: string;
  time?: string;
  userId?: string;
  scanCount?: number;
  event_uuid?: string;
  eventUuid?: string;
  uuid?: string;
  title?: string;
  [key: string]: any;
}

const transformEventInfo = (
  data: any,
  eventUuid: string,
): EventInformation => ({
  staff_name: data?.staff_name,
  event_title: data?.eventTitle || data?.event_title,
  cityName: data?.location?.city,
  date: data?.startDate || data?.start_date,
  time: data?.startTime || data?.start_time,
  userId: data?.staff_id,
  scanCount: data?.scanCount ?? data?.scan_count,
  event_uuid: data?.location?.uuid,
  eventUuid,
});

export const useEventInfo = (
  routeEventInfo: EventInformation | null,
  userId: string,
) => {
  const dispatch = useDispatch();
  const [eventInformation, setEventInformation] =
    useState<EventInformation | null>(routeEventInfo);

  const handleUnauthorized = async () => {
    dispatch(resetDashboard());
    dispatch(logout());
    await clearUserSession();
  };

  useEffect(() => {
    if (routeEventInfo) setEventInformation(routeEventInfo);
  }, [routeEventInfo]);

  useEffect(() => {
    const fetchIfNeeded = async () => {
      if (eventInformation?.eventUuid) return;

      try {
        const lastEventUuid = await SecureStore.getItemAsync(
          "lastSelectedEventUuid",
        );

        if (lastEventUuid) {
          const res = await EVENT_SERVICES.fetchEventInfo(lastEventUuid);
          setEventInformation(transformEventInfo(res?.data, lastEventUuid));
          return;
        }

        const staffRes = await EVENT_SERVICES.fetchStaffEvents(userId);
        const list = staffRes?.data;
        if (!list?.length) return;

        const first = list[0];
        const selected = first.events?.length > 0 ? first.events[0] : first;
        if (!selected) return;

        const eventUuid = selected.uuid || selected.eventUuid;
        await SecureStore.setItemAsync("lastSelectedEventUuid", eventUuid);
        const res = await EVENT_SERVICES.fetchEventInfo(eventUuid);
        setEventInformation(transformEventInfo(res?.data, eventUuid));
      } catch (error: any) {
        logger.error(
          "useEventInfo — error fetching event on mount:",
          error.response?.data,
        );
        if (
          error?.response?.status === 401 ||
          error?.response?.data?.statusCode === 401
        ) {
          await handleUnauthorized();
        }
      }
    };

    fetchIfNeeded();
  }, []);

  const handleEventChange = async (
    newEvent: EventInformation,
  ): Promise<EventInformation> => {
    const eventUuid = newEvent.uuid || newEvent.eventUuid;

    try {
      if (eventUuid)
        await SecureStore.setItemAsync("lastSelectedEventUuid", eventUuid);
    } catch (error) {
      logger.error("useEventInfo — error persisting event UUID:", error);
    }

    let resolved: EventInformation | undefined;

    try {
      if (eventUuid) {
        const { data } = await EVENT_SERVICES.fetchEventInfo(eventUuid);
        resolved = {
          staff_name: data?.staff_name || newEvent.staff_name,
          event_title:
            data?.eventTitle ||
            data?.event_title ||
            newEvent.event_title ||
            newEvent.title,
          cityName: data?.location?.city || newEvent.cityName,
          date: data?.startDate || data?.start_date || newEvent.date,
          time: data?.startTime || data?.start_time || newEvent.time,
          userId: data?.staff_id || newEvent.userId,
          scanCount:
            data?.scanCount ?? data?.scan_count ?? newEvent.scanCount ?? 0,
          event_uuid: data?.location?.uuid || newEvent.event_uuid,
          eventUuid,
        };
      }
    } catch (error) {
      logger.error("useEventInfo — error fetching event info:", error);
    }

    if (!resolved) {
      resolved = {
        eventUuid,
        event_title: newEvent.title || newEvent.event_title,
        uuid: eventUuid,
        cityName: newEvent.cityName || eventInformation?.cityName || "Accra",
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

  const updateScanCount = async (): Promise<void> => {
    if (!eventInformation?.eventUuid) return;
    try {
      const newCount = await fetchUpdatedScanCount(eventInformation.eventUuid);
      if (newCount !== null) {
        setEventInformation((prev) => updateEventInfoScanCount(prev, newCount));
      }
    } catch (error) {
      logger.error("useEventInfo — error updating scan count:", error);
    }
  };

  return { eventInformation, updateScanCount, handleEventChange };
};
