import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CHECK_IN_SERVICES } from '../../services/CheckInService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoxOfficeTicket {
  type: string;
  id: number;
  price: number;
  discountPrice: number;
  quantity: number;
  remaining: number;
  purchase_limit: number;
  currency: string;
  sale_end_date_time: string;
  description: string;
}

export interface BoxOfficeCategory {
  title: string;
  tickets: BoxOfficeTicket[];
}

interface BoxOfficeState {
  pricingCategories: string[];
  ticketPricing: BoxOfficeCategory[];
  activeTab: string;
  selectedTickets: BoxOfficeTicket[];
  loading: boolean;
  error: string | null;
}

const initialState: BoxOfficeState = {
  pricingCategories: [],
  ticketPricing: [],
  activeTab: '',
  selectedTickets: [],
  loading: false,
  error: null,
};

// ─── Thunk ────────────────────────────────────────────────────────────────────

export const fetchBoxOfficeDataThunk = createAsyncThunk(
  'boxOffice/fetchData',
  async (
    { eventUuid, preferredTab, ticketUuid }: {
      eventUuid: string;
      preferredTab?: string;
      ticketUuid?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const pricingRes = await CHECK_IN_SERVICES.fetchTicketPricing(eventUuid);
      const pricingData = pricingRes?.data;
      if (!pricingData) return rejectWithValue('No pricing data');

      const categories: BoxOfficeCategory[] = (pricingData.pricingTypeOptions || []).reduce(
        (acc: BoxOfficeCategory[], option: any) => {
          const categoryTitle: string = option.type?.alias;
          const ticket: BoxOfficeTicket = {
            type: option.className,
            id: option.id,
            price: option.previousPrice ?? option.price,
            discountPrice: option.price,
            quantity: option.quantity,
            remaining: pricingData.ticketsRemainingQuantity ? option.quantity : 0,
            purchase_limit: option.purchaseLimit,
            currency: option.currency?.symbol || option.currency?.threeLetter || '',
            sale_end_date_time: pricingData.saleEndDateTime,
            description: option.description,
          };
          if (ticketUuid && ticket.id !== ticketUuid) return acc;
          const existing = acc.find((c) => c.title === categoryTitle);
          if (existing) {
            existing.tickets.push(ticket);
          } else {
            acc.push({ title: categoryTitle, tickets: [ticket] });
          }
          return acc;
        },
        [],
      );

      const pricingCategories = [...new Set(categories.map((c) => c.title))];

      const resolveTab = () => {
        if (preferredTab && categories.find((c) => c.title === preferredTab)) return preferredTab;
        const earlyBird = categories.find((c) => c.title === 'Early Bird');
        return earlyBird ? earlyBird.title : (categories[0]?.title ?? '');
      };

      const activeTab = resolveTab();
      const activeCategory = categories.find((c) => c.title === activeTab);
      const selectedTickets = (activeCategory?.tickets ?? []).map((t) => ({ ...t, quantity: 0 }));

      return { pricingCategories, ticketPricing: categories, activeTab, selectedTickets };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to fetch box office data');
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const boxOfficeSlice = createSlice({
  name: 'boxOffice',
  initialState,
  reducers: {
    setBoxOfficeActiveTab(state, action: PayloadAction<string>) {
      state.activeTab = action.payload;
      const category = state.ticketPricing.find((c) => c.title === action.payload);
      state.selectedTickets = (category?.tickets ?? []).map((t) => ({ ...t, quantity: 0 }));
    },
    updateTicketQuantity(state, action: PayloadAction<{ index: number; quantity: number }>) {
      const { index, quantity } = action.payload;
      if (index >= 0 && index < state.selectedTickets.length && quantity >= 0) {
        state.selectedTickets[index].quantity = quantity;
      }
    },
    resetBoxOffice(state) {
      state.pricingCategories = [];
      state.ticketPricing = [];
      state.activeTab = '';
      state.selectedTickets = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoxOfficeDataThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoxOfficeDataThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pricingCategories = action.payload.pricingCategories;
        state.ticketPricing = action.payload.ticketPricing;
        state.activeTab = action.payload.activeTab;
        state.selectedTickets = action.payload.selectedTickets;
      })
      .addCase(fetchBoxOfficeDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Failed to fetch box office data';
      });
  },
});

export const { setBoxOfficeActiveTab, updateTicketQuantity, resetBoxOffice } =
  boxOfficeSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectBoxOfficePricingCategories = (state: any): string[] =>
  state.boxOffice.pricingCategories ?? [];
export const selectBoxOfficeTicketPricing = (state: any): BoxOfficeCategory[] =>
  state.boxOffice.ticketPricing ?? [];
export const selectBoxOfficeActiveTab = (state: any): string =>
  state.boxOffice.activeTab ?? '';
export const selectBoxOfficeSelectedTickets = (state: any): BoxOfficeTicket[] =>
  state.boxOffice.selectedTickets ?? [];
export const selectBoxOfficeLoading = (state: any): boolean =>
  state.boxOffice.loading ?? false;
export const selectBoxOfficeError = (state: any): string | null =>
  state.boxOffice.error ?? null;

export default boxOfficeSlice.reducer;
