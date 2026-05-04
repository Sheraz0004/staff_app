import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import SvgIcons from "../../../components/SvgIcons";
import Loader from "../../../components/Loader/Loader";
import EventsModal from "../../../components/EventsModal";
import { dashboardsalesscantab } from "../../../constants/dashboardsalesscantab";
import { formatDateWithMonthName } from "../../../constants/dateAndTime";
import { truncateEventName } from "../../../utils/stringUtils";
import { color } from "../../../color/color";
import { logger } from "../../../utils/logger";
import { useApi } from "../../../services/useApi";
import { DASHBOARD_SERVICES } from "../../../services/DashboardService";
import AdminOverallStatistics from "../AdminOverallStatistics";
import AnalyticsChart from "../AnalyticsChart";
import AdminBoxOfficePaymentChannel from "../AdminBoxOfficePaymentChannel";
import BoxOfficeSales from "../BoxOfficeSales";
import CheckInSoldTicketsCard from "../CheckInSolidTicketsCard";
import ScanAnalytics from "../ScanAnalytics";
import ScanCategories from "../ScanCategories";
import ScanCategoriesDetails from "../ScanCategoriesDetails";
import ScanListComponent, { ScanListHandle } from "../ScanListComponent";
import { styles } from "./index.styles";

const StaffDashboard: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);
  const scanListRef = useRef<ScanListHandle>(null);

  const {
    eventInfo: initialEventInfo,
    staffUuid,
    staffName,
    salesOnly = false,
  } = route.params as any;
  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const [localEventInfo, setLocalEventInfo] = useState<any>(null);
  const eventInfo = localEventInfo || initialEventInfo;

  const [selectedSaleScanTab, setSelectedSaleScanTab] = useState(
    dashboardsalesscantab[0],
  );
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTitle, setAnalyticsTitle] = useState("");
  const [activeAnalytics, setActiveAnalytics] = useState<any>(null);
  const [scanAnalyticsData, setScanAnalyticsData] = useState<any>(null);
  const [scanAnalyticsTitle, setScanAnalyticsTitle] = useState("");
  const [activeScanAnalytics, setActiveScanAnalytics] = useState<any>(null);

  const { loading, requestCall: fetchStaffEventStats } = useApi(
    DASHBOARD_SERVICES.fetchStaffEventStats,
    false,
    false,
  );

  useEffect(() => {
    if (!staffUuid) return;
    fetchStaffEventStats(staffUuid)
      .then((res: any) => {
        setDashboardStats(res?.data);
      })
      .catch((err: any) => {
        logger.error("[StaffDashboard] stats error:", err.response);
        setHasError(true);
      });
  }, [staffUuid]);

  const handleAnalyticsPress = (
    ticketType: any,
    title: any,
    ticketUuid: any = null,
    subitemLabel: any = null,
  ) => {
    const analyticsKey = ticketUuid
      ? `${title}-${ticketUuid}`
      : `${title}-${ticketType}`;
    if (activeAnalytics === analyticsKey) {
      setActiveAnalytics(null);
      setAnalyticsData(null);
      setAnalyticsTitle("");
      return;
    }
    const saleAnalytics = dashboardStats?.sales?.saleAnalytics || {};
    const titleStr = subitemLabel
      ? `${subitemLabel} Sales`
      : `${ticketType} Sales`;
    const chartData = Object.entries(saleAnalytics).map(([hour, value]) => ({
      time: formatHourLabel(hour),
      value: (value as number) || 0,
    }));
    setAnalyticsData(chartData);
    setAnalyticsTitle(titleStr);
    setActiveAnalytics(analyticsKey);
  };

  const handleScanAnalyticsPress = (
    scanType: any,
    parentCategory: any,
    ticketUuid: any = null,
  ) => {
    const analyticsKey = ticketUuid
      ? `Scan-${parentCategory}-${ticketUuid}`
      : `Scan-${parentCategory}-${scanType}`;
    if (activeScanAnalytics === analyticsKey) {
      setActiveScanAnalytics(null);
      setScanAnalyticsData(null);
      setScanAnalyticsTitle("");
      return;
    }
    const scanAnalytics = dashboardStats?.scans?.scanAnalytics || {};
    const title = ticketUuid ? `${scanType} Scans` : `${parentCategory} Scans`;
    const chartData = Object.entries(scanAnalytics)
      .filter(([, value]) => (value as number) > 0)
      .map(([hour, value]) => ({
        time: formatHourLabel(hour),
        value: (value as number) || 0,
      }));
    setScanAnalyticsData(chartData);
    setScanAnalyticsTitle(title);
    setActiveScanAnalytics(analyticsKey);
  };

  function formatHourLabel(hourStr: any): string {
    if (!hourStr || typeof hourStr !== "string") return "";
    if (hourStr.includes("-") && hourStr.includes(" ")) {
      const spaceIdx = hourStr.lastIndexOf(" ");
      const hour = parseInt(hourStr.slice(spaceIdx + 1), 10);
      const period = hour >= 12 ? "pm" : "am";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}${period}`;
    }
    const parts = hourStr.split(":");
    if (parts.length < 2) return hourStr;
    const [hour, minutePart] = parts;
    if (!minutePart) return hour;
    const minuteAndPeriod = minutePart.split(" ");
    if (minuteAndPeriod.length < 2) {
      return `${parseInt(hour, 10)}${hourStr.includes("PM") ? "pm" : "am"}`;
    }
    const [, period] = minuteAndPeriod;
    return `${parseInt(hour, 10)}${period.toLowerCase()}`;
  }

  function mapAnalyticsData(
    analyticsObj: any,
  ): { time: string; value: number }[] {
    if (!analyticsObj) return [];
    return Object.entries(analyticsObj).map(([hour, value]) => ({
      time: formatHourLabel(hour),
      value: (value as number) || 0,
    }));
  }

  const getSoldTicketsData = () => {
    const salesTickets = dashboardStats?.sales?.tickets;
    const totalSold = salesTickets?.totalSold || 0;
    const totalTickets = dashboardStats?.tickets?.totalTickets || 0;
    const classes = salesTickets?.classes || {};
    const availableByClass = dashboardStats?.availableTickets || {};

    const typeRows = Object.entries(classes).map(
      ([name, classData]: [string, any]) => {
        const sold = classData?.total || 0;
        const available = availableByClass[name]?.total || 0;
        const total = sold + available;
        const subClasses = classData?.subClasses || {};
        const availableSubClasses = availableByClass[name]?.subClasses || {};
        const subItems: any[] = Object.entries(subClasses).map(
          ([subName, subSold]) => {
            const subSoldCount = typeof subSold === "number" ? subSold : 0;
            const subAvailable =
              typeof availableSubClasses[subName] === "number"
                ? availableSubClasses[subName]
                : 0;
            const subTotal = subSoldCount + subAvailable;
            return {
              label: subName,
              checkedIn: subSoldCount,
              total: subTotal,
              percentage:
                subTotal > 0 ? Math.round((subSoldCount / subTotal) * 100) : 0,
            };
          },
        );
        return {
          label: name,
          checkedIn: sold,
          total,
          percentage: total > 0 ? Math.round((sold / total) * 100) : 0,
          subItems: subItems.length > 0 ? subItems : undefined,
        };
      },
    );

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

  const renderContent = () => {
    if (!dashboardStats) return null;

    if (selectedSaleScanTab === "Sales") {
      const soldTicketsData = getSoldTicketsData();
      const remainingTicketsData = soldTicketsData.filter(
        (item) => item.label !== "Total Sold",
      );
      const soldTicketsChartData = mapAnalyticsData(
        dashboardStats?.sales?.saleAnalytics,
      );

      return (
        <>
          <BoxOfficeSales stats={dashboardStats} onDebugData={() => {}} />
          <CheckInSoldTicketsCard
            title="Sold Tickets"
            data={soldTicketsData}
            remainingTicketsData={remainingTicketsData}
            showRemaining={true}
            userRole="ADMIN"
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
              data={soldTicketsChartData}
              dataType="sold"
            />
          )}
          {/* <AdminBoxOfficePaymentChannel stats={dashboardStats} /> */}
        </>
      );
    }

    if (selectedSaleScanTab === "Scans") {
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
              data={mapAnalyticsData(dashboardStats?.scans?.scanAnalytics)}
              dataType="checked in"
            />
          )}
        </>
      );
    }

    return null;
  };

  return (
    <View style={styles.mainContainer}>
      {Platform.OS === "android" && (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
      )}
      <SafeAreaView
        style={[styles.safeAreaContainer, { paddingTop: topPadding }]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text
                style={styles.eventName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {truncateEventName(eventInfo?.event_title) || "OUTMOSPHERE"}
              </Text>
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

      <View style={styles.staffNameContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <SvgIcons.backArrow width={21} height={21} />
        </TouchableOpacity>
        <Text style={styles.staffName}>{staffName}</Text>
      </View>

      {hasError ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>No Stats Available</Text>
          <Text style={styles.emptyStateSubtext}>
            This staff member has no event assigned or stats could not be loaded.
          </Text>
        </View>
      ) : loading && !dashboardStats ? null : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          innerRef={(ref: any) => {
            scrollViewRef.current = ref;
          }}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={40}
          scrollEventThrottle={400}
          onScroll={({ nativeEvent }: { nativeEvent: any }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const nearBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 300;
            if (nearBottom && selectedSaleScanTab === "Scans") {
              scanListRef.current?.loadMore();
            }
          }}
        >
          <AdminOverallStatistics
            stats={dashboardStats}
            onTotalTicketsPress={() => {}}
            onTotalScannedPress={() => {}}
            onTotalUnscannedPress={() => {}}
            onAvailableTicketsPress={() => {}}
            showOnlyTopRow
          />

          {!salesOnly && (
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
                    onPress={() => setSelectedSaleScanTab(item)}
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
          )}

          {renderContent()}

          {dashboardStats && !salesOnly && (
            <View
              style={{
                display: selectedSaleScanTab === "Scans" ? "flex" : "none",
              }}
            >
              <ScanListComponent
                ref={scanListRef}
                isActive={selectedSaleScanTab === "Scans"}
                eventInfo={eventInfo}
                staffUuid={null}
                onScanCountUpdate={null}
              />
            </View>
          )}
        </KeyboardAwareScrollView>
      )}

      <EventsModal
        visible={eventsModalVisible}
        onClose={() => setEventsModalVisible(false)}
        onEventSelect={(event: any) => {
          if (event.uuid !== eventInfo?.eventUuid) {
            setLocalEventInfo({
              ...eventInfo,
              eventUuid: event.uuid || event.eventUuid,
              event_title: event.title || event.event_title || event.name,
              date: event.start_date || event.date || eventInfo?.date,
              time: event.start_time || event.time || eventInfo?.time,
            });
          }
          setEventsModalVisible(false);
        }}
        currentEventUuid={eventInfo?.eventUuid}
      />
      <Loader isLoading={loading} />
    </View>
  );
};

export default StaffDashboard;
