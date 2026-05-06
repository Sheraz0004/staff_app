import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { DASHBOARD_SERVICES } from "../../../services/DashboardService";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import { formatDateWithMonthName } from "../../../constants/dateAndTime";
import { logger } from "../../../utils/logger";
import { truncateEventName } from "../../../utils/stringUtils";
import BoxOfficeTab from "../../BoxOfficeTab";
import TicketsTab from "../../TicketsTab";
import AnalyticsChart from "../AnalyticsChart";
import BoxOfficeSales from "../BoxOfficeSales";
import CheckInSoldTicketsCard from "../CheckInSolidTicketsCard";
import { styles } from "../index.styles";

const AGENT_TABS = ["Sales", "Sold Tix", "New Tix"];

interface CircularProgressProps {
  value: number;
  total: number;
  size?: number;
}

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

interface AgentDashboardProps {
  eventInfo?: any;
  onScanCountUpdate?: any;
  showEventDashboard?: boolean;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({
  eventInfo: propEventInfo,
  onScanCountUpdate,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const isFromRootStack = route?.name === "DashboardDetail";
  const initialEventInfo = isFromRootStack
    ? (route.params as any)?.eventInfo || propEventInfo
    : propEventInfo;
  const eventInfo = isFromRootStack ? initialEventInfo : propEventInfo;

  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const [selectedAgentTab, setSelectedAgentTab] = useState(AGENT_TABS[0]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [dashboardStats] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTitle, setAnalyticsTitle] = useState("");
  const [activeAnalytics, setActiveAnalytics] = useState<string | null>(null);

  const shouldShowBackButton = isFromRootStack;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAgentTabPress = (tab: string) => {
    setSelectedAgentTab(tab);
  };

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

  const getSoldTicketsData = () => {
    const dataSource = dashboardStats?.data?.box_office_sales?.ticket_wise;

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
        const sold = categoryData?.sold || 0;
        const total = categoryData?.total || 0;
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

  const handleAnalyticsPress = async (
    ticketType: string,
    title: string,
    ticketUuid: string | null = null,
    subitemLabel: string | null = null,
  ) => {
    if (!eventInfo?.eventUuid) return;

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
      const response = await DASHBOARD_SERVICES.fetchEventStats({
        eventUuid: eventInfo.eventUuid,
        ticketType,
        ticketUuid,
      });

      if (response?.data?.sold_tickets_analytics?.data) {
        const data = response.data.sold_tickets_analytics.data;
        const resolvedTitle = subitemLabel
          ? `${subitemLabel} Sales`
          : `${ticketType} Sales`;

        const chartData = Object.entries(data)
          .filter(([, value]) => (value as number) > 0)
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
        setAnalyticsTitle(resolvedTitle);
        setActiveAnalytics(analyticsKey);
      }
    } catch (err) {
      logger.error("Error fetching analytics for", ticketType, err);
    }
  };

  const mapSoldTicketsAnalytics = (data: any) => {
    if (!data) return [];
    return Object.entries(data).map(([hour, value]) => {
      const parts = hour.split(":");
      let formattedTime = hour;
      if (parts.length >= 2 && parts[1]) {
        const minuteAndPeriod = parts[1].split(" ");
        if (minuteAndPeriod.length >= 2) {
          formattedTime = `${parseInt(parts[0], 10)}${minuteAndPeriod[1].toLowerCase()}`;
        }
      }
      return { time: formattedTime, value: value as number };
    });
  };

  const renderAgentTabContent = () => {
    switch (selectedAgentTab) {
      case "Sales":
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
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
                  userRole="AGENT"
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
            <TicketsTab eventInfo={eventInfo} />
          </View>
        );
      case "New Tix":
        return (
          <View style={{ flex: 1 }}>
            <BoxOfficeTab onScanCountUpdate={onScanCountUpdate} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={[{ paddingTop: topPadding }]}>
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
                  selectedAgentTab === tab && styles.selectedAgentTabButtonText,
                ]}
                numberOfLines={1}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>{renderAgentTabContent()}</View>
    </View>
  );
};

export default AgentDashboard;
