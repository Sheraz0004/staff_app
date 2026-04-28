import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "../../../redux/reducers/userReducer";
import SvgIcons from "../../../components/SvgIcons";
import { color } from "../../../color/color";
import Typography from "../../../components/Typography";
import BottomSheetRadioPicker from "../../../constants/bottomSheetRadioPicker";
import AdminEarningCard from "./AdminEarningCard";
import AdminAttendeesCard from "./AdminAttendeesCard";
import AdminEventCard from "./AdminEventCard";
import AdminStatisticsCard from "./AdminStatisticsCard";
import AdminCouponsCard from "./AdminCouponsCard";
import Dropdown from "./components/Dropdown";
import DateRangePicker from "./components/DateRangePicker";
import { styles } from "./adminAllEventsDashboard.styles";
import { styles as dashboardStyles } from "../index.styles";
import { DASHBOARD_SERVICES } from "../../../services/DashboardService";
import AdminOverallStatistics from "../AdminOverallStatistics";
import TerminalsComponent from "../TerminalsComponent";
import StaffListComponent from "../StaffListComponent";
import { admindashboardterminaltab as originalAdminTabs } from "../../../constants/admindashboardterminaltab";
import { dashboardsalesscantab } from "../../../constants/dashboardsalesscantab";

const admindashboardterminaltab = [...originalAdminTabs, "Staff"];
import type {
  EventType,
  TicketingType,
  Organization,
} from "../../../redux/reducers/dashboardReducer";
import {
  selectEventTypes,
  selectTicketingTypes,
  selectOrganizations,
  selectOrganizationsPage,
  selectOrganizationsTotalPages,
  selectOrganizationsLoadingMore,
  selectSelectedEventTypeValue,
  selectSelectedTicketingTypeValue,
  selectSelectedOrganizationValue,
  selectSelectedCurrencyValue,
  selectSelectedEventFilterValue,
  selectDashboardDataLoading,
  selectDashboardDataError,
  selectEvents,
  selectEventsPage,
  selectEventsTotalPages,
  selectEventsLoadingMore,
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
  setSelectedEventFilterValue,
  setEvents,
  appendEvents,
  setEventsLoading,
  setEventsError,
  setEventsPage,
  setEventsTotalPages,
  setEventsLoadingMore,
  setDashboardData,
  setDashboardDataLoading,
  setDashboardDataError,
} from "../../../redux/reducers/dashboardReducer";
import Loader from "@components/Loader/Loader";
import Svg, { Circle, Path, Line } from "react-native-svg";

interface RadioOption {
  label: string;
  value: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
  year?: number;
}

interface AdminAllEventsDashboardProps {
  showEventDashboard?: boolean;
  eventInfo?: any;
  dashboardStats?: any;
  dashboardLoading?: boolean;
  dashboardError?: string | null;
  onScanCountUpdate?: any;
  onEventChange?: any;
  onTotalTicketsPress?: () => void;
  onTotalScannedPress?: () => void;
  onTotalUnscannedPress?: () => void;
  onAvailableTicketsPress?: () => void;
  selectedSaleScanTab?: string;
  onSaleScanTabPress?: (tab: string) => void;
  renderEventContent?: () => React.ReactNode;
}

