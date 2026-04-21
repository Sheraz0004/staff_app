import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EVENT_SERVICES } from '../../services/EventService';

export interface SellEventDetail {
  eventUuid: string;
  event_title: string;
  date: string;
  time: string;
  staff_name: string;
  scanCount: number | string;
  cityName: string | undefined;
}

const PAGE_SIZE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SellEventItem {
  uuid: string;
  title: string;
  banner: string | null;
  formattedStartDate: string;
  timeDuration: string;
  location: string | null;
  globalLocation: string | null;
  priceFrom: number | null;
  date?: string;
  time?: string;
  cityName?: string;
  event_title?: string;
  [key: string]: any;
}

export interface SelectedSellEvent {
  uuid: string;
  eventUuid: string;
  title: string;
  event_title: string;
  cityName: string | undefined;
  date: string | undefined;
  time: string | undefined;
}

interface SellCheckinState {
  events: SellEventItem[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  searchQuery: string;
  selectedFilter: string | null;
  selectedMonthIndex: number;
  selectedMonthYear: number;
  selectedEvent: SelectedSellEvent | null;
  eventDetail: SellEventDetail | null;
  eventDetailLoading: boolean;
  activeView: 'TicketsTab' | 'BoxOfficeTab';
  activeHeaderTab: string;
}

const initialState: SellCheckinState = {
  events: [],
  loading: true,
  loadingMore: false,
  refreshing: false,
  error: null,
  page: 1,
  hasMore: false,
  searchQuery: '',
  selectedFilter: null,
  selectedMonthIndex: new Date().getMonth(),
  selectedMonthYear: new Date().getFullYear(),
  selectedEvent: null,
  eventDetail: null,
  eventDetailLoading: false,
  activeView: 'TicketsTab',
  activeHeaderTab: 'Sell',
};

// ─── Date Range Helper ────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getDateRange = (
  filter: string | null,
  monthIndex: number,
  monthYear: number,
): { start_date?: string; end_date?: string } => {
  if (!filter || filter === 'All') return {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'Today':
      return { start_date: fmtDate(today), end_date: fmtDate(today) };
    case 'Tomorrow': {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return { start_date: fmtDate(d), end_date: fmtDate(d) };
    }
    case 'This Week': {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start_date: fmtDate(start), end_date: fmtDate(end) };
    }
    case 'Month': {
      const first = new Date(monthYear, monthIndex, 1);
      const last = new Date(monthYear, monthIndex + 1, 0);
      return { start_date: fmtDate(first), end_date: fmtDate(last) };
    }
    default:
      return {};
  }
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchEventDetailThunk = createAsyncThunk(
  'sellCheckin/fetchEventDetail',
  async (eventUuid: string, { rejectWithValue }) => {
    try {
      const res = await EVENT_SERVICES.fetchEventInfo(eventUuid);
      const info = res?.data;
      return {
        eventUuid,
        event_title: info?.eventTitle || info?.event_title || '',
        date: info?.startDate || info?.start_date || '',
        time: info?.startTime || info?.start_time || '',
        staff_name: info?.staff_name || '',
        scanCount: info?.scanCount ?? info?.scan_count ?? 0,
        cityName: info?.location?.city ?? undefined,
      } as SellEventDetail;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to fetch event detail');
    }
  },
);

