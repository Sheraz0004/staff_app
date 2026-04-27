import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  Alert,
  Dimensions,
  Text,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color } from "../../color/color";
import OverallStatistics from "./OverallStatistics";
import AdminOverallStatistics from "./AdminOverallStatistics";
import BoxOfficeSales from "./BoxOfficeSales";
import { useNavigation, useRoute } from "@react-navigation/native";
import SvgIcons from "../../components/SvgIcons";
import { dashboardstatuslist } from "../../constants/dashboardstatuslist";
import CheckInSoldTicketsCard from "./CheckInSolidTicketsCard";
import AttendeesComponent from "./AttendeesComponent";
import { dashboardsalesscantab } from "../../constants/dashboardsalesscantab";
import AnalyticsChart from "./AnalyticsChart";
import { ticketService, userService } from "../../api/apiService";

import AvailableTicketsCard from "./AvailableTicketsCard";
import ScanAnalytics from "./ScanAnalytics";
import ScanCategories from "./ScanCategories";
import ScanCategoriesDetails from "./ScanCategoriesDetails";
import ScanListComponent from "./ScanListComponent";
import EventsModal from "../../components/EventsModal";
import TerminalsComponent from "./TerminalsComponent";
import StaffListComponent from "./StaffListComponent";
import AdminAllSales from "./AdminAllSales";
import AdminOnlineSales from "./AdminOnlineSales";
import AdminBoxOfficeSales from "./AdminBoxOfficeSales";
import AdminBoxOfficePaymentChannel from "./AdminBoxOfficePaymentChannel";
import TotalPaymentChannelCard from "./TotalPaymentChannelCard";
import PaymentChannelAnalytics from "./PaymentChannelAnalytics";
import { admindashboardterminaltab as originalAdminTabs } from "../../constants/admindashboardterminaltab";

// Extend admin tabs to include Staff
const admindashboardterminaltab = [...originalAdminTabs, "Staff"];
import { adminonlineboxofficetab } from "../../constants/adminonlineboxofficetab";
import { truncateCityName } from "../../utils/stringUtils";
import { truncateEventName } from "../../utils/stringUtils";
import { formatDateWithMonthName } from "../../constants/dateAndTime";
import { logger } from "../../utils/logger";
import AdminAllEventsDashboard from "../dashboard/AdminAllEventsDashboard/adminAllEventsDashboard";
import TerminalDashboard from "./TerminalDashboardPortal/TerminalDashboard";
import TicketsTab from "../TicketsTab";
import BoxOfficeTab from "../BoxOfficeTab";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { styles } from "./index.styles";

// ── AGENT tab definitions ──
const AGENT_TABS = ["Sales", "Sold Tix", "New Tix"];

interface CircularProgressProps {
  value: number;
  total: number;
  size?: number;
}

