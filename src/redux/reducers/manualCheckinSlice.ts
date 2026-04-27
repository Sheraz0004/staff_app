import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CHECK_IN_SERVICES } from '../../services/CheckInService';
import { EVENT_SERVICES } from '../../services/EventService';


export interface ScannedBy {
  name: string;
  staff_id: string | number;
  scanned_on: string;
  email: string;
}

export interface LegacyTicket {
  code: string;
  uuid: string;
  ticket_number: string;
  ticket_type: string;
  ticket_class: string;
  ticket_price: number;
  checkin_status: 'UNSCANNED' | 'SCANNED';
  scan_count: number;
  note: string | null;
  message: string | null;
  category: string;
  currency: string;
  formatted_date: string;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_phone: string;
  ticket_holder: string;
  scanned_by: ScannedBy | null;
  last_scanned_on: string | null;
  last_scanned_by_name: string | null;
}

export interface OrderResult {
  orderId: number;
  orderNumber: string;
  status: string;
  boughtBy: string;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventBanner: string | null;
  total: number;
  subtotal: number;
  totalVat: number;
  discountedValue: number | null;
  currency: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
  buyerFirstName: string | null;
  buyerLastName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  tickets: any[];
}

export interface CachedEventInfo {
  eventUuid: string;
  event_title: string;
  date: string;
  time: string;
  cityName: string | undefined;
  scanCount: number | undefined;
}

interface ManualCheckinState {
  lookupResults: OrderResult[];
  lookupLoading: boolean;
  lookupError: string | null;

  allOrders: OrderResult[];
  allOrdersLoading: boolean;
  allOrdersLoadingMore: boolean;
  allOrdersRefreshing: boolean;
  allOrdersPage: number;
  allOrdersHasMore: boolean;

  ticketDetails: LegacyTicket[];
  ticketDetailsLoading: boolean;
  ticketDetailsError: string | null;
  currentOrderNumber: string | null;
  currentEventUuid: string | null;

  checkingInCode: string | null;
  checkingInAll: boolean;

  eventInfoCache: Record<string, CachedEventInfo>;

  checkinSuccessCount: number;
}

const normalizeOrder = (o: any): OrderResult => ({
  orderId: o.orderId ?? o.id ?? 0,
  orderNumber: o.orderNumber ?? o.order_number ?? '',
  status: o.status ?? '',
  boughtBy: o.boughtBy ?? o.bought_by ?? '',
  eventId: o.eventId ?? o.event_id ?? 0,
  eventTitle: o.eventTitle ?? o.event_title ?? '',
  eventDate: o.eventDate ?? o.event_date ?? '',
  eventStartTime: o.eventStartTime ?? o.event_start_time ?? '',
  eventEndTime: o.eventEndTime ?? o.event_end_time ?? '',
  eventBanner: o.eventBanner ?? o.event_banner ?? null,
  total: o.total ?? 0,
  subtotal: o.subtotal ?? 0,
  totalVat: o.totalVat ?? o.total_vat ?? 0,
  discountedValue: o.discountedValue ?? o.discounted_value ?? null,
  currency: o.currency ?? '',
  paymentMethod: o.paymentMethod ?? o.payment_method ?? null,
  transactionId: o.transactionId ?? o.transaction_id ?? null,
  createdAt: o.createdAt ?? o.created_at ?? '',
  buyerFirstName: o.buyerFirstName ?? o.buyer_first_name ?? null,
  buyerLastName: o.buyerLastName ?? o.buyer_last_name ?? null,
  buyerEmail: o.buyerEmail ?? o.buyer_email ?? null,
  buyerPhone: o.buyerPhone ?? o.buyer_phone ?? null,
  tickets: o.tickets ?? [],
});

const initialState: ManualCheckinState = {
  lookupResults: [],
  lookupLoading: false,
  lookupError: null,
  allOrders: [],
  allOrdersLoading: false,
  allOrdersLoadingMore: false,
  allOrdersRefreshing: false,
  allOrdersPage: 1,
  allOrdersHasMore: true,
  ticketDetails: [],
  ticketDetailsLoading: true,
  ticketDetailsError: null,
  currentOrderNumber: null,
  currentEventUuid: null,
  checkingInCode: null,
  checkingInAll: false,
  eventInfoCache: {},
  checkinSuccessCount: 0,
};


