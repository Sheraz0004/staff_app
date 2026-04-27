import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface EventStat {
  id: number;
  title: string;
  attendanceType: string;
  seatingType: string;
  eventType: string;
  startDateTime: string;
  endDateTime: string;
  currency: string | null;
  promoted: boolean;
  createdBy: string;
  staffId: string | null;
  status: string;
  banner: string;
  images: string[];
  createdAt: string;
}

interface EventsState {
  events: EventStat[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  loadingMore: boolean;
  totalCount: number;
  activeCount: number;
  cancelledCount: number;
  locations: number;
  searchQuery: string;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  loadingMore: false,
  totalCount: 0,
  activeCount: 0,
  cancelledCount: 0,
  locations: 0,
  searchQuery: '',
};

export const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<EventStat[]>) => {
      state.events = action.payload;
    },
    appendEvents: (state, action: PayloadAction<EventStat[]>) => {
      state.events = [...state.events, ...action.payload];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },
    setLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.loadingMore = action.payload;
    },
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },
    setActiveCount: (state, action: PayloadAction<number>) => {
      state.activeCount = action.payload;
    },
    setCancelledCount: (state, action: PayloadAction<number>) => {
      state.cancelledCount = action.payload;
    },
    setLocations: (state, action: PayloadAction<number>) => {
      state.locations = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetEvents: () => initialState,
  },
});

// Selectors — state path: state.entities.events
export const selectEvents = (state: any): EventStat[] =>
  state.entities.events.events ?? [];
export const selectEventsLoading = (state: any): boolean =>
  state.entities.events.loading ?? false;
export const selectEventsError = (state: any): string | null =>
  state.entities.events.error ?? null;
export const selectEventsPage = (state: any): number =>
  state.entities.events.page ?? 1;
export const selectEventsTotalPages = (state: any): number =>
  state.entities.events.totalPages ?? 1;
export const selectEventsLoadingMore = (state: any): boolean =>
  state.entities.events.loadingMore ?? false;
export const selectEventsTotalCount = (state: any): number =>
  state.entities.events.totalCount ?? 0;
export const selectEventsActiveCount = (state: any): number =>
  state.entities.events.activeCount ?? 0;
export const selectEventsCancelledCount = (state: any): number =>
  state.entities.events.cancelledCount ?? 0;
export const selectEventsLocations = (state: any): number =>
  state.entities.events.locations ?? 0;
export const selectEventsSearchQuery = (state: any): string =>
  state.entities.events.searchQuery ?? '';

export const {
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
  setSearchQuery,
  resetEvents,
} = eventsSlice.actions;

export default eventsSlice.reducer;
