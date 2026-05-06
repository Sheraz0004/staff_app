import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface EventType {
  id: number;
  title: string;
  description: string;
  status: string;
}

export interface TicketingType {
  id: number;
  title: string;
  description: string;
  active: boolean;
  status: string;
}

export interface Organization {
  id: number;
  name: string | null;
  organizationNumber: string;
  logo: string | null;
  registrationDate: string;
  phoneNumber: string | null;
  status: string;
}

export interface EarningChartItem {
  month: string;
  gross: number;
  net: number;
}

export interface AttendeeChartItem {
  month: string;
  count: number;
}

export interface DashboardData {
  currency: string;
  earned: {
    totalEarned: number;
    chartData: EarningChartItem[];
  };
  attendees: {
    total: number;
    chartData: AttendeeChartItem[];
  };
  events: {
    total: number;
    active: number;
    upcoming: number;
    past: number;
  };
  tickets: {
    sold: { count: number; grossValue: number; netValue: number };
    refunded: { count: number; value: number };
    cancelled: { count: number; value: number };
  };
  coupons: {
    sold: { count: number; value: number };
    refunded: { count: number; value: number };
    cancelled: { count: number; value: number };
  };
}

export interface Currency {
  id: number;
  currency: string;
  symbol: string;
  threeLetter: string;
}

export interface Event {
  id: number;
  title: string;
  eventNumber: string;
}

interface State {
  eventTypes: EventType[];
  eventTypesLoading: boolean;
  eventTypesError: string | null;

  ticketingTypes: TicketingType[];
  ticketingTypesLoading: boolean;
  ticketingTypesError: string | null;

  organizations: Organization[];
  organizationsLoading: boolean;
  organizationsError: string | null;
  organizationsPage: number;
  organizationsTotalPages: number;
  organizationsLoadingMore: boolean;

  selectedEventTypeValue: string;
  selectedTicketingTypeValue: string;
  selectedOrganizationValue: string;

  currencies: Currency[];
  currenciesLoading: boolean;
  currenciesError: string | null;
  selectedCurrencyValue: string;

  events: Event[];
  eventsLoading: boolean;
  eventsError: string | null;
  eventsPage: number;
  eventsTotalPages: number;
  eventsLoadingMore: boolean;
  selectedEventFilterValue: string;

  dashboardData: DashboardData | null;
  dashboardDataLoading: boolean;
  dashboardDataError: string | null;
  earningsLoading: boolean;
}

const initialState: State = {
  eventTypes: [],
  eventTypesLoading: false,
  eventTypesError: null,

  ticketingTypes: [],
  ticketingTypesLoading: false,
  ticketingTypesError: null,

  organizations: [],
  organizationsLoading: false,
  organizationsError: null,
  organizationsPage: 0,
  organizationsTotalPages: 1,
  organizationsLoadingMore: false,

  selectedEventTypeValue: "all",
  selectedTicketingTypeValue: "all",
  selectedOrganizationValue: "all",

  currencies: [],
  currenciesLoading: false,
  currenciesError: null,
  selectedCurrencyValue: "all",

  events: [],
  eventsLoading: false,
  eventsError: null,
  eventsPage: 0,
  eventsTotalPages: 1,
  eventsLoadingMore: false,
  selectedEventFilterValue: "all",

  dashboardData: null,
  dashboardDataLoading: false,
  dashboardDataError: null,
  earningsLoading: false,
};