const normalizeScannedBy = (s: any): ScannedBy | null => {
  if (!s) return null;
  return {
    name: s.name || 'No Record',
    staff_id: s.staff_id ?? s.staffId ?? 'No Record',
    scanned_on: s.scanned_on || s.scannedAt || s.scannedOn || '',
    email: s.email || 'No Record',
  };
};

export const normalizeTicket = (t: any): LegacyTicket => ({
  code: t.code || '',
  uuid: t.uuid || String(t.id || ''),
  ticket_number: t.ticket_number || t.ticketNumber || '',
  ticket_type: t.ticket_type || t.ticketType || '',
  ticket_class: t.ticket_class || t.ticketClass || '',
  ticket_price: t.ticket_price ?? t.ticketPrice ?? 0,
  checkin_status: t.checkin_status || t.checkinStatus || 'UNSCANNED',
  scan_count: t.scan_count ?? t.scanCount ?? 0,
  note: t.note ?? null,
  message: t.message ?? null,
  category: t.category || '',
  currency: t.currency || '',
  formatted_date: t.formatted_date || t.formattedDate || '',
  user_first_name: t.user_first_name || t.userFirstName || '',
  user_last_name: t.user_last_name || t.userLastName || '',
  user_email: t.user_email || t.userEmail || '',
  user_phone: t.user_phone || t.userPhone || '',
  ticket_holder: t.ticket_holder || t.ticketHolder || '',
  scanned_by: normalizeScannedBy(t.scanned_by || t.scannedBy),
  last_scanned_on:
    t.last_scanned_on || t.lastScannedOn || t.scannedBy?.scannedAt || null,
  last_scanned_by_name:
    t.last_scanned_by_name || t.lastScannedByName || t.scannedBy?.name || null,
});


export const lookupOrdersThunk = createAsyncThunk(
  'manualCheckin/lookupOrders',
  async (searchFor: string) => {
    const res = await CHECK_IN_SERVICES.lookupOrders(searchFor);
    return (res?.data ?? []) as OrderResult[];
  },
);

export const fetchAllOrdersThunk = createAsyncThunk(
  'manualCheckin/fetchAllOrders',
  async ({
    eventId,
    page,
    isRefresh,
  }: {
    eventId: string | number;
    page: number;
    isRefresh?: boolean;
  }, { rejectWithValue }) => {
    try {
      const res = await CHECK_IN_SERVICES.fetchOrdersWithTickets(eventId, page, 10);
      const data = res?.data;
      const raw: any[] = data?.orders ?? [];
      const hasMore =
        data?.hasNextPage === true ||
        (data?.currentPage != null && data?.totalPages != null
          ? data.currentPage < data.totalPages
          : false);
      return {
        results: raw.map(normalizeOrder),
        hasMore,
        page,
        isRefresh: isRefresh ?? false,
      };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to fetch orders');
    }
  },
);

export const fetchTicketDetailsThunk = createAsyncThunk(
  'manualCheckin/fetchTicketDetails',
  async (
    { orderNumber, eventUuid }: { orderNumber: string; eventUuid: string | number },
    { rejectWithValue },
  ) => {
    try {
      const res = await CHECK_IN_SERVICES.fetchTicketOrderDetails(
        orderNumber,
        String(eventUuid),
      );
      const response = res?.data;
      const raw: any[] =
        response?.data && Array.isArray(response.data) ? response.data : [];
      return {
        tickets: raw.map(normalizeTicket),
        orderNumber,
        eventUuid: String(eventUuid),
      };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to load tickets');
    }
  },
);

export const manualCheckinTicketThunk = createAsyncThunk(
  'manualCheckin/checkinTicket',
  async (
    { eventUuid, code }: { eventUuid: string | number; code: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await CHECK_IN_SERVICES.manualCheckin(String(eventUuid), code);
      const ticketData = res?.data?.data ?? res?.data;
      if (!ticketData || ticketData.status !== 'SCANNED') {
        return rejectWithValue('Check-in failed');
      }
      return { code, data: ticketData };
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Check-in failed',
      );
    }
  },
);

export const checkinAllTicketsThunk = createAsyncThunk(
  'manualCheckin/checkinAll',
  async (
    { eventUuid, orderNumber }: { eventUuid: string | number; orderNumber: string },
    { rejectWithValue },
  ) => {
    try {
       const res = await CHECK_IN_SERVICES.boxOfficeCheckinAll(String(eventUuid), orderNumber);
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Check-in all failed',
      );
    }
  },
);

