import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TICKET_SERVICES } from '../../services/TicketService';
import { API_BASE_URL } from '../../config/env';

const PAGE_SIZE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketStats {
  total: number;
  scanned: number;
  unscanned: number;
}

export interface TicketItem {
  id: string;
  type: string;
  price: string;
  date: string;
  status: string;
  note: string;
  uuid: string;
  ticketHolder: string;
  lastScannedByName: string;
  scanCount: string | number;
  lastScannedOn: string;
  qrCodeUrl: string;
  currency: string;
  email: string;
  name: string;
  category: string;
  ticketClass: string;
  scannedBy: string;
  staffId: string;
  scannedOn: string;
}

interface TicketsTabState {
  tickets: TicketItem[];
  stats: TicketStats;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  page: number;
  hasMore: boolean;
  searchText: string;
  selectedTab: string;
  error: string | null;
}

const initialState: TicketsTabState = {
  tickets: [],
  stats: { total: 0, scanned: 0, unscanned: 0 },
  loading: false,
  loadingMore: false,
  refreshing: false,
  page: 1,
  hasMore: false,
  searchText: '',
  selectedTab: 'All',
  error: null,
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

export const mapTicket = (ticket: any): TicketItem => ({
  id: ticket.ticketNumber || 'No Record',
  type: ticket.ticketType || 'No Record',
  price: ticket.ticketPrice?.toString() || 'No Record',
  date: ticket.formattedDate || 'No Record',
  status: ticket.checkinStatus === 'SCANNED' ? 'Scanned' : 'Unscanned',
  note: ticket.note || 'No note added',
  uuid: ticket.id?.toString() || ticket.ticketNumber || 'No Record',
  ticketHolder: ticket.ticketHolder || 'No Record',
  lastScannedByName: ticket.scannedBy?.name || 'No Record',
  scanCount: ticket.scanCount ?? 'No Record',
  lastScannedOn: ticket.scannedBy?.scannedOn || 'No Record',
  qrCodeUrl: `${API_BASE_URL}ticket/scan/${ticket.eventId}/${ticket.code}/`,
  currency: ticket.currency || 'No Record',
  email: ticket.userEmail || 'No Record',
  name: `${ticket.userFirstName || ''} ${ticket.userLastName || ''}`.trim() || 'No Record',
  category: ticket.category || 'No Record',
  ticketClass: ticket.ticketClass || 'No Record',
  scannedBy: ticket.scannedBy?.name || 'No Record',
  staffId: ticket.scannedBy?.staffId || 'No Record',
  scannedOn: ticket.scannedBy?.scannedOn || 'No Record',
});

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTicketStatsThunk = createAsyncThunk(
  'ticketsTab/fetchStats',
  async (eventUuid: string, { rejectWithValue }) => {
    try {
      const res = await TICKET_SERVICES.fetchStats(eventUuid);
      // console.log('[Tickets] Stats response:', JSON.stringify(res?.data, null, 2));
      const data = res?.data?.data || {};
      return {
        total: data.total || 0,
        scanned: data.scanned || 0,
        unscanned: data.unscanned || 0,
      } as TicketStats;
    } catch (e: any) {
      console.log('[Tickets] Stats error:', e?.message, e?.response?.data);
      return rejectWithValue(e?.message ?? 'Failed to fetch stats');
    }
  },
);

export const fetchTicketsThunk = createAsyncThunk(
  'ticketsTab/fetchTickets',
  async (
    { eventUuid, page, reset }: {
      eventUuid: string;
      page: number;
      reset: boolean;
      isRefresh?: boolean;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const { ticketsTab } = getState() as { ticketsTab: TicketsTabState };
      const { selectedTab, searchText } = ticketsTab;

      const checkinStatus =
        selectedTab === 'Scanned' ? 'SCANNED'
          : selectedTab === 'Unscanned' ? 'UNSCANNED'
          : undefined;

      const res = await TICKET_SERVICES.fetchList(
        eventUuid,
        page,
        PAGE_SIZE,
        'PAID',
        checkinStatus,
        searchText.trim() || undefined,
      );
      // console.log('[Tickets] List response:', JSON.stringify(res?.data, null, 2));
      const body = res?.data || {};
      const raw: any[] = body.data || [];
      const currentPage = body.currentPage || page;
      const totalPages = body.totalPages || page;

      return {
        tickets: raw.map(mapTicket),
        page: currentPage,
        hasMore: currentPage < totalPages,
        reset,
      };
    } catch (e: any) {
      console.log('[Tickets] List error:', e?.message, e?.response?.data);
      return rejectWithValue(e?.message ?? 'Failed to fetch tickets');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const ticketsTabSlice = createSlice({
  name: 'ticketsTab',
  initialState,
  reducers: {
    setTicketsSelectedTab(state, action: PayloadAction<string>) {
      state.selectedTab = action.payload;
      state.page = 1;
      state.hasMore = false;
    },
    setTicketsSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },
    resetTicketsTab(state) {
      state.tickets = [];
      state.page = 1;
      state.hasMore = false;
      state.loading = false;
      state.searchText = '';
      state.selectedTab = 'All';
      state.stats = { total: 0, scanned: 0, unscanned: 0 };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTicketStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchTicketStatsThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? 'Failed to fetch ticket stats';
      });

    builder
      .addCase(fetchTicketsThunk.pending, (state, action) => {
        const { reset, isRefresh = false } = action.meta.arg;
        state.error = null;
        if (isRefresh) {
          state.refreshing = true;
        } else if (reset) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchTicketsThunk.fulfilled, (state, action) => {
        const { tickets, page, hasMore, reset } = action.payload;
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
        state.tickets = reset ? tickets : [...state.tickets, ...tickets];
        state.page = page;
        state.hasMore = hasMore;
      })
      .addCase(fetchTicketsThunk.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.refreshing = false;
        state.error = (action.payload as string) ?? 'Failed to fetch tickets';
      });
  },
});

export const { setTicketsSelectedTab, setTicketsSearchText, resetTicketsTab } =
  ticketsTabSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectTickets = (state: any): TicketItem[] =>
  state.ticketsTab.tickets ?? [];
export const selectTicketStats = (state: any): TicketStats =>
  state.ticketsTab.stats ?? { total: 0, scanned: 0, unscanned: 0 };
export const selectTicketsLoading = (state: any): boolean =>
  state.ticketsTab.loading ?? false;
export const selectTicketsLoadingMore = (state: any): boolean =>
  state.ticketsTab.loadingMore ?? false;
export const selectTicketsRefreshing = (state: any): boolean =>
  state.ticketsTab.refreshing ?? false;
export const selectTicketsPage = (state: any): number =>
  state.ticketsTab.page ?? 1;
export const selectTicketsHasMore = (state: any): boolean =>
  state.ticketsTab.hasMore ?? false;
export const selectTicketsSearchText = (state: any): string =>
  state.ticketsTab.searchText ?? '';
export const selectTicketsSelectedTab = (state: any): string =>
  state.ticketsTab.selectedTab ?? 'All';
export const selectTicketsError = (state: any): string | null =>
  state.ticketsTab.error ?? null;

export default ticketsTabSlice.reducer;