export const dashboardReducer = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setEventTypes: (state, action: PayloadAction<EventType[]>) => {
      state.eventTypes = action.payload;
    },
    setEventTypesLoading: (state, action: PayloadAction<boolean>) => {
      state.eventTypesLoading = action.payload;
    },
    setEventTypesError: (state, action: PayloadAction<string | null>) => {
      state.eventTypesError = action.payload;
    },

    setTicketingTypes: (state, action: PayloadAction<TicketingType[]>) => {
      state.ticketingTypes = action.payload;
    },
    setTicketingTypesLoading: (state, action: PayloadAction<boolean>) => {
      state.ticketingTypesLoading = action.payload;
    },
    setTicketingTypesError: (state, action: PayloadAction<string | null>) => {
      state.ticketingTypesError = action.payload;
    },

    setOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = action.payload;
    },
    appendOrganizations: (state, action: PayloadAction<Organization[]>) => {
      state.organizations = [...state.organizations, ...action.payload];
    },
    setOrganizationsLoading: (state, action: PayloadAction<boolean>) => {
      state.organizationsLoading = action.payload;
    },
    setOrganizationsError: (state, action: PayloadAction<string | null>) => {
      state.organizationsError = action.payload;
    },
    setOrganizationsPage: (state, action: PayloadAction<number>) => {
      state.organizationsPage = action.payload;
    },
    setOrganizationsTotalPages: (state, action: PayloadAction<number>) => {
      state.organizationsTotalPages = action.payload;
    },
    setOrganizationsLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.organizationsLoadingMore = action.payload;
    },

    setSelectedEventTypeValue: (state, action: PayloadAction<string>) => {
      state.selectedEventTypeValue = action.payload;
    },
    setSelectedTicketingTypeValue: (state, action: PayloadAction<string>) => {
      state.selectedTicketingTypeValue = action.payload;
    },
    setSelectedOrganizationValue: (state, action: PayloadAction<string>) => {
      state.selectedOrganizationValue = action.payload;
    },

    setCurrencies: (state, action: PayloadAction<Currency[]>) => {
      state.currencies = action.payload;
    },
    setCurrenciesLoading: (state, action: PayloadAction<boolean>) => {
      state.currenciesLoading = action.payload;
    },
    setCurrenciesError: (state, action: PayloadAction<string | null>) => {
      state.currenciesError = action.payload;
    },
    setSelectedCurrencyValue: (state, action: PayloadAction<string>) => {
      state.selectedCurrencyValue = action.payload;
    },

    setEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload;
    },
    appendEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = [...state.events, ...action.payload];
    },
    setEventsLoading: (state, action: PayloadAction<boolean>) => {
      state.eventsLoading = action.payload;
    },
    setEventsError: (state, action: PayloadAction<string | null>) => {
      state.eventsError = action.payload;
    },
    setEventsPage: (state, action: PayloadAction<number>) => {
      state.eventsPage = action.payload;
    },
    setEventsTotalPages: (state, action: PayloadAction<number>) => {
      state.eventsTotalPages = action.payload;
    },
    setEventsLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.eventsLoadingMore = action.payload;
    },
    setSelectedEventFilterValue: (state, action: PayloadAction<string>) => {
      state.selectedEventFilterValue = action.payload;
    },

    setDashboardData: (state, action: PayloadAction<DashboardData>) => {
      state.dashboardData = action.payload;
    },
    setDashboardDataLoading: (state, action: PayloadAction<boolean>) => {
      state.dashboardDataLoading = action.payload;
    },
    setDashboardDataError: (state, action: PayloadAction<string | null>) => {
      state.dashboardDataError = action.payload;
    },
    setEarningsLoading: (state, action: PayloadAction<boolean>) => {
      state.earningsLoading = action.payload;
    },
    resetDashboard: () => initialState,
  },
});

export const selectEventTypes = (state: any): EventType[] =>
  state.entities.dashboard.eventTypes ?? [];
export const selectEventTypesLoading = (state: any): boolean =>
  state.entities.dashboard.eventTypesLoading ?? false;
export const selectEventTypesError = (state: any): string | null =>
  state.entities.dashboard.eventTypesError ?? null;

export const selectTicketingTypes = (state: any): TicketingType[] =>
  state.entities.dashboard.ticketingTypes ?? [];
export const selectTicketingTypesLoading = (state: any): boolean =>
  state.entities.dashboard.ticketingTypesLoading ?? false;
export const selectTicketingTypesError = (state: any): string | null =>
  state.entities.dashboard.ticketingTypesError ?? null;

