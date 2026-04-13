import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
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
import { DASHBOARD_SERVICES } from "../../../services/DashboardService";
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
  setDashboardData,
  setDashboardDataLoading,
  setDashboardDataError,
} from "../../../redux/reducers/dashboardReducer";
import Loader from "@components/Loader/Loader";

interface RadioOption {
  label: string;
  value: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
  year?: number;
}

const AdminAllEventsDashboard: React.FC = () => {
  const dispatch = useDispatch();

  const eventTypes = useSelector(selectEventTypes) ?? [];
  const ticketingTypes = useSelector(selectTicketingTypes) ?? [];
  const organizations = useSelector(selectOrganizations) ?? [];
  const organizationsPage = useSelector(selectOrganizationsPage) ?? 0;
  const organizationsTotalPages = useSelector(selectOrganizationsTotalPages) ?? 1;
  const organizationsLoadingMore = useSelector(selectOrganizationsLoadingMore) ?? false;
  const selectedEventTypeValue = useSelector(selectSelectedEventTypeValue) ?? "all";
  const selectedTicketingTypeValue = useSelector(selectSelectedTicketingTypeValue) ?? "all";
  const selectedOrganizationValue = useSelector(selectSelectedOrganizationValue) ?? "all";
  const selectedCurrencyValue = useSelector(selectSelectedCurrencyValue) ?? "all";
  const selectedEventFilterValue = useSelector(selectSelectedEventFilterValue) ?? "all";
  const dashboardDataLoading = useSelector(selectDashboardDataLoading) ?? false;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Jan 23, 2026");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showEventTypePicker, setShowEventTypePicker] = useState(false);
  const [showTicketingTypePicker, setShowTicketingTypePicker] = useState(false);
  const [showOrganizationPicker, setShowOrganizationPicker] = useState(false);

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

  const selectedEventTypeLabel =
    eventTypeOptions.find((o) => o.value === selectedEventTypeValue)?.label ?? "All";

  const selectedTicketingTypeLabel =
    ticketingTypeOptions.find((o) => o.value === selectedTicketingTypeValue)?.label ?? "All";

  const selectedOrganizationLabel =
    organizationOptions.find((o) => o.value === selectedOrganizationValue)?.label ?? "Organization";

  useEffect(() => {
    if ((eventTypes ?? []).length === 0) fetchEventTypes();
    if ((ticketingTypes ?? []).length === 0) fetchTicketingTypes();
    if ((organizations ?? []).length === 0) fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedOrganizationValue, selectedTicketingTypeValue, selectedEventTypeValue, selectedCurrencyValue, selectedEventFilterValue, selectedYear]);

  const buildParams = () => {
    const params: {
      organization_uuid?: string;
      ticketing_type?: string;
      event_type?: string;
      currency?: string;
      event_id?: string;
      year?: number;
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
    if (selectedYear)
      params.year = selectedYear;
    return params;
  };

  const fetchDashboardData = async () => {
    dispatch(setDashboardDataLoading(true));
    dispatch(setDashboardDataError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchDashboardStats(buildParams());
      dispatch(setDashboardData(response?.data ?? {}));
    } catch (error: any) {
      dispatch(setDashboardDataError(error?.message ?? "Failed to fetch dashboard data"));
    } finally {
      dispatch(setDashboardDataLoading(false));
    }
  };

  const fetchEventTypes = async () => {
    dispatch(setEventTypesLoading(true));
    dispatch(setEventTypesError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchEventTypes();
      dispatch(setEventTypes(response?.data?.data ?? []));
    } catch (error: any) {
      dispatch(setEventTypesError(error?.message ?? "Failed to fetch event types"));
    } finally {
      dispatch(setEventTypesLoading(false));
    }
  };

  const fetchTicketingTypes = async () => {
    dispatch(setTicketingTypesLoading(true));
    dispatch(setTicketingTypesError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchTicketingTypes();
      dispatch(setTicketingTypes(response?.data?.data ?? []));
    } catch (error: any) {
      dispatch(setTicketingTypesError(error?.message ?? "Failed to fetch ticketing types"));
    } finally {
      dispatch(setTicketingTypesLoading(false));
    }
  };

  const fetchOrganizations = async (page: number = 0) => {
    if (page === 0) {
      dispatch(setOrganizationsLoading(true));
      dispatch(setOrganizationsError(null));
    } else {
      dispatch(setOrganizationsLoadingMore(true));
    }
    try {
      const response = await DASHBOARD_SERVICES.fetchOrganizations(page);
      const data = response?.data?.data ?? [];
      const totalPages = response?.data?.totalPages ?? 1;
      const currentPage = response?.data?.currentPage ?? page;
      if (page === 0) {
        dispatch(setOrganizations(data));
      } else {
        dispatch(appendOrganizations(data));
      }
      dispatch(setOrganizationsPage(currentPage));
      dispatch(setOrganizationsTotalPages(totalPages));
    } catch (error: any) {
      dispatch(setOrganizationsError(error?.message ?? "Failed to fetch organizations"));
    } finally {
      if (page === 0) {
        dispatch(setOrganizationsLoading(false));
      } else {
        dispatch(setOrganizationsLoadingMore(false));
      }
    }
  };

  const loadMoreOrganizations = () => {
    const nextPage = (organizationsPage ?? 0) + 1;
    if (nextPage < (organizationsTotalPages ?? 1) && !organizationsLoadingMore) {
      fetchOrganizations(nextPage);
    }
  };

  const handleDateRangeSelect = ({ startDate, endDate, year }: DateRange) => {
    if (year) {
      setSelectedYear(year);
      setSelectedDate(String(year));
      return;
    }

    setSelectedYear(null);

    const formatDate = (date: Date) => {
      if (!date) return "";
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    if (startDate && endDate) {
      if (startDate.getTime() === endDate.getTime()) {
        setSelectedDate(formatDate(startDate));
      } else {
        setSelectedDate(`${formatDate(startDate)} - ${formatDate(endDate)}`);
      }
    } else if (startDate) {
      setSelectedDate(formatDate(startDate));
    }
  };

  return (
    <View style={styles.container}>
      <Loader isLoading={dashboardDataLoading} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <SvgIcons.drawerSvg width={24} height={24} fill="transparent" />
          </TouchableOpacity>
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
            <SvgIcons.profileImage width={40} height={40} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

        <AdminEarningCard />
        <AdminAttendeesCard />
        <AdminEventCard />
        <AdminStatisticsCard />
        <AdminCouponsCard />
      </ScrollView>

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
      />
    </View>
  );
};

export default AdminAllEventsDashboard;