export const fetchSellEventsThunk = createAsyncThunk(
  'sellCheckin/fetchEvents',
  async (
    { page, reset, isRefresh = false }: { page: number; reset: boolean; isRefresh?: boolean },
    { getState, rejectWithValue },
  ) => {
    try {
      const { sellCheckin } = getState() as { sellCheckin: SellCheckinState };
      const { searchQuery, selectedFilter, selectedMonthIndex, selectedMonthYear } = sellCheckin;
      const dateRange = getDateRange(selectedFilter, selectedMonthIndex, selectedMonthYear);

      const res = await EVENT_SERVICES.fetchMyEvents({
        page,
        page_size: PAGE_SIZE,
        sort_by: 'startDate',
        sort_dir: 'asc',
        search: searchQuery || undefined,
        ...dateRange,
      });

      const data = res?.data;
      const raw: any[] = data?.events ?? [];
      const hasMore: boolean = data?.hasMore ?? false;

      const events = raw
        .filter((e: any) => e.id)
        .map((e: any): SellEventItem => ({ ...e, uuid: String(e.id) }));

      return { events, hasMore, page, reset };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to fetch events');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const sellCheckinSlice = createSlice({
  name: 'sellCheckin',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setFilter(state, action: PayloadAction<string | null>) {
      state.selectedFilter = action.payload === 'All' ? null : action.payload;
    },
    setMonthFilter(state, action: PayloadAction<{ monthIndex: number; year: number }>) {
      state.selectedMonthIndex = action.payload.monthIndex;
      state.selectedMonthYear = action.payload.year;
      state.selectedFilter = 'Month';
    },
    clearFilter(state) {
      state.selectedFilter = null;
    },
    setSelectedEvent(state, action: PayloadAction<SelectedSellEvent>) {
      state.selectedEvent = action.payload;
      state.eventDetail = null;
    },
    setActiveView(state, action: PayloadAction<'TicketsTab' | 'BoxOfficeTab'>) {
      state.activeView = action.payload;
    },
    setActiveHeaderTab(state, action: PayloadAction<string>) {
      state.activeHeaderTab = action.payload;
    },
    resetSellScreenState(state) {
      state.activeView = 'TicketsTab';
      state.activeHeaderTab = 'Sell';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellEventsThunk.pending, (state, action) => {
        const { reset, isRefresh } = action.meta.arg;
        if (isRefresh) {
          state.refreshing = true;
        } else if (reset) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchSellEventsThunk.fulfilled, (state, action) => {
        const { events, hasMore, page, reset } = action.payload;
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
        state.events = reset ? events : [...state.events, ...events];
        state.hasMore = hasMore;
        state.page = page;
      })
      .addCase(fetchSellEventsThunk.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
        state.error = String(action.payload ?? action.error.message ?? 'Failed');
        if (action.meta.arg.reset && !action.meta.arg.isRefresh) {
          state.events = [];
        }
      });

    builder
      .addCase(fetchEventDetailThunk.pending, (state) => {
        state.eventDetailLoading = true;
      })
      .addCase(fetchEventDetailThunk.fulfilled, (state, action) => {
        state.eventDetailLoading = false;
        state.eventDetail = action.payload;
      })
      .addCase(fetchEventDetailThunk.rejected, (state) => {
        state.eventDetailLoading = false;
      });
  },
});

export const {
  setSearchQuery,
  setFilter,
  setMonthFilter,
  clearFilter,
  setSelectedEvent,
  setActiveView,
  setActiveHeaderTab,
  resetSellScreenState,
} = sellCheckinSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectSellEvents = (state: any): SellEventItem[] =>
  state.sellCheckin.events ?? [];
export const selectSellLoading = (state: any): boolean =>
  state.sellCheckin.loading ?? false;
export const selectSellLoadingMore = (state: any): boolean =>
  state.sellCheckin.loadingMore ?? false;
export const selectSellRefreshing = (state: any): boolean =>
  state.sellCheckin.refreshing ?? false;
export const selectSellHasMore = (state: any): boolean =>
  state.sellCheckin.hasMore ?? false;
export const selectSellPage = (state: any): number =>
  state.sellCheckin.page ?? 1;
export const selectSellError = (state: any): string | null =>
  state.sellCheckin.error ?? null;
export const selectSellSearchQuery = (state: any): string =>
  state.sellCheckin.searchQuery ?? '';
export const selectSellSelectedFilter = (state: any): string | null =>
  state.sellCheckin.selectedFilter ?? null;
export const selectSellMonthIndex = (state: any): number =>
  state.sellCheckin.selectedMonthIndex ?? new Date().getMonth();
export const selectSellMonthYear = (state: any): number =>
  state.sellCheckin.selectedMonthYear ?? new Date().getFullYear();
export const selectSellSelectedEvent = (state: any): SelectedSellEvent | null =>
  state.sellCheckin.selectedEvent ?? null;
export const selectSellEventDetail = (state: any): SellEventDetail | null =>
  state.sellCheckin.eventDetail ?? null;
export const selectSellEventDetailLoading = (state: any): boolean =>
  state.sellCheckin.eventDetailLoading ?? false;
export const selectSellActiveView = (state: any): 'TicketsTab' | 'BoxOfficeTab' =>
  state.sellCheckin.activeView ?? 'TicketsTab';
export const selectSellActiveHeaderTab = (state: any): string =>
  state.sellCheckin.activeHeaderTab ?? 'Sell';

export default sellCheckinSlice.reducer;