export const selectOrganizations = (state: any): Organization[] =>
  state.entities.dashboard.organizations ?? [];
export const selectOrganizationsLoading = (state: any): boolean =>
  state.entities.dashboard.organizationsLoading ?? false;
export const selectOrganizationsError = (state: any): string | null =>
  state.entities.dashboard.organizationsError ?? null;
export const selectOrganizationsPage = (state: any): number =>
  state.entities.dashboard.organizationsPage ?? 0;
export const selectOrganizationsTotalPages = (state: any): number =>
  state.entities.dashboard.organizationsTotalPages ?? 1;
export const selectOrganizationsLoadingMore = (state: any): boolean =>
  state.entities.dashboard.organizationsLoadingMore ?? false;

export const selectSelectedEventTypeValue = (state: any): string =>
  state.entities.dashboard.selectedEventTypeValue ?? "all";
export const selectSelectedTicketingTypeValue = (state: any): string =>
  state.entities.dashboard.selectedTicketingTypeValue ?? "all";
export const selectSelectedOrganizationValue = (state: any): string =>
  state.entities.dashboard.selectedOrganizationValue ?? "all";

export const selectCurrencies = (state: any): Currency[] =>
  state.entities.dashboard.currencies ?? [];
export const selectCurrenciesLoading = (state: any): boolean =>
  state.entities.dashboard.currenciesLoading ?? false;
export const selectCurrenciesError = (state: any): string | null =>
  state.entities.dashboard.currenciesError ?? null;
export const selectSelectedCurrencyValue = (state: any): string =>
  state.entities.dashboard.selectedCurrencyValue ?? "all";

export const selectEvents = (state: any): Event[] =>
  state.entities.dashboard.events ?? [];
export const selectEventsLoading = (state: any): boolean =>
  state.entities.dashboard.eventsLoading ?? false;
export const selectEventsError = (state: any): string | null =>
  state.entities.dashboard.eventsError ?? null;
export const selectEventsPage = (state: any): number =>
  state.entities.dashboard.eventsPage ?? 0;
export const selectEventsTotalPages = (state: any): number =>
  state.entities.dashboard.eventsTotalPages ?? 1;
export const selectEventsLoadingMore = (state: any): boolean =>
  state.entities.dashboard.eventsLoadingMore ?? false;
export const selectSelectedEventFilterValue = (state: any): string =>
  state.entities.dashboard.selectedEventFilterValue ?? "all";

export const selectDashboardData = (state: any): DashboardData | null =>
  state.entities.dashboard.dashboardData ?? null;
export const selectDashboardDataLoading = (state: any): boolean =>
  state.entities.dashboard.dashboardDataLoading ?? false;
export const selectDashboardDataError = (state: any): string | null =>
  state.entities.dashboard.dashboardDataError ?? null;

export const selectEarningsLoading = (state: any): boolean =>
  state.entities.dashboard.earningsLoading ?? false;

export const {
  setEventTypes,
  setEventTypesLoading,
  setEventTypesError,
  setTicketingTypes,
  setTicketingTypesLoading,
  setTicketingTypesError,
  setOrganizations,
  appendOrganizations,
  setOrganizationsLoading,
  setOrganizationsError,
  setOrganizationsPage,
  setOrganizationsTotalPages,
  setOrganizationsLoadingMore,
  setSelectedEventTypeValue,
  setSelectedTicketingTypeValue,
  setSelectedOrganizationValue,
  setCurrencies,
  setCurrenciesLoading,
  setCurrenciesError,
  setSelectedCurrencyValue,
  setEvents,
  appendEvents,
  setEventsLoading,
  setEventsError,
  setEventsPage,
  setEventsTotalPages,
  setEventsLoadingMore,
  setSelectedEventFilterValue,
  setDashboardData,
  setDashboardDataLoading,
  setDashboardDataError,
  setEarningsLoading,
  resetDashboard,
} = dashboardReducer.actions;

export { resetDashboard };

export default dashboardReducer.reducer;