const AdminAllEventsDashboard: React.FC<AdminAllEventsDashboardProps> = ({
  showEventDashboard = false,
  eventInfo,
  dashboardStats,
  dashboardLoading = false,
  dashboardError = null,
  onEventChange,
  onTotalTicketsPress,
  onTotalScannedPress,
  onTotalUnscannedPress,
  onAvailableTicketsPress,
  selectedSaleScanTab,
  onSaleScanTabPress,
  renderEventContent,
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(getUser);
  const eventTypes = useSelector(selectEventTypes) ?? [];
  const ticketingTypes = useSelector(selectTicketingTypes) ?? [];
  const organizations = useSelector(selectOrganizations) ?? [];
  const organizationsPage = useSelector(selectOrganizationsPage) ?? 0;
  const organizationsTotalPages =
    useSelector(selectOrganizationsTotalPages) ?? 1;
  const organizationsLoadingMore =
    useSelector(selectOrganizationsLoadingMore) ?? false;
  const events = useSelector(selectEvents) ?? [];
  const eventsPage = useSelector(selectEventsPage) ?? 0;
  const eventsTotalPages = useSelector(selectEventsTotalPages) ?? 1;
  const eventsLoadingMore = useSelector(selectEventsLoadingMore) ?? false;
  const selectedEventTypeValue =
    useSelector(selectSelectedEventTypeValue) ?? "all";
  const selectedTicketingTypeValue =
    useSelector(selectSelectedTicketingTypeValue) ?? "all";
  const selectedOrganizationValue =
    useSelector(selectSelectedOrganizationValue) ?? "all";
  const selectedCurrencyValue =
    useSelector(selectSelectedCurrencyValue) ?? "all";
  const selectedEventFilterValue =
    useSelector(selectSelectedEventFilterValue) ?? "all";
  const dashboardDataLoading = useSelector(selectDashboardDataLoading) ?? false;
  const dashboardDataError = useSelector(selectDashboardDataError) ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Jan 23, 2026");
  const [dateRange, setDateRange] = useState<{
    start_date: string;
    end_date: string;
  } | null>(null);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [showTicketingTypePicker, setShowTicketingTypePicker] = useState(false);
  const [showOrganizationPicker, setShowOrganizationPicker] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [selectedAdminTab, setSelectedAdminTab] = useState(admindashboardterminaltab[0]);

  const eventTypeOptions: RadioOption[] = [
    { label: "All", value: "all" },
    ...(eventTypes ?? []).map((t: EventType) => ({
      label: t?.title ?? "",
      value: String(t?.id ?? ""),
    })),
  ];

  const ticketingTypeOptions: RadioOption[] = [
    { label: "All", value: "all" },
    ...(ticketingTypes ?? []).map((t: TicketingType) => ({
      label: t?.title ?? "",
      value: String(t?.id ?? ""),
    })),
  ];

  const organizationOptions: RadioOption[] = [
    { label: "All", value: "all" },
    ...(organizations ?? []).map((o: Organization) => ({
      label: o?.name ?? o?.organizationNumber ?? "",
      value: String(o?.id ?? ""),
    })),
  ];

  const eventFilterOptions: RadioOption[] = [
    { label: "All Events", value: "all" },
    ...(events ?? []).map((e: any) => ({
      label: e?.title ?? e?.event_title ?? "",
      value: String(e?.id ?? e?.uuid ?? ""),
    })),
  ];

  const selectedEventTypeLabel =
    eventTypeOptions.find((o) => o.value === selectedEventTypeValue)?.label ??
    "Event Type";

  const selectedTicketingTypeLabel =
    ticketingTypeOptions.find((o) => o.value === selectedTicketingTypeValue)
      ?.label ?? "Ticketing Type";

  const selectedOrganizationLabel =
    organizationOptions.find((o) => o.value === selectedOrganizationValue)
      ?.label ?? "Organization";

  const selectedEventFilterLabel =
    eventFilterOptions.find((o) => o.value === selectedEventFilterValue)
      ?.label ?? "All Events";

  useEffect(() => {
    if ((eventTypes ?? []).length === 0) fetchEventTypes();
    if ((ticketingTypes ?? []).length === 0) fetchTicketingTypes();
    if ((organizations ?? []).length === 0) fetchOrganizations();
    if ((events ?? []).length === 0) fetchEvents();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [
    selectedOrganizationValue,
    selectedTicketingTypeValue,
    selectedEventTypeValue,
    selectedCurrencyValue,
    selectedEventFilterValue,
    dateRange,
  ]);

  const buildParams = () => {
    const params: {
      organization_uuid?: string;
      ticketing_type?: string;
      event_type?: string;
      currency?: string;
      event_id?: string;
      start_date?: string;
      end_date?: string;
    } = {};
    if (selectedOrganizationValue && selectedOrganizationValue !== "all")
      params.organization_uuid = selectedOrganizationValue;
    if (selectedTicketingTypeValue && selectedTicketingTypeValue !== "all")
      params.ticketing_type = selectedTicketingTypeValue;
    if (selectedEventTypeValue && selectedEventTypeValue !== "all")
      params.event_type = selectedEventTypeValue;
    if (selectedCurrencyValue && selectedCurrencyValue !== "all")
      params.currency = selectedCurrencyValue;
    if (selectedEventFilterValue && selectedEventFilterValue !== "all")
      params.event_id = selectedEventFilterValue;
    if (dateRange?.start_date) params.start_date = dateRange.start_date;
    if (dateRange?.end_date) params.end_date = dateRange.end_date;
    return params;
  };

  const fetchDashboardData = async () => {
    const params = buildParams();
    dispatch(setDashboardDataLoading(true));
    dispatch(setDashboardDataError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchDashboardStats(params);
      // console.log("response dasboard--->",response)
      dispatch(setDashboardData(response?.data ?? {}));
    } catch (error: any) {
      dispatch(
        setDashboardDataError(
          error?.message ?? "Failed to fetch dashboard data",
        ),
      );
    } finally {
      dispatch(setDashboardDataLoading(false));
    }
  };

  // Helper: extract list from various API response shapes
  const extractList = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw;
    return (
      raw?.data ??
      raw?.results ??
      raw?.organizations ??
      raw?.events ??
      raw?.types ??
      []
    );
  };

  const extractPagination = (raw: any, fallbackPage: number) => ({
    totalPages:
      raw?.totalPages ??
      raw?.total_pages ??
      (raw?.count ? Math.ceil(raw.count / 20) : 1),
    currentPage: raw?.currentPage ?? raw?.current_page ?? fallbackPage,
  });

  const fetchEventTypes = async () => {
    dispatch(setEventTypesLoading(true));
    dispatch(setEventTypesError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchEventTypes();
      dispatch(setEventTypes(extractList(response?.data)));
    } catch (error: any) {
      dispatch(
        setEventTypesError(error?.message ?? "Failed to fetch event types"),
      );
    } finally {
      dispatch(setEventTypesLoading(false));
    }
  };

  const fetchTicketingTypes = async () => {
    dispatch(setTicketingTypesLoading(true));
    dispatch(setTicketingTypesError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchTicketingTypes();
      dispatch(setTicketingTypes(extractList(response?.data)));
    } catch (error: any) {
      dispatch(
        setTicketingTypesError(
          error?.message ?? "Failed to fetch ticketing types",
        ),
      );
    } finally {
      dispatch(setTicketingTypesLoading(false));
    }
  };

  const fetchOrganizations = async (page?: number) => {
    const isInitial = page == null;
    if (isInitial) {
      dispatch(setOrganizationsLoading(true));
      dispatch(setOrganizationsError(null));
    } else {
      dispatch(setOrganizationsLoadingMore(true));
    }
    try {
      const response = await DASHBOARD_SERVICES.fetchOrganizations(page);
      const raw = response?.data;
      const list = extractList(raw);
      if (isInitial) {
        dispatch(setOrganizations(list));
        dispatch(setOrganizationsPage(0));
        // All data fetched in one shot — no load-more needed
        dispatch(setOrganizationsTotalPages(1));
      } else {
        dispatch(appendOrganizations(list));
        const { totalPages, currentPage } = extractPagination(raw, page!);
        dispatch(setOrganizationsPage(currentPage));
        dispatch(setOrganizationsTotalPages(totalPages));
      }
    } catch (error: any) {
      dispatch(
        setOrganizationsError(
          error?.message ?? "Failed to fetch organizations",
        ),
      );
    } finally {
      if (isInitial) {
        dispatch(setOrganizationsLoading(false));
      } else {
        dispatch(setOrganizationsLoadingMore(false));
      }
    }
  };

  const loadMoreOrganizations = () => {
    const nextPage = (organizationsPage ?? 0) + 1;
    if (
      nextPage < (organizationsTotalPages ?? 1) &&
      !organizationsLoadingMore
    ) {
      fetchOrganizations(nextPage);
    }
  };

  const fetchEvents = async (page?: number) => {
    const isInitial = page == null;
    if (isInitial) {
      dispatch(setEventsLoading(true));
      dispatch(setEventsError(null));
    } else {
      dispatch(setEventsLoadingMore(true));
    }
    try {
      const response = await DASHBOARD_SERVICES.fetchEvents(page);
      const raw = response?.data;
      const list = extractList(raw);
      if (isInitial) {
        dispatch(setEvents(list));
        dispatch(setEventsPage(0));
        // All data fetched in one shot — no load-more needed
        dispatch(setEventsTotalPages(1));
      } else {
        dispatch(appendEvents(list));
        const { totalPages, currentPage } = extractPagination(raw, page!);
        dispatch(setEventsPage(currentPage));
        dispatch(setEventsTotalPages(totalPages));
      }
    } catch (error: any) {
      dispatch(setEventsError(error?.message ?? "Failed to fetch events"));
    } finally {
      if (isInitial) {
        dispatch(setEventsLoading(false));
      } else {
        dispatch(setEventsLoadingMore(false));
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchEventTypes(),
      fetchTicketingTypes(),
      fetchOrganizations(),
      fetchEvents(),
      fetchDashboardData(),
    ]);
    setRefreshing(false);
  };

  const loadMoreEvents = () => {
    const nextPage = (eventsPage ?? 0) + 1;
    if (nextPage < (eventsTotalPages ?? 1) && !eventsLoadingMore) {
      fetchEvents(nextPage);
    }
  };

  const handleDateRangeSelect = ({ startDate, endDate, year }: DateRange) => {
    dispatch(setDashboardDataLoading(true));
    const toApiDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const toDisplayDate = (date: Date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    if (year) {
      setDateRange({ start_date: `${year}-01-01`, end_date: `${year}-12-31` });
      setSelectedDate(String(year));
      return;
    }

    if (startDate && endDate) {
      setDateRange({
        start_date: toApiDate(startDate),
        end_date: toApiDate(endDate),
      });
      if (startDate.getTime() === endDate.getTime()) {
        setSelectedDate(toDisplayDate(startDate));
      } else {
        setSelectedDate(
          `${toDisplayDate(startDate)} - ${toDisplayDate(endDate)}`,
        );
      }
    } else if (startDate) {
      const apiDate = toApiDate(startDate);
      setDateRange({ start_date: apiDate, end_date: apiDate });
      setSelectedDate(toDisplayDate(startDate));
    }
  };

  if (showEventDashboard) {
    return (
      <View style={dashboardStyles.mainContainer}>
        <View style={dashboardStyles.adminTabContainer}>
          <View style={dashboardStyles.adminTabRow}>
            {admindashboardterminaltab.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  dashboardStyles.adminTabButton,
                  selectedAdminTab === item && dashboardStyles.selectedAdminTabButton,
                ]}
                onPress={() => setSelectedAdminTab(item)}
              >
                <Text
                  style={[
                    dashboardStyles.adminTabButtonText,
                    selectedAdminTab === item && dashboardStyles.selectedAdminTabButtonText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedAdminTab === "Terminals" ? (
          <TerminalsComponent eventInfo={eventInfo} onEventChange={onEventChange} />
        ) : selectedAdminTab === "Staff" ? (
          <StaffListComponent eventInfo={eventInfo} onEventChange={onEventChange} />
        ) : (
          <ScrollView contentContainerStyle={dashboardStyles.scrollContainer}>
            <View style={dashboardStyles.wrapper}>
              {dashboardLoading ? (
                <Text style={dashboardStyles.loadingText}>Loading dashboard stats...</Text>
              ) : dashboardError ? (
                <Text style={dashboardStyles.errorText}>{dashboardError}</Text>
              ) : (
                <>
                  {selectedAdminTab === "Dashboard" && (
                    <View style={dashboardStyles.overallStatisticsContainer}>
                      <AdminOverallStatistics
                        stats={dashboardStats}
                        onTotalTicketsPress={onTotalTicketsPress ?? (() => {})}
                        onTotalScannedPress={onTotalScannedPress ?? (() => {})}
                        onTotalUnscannedPress={onTotalUnscannedPress ?? (() => {})}
                        onAvailableTicketsPress={onAvailableTicketsPress ?? (() => {})}
                      />
                    </View>
                  )}
                  {selectedAdminTab === "Dashboard" && (
                    <>
                      <View style={dashboardStyles.saleScanTabContainer}>
                        <View style={dashboardStyles.saleScanTabRow}>
                          {dashboardsalesscantab.map((item: string) => (
                            <TouchableOpacity
                              key={item}
                              style={[
                                dashboardStyles.saleScanTabButton,
                                selectedSaleScanTab === item &&
                                  dashboardStyles.selectedSaleScanTabButton,
                              ]}
                              onPress={() => onSaleScanTabPress?.(item)}
                            >
                              <Text
                                style={[
                                  dashboardStyles.saleScanTabButtonText,
                                  selectedSaleScanTab === item &&
                                    dashboardStyles.selectedSaleScanTabButtonText,
                                ]}
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      {renderEventContent?.()}
                    </>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Loader isLoading={dashboardDataLoading} />

      <View style={styles.header}>

        <View style={styles.headerLeft}>
          {/* <TouchableOpacity>
            <SvgIcons.drawerSvg width={24} height={24} fill="transparent" />
          </TouchableOpacity> */}
          <Typography weight="700" size={20} color={color.brown_3C200A}>
            Dashboard
          </Typography>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellButton}>
            <SvgIcons.bellIcon width={28} height={28} fill="transparent" />
          </TouchableOpacity>
          <View style={styles.headerDivider} />
          <View style={styles.avatar}>
            {currentUser?.profile_image ? (
              <Image
                source={{ uri: currentUser.profile_image }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                resizeMode="cover"
              />
            ) : (
              <SvgIcons.profileImage width={40} height={40} />
            )}
          </View>
        </View>
      </View>

      {dashboardDataError && !dashboardDataLoading ? (
        <View style={styles.errorContainer}>
          <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
            <Circle cx="40" cy="40" r="38" fill="#FFF6DF" stroke="#F7E4B6" strokeWidth="1.5" />
            <Path d="M15 33 Q40 16 65 33" stroke="#E4E4E4" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M23 41 Q40 29 57 41" stroke="#CEBCA0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M31 49 Q40 43 49 49" stroke="#AE6F28" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Circle cx="40" cy="57" r="3.5" fill="#AE6F28" />
            <Line x1="20" y1="20" x2="60" y2="60" stroke="#EF3E32" strokeWidth="3.5" strokeLinecap="round" />
          </Svg>
          <Text style={styles.errorTitle}>Network Error</Text>
          <Text style={styles.errorSubtitle}>
            Unable to load dashboard data.{"\n"}Check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchDashboardData}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.filters}>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                value={selectedEventTypeLabel}
                onPress={() => setShowEventTypePicker(true)}
              />
            </View>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                value={selectedTicketingTypeLabel}
                onPress={() => setShowTicketingTypePicker(true)}
              />
            </View>
          </View>

          <View style={styles.filtersRow2}>
            <View style={styles.dropdownWrapper}>
              <Dropdown
                value={selectedOrganizationLabel}
                onPress={() => setShowOrganizationPicker(true)}
              />
            </View>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dateSelectorInRow}
                onPress={() => setShowDatePicker(true)}
              >
                <SvgIcons.calendarIcon />
                <Typography
                  style={styles.dateSelectorText}
                  weight="400"
                  size={14}
                  color={color.brown_766F6A}
                  numberOfLines={1}
                >
                  {selectedDate}
                </Typography>
                <SvgIcons.downArrow />
              </TouchableOpacity>
            </View>
          </View>

          <AdminEarningCard />
          <AdminAttendeesCard />
          <AdminEventCard />
          <AdminStatisticsCard />
          <AdminCouponsCard />
        </ScrollView>
      )}

      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateRangeSelect={handleDateRangeSelect}
      />

      <BottomSheetRadioPicker
        visible={showEventTypePicker}
        onClose={() => setShowEventTypePicker(false)}
        title="Event Type"
        options={eventTypeOptions}
        selectedValue={selectedEventTypeValue}
        onSelect={(option: RadioOption) =>
          dispatch(setSelectedEventTypeValue(option?.value ?? "all"))
        }
      />

      <BottomSheetRadioPicker
        visible={showTicketingTypePicker}
        onClose={() => setShowTicketingTypePicker(false)}
        title="Ticketing Type"
        options={ticketingTypeOptions}
        selectedValue={selectedTicketingTypeValue}
        onSelect={(option: RadioOption) =>
          dispatch(setSelectedTicketingTypeValue(option?.value ?? "all"))
        }
      />

      <BottomSheetRadioPicker
        visible={showOrganizationPicker}
        onClose={() => setShowOrganizationPicker(false)}
        title="Organization"
        options={organizationOptions}
        selectedValue={selectedOrganizationValue}
        onSelect={(option: RadioOption) =>
          dispatch(setSelectedOrganizationValue(option?.value ?? "all"))
        }
        hasMore={(organizationsPage ?? 0) + 1 < (organizationsTotalPages ?? 1)}
        isLoadingMore={organizationsLoadingMore}
        onLoadMore={loadMoreOrganizations}
        disableDrag
      />

      <BottomSheetRadioPicker
        visible={showEventPicker}
        onClose={() => setShowEventPicker(false)}
        title="Filter by Event"
        options={eventFilterOptions}
        selectedValue={selectedEventFilterValue}
        onSelect={(option) =>
          dispatch(setSelectedEventFilterValue(String(option?.value ?? "all")))
        }
        hasMore={(eventsPage ?? 0) + 1 < (eventsTotalPages ?? 1)}
        isLoadingMore={eventsLoadingMore}
        onLoadMore={loadMoreEvents}
        disableDrag
      />
    </View>
  );
};

export default AdminAllEventsDashboard;
