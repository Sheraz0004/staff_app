import React, { useState, useEffect } from 'react';
import { View, Platform, TouchableOpacity, SafeAreaView, ScrollView, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../../color/color';
import { useNavigation, useRoute } from '@react-navigation/native';
import SvgIcons from '../../../components/SvgIcons';
import AnalyticsChart from '../AnalyticsChart';
import { ticketService } from '../../../api/apiService';
import BoxOfficeSales from '../BoxOfficeSales';
import CheckInSoldTicketsCard from '../CheckInSolidTicketsCard';
import ScanAnalytics from '../ScanAnalytics';
import ScanCategories from '../ScanCategories';
import ScanCategoriesDetails from '../ScanCategoriesDetails';
import ScanListComponent from '../ScanListComponent';
import EventsModal from '../../../components/EventsModal';
import AdminBoxOfficePaymentChannel from '../AdminBoxOfficePaymentChannel';
import TotalPaymentChannelCard from '../TotalPaymentChannelCard';
import PaymentChannelAnalytics from '../PaymentChannelAnalytics';
import AvailableTicketsCard from '../AvailableTicketsCard';
import { truncateEventName } from '../../../utils/stringUtils';
import { formatDateWithMonthName } from '../../../constants/dateAndTime';
import { logger } from '../../../utils/logger';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { styles } from './index.styles';

// Circular Progress for Available Tickets
const CircularProgress = ({ value, total, size = 40 }: { value: number; total: number; size?: number }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const radius = (size / 2) - 3;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const viewBox = `0 0 ${size} ${size}`;
  const center = size / 2;
  const fontSize = size <= 40 ? 9 : 11;

  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      <Circle cx={center} cy={center} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={center} cy={center} r={radius}
        stroke={color.btnBrown_AE6F28} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${circumference - progress}`}
        strokeLinecap="round"
      />
      <SvgText
        x={center} y={center + fontSize / 3}
        textAnchor="middle" fontSize={fontSize}
        fill={color.placeholderTxt_24282C} fontWeight="500"
      >
        {`${percentage}%`}
      </SvgText>
    </Svg>
  );
};

const AdminTerminalDashboard: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { eventInfo, staffUuid, staffName, onEventChange } = (route.params as any);

  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  const [currentEventInfo, setCurrentEventInfo] = useState(eventInfo);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTitle, setAnalyticsTitle] = useState('');
  const [activeAnalytics, setActiveAnalytics] = useState<string | null>(null);
  const [scanAnalyticsData, setScanAnalyticsData] = useState<any>(null);
  const [scanAnalyticsTitle, setScanAnalyticsTitle] = useState('');
  const [activeScanAnalytics, setActiveScanAnalytics] = useState<string | null>(null);
  const [checkInAnalyticsData, setCheckInAnalyticsData] = useState<any>(null);
  const [checkInAnalyticsTitle, setCheckInAnalyticsTitle] = useState('');
  const [activeCheckInAnalytics, setActiveCheckInAnalytics] = useState<string | null>(null);
  const [activePaymentChannel, setActivePaymentChannel] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (currentEventInfo?.eventUuid && staffUuid) {
          setLoading(true);
          const salesParam = 'box_office';

          logger.log('StaffDashboard - Fetching stats with params:', {
            eventUuid: currentEventInfo.eventUuid,
            sales: salesParam,
            staffUuid: staffUuid,
          });

          const stats = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, null, null, staffUuid);
          setDashboardStats(stats);
          setError(null);
        }
      } catch (err: any) {
        logger.error('Error fetching staff dashboard stats:', err);
        setError(err.message || 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentEventInfo?.eventUuid, staffUuid]);

  const handlePaymentChannelPress = (paymentChannel: any) => {
    if (activePaymentChannel === paymentChannel) {
      setActivePaymentChannel(null);
    } else {
      setActivePaymentChannel(paymentChannel);
    }
  };

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    if (event.uuid !== currentEventInfo?.eventUuid) {
      if (onEventChange) onEventChange(event);
      navigation.goBack();
    }
    setEventsModalVisible(false);
  };

  const handleAnalyticsPress = async (ticketType: any, title: any, ticketUuid: any = null, subitemLabel: any = null) => {
    if (!currentEventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid ? `${title}-${ticketUuid}` : `${title}-${ticketType}`;

    if (activeAnalytics === analyticsKey) {
      setActiveAnalytics(null);
      setAnalyticsData(null);
      setAnalyticsTitle('');
      return;
    }

    try {
      let salesParam = null;
      const response = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, ticketType, ticketUuid, staffUuid);

      let data = null;
      let aTitle = '';

      if (title === 'Check-Ins' && response?.data?.checkin_analytics?.data) {
        data = response.data.checkin_analytics.data;
        aTitle = subitemLabel ? `${subitemLabel} Check-Ins` : `${ticketType} Check-Ins`;
      } else if (response?.data?.sold_tickets_analytics?.data) {
        data = response.data.sold_tickets_analytics.data;
        aTitle = subitemLabel ? `${subitemLabel} Sales` : `${ticketType} Sales`;
      }

      if (data) {
        const chartData = Object.entries(data).map(([hour, value]) => {
          let formattedTime = hour;
          if (hour.includes(':00 ')) {
            const [time, period] = hour.split(' ');
            const [hours] = time.split(':');
            formattedTime = `${hours}${period.toLowerCase()}`;
          }
          return { time: formattedTime, value: value || 0 };
        });

        setAnalyticsData(chartData);
        setAnalyticsTitle(aTitle);
        setActiveAnalytics(analyticsKey);
      }
    } catch (err: any) {
      logger.error('Error fetching analytics for', ticketType, err);
    }
  };

  const handleScanAnalyticsPress = async (scanType: any, parentCategory: any, ticketUuid: any = null) => {
    if (!currentEventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid ? `Scan-${parentCategory}-${ticketUuid}` : `Scan-${parentCategory}-${scanType}`;

    if (activeScanAnalytics === analyticsKey) {
      setActiveScanAnalytics(null);
      setScanAnalyticsData(null);
      setScanAnalyticsTitle('');
      return;
    }

    try {
      let salesParam = null;
      const response = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, parentCategory, ticketUuid, staffUuid);

      if (response?.data?.scan_analytics?.data) {
        const data = response.data.scan_analytics.data;
        const aTitle = ticketUuid ? `${scanType} Scans` : `${parentCategory} Scans`;

        const chartData = Object.entries(data)
          .filter(([, value]) => (value as number) > 0)
          .map(([hour, value]) => {
            let formattedTime = hour;
            if (hour.includes(':00 ')) {
              const [time, period] = hour.split(' ');
              const [hours] = time.split(':');
              formattedTime = `${hours}${period.toLowerCase()}`;
            }
            return { time: formattedTime, value: value || 0 };
          });

        setScanAnalyticsData(chartData);
        setScanAnalyticsTitle(aTitle);
        setActiveScanAnalytics(analyticsKey);
      }
    } catch (err: any) {
      logger.error('Error fetching scan analytics for', scanType, err);
    }
  };

  const handleCheckInAnalyticsPress = async (ticketType: any, title: any, ticketUuid: any = null, subitemLabel: any = null) => {
    if (!currentEventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid ? `${title}-${ticketUuid}` : `${title}-${ticketType}`;

    if (activeCheckInAnalytics === analyticsKey) {
      setActiveCheckInAnalytics(null);
      setCheckInAnalyticsData(null);
      setCheckInAnalyticsTitle('');
      return;
    }

    try {
      let salesParam = null;
      const response = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, ticketType, ticketUuid, staffUuid);

      if (response?.data?.checkin_analytics?.data) {
        const data = response.data.checkin_analytics.data;
        const aTitle = subitemLabel ? `${subitemLabel} Check-Ins` : `${ticketType} Check-Ins`;

        const chartData = Object.entries(data).map(([hour, value]) => {
          let formattedTime = hour;
          if (hour.includes(':00 ')) {
            const [time, period] = hour.split(' ');
            const [hours] = time.split(':');
            formattedTime = `${hours}${period.toLowerCase()}`;
          }
          return { time: formattedTime, value: value || 0 };
        });

        setCheckInAnalyticsData(chartData);
        setCheckInAnalyticsTitle(aTitle);
        setActiveCheckInAnalytics(analyticsKey);
      }
    } catch (err: any) {
      logger.error('Error fetching check-in analytics for', ticketType, err);
    }
  };

  const getSoldTicketsData = () => {
    const dataSource = dashboardStats?.data?.sold_tickets;

    if (dataSource?.total_tickets === undefined || dataSource?.sold_tickets === undefined) {
      return [{ label: 'Total Sold', checkedIn: 0, total: 0, percentage: 0 }];
    }

    const totalSold = dataSource.sold_tickets || 0;
    const totalTickets = dataSource.total_tickets || 0;

    const byCategory = dataSource.by_category;
    let typeRows: any[] = [];
    if (byCategory) {
      typeRows = Object.keys(byCategory).map((type) => {
        const categoryData = byCategory[type];
        const sold = categoryData?.sold_tickets || 0;
        const total = categoryData?.total_tickets || 0;

        const subItems: any[] = [];
        if (categoryData && typeof categoryData === 'object') {
          Object.keys(categoryData).forEach((ticketName) => {
            if (ticketName !== 'total_tickets' && ticketName !== 'sold_tickets' && categoryData[ticketName]) {
              const ticketInfo = categoryData[ticketName];
              if (ticketInfo.total !== undefined && ticketInfo.sold !== undefined) {
                subItems.push({
                  label: ticketName,
                  checkedIn: ticketInfo.sold,
                  total: ticketInfo.total,
                  percentage: ticketInfo.total > 0 ? Math.round((ticketInfo.sold / ticketInfo.total) * 100) : 0,
                  ticketUuid: ticketInfo.ticket_uuid,
                });
              }
            }
          });
        }

        return {
          label: type,
          checkedIn: sold,
          total,
          percentage: total ? Math.round((sold / total) * 100) : 0,
          subItems: subItems.length > 0 ? subItems : undefined,
        };
      });
    }

    return [
      { label: 'Total Sold', checkedIn: totalSold, total: totalTickets, percentage: totalTickets ? Math.round((totalSold / totalTickets) * 100) : 0 },
      ...typeRows,
    ];
  };

  function formatHourLabel(hourStr: any) {
    if (!hourStr || typeof hourStr !== 'string') return '';
    const parts = hourStr.split(':');
    if (parts.length < 2) return hourStr;
    const [hour, minutePart] = parts;
    if (!minutePart) return hour;
    const minuteAndPeriod = minutePart.split(' ');
    if (minuteAndPeriod.length < 2) return `${parseInt(hour, 10)}${hourStr.includes('PM') ? 'pm' : 'am'}`;
    const [, period] = minuteAndPeriod;
    return `${parseInt(hour, 10)}${period.toLowerCase()}`;
  }

  function mapSoldTicketsAnalytics(data: any) {
    if (!data) return [];
    return Object.entries(data).map(([hour, value]) => ({ time: formatHourLabel(hour), value }));
  }

  function getCheckinAnalyticsChartData(checkinAnalytics: any) {
    if (!checkinAnalytics?.data) return [];
    return Object.entries(checkinAnalytics.data).map(([hour, value]) => ({ time: formatHourLabel(hour), value }));
  }

  const getCheckInData = () => {
    const dataSource = dashboardStats?.data?.check_ins;

    if (dataSource?.total_checkins === undefined) {
      return [{ label: 'Total Check-Ins', checkedIn: 0, total: 0, percentage: 0 }];
    }

    const totalCheckedIn = dataSource.total_checkins || 0;
    const totalTickets = dashboardStats?.data?.sold_tickets?.total_tickets || 0;

    const byCategory = dataSource.by_category;
    let typeRows: any[] = [];
    if (byCategory) {
      typeRows = Object.keys(byCategory).map((type) => {
        const categoryData = byCategory[type];
        const checkedIn = categoryData?.total_checkins || 0;
        const total = categoryData?.total_tickets || 0;

        const subItems: any[] = [];
        if (categoryData && typeof categoryData === 'object') {
          Object.keys(categoryData).forEach((ticketName) => {
            if (ticketName !== 'total_tickets' && ticketName !== 'total_checkins' && categoryData[ticketName]) {
              const ticketInfo = categoryData[ticketName];
              if (ticketInfo.total !== undefined && ticketInfo.checked_in !== undefined) {
                subItems.push({
                  label: ticketName,
                  checkedIn: ticketInfo.checked_in,
                  total: ticketInfo.total,
                  percentage: ticketInfo.total > 0 ? Math.round((ticketInfo.checked_in / ticketInfo.total) * 100) : 0,
                  ticketUuid: ticketInfo.ticket_uuid,
                });
              }
            }
          });
        }

        return {
          label: type,
          checkedIn,
          total,
          percentage: total ? Math.round((checkedIn / total) * 100) : 0,
          subItems: subItems.length > 0 ? subItems : undefined,
        };
      });
    }

    return [
      { label: 'Total Check-Ins', checkedIn: totalCheckedIn, total: totalTickets, percentage: totalTickets ? Math.round((totalCheckedIn / totalTickets) * 100) : 0 },
      ...typeRows,
    ];
  };

  // Get available tickets count for the top card
  const getAvailableCount = () => {
    const terminalStats = dashboardStats?.data?.terminal_statistics || dashboardStats?.data?.overall_statistics || {};
    const raw = terminalStats?.available_tickets || 0;
    return typeof raw === 'object' && raw !== null ? (raw.total || raw.count || 0) : (raw || 0);
  };

  const getTotalTicketsCount = () => {
    const terminalStats = dashboardStats?.data?.terminal_statistics || dashboardStats?.data?.overall_statistics || {};
    const raw = terminalStats?.total_tickets || 0;
    return typeof raw === 'object' && raw !== null ? (raw.total || raw.count || 0) : (raw || 0);
  };

  const renderContent = () => {
    if (!dashboardStats?.data) return null;

    const soldTicketsData = getSoldTicketsData();
    const remainingTicketsData = soldTicketsData.filter((item) => item.label !== 'Total Sold');
    const soldTicketsChartData = mapSoldTicketsAnalytics(dashboardStats?.data?.sold_tickets_analytics?.data);

    return (
      <>
        <BoxOfficeSales
          stats={dashboardStats}
          title="Sales"
          onDebugData={(data: any) => {
            logger.log('BoxOfficeSales - Backend Data:', JSON.stringify(data, null, 2));
          }}
        />
        <CheckInSoldTicketsCard
          title="Sold Tickets"
          data={soldTicketsData}
          remainingTicketsData={remainingTicketsData}
          showRemaining={true}
          userRole="STAFF"
          stats={dashboardStats}
          onAnalyticsPress={handleAnalyticsPress}
          activeAnalytics={activeAnalytics}
        />
        {analyticsData && activeAnalytics ? (
          <AnalyticsChart title={analyticsTitle} data={analyticsData} dataType="sold" />
        ) : (
          <AnalyticsChart title="Sold Tickets" data={soldTicketsChartData} dataType="sold" />
        )}
        <AdminBoxOfficePaymentChannel
          stats={{
            ...dashboardStats,
            data: {
              ...dashboardStats?.data,
              box_office_sales: {
                ...dashboardStats?.data?.box_office_sales,
                payment_channel: dashboardStats?.data?.payment_channels || dashboardStats?.data?.payment_channel,
              },
            },
          }}
        />
        <TotalPaymentChannelCard
          stats={dashboardStats}
          onPaymentChannelPress={handlePaymentChannelPress}
          activePaymentChannel={activePaymentChannel}
        />
        <PaymentChannelAnalytics
          stats={dashboardStats}
          selectedPaymentChannel={activePaymentChannel}
          eventInfo={currentEventInfo}
          userRole="STAFF"
          staffUuid={staffUuid}
        />

        {/* Check-Ins Section */}
        {/* <CheckInSoldTicketsCard
          title="Check-Ins"
          data={getCheckInData()}
          remainingTicketsData={[]}
          showRemaining={false}
          userRole="STAFF"
          stats={dashboardStats}
          onAnalyticsPress={handleCheckInAnalyticsPress}
          activeAnalytics={activeCheckInAnalytics}
        />
        {checkInAnalyticsData && activeCheckInAnalytics ? (
          <AnalyticsChart title={checkInAnalyticsTitle} data={checkInAnalyticsData} dataType="checked in" />
        ) : (
          <AnalyticsChart title="Check In" data={getCheckinAnalyticsChartData(dashboardStats?.data?.checkin_analytics)} dataType="checked in" />
        )} */}

        {/* Scans Section */}
        {/* <ScanCategories stats={dashboardStats} />
        <ScanCategoriesDetails
          stats={dashboardStats}
          onScanAnalyticsPress={handleScanAnalyticsPress}
          activeScanAnalytics={activeScanAnalytics}
        />
        {scanAnalyticsData && activeScanAnalytics ? (
          <ScanAnalytics title={scanAnalyticsTitle} data={scanAnalyticsData} dataType="checked in" />
        ) : (
          <ScanAnalytics title="Scans" data={getCheckinAnalyticsChartData(dashboardStats?.data?.scan_analytics)} dataType="checked in" />
        )}
        <ScanListComponent eventInfo={currentEventInfo} staffUuid={staffUuid} /> */}
      </>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {Platform.OS === 'android' && (
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      )}
      <SafeAreaView style={[styles.safeAreaContainer, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">
                {truncateEventName(currentEventInfo?.event_title) || 'OUTMOSPHERE'}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              {formatDateWithMonthName(eventInfo?.date) || '30 Oct 2025'}
            </Text>
            <Text style={styles.separator}>at</Text>
            <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
              {eventInfo?.time || '7:00 PM'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Staff Name Display */}
      <View style={styles.staffNameContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <SvgIcons.backArrow width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.staffName}>{staffName}</Text>
      </View>

      {/* Available Tickets - Full Width Card */}
      <View style={styles.availableTicketsContainer}>
        <View style={styles.availableTicketsOuterWrapper}>
          <View style={styles.availableTicketsCard}>
            <CircularProgress value={getAvailableCount()} total={getTotalTicketsCount()} size={40} />
            <View style={styles.availableTicketsTextContainer}>
              <Text style={styles.availableTicketsTitle}>Available Tickets</Text>
              <Text style={styles.availableTicketsValue}>{getAvailableCount()}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.wrapper}>
          {loading ? (
            <Text style={styles.loadingText}>Loading staff dashboard stats...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            renderContent()
          )}
        </View>
      </ScrollView>

      {/* Events Modal */}
      <EventsModal
        visible={eventsModalVisible}
        onClose={() => setEventsModalVisible(false)}
        onEventSelect={handleEventSelect}
        currentEventUuid={currentEventInfo?.eventUuid}
      />
    </View>
  );
};

export default AdminTerminalDashboard;