export const fetchEventInfoThunk = createAsyncThunk(
  'manualCheckin/fetchEventInfo',
  async (eventId: string | number, { getState }) => {
    const key = String(eventId);
    const cached = (getState() as { manualCheckin: ManualCheckinState })
      .manualCheckin.eventInfoCache[key];
    if (cached) return cached;
    const res = await EVENT_SERVICES.fetchEventInfo(key);
    const info = res?.data;
    return {
      eventUuid: key,
      event_title: info?.eventTitle || info?.event_title || '',
      date: info?.startDate || info?.start_date || '',
      time: info?.startTime || info?.start_time || '',
      cityName: info?.location?.city ?? undefined,
      scanCount: info?.scanCount ?? info?.scan_count ?? undefined,
    } as CachedEventInfo;
  },
);


const manualCheckinSlice = createSlice({
  name: 'manualCheckin',
  initialState,
  reducers: {
    clearLookupResults(state) {
      state.lookupResults = [];
    },
    resetTicketDetails(state) {
      state.ticketDetails = [];
      state.ticketDetailsLoading = true;
      state.ticketDetailsError = null;
    },
    preloadFromLookup(
      state,
      action: PayloadAction<{
        tickets: any[];
        orderNumber: string;
        eventUuid: string;
      }>,
    ) {
      state.ticketDetails = action.payload.tickets.map(normalizeTicket);
      state.ticketDetailsLoading = false;
      state.ticketDetailsError = null;
      state.currentOrderNumber = action.payload.orderNumber;
      state.currentEventUuid = action.payload.eventUuid;
    },
    updateTicketStatus(
      state,
      action: PayloadAction<{
        uuid: string;
        status: string;
        scannedBy?: ScannedBy | null;
      }>,
    ) {
      const { uuid, status, scannedBy } = action.payload;
      const idx = state.ticketDetails.findIndex((t) => t.uuid === uuid);
      if (idx === -1) return;
      const t = state.ticketDetails[idx];
      state.ticketDetails[idx] = {
        ...t,
        checkin_status: status as 'SCANNED' | 'UNSCANNED',
        scan_count: status === 'SCANNED' ? (t.scan_count || 0) + 1 : t.scan_count,
        last_scanned_on: scannedBy?.scanned_on || new Date().toISOString(),
        last_scanned_by_name: scannedBy?.name || t.last_scanned_by_name,
        scanned_by: scannedBy
          ? {
              name: scannedBy.name || 'No Record',
              staff_id: scannedBy.staff_id || 'No Record',
              scanned_on: scannedBy.scanned_on || 'No Record',
            }
          : t.scanned_by,
      };
      if (status === 'SCANNED') state.checkinSuccessCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(lookupOrdersThunk.pending, (state) => {
        state.lookupLoading = true;
        state.lookupError = null;
      })
      .addCase(lookupOrdersThunk.fulfilled, (state, action) => {
        state.lookupLoading = false;
        state.lookupResults = action.payload;
      })
      .addCase(lookupOrdersThunk.rejected, (state, action) => {
        state.lookupLoading = false;
        state.lookupError = action.error.message ?? 'Lookup failed';
      });

    builder
      .addCase(fetchAllOrdersThunk.pending, (state, action) => {
        if (action.meta.arg.isRefresh) {
          state.allOrdersRefreshing = true;
        } else if (action.meta.arg.page === 1) {
          state.allOrdersLoading = true;
        } else {
          state.allOrdersLoadingMore = true;
        }
      })
      .addCase(fetchAllOrdersThunk.fulfilled, (state, action) => {
        state.allOrdersLoading = false;
        state.allOrdersLoadingMore = false;
        state.allOrdersRefreshing = false;
        if (action.payload.page === 1) {
          state.allOrders = action.payload.results;
        } else {
          state.allOrders = [...state.allOrders, ...action.payload.results];
        }
        state.allOrdersHasMore = action.payload.hasMore;
        state.allOrdersPage = action.payload.page;
      })
      .addCase(fetchAllOrdersThunk.rejected, (state) => {
        state.allOrdersLoading = false;
        state.allOrdersLoadingMore = false;
        state.allOrdersRefreshing = false;
      });

    builder
      .addCase(fetchTicketDetailsThunk.pending, (state) => {
        state.ticketDetailsLoading = true;
        state.ticketDetailsError = null;
      })
      .addCase(fetchTicketDetailsThunk.fulfilled, (state, action) => {
        state.ticketDetailsLoading = false;
        state.ticketDetails = action.payload.tickets;
        state.currentOrderNumber = action.payload.orderNumber;
        state.currentEventUuid = action.payload.eventUuid;
      })
      .addCase(fetchTicketDetailsThunk.rejected, (state, action) => {
        state.ticketDetailsLoading = false;
        state.ticketDetailsError = String(
          action.payload ?? action.error.message ?? 'Failed',
        );
      });

    builder
      .addCase(manualCheckinTicketThunk.pending, (state, action) => {
        state.checkingInCode = action.meta.arg.code;
      })
      .addCase(manualCheckinTicketThunk.fulfilled, (state, action) => {
        state.checkingInCode = null;
        const { code, data } = action.payload as { code: string; data: any };
        const sb = data.scannedBy ?? data.scanned_by;
        const staffLabel =
          sb?.name || sb?.email || String(sb?.staffId ?? '') || 'No Record';
        const scannedOn =
          sb?.scannedOn || sb?.scanned_on || new Date().toISOString();
        const newScanCount = data.scanCount ?? data.scan_count;

        const idx = state.ticketDetails.findIndex((t) => t.code === code);
        if (idx !== -1) {
          const t = state.ticketDetails[idx];
          state.ticketDetails[idx] = {
            ...t,
            checkin_status: 'SCANNED',
            scan_count: newScanCount ?? t.scan_count + 1,
            note: data.note ?? t.note,
            last_scanned_on: scannedOn,
            last_scanned_by_name: staffLabel,
            scanned_by: sb
              ? {
                  name: staffLabel,
                  staff_id: sb.staffId ?? sb.staff_id ?? 'No Record',
                  scanned_on: scannedOn,
                }
              : t.scanned_by,
          };
        }

        for (const order of state.lookupResults) {
          const tIdx = order.tickets.findIndex((t: any) => t.code === code);
          if (tIdx !== -1) {
            order.tickets[tIdx] = {
              ...order.tickets[tIdx],
              checkinStatus: 'SCANNED',
              scanCount: newScanCount ?? (order.tickets[tIdx].scanCount ?? 0) + 1,
              scannedBy: sb
                ? {
                    name: sb.name ?? null,
                    email: sb.email ?? null,
                    scannedOn: scannedOn,
                    staffId: sb.staffId ?? sb.staff_id ?? null,
                  }
                : order.tickets[tIdx].scannedBy,
            };
            break;
          }
        }

        state.checkinSuccessCount += 1;
      })
      .addCase(manualCheckinTicketThunk.rejected, (state) => {
        state.checkingInCode = null;
      });

    builder
      .addCase(checkinAllTicketsThunk.pending, (state) => {
        state.checkingInAll = true;
      })
      .addCase(checkinAllTicketsThunk.fulfilled, (state) => {
        state.checkingInAll = false;
        state.ticketDetails = state.ticketDetails.map((t) => ({
          ...t,
          checkin_status: 'SCANNED',
          scan_count: (t.scan_count || 0) + 1,
        }));
        const orderNumber = state.currentOrderNumber;
        if (orderNumber) {
          const order = state.lookupResults.find(
            (o) => o.orderNumber === orderNumber,
          );
          if (order) {
            order.tickets = order.tickets.map((t: any) => ({
              ...t,
              checkinStatus: 'SCANNED',
              scanCount: (t.scanCount ?? 0) + 1,
            }));
          }
        }

        state.checkinSuccessCount += 1;
      })
      .addCase(checkinAllTicketsThunk.rejected, (state) => {
        state.checkingInAll = false;
      });

    builder.addCase(fetchEventInfoThunk.fulfilled, (state, action) => {
      if (action.payload?.eventUuid) {
        state.eventInfoCache[action.payload.eventUuid] = action.payload;
      }
    });
  },
});

export const {
  clearLookupResults,
  resetTicketDetails,
  preloadFromLookup,
  updateTicketStatus,
} = manualCheckinSlice.actions;
export default manualCheckinSlice.reducer;
