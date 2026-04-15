import { AppDispatch } from '../store';
import { EVENT_SERVICES } from '../../services/EventService';
import {
  setEvents,
  appendEvents,
  setLoading,
  setError,
  setPage,
  setTotalPages,
  setLoadingMore,
  setTotalCount,
  setActiveCount,
  setCancelledCount,
  setLocations,
} from '../reducers/eventsReducer';

export const fetchEventStatsThunk = (
  page: number = 1,
  eventClass: string = '',
  isLoadMore: boolean = false,
) =>
  async (dispatch: AppDispatch) => {
    if (isLoadMore) {
      dispatch(setLoadingMore(true));
    } else {
      dispatch(setLoading(true));
      dispatch(setError(null));
    }

    try {
      const response = await EVENT_SERVICES.fetchEventStats({ page, pageSize: 10, eventClass });
      const data = response.data;

      if (isLoadMore) {
        dispatch(appendEvents(data.events ?? []));
      } else {
        dispatch(setEvents(data.events ?? []));
      }

      dispatch(setPage(data.currentPage ?? page));
      dispatch(setTotalPages(data.totalPages ?? 1));
      dispatch(setTotalCount(data.totalElements ?? 0));
      dispatch(setActiveCount(data.activeEvents ?? 0));
      dispatch(setCancelledCount(data.cancelledEvents ?? 0));
      dispatch(setLocations(data.eventLocations ?? 0));
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch events';
      dispatch(setError(msg));
    } finally {
      if (isLoadMore) {
        dispatch(setLoadingMore(false));
      } else {
        dispatch(setLoading(false));
      }
    }
  };