// Circular Progress for Available Tickets
const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  total,
  size = 40,
}) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = size / 2 - 3;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const viewBox = `0 0 ${size} ${size}`;
  const center = size / 2;
  const fontSize = size <= 40 ? 9 : 11;

  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color.btnBrown_AE6F28}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${circumference - progress}`}
        strokeLinecap="round"
      />
      <SvgText
        x={center}
        y={center + fontSize / 3}
        textAnchor="middle"
        fontSize={fontSize}
        fill={color.placeholderTxt_24282C}
        fontWeight="500"
      >
        {`${percentage}%`}
      </SvgText>
    </Svg>
  );
};

interface DashboardScreenProps {
  eventInfo?: any;
  onScanCountUpdate?: any;
  onEventChange?: any;
  showEventDashboard?: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  eventInfo: propEventInfo,
  onScanCountUpdate,
  onEventChange,
  showEventDashboard,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);

  // Get eventInfo from props or route params (route params take precedence for navigation updates)
  const isFromRootStack = route?.name === "DashboardDetail";
  const initialEventInfo = isFromRootStack
    ? (route.params as any)?.eventInfo || propEventInfo
    : propEventInfo;

  // Local state to track event changes from dropdown when in root stack
  const [localEventInfo, setLocalEventInfo] = useState<any>(null);
  const eventInfo =
    localEventInfo || (isFromRootStack ? initialEventInfo : propEventInfo);

  // Calculate top padding: use safe area insets, or StatusBar height on Android
  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const [selectedTab, setSelectedTab] = useState("Check-Ins");
  const [selectedSaleScanTab, setSelectedSaleScanTab] = useState(
    dashboardsalesscantab[0],
  );
  const [selectedAdminTab, setSelectedAdminTab] = useState(
    admindashboardterminaltab[0],
  );
  const [selectedAdminOnlineBoxOfficeTab, setSelectedAdminOnlineBoxOfficeTab] =
    useState(adminonlineboxofficetab[0]);

  // ── AGENT tab state ──
  const [selectedAgentTab, setSelectedAgentTab] = useState(AGENT_TABS[0]);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(true);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentSalesType, setCurrentSalesType] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTitle, setAnalyticsTitle] = useState("");
  const [activeAnalytics, setActiveAnalytics] = useState<string | null>(null);

  // Separate analytics states for Check-Ins
  const [checkInAnalyticsData, setCheckInAnalyticsData] = useState<any>(null);
  const [checkInAnalyticsTitle, setCheckInAnalyticsTitle] = useState("");
  const [activeCheckInAnalytics, setActiveCheckInAnalytics] = useState<
    string | null
  >(null);
  const [scanAnalyticsData, setScanAnalyticsData] = useState<any>(null);
  const [scanAnalyticsTitle, setScanAnalyticsTitle] = useState("");
  const [activeScanAnalytics, setActiveScanAnalytics] = useState<string | null>(
    null,
  );
  const [activePaymentChannel, setActivePaymentChannel] = useState<
    string | null
  >(null);

  // Get available tickets count for the top card
  const getAvailableCount = () => {
    const terminalStats =
      dashboardStats?.data?.terminal_statistics ||
      dashboardStats?.data?.overall_statistics ||
      {};
    const raw = terminalStats?.available_tickets || 0;
    return typeof raw === "object" && raw !== null
      ? raw.total || raw.count || 0
      : raw || 0;
  };

  const getTotalTicketsCount = () => {
    const terminalStats =
      dashboardStats?.data?.terminal_statistics ||
      dashboardStats?.data?.overall_statistics ||
      {};
    const raw = terminalStats?.total_tickets || 0;
    return typeof raw === "object" && raw !== null
      ? raw.total || raw.count || 0
      : raw || 0;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setUserProfileLoading(true);
        const profile = await userService.getProfile();
        const role =
          profile?.role ||
          profile?.user_role ||
          profile?.type ||
          profile?.permission ||
          profile?.user_type ||
          profile?.data?.role ||
          profile?.user?.role;
        logger.log("Final role value:", role);

        setUserRole(role || null);
      } catch (err: any) {
        logger.error("Error fetching user profile:", err);
        setUserRole(null);
      } finally {
        setUserProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Reset selectedTab when user role changes to ensure valid default tab
  useEffect(() => {
    if (userRole !== null) {
      const tabList = getTabList();
      if (!tabList.includes(selectedTab)) {
        setSelectedTab(tabList[0]);
      }
    }
  }, [userRole]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // if (eventInfo?.eventUuid) {
        setLoading(true);

        let salesParam: string | null = null;
        if (userRole === "ADMIN") {
          if (selectedAdminOnlineBoxOfficeTab === "Online") {
            salesParam = "online";
          } else if (selectedAdminOnlineBoxOfficeTab === "Box Office") {
            salesParam = "box_office";
          }
        }

        const stats = await ticketService.fetchDashboardStats();
        // logger.log('📊 Dashboard Stats for ORGANIZER:', JSON.stringify(stats, null, 2));

        // if (userRole === 'ORGANIZER') {
        //   logger.log('📊 Dashboard Stats for ORGANIZER:', JSON.stringify(stats, null, 2));
        // }

        setDashboardStats(stats);
        setCurrentSalesType(salesParam);
        setError(null);
        // }
      } catch (err: any) {
        logger.error("Error fetching dashboard stats:", err);
        setError(err.message || "Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    // fetchStats();
  }, [eventInfo?.eventUuid, userRole, selectedAdminOnlineBoxOfficeTab]);

  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleTotalTicketsPress = () => {
    navigation.navigate(
      "Tickets" as never,
      { initialTab: "All", eventInfo } as never,
    );
  };

  const handlePaymentChannelPress = (paymentChannel: string) => {
    logger.log("Payment channel pressed:", paymentChannel);
    if (activePaymentChannel === paymentChannel) {
      setActivePaymentChannel(null);
    } else {
      setActivePaymentChannel(paymentChannel);
    }
  };

  const handleTotalScannedPress = () => {
    navigation.navigate(
      "Tickets" as never,
      { initialTab: "Scanned", eventInfo } as never,
    );
  };

  const handleTotalUnscannedPress = () => {
    navigation.navigate(
      "Tickets" as never,
      { initialTab: "Unscanned", eventInfo } as never,
    );
  };

  const handleAvailableTicketsPress = () => {
    setSelectedSaleScanTab("Sales");
    setSelectedTab("Available");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSaleScanTabPress = (tab: string) => {
    setSelectedSaleScanTab(tab);
  };

  const handleAdminTabPress = (tab: string) => {
    setSelectedAdminTab(tab);
  };

  const handleAdminOnlineBoxOfficeTabPress = (tab: string) => {
    setSelectedAdminOnlineBoxOfficeTab(tab);
  };

  const getTabList = () => {
    if (userRole === "ADMIN") {
      return ["Attendees", "Check-Ins", "Available"];
    } else {
      return ["Check-Ins", "Available"];
    }
  };

  const getTabButtonWidth = () => {
    return null;
  };

  const handleAnalyticsPress = async (
    ticketType: string,
    title: string,
    ticketUuid: string | null = null,
    subitemLabel: string | null = null,
  ) => {
    if (
      !eventInfo?.eventUuid ||
      (userRole !== "ADMIN" && userRole !== "ORGANIZER" && userRole !== "STAFF")
    )
      return;

    const analyticsKey = ticketUuid
      ? `${title}-${ticketUuid}`
      : `${title}-${ticketType}`;

    if (activeAnalytics === analyticsKey) {
      setActiveAnalytics(null);
      setAnalyticsData(null);
      setAnalyticsTitle("");
      return;
    }

    try {
      let salesParam = null;
      logger.log("handleAnalyticsPress params:", {
        ticketType,
        title,
        ticketUuid,
        subitemLabel,
      });

      const response = await ticketService.fetchDashboardStats(
        eventInfo.eventUuid,
        salesParam,
        ticketType,
        ticketUuid,
      );

      if (response?.data?.sold_tickets_analytics?.data) {
        const analyticsData = response.data.sold_tickets_analytics.data;
        const analyticsTitle = subitemLabel
          ? `${subitemLabel} Sales`
          : `${ticketType} Sales`;

        const chartData = Object.entries(analyticsData)
          .filter(([hour, value]) => (value as number) > 0)
          .map(([hour, value]) => {
            let formattedTime = hour;
            if (hour.includes(":00 ")) {
              const [time, period] = hour.split(" ");
              const [hours] = time.split(":");
              formattedTime = `${hours}${period.toLowerCase()}`;
            }
            return { time: formattedTime, value: value || 0 };
          });

        setAnalyticsData(chartData);
        setAnalyticsTitle(analyticsTitle);
        setActiveAnalytics(analyticsKey);
      }
    } catch (error) {
      logger.error("Error fetching analytics for", ticketType, error);
    }
  };

  const handleCheckInAnalyticsPress = async (
    ticketType: string,
    title: string,
    ticketUuid: string | null = null,
    subitemLabel: string | null = null,
  ) => {
    if (
      !eventInfo?.eventUuid ||
      (userRole !== "ADMIN" && userRole !== "ORGANIZER" && userRole !== "STAFF")
    )
      return;

    const analyticsKey = ticketUuid
      ? `${title}-${ticketUuid}`
      : `${title}-${ticketType}`;

    if (activeCheckInAnalytics === analyticsKey) {
      setActiveCheckInAnalytics(null);
      setCheckInAnalyticsData(null);
      setCheckInAnalyticsTitle("");
      return;
    }

    try {
      let salesParam = null;
      logger.log("handleCheckInAnalyticsPress params:", {
        ticketType,
        title,
        ticketUuid,
        subitemLabel,
      });

      const response = await ticketService.fetchDashboardStats(
        eventInfo.eventUuid,
        salesParam,
        ticketType,
        ticketUuid,
      );

      if (response?.data?.checkin_analytics?.data) {
        const analyticsData = response.data.checkin_analytics.data;
        const analyticsTitle = subitemLabel
          ? `${subitemLabel} Check-Ins`
          : `${ticketType} Check-Ins`;

        const chartData = Object.entries(analyticsData)
          .filter(([hour, value]) => (value as number) > 0)
          .map(([hour, value]) => {
            let formattedTime = hour;
            if (hour.includes(":00 ")) {
              const [time, period] = hour.split(" ");
              const [hours] = time.split(":");
              formattedTime = `${hours}${period.toLowerCase()}`;
            }
            return { time: formattedTime, value: value || 0 };
          });

        setCheckInAnalyticsData(chartData);
        setCheckInAnalyticsTitle(analyticsTitle);
        setActiveCheckInAnalytics(analyticsKey);
      }
    } catch (error) {
      logger.error("Error fetching check-in analytics for", ticketType, error);
    }
  };

  const handleScanAnalyticsPress = async (
    scanType: string,
    parentCategory: string,
    ticketUuid: string | null = null,
  ) => {
    if (!eventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid
      ? `Scan-${parentCategory}-${ticketUuid}`
      : `Scan-${parentCategory}-${scanType}`;

    if (activeScanAnalytics === analyticsKey) {
      setActiveScanAnalytics(null);
      setScanAnalyticsData(null);
      setScanAnalyticsTitle("");
      return;
    }

    try {
      logger.log("🔍 Fetching scan analytics for:", {
        scanType,
        parentCategory,
        ticketUuid,
      });

      let salesParam = null;
      const response = await ticketService.fetchDashboardStats(
        eventInfo.eventUuid,
        salesParam,
        parentCategory,
        ticketUuid,
      );

      if (response?.data?.scan_analytics?.data) {
        const analyticsData = response.data.scan_analytics.data;
        const analyticsTitle = ticketUuid
          ? `${scanType} Scans`
          : `${parentCategory} Scans`;

        const chartData = Object.entries(analyticsData)
          .filter(([hour, value]) => (value as number) > 0)
          .map(([hour, value]) => {
            let formattedTime = hour;
            if (hour.includes(":00 ")) {
              const [time, period] = hour.split(" ");
              const [hours] = time.split(":");
              formattedTime = `${hours}${period.toLowerCase()}`;
            }
            return { time: formattedTime, value: value || 0 };
          });

        setScanAnalyticsData(chartData);
        setScanAnalyticsTitle(analyticsTitle);
        setActiveScanAnalytics(analyticsKey);
      } else {
        logger.warn("⚠️ No scan analytics data found in response");
      }
    } catch (error) {
      logger.error("❌ Error fetching scan analytics for", scanType, error);
    }
  };

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    logger.log("Selected event:", event);

    if (event.uuid !== eventInfo?.eventUuid) {
      const eventUuid = event.uuid || event.eventUuid;
      setLocalEventInfo({
        ...eventInfo,
        eventUuid: eventUuid,
        event_title: event.title || event.event_title || event.name,
        cityName: event.cityName || event.location?.city || eventInfo?.cityName,
        date: event.start_date || event.date || eventInfo?.date,
        time: event.start_time || event.time || eventInfo?.time,
      });

      if (onEventChange) {
        onEventChange(event);
      }

      setEventsModalVisible(false);
    }
  };

  const getCheckInData = () => {
    if (
      dashboardStats?.data?.check_ins?.total_checkins === undefined ||
      dashboardStats?.data?.check_ins?.total_tickets === undefined
    ) {
      return [
        { label: "Total Checked In", checkedIn: 0, total: 0, percentage: 0 },
      ];
    }

    const totalCheckedIn = dashboardStats?.data?.check_ins?.total_checkins;
    const totalTickets = dashboardStats?.data?.check_ins?.total_tickets;
    const byCategory = dashboardStats?.data?.check_ins?.by_category;
    let typeRows: any[] = [];

    if (byCategory) {
      typeRows = Object.keys(byCategory || {}).map((type) => {
        const categoryData = byCategory[type];
        const checkedIn = categoryData?.scanned_tickets || 0;
        const total = categoryData?.total_tickets || 0;
        return {
          label: type,
          checkedIn,
          total,
          percentage: total ? Math.round((checkedIn / total) * 100) : 0,
        };
      });
    }

    return [
      {
        label: "Total Checked In",
        checkedIn: totalCheckedIn,
        total: totalTickets,
        percentage: totalTickets
          ? Math.round((totalCheckedIn / totalTickets) * 100)
          : 0,
      },
      ...typeRows,
    ];
  };

  const getSoldTicketsData = () => {
    let dataSource: any;
    if (userRole === "ADMIN") {
      dataSource = dashboardStats?.data?.sold_tickets;
    } else {
      dataSource = dashboardStats?.data?.box_office_sales?.ticket_wise;
    }

    if (
      dataSource?.total_tickets === undefined ||
      dataSource?.sold_tickets === undefined
    ) {
      return [{ label: "Total Sold", checkedIn: 0, total: 0, percentage: 0 }];
    }

    const totalSold = dataSource.sold_tickets || 0;
    const totalTickets = dataSource.total_tickets || 0;
    const byCategory = dataSource.by_category;
    let typeRows: any[] = [];

    if (byCategory) {
      typeRows = Object.keys(byCategory || {}).map((type) => {
        const categoryData = byCategory[type];
        let sold, total;
        if (userRole === "ADMIN") {
          sold = categoryData?.sold_tickets || 0;
          total = categoryData?.total_tickets || 0;
        } else {
          sold = categoryData?.sold || 0;
          total = categoryData?.total || 0;
        }
        return {
          label: type,
          checkedIn: sold,
          total,
          percentage: total ? Math.round((sold / total) * 100) : 0,
        };
      });
    }

    return [
      {
        label: "Total Sold",
        checkedIn: totalSold,
        total: totalTickets,
        percentage: totalTickets
          ? Math.round((totalSold / totalTickets) * 100)
          : 0,
      },
      ...typeRows,
    ];
  };

  const getAvailableTicketsData = () => {
    if (!dashboardStats?.data?.available_tickets) {
      return [{ label: "Available", checkedIn: 0, total: 0, percentage: 0 }];
    }

    const byCategory = dashboardStats?.data?.available_tickets;
    const typeRows = Object.keys(byCategory || {}).map((type) => {
      const categoryData = byCategory[type];
      const available = categoryData?.available_tickets || 0;
      const total = categoryData?.total_tickets || 0;

      const subItems: any[] = [];
      const ticketWise = categoryData;
      if (ticketWise) {
        Object.keys(ticketWise).forEach((ticketName) => {
          if (
            ticketName !== "total_tickets" &&
            ticketName !== "available_tickets"
          ) {
            const ticketInfo = ticketWise[ticketName];
            const ticketAvailable = ticketInfo.available || 0;
            const ticketTotal = ticketInfo.total || 0;
            subItems.push({
              label: ticketName,
              checkedIn: ticketAvailable,
              total: ticketTotal,
              percentage:
                ticketTotal > 0
                  ? Math.round((ticketAvailable / ticketTotal) * 100)
                  : 0,
              ticketUuid: ticketInfo.ticket_uuid,
              subItems: [],
            });
          }
        });
      }

      return {
        label: type,
        checkedIn: available,
        total,
        percentage: total > 0 ? Math.round((available / total) * 100) : 0,
        subItems,
      };
    });

    return [...typeRows];
  };

  function formatHourLabel(hourStr: string) {
    if (!hourStr || typeof hourStr !== "string") {
      logger.warn("formatHourLabel: Invalid input", hourStr);
      return "";
    }
    const parts = hourStr.split(":");
    if (parts.length < 2) return hourStr;
    const [hour, minutePart] = parts;
    if (!minutePart) return hour;
    const minuteAndPeriod = minutePart.split(" ");
    if (minuteAndPeriod.length < 2) {
      return `${parseInt(hour, 10)}${hourStr.includes("PM") ? "pm" : "am"}`;
    }
    const [minute, period] = minuteAndPeriod;
    return `${parseInt(hour, 10)}${period.toLowerCase()}`;
  }

  function getLatestNonZeroHour(checkinAnalytics: any) {
    if (!checkinAnalytics?.data) return null;
    const entries = Object.entries(checkinAnalytics.data);
    for (let i = entries.length - 1; i >= 0; i--) {
      if ((entries[i][1] as number) > 0) return formatHourLabel(entries[i][0]);
    }
    return formatHourLabel(entries[entries.length - 1][0]);
  }

  function getCheckinAnalyticsChartData(
    checkinAnalytics: any,
    highlightHour: string | null = null,
  ) {
    if (!checkinAnalytics?.data) return [];
    return Object.entries(checkinAnalytics.data).map(([hour, value]) => ({
      time: formatHourLabel(hour),
      value,
      isHighlighted: highlightHour
        ? formatHourLabel(hour) === highlightHour
        : false,
    }));
  }

  function mapSoldTicketsAnalytics(analyticsData: any) {
    if (!analyticsData) return [];
    return Object.entries(analyticsData).map(([hour, value]) => ({
      time: formatHourLabel(hour),
      value,
    }));
  }

  const handleBackPress = () => {
    navigation.goBack();
  };

  const shouldShowBackButton = isFromRootStack;

  const renderContent = () => {
    if (!dashboardStats?.data) return null;

    if (selectedSaleScanTab === "Sales") {
      const soldTicketsData = getSoldTicketsData();
      const remainingTicketsData = soldTicketsData.filter(
        (item) => item.label !== "Total Sold",
      );
      const soldTicketsChartData = mapSoldTicketsAnalytics(
        dashboardStats?.data?.sold_tickets_analytics?.data,
      );

      return (
        <>
          {/* Admin Online Box Office Tab */}
          {userRole === "ADMIN" && (
            <View style={styles.adminOnlineBoxOfficeTabContainer}>
              <View style={styles.adminOnlineBoxOfficeTabRow}>
                {adminonlineboxofficetab.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.adminOnlineBoxOfficeTabButton,
                      selectedAdminOnlineBoxOfficeTab === item &&
                        styles.selectedAdminOnlineBoxOfficeTabButton,
                    ]}
                    onPress={() => handleAdminOnlineBoxOfficeTabPress(item)}
                  >
                    <Text
                      style={[
                        styles.adminOnlineBoxOfficeTabButtonText,
                        selectedAdminOnlineBoxOfficeTab === item &&
                          styles.selectedAdminOnlineBoxOfficeTabButtonText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Admin Sales Components */}
          {userRole === "ADMIN" && (
            <>
              {selectedAdminOnlineBoxOfficeTab === "All" && (
                <AdminAllSales stats={dashboardStats} />
              )}
              {selectedAdminOnlineBoxOfficeTab === "Online" && (
                <AdminOnlineSales stats={dashboardStats} />
              )}
              {selectedAdminOnlineBoxOfficeTab === "Box Office" && (
                <>
                  <AdminBoxOfficeSales stats={dashboardStats} />
                  <CheckInSoldTicketsCard
                    title="Sold Tickets"
                    data={soldTicketsData}
                    remainingTicketsData={remainingTicketsData}
                    showRemaining={true}
                    userRole={userRole}
                    stats={dashboardStats}
                    onAnalyticsPress={handleAnalyticsPress}
                    activeAnalytics={activeAnalytics}
                  />
                </>
              )}
            </>
          )}

          {userRole !== "ADMIN" && <BoxOfficeSales stats={dashboardStats} />}
          {(userRole !== "ADMIN" ||
            (userRole === "ADMIN" &&
              selectedAdminOnlineBoxOfficeTab !== "Box Office")) && (
            <CheckInSoldTicketsCard
              title="Sold Tickets"
              data={soldTicketsData}
              remainingTicketsData={remainingTicketsData}
              showRemaining={true}
              userRole={userRole}
              stats={dashboardStats}
              onAnalyticsPress={handleAnalyticsPress}
              activeAnalytics={activeAnalytics}
            />
          )}
          {analyticsData && activeAnalytics ? (
            <AnalyticsChart
              title={analyticsTitle}
              data={analyticsData}
              dataType="sold"
            />
          ) : (
            <AnalyticsChart
              title="Sold Tickets"
              data={soldTicketsChartData}
              dataType="sold"
            />
          )}

          {userRole === "ADMIN" &&
            selectedAdminOnlineBoxOfficeTab === "Box Office" && (
              <AdminBoxOfficePaymentChannel stats={dashboardStats} />
            )}
          {userRole === "ORGANIZER" &&
            (() => {
              logger.log("🔍 ORGANIZER Payment Channels Debug:");
              const paymentChannelData =
                dashboardStats?.data?.payment_channels ||
                dashboardStats?.data?.payment_channel ||
                dashboardStats?.data?.box_office_sales?.payment_channels ||
                dashboardStats?.data?.box_office_sales?.payment_channel;

              return (
                <AdminBoxOfficePaymentChannel
                  stats={{
                    ...dashboardStats,
                    data: {
                      ...dashboardStats?.data,
                      box_office_sales: {
                        ...dashboardStats?.data?.box_office_sales,
                        payment_channel: paymentChannelData,
                      },
                    },
                  }}
                />
              );
            })()}

          {((userRole === "ADMIN" &&
            selectedAdminOnlineBoxOfficeTab === "Box Office") ||
            userRole === "ORGANIZER") && (
            <TotalPaymentChannelCard
              stats={dashboardStats}
              onPaymentChannelPress={handlePaymentChannelPress}
              activePaymentChannel={activePaymentChannel}
            />
          )}

          {((userRole === "ADMIN" &&
            selectedAdminOnlineBoxOfficeTab === "Box Office") ||
            userRole === "ORGANIZER") && (
            <PaymentChannelAnalytics
              stats={dashboardStats}
              selectedPaymentChannel={activePaymentChannel}
              eventInfo={eventInfo}
              userRole={userRole}
            />
          )}

          <View style={styles.tabContainer}>
            <View style={styles.tabRow}>
              {getTabList().map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.tabButton,
                    selectedTab === item && styles.selectedTabButton,
                  ]}
                  onPress={() => handleTabPress(item)}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      selectedTab === item && styles.selectedTabButtonText,
                    ]}
                    numberOfLines={2}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedTab === "Check-Ins" && (
            <>
              <CheckInSoldTicketsCard
                title="Check-Ins"
                data={getCheckInData()}
                remainingTicketsData={[]}
                showRemaining={false}
                userRole={userRole}
                stats={dashboardStats}
                onAnalyticsPress={handleCheckInAnalyticsPress}
                activeAnalytics={activeCheckInAnalytics}
              />
              {checkInAnalyticsData && activeCheckInAnalytics ? (
                <AnalyticsChart
                  title={checkInAnalyticsTitle}
                  data={checkInAnalyticsData}
                  dataType="checked in"
                />
              ) : (
                <AnalyticsChart
                  title="Check In"
                  data={getCheckinAnalyticsChartData(
                    dashboardStats?.data?.checkin_analytics,
                    highlightHour,
                  )}
                  dataType="checked in"
                />
              )}
            </>
          )}
          {selectedTab === "Available" && (
            <AvailableTicketsCard
              data={getAvailableTicketsData()}
              stats={dashboardStats}
            />
          )}
          {selectedTab === "Attendees" && (
            <AttendeesComponent
              eventInfo={eventInfo}
              onScanCountUpdate={onScanCountUpdate}
            />
          )}
        </>
      );
    } else if (selectedSaleScanTab === "Scans") {
      return (
        <>
          <ScanCategories stats={dashboardStats} />
          <ScanCategoriesDetails
            stats={dashboardStats}
            onScanAnalyticsPress={handleScanAnalyticsPress}
            activeScanAnalytics={activeScanAnalytics}
          />
          {scanAnalyticsData && activeScanAnalytics ? (
            <ScanAnalytics
              title={scanAnalyticsTitle}
              data={scanAnalyticsData}
              dataType="checked in"
            />
          ) : (
            <ScanAnalytics
              title="Scans"
              data={getCheckinAnalyticsChartData(
                dashboardStats?.data?.scan_analytics,
              )}
              dataType="checked in"
            />
          )}
          <ScanListComponent
            eventInfo={eventInfo}
            onScanCountUpdate={onScanCountUpdate}
          />
        </>
      );
    }

    if (selectedTab === "Attendees") {
      return (
        <AttendeesComponent
          eventInfo={eventInfo}
          onScanCountUpdate={onScanCountUpdate}
        />
      );
    } else if (
      selectedTab === "Check-Ins" ||
      selectedTab === "Sold Tickets" ||
      selectedTab === "Available"
    ) {
      const data =
        selectedTab === "Check-Ins"
          ? getCheckInData()
          : selectedTab === "Sold Tickets"
            ? getSoldTicketsData()
            : getAvailableTicketsData();

      const remainingTicketsData =
        selectedTab === "Sold Tickets"
          ? data.filter((item: any) => item.label !== "Total Sold")
          : [];

      const checkedInChartData = getCheckinAnalyticsChartData(
        dashboardStats?.data?.checkin_analytics,
        highlightHour,
      );
      const soldTicketsChartData = mapSoldTicketsAnalytics(
        dashboardStats?.data?.sold_tickets_analytics?.data,
      );

      return (
        <>
          <CheckInSoldTicketsCard
            title={selectedTab}
            data={data}
            remainingTicketsData={remainingTicketsData}
            showRemaining={selectedTab === "Sold Tickets"}
            userRole={userRole}
            stats={dashboardStats}
            onAnalyticsPress={
              selectedTab === "Check-Ins"
                ? handleCheckInAnalyticsPress
                : handleAnalyticsPress
            }
            activeAnalytics={
              selectedTab === "Check-Ins"
                ? activeCheckInAnalytics
                : activeAnalytics
            }
          />
          {selectedTab !== "Available" && (
            <>
              {selectedTab === "Check-Ins" ? (
                checkInAnalyticsData && activeCheckInAnalytics ? (
                  <AnalyticsChart
                    title={checkInAnalyticsTitle}
                    data={checkInAnalyticsData}
                    dataType="checked in"
                  />
                ) : (
                  <AnalyticsChart
                    title="Check In"
                    data={checkedInChartData}
                    dataType="checked in"
                  />
                )
              ) : analyticsData && activeAnalytics ? (
                <AnalyticsChart
                  title={analyticsTitle}
                  data={analyticsData}
                  dataType="sold"
                />
              ) : (
                <AnalyticsChart
                  title="Sold Tickets"
                  data={soldTicketsChartData}
                  dataType="sold"
                />
              )}
            </>
          )}
        </>
      );
    }
    return null;
  };

  // ── AGENT tab press handler — navigates to dedicated screens ──
  // ── AGENT tab press: just switch the selected tab ──
  const handleAgentTabPress = (tab: string) => {
    setSelectedAgentTab(tab);
  };

  // ── AGENT inline tab content renderer ──
  const renderAgentTabContent = () => {
    switch (selectedAgentTab) {
      case "Sales":
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {loading || userProfileLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                {/* Available Tickets - Full Width Card */}
                <View style={styles.availableTicketsContainer}>
                  <View style={styles.availableTicketsOuterWrapper}>
                    <View style={styles.availableTicketsCard}>
                      <CircularProgress
                        value={getAvailableCount()}
                        total={getTotalTicketsCount()}
                        size={40}
                      />
                      <View style={styles.availableTicketsTextContainer}>
                        <Text style={styles.availableTicketsTitle}>
                          Available Tickets
                        </Text>
                        <Text style={styles.availableTicketsValue}>
                          {getAvailableCount()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <BoxOfficeSales
                  stats={dashboardStats}
                  title="Sales"
                  onDebugData={(data: any) => {
                    logger.log(
                      "BoxOfficeSales - Backend Data:",
                      JSON.stringify(data, null, 2),
                    );
                  }}
                />
                <CheckInSoldTicketsCard
                  title="Sold Tickets"
                  data={getSoldTicketsData()}
                  remainingTicketsData={getSoldTicketsData().filter(
                    (i: any) => i.label !== "Total Sold",
                  )}
                  showRemaining={true}
                  userRole={userRole}
                  stats={dashboardStats}
                  onAnalyticsPress={handleAnalyticsPress}
                  activeAnalytics={activeAnalytics}
                />
                {analyticsData && activeAnalytics ? (
                  <AnalyticsChart
                    title={analyticsTitle}
                    data={analyticsData}
                    dataType="sold"
                  />
                ) : (
                  <AnalyticsChart
                    title="Sold Tickets"
                    data={mapSoldTicketsAnalytics(
                      dashboardStats?.data?.sold_tickets_analytics?.data,
                    )}
                    dataType="sold"
                  />
                )}
              </>
            )}
          </ScrollView>
        );
      case "Sold Tix":
        return (
          <View style={{ flex: 1 }}>
            <TicketsTab eventInfo={eventInfo} initialTab="All" />
          </View>
        );
      case "New Tix":
        return (
          <View style={{ flex: 1 }}>
            <BoxOfficeTab
              eventInfo={eventInfo}
              onScanCountUpdate={onScanCountUpdate}
            />
          </View>
        );
      default:
        return null;
    }
  };

  const highlightHour = getLatestNonZeroHour(
    dashboardStats?.data?.checkin_analytics,
  );

  const soldTicketsData = getSoldTicketsData();
  const remainingTicketsData = soldTicketsData.filter(
    (item: any) => item.label !== "Total Sold",
  );

  const renderTab = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === item && styles.selectedTabButton,
      ]}
      onPress={() => handleTabPress(item)}
    >
      <Text
        style={[
          styles.tabButtonText,
          selectedTab === item && styles.selectedTabButtonText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderSaleScanTab = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.saleScanTabButton,
        selectedSaleScanTab === item && styles.selectedSaleScanTabButton,
      ]}
      onPress={() => handleSaleScanTabPress(item)}
    >
      <Text
        style={[
          styles.saleScanTabButtonText,
          selectedSaleScanTab === item && styles.selectedSaleScanTabButtonText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  // ── Role-based early returns ──
  const shouldShowEventDashboard =
    showEventDashboard ||
    isFromRootStack ||
    (route.params as any)?.showEventDashboard;

  // ADMIN: show AdminAllEventsDashboard until an event is selected
  if (userRole === "ADMIN") {
    return <AdminAllEventsDashboard />;
  }

  // AGENT: show TerminalDashboard until an event is selected from TerminalEventsTab
  if (userRole === "AGENT" && !shouldShowEventDashboard) {
    return <TerminalDashboard />;
  }

  // ── AGENT event detail view (after selecting an event) ──
  if (userRole === "AGENT" && shouldShowEventDashboard) {
    return (
      <View style={styles.mainContainer}>
        <SafeAreaView style={[{ paddingTop: topPadding }]}>
          {/* Brown event info bar */}
          <View style={styles.header}>
            {shouldShowBackButton && (
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.headerBackButton}
              >
                <SvgIcons.whiteArrow />
              </TouchableOpacity>
            )}
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text
                  style={styles.eventName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {truncateEventName(eventInfo?.event_title) || "OUTMOSPHERE"}
                </Text>
              </View>
              <View style={styles.headerSpacer} />
              <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
                {formatDateWithMonthName(eventInfo?.date) || "30 Oct 2025"}
              </Text>
              <Text style={styles.separator}>at</Text>
              <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
                {eventInfo?.time || "7:00 PM"}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* ── AGENT three-tab bar: Sales | Sold Tix | New Tix ── */}
        <View style={styles.agentTabContainer}>
          <View style={styles.agentTabRow}>
            {AGENT_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.agentTabButton,
                  selectedAgentTab === tab && styles.selectedAgentTabButton,
                ]}
                onPress={() => handleAgentTabPress(tab)}
              >
                <Text
                  style={[
                    styles.agentTabButtonText,
                    selectedAgentTab === tab &&
                      styles.selectedAgentTabButtonText,
                  ]}
                  numberOfLines={1}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── AGENT tab content rendered inline ── */}
        <View style={{ flex: 1 }}>{renderAgentTabContent()}</View>
      </View>
    );
  }

  // ── Default full dashboard (ADMIN with event selected, ORGANIZER, STAFF, etc.) ──
  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={[{ paddingTop: topPadding }]}>
        {
          userRole === "AGENT" && 
          <View style={styles.header}>
          {shouldShowBackButton && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.headerBackButton}
            >
              <SvgIcons.whiteArrow />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text
                style={styles.eventName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {truncateEventName(eventInfo?.event_title) || "OUTMOSPHERE"}
              </Text>
              {userRole === "ADMIN" && (
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setEventsModalVisible(true)}
                >
                  <SvgIcons.downArrowWhite
                    width={12}
                    height={12}
                    fill={color.white_FFFFFF}
                    stroke={color.white_FFFFFF}
                    strokeWidth={0}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.headerSpacer} />
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              {formatDateWithMonthName(eventInfo?.date) || "30 Oct 2025"}
            </Text>
            <Text style={styles.separator}>at</Text>
            <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
              {eventInfo?.time || "7:00 PM"}
            </Text>
          </View>
        </View>
        }
        
      </SafeAreaView>

      {/* Admin Dashboard Terminal Tab */}
      {userRole === "ADMIN" && (
        <View style={styles.adminTabContainer}>
          <View style={styles.adminTabRow}>
            {admindashboardterminaltab.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.adminTabButton,
                  selectedAdminTab === item && styles.selectedAdminTabButton,
                ]}
                onPress={() => handleAdminTabPress(item)}
              >
                <Text
                  style={[
                    styles.adminTabButtonText,
                    selectedAdminTab === item &&
                      styles.selectedAdminTabButtonText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {userRole === "ADMIN" && selectedAdminTab === "Terminals" ? (
        <TerminalsComponent
          eventInfo={eventInfo}
          onEventChange={onEventChange}
        />
      ) : userRole === "ADMIN" && selectedAdminTab === "Staff" ? (
        <StaffListComponent
          eventInfo={eventInfo}
          onEventChange={onEventChange}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          ref={scrollViewRef}
        >
          <AdminAllEventsDashboard/>
          {/* <View style={styles.wrapper}>
            {loading || userProfileLoading ? (
              <Text style={styles.loadingText}>
                {loading
                  ? "Loading dashboard stats..."
                  : "Loading user profile..."}
              </Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                {userRole === "ADMIN" ? (
                  selectedAdminTab === "Dashboard" ? (
                    <>
                      {logger.log(
                        "Rendering AdminOverallStatistics for role:",
                        userRole,
                      )}
                      <View style={styles.overallStatisticsContainer}>
                        <AdminOverallStatistics
                          stats={dashboardStats}
                          onTotalTicketsPress={handleTotalTicketsPress}
                          onTotalScannedPress={handleTotalScannedPress}
                          onTotalUnscannedPress={handleTotalUnscannedPress}
                          onAvailableTicketsPress={handleAvailableTicketsPress}
                        />
                      </View>
                    </>
                  ) : null
                ) : (
                  <>
                    {logger.log(
                      "Rendering OverallStatistics for role:",
                      userRole,
                    )}
                    <View style={styles.overallStatisticsContainer}>
                      <OverallStatistics
                        stats={dashboardStats}
                        onTotalTicketsPress={handleTotalTicketsPress}
                        onTotalScannedPress={handleTotalScannedPress}
                        onTotalUnscannedPress={handleTotalUnscannedPress}
                        onAvailableTicketsPress={handleAvailableTicketsPress}
                      />
                    </View>
                  </>
                )}

                {(userRole !== "ADMIN" || selectedAdminTab === "Dashboard") && (
                  <>
                    <View style={styles.saleScanTabContainer}>
                      <View style={styles.saleScanTabRow}>
                        {dashboardsalesscantab.map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.saleScanTabButton,
                              selectedSaleScanTab === item &&
                                styles.selectedSaleScanTabButton,
                            ]}
                            onPress={() => handleSaleScanTabPress(item)}
                          >
                            <Text
                              style={[
                                styles.saleScanTabButtonText,
                                selectedSaleScanTab === item &&
                                  styles.selectedSaleScanTabButtonText,
                              ]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {selectedSaleScanTab !== "Sales" &&
                      selectedSaleScanTab !== "Scans" && (
                        <>
                          <BoxOfficeSales stats={dashboardStats} />
                          <View style={styles.tabContainer}>
                            <View style={styles.tabRow}>
                              {getTabList().map((item) => (
                                <TouchableOpacity
                                  key={item}
                                  style={[
                                    styles.tabButton,
                                    selectedTab === item &&
                                      styles.selectedTabButton,
                                  ]}
                                  onPress={() => handleTabPress(item)}
                                >
                                  <Text
                                    style={[
                                      styles.tabButtonText,
                                      selectedTab === item &&
                                        styles.selectedTabButtonText,
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {item}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </>
                      )}
                    {renderContent()}
                  </>
                )}
              </>
            )}
          </View> */}
        </ScrollView>
      )}

      <EventsModal
        visible={eventsModalVisible}
        onClose={() => setEventsModalVisible(false)}
        onEventSelect={handleEventSelect}
        currentEventUuid={eventInfo?.eventUuid}
      />
    </View>
  );
};

export default DashboardScreen;
