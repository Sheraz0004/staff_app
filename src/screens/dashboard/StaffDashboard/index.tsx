import React, { useState, useEffect } from 'react';
import { View, Platform, TouchableOpacity, SafeAreaView, ScrollView, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../../color/color';
import { useNavigation, useRoute } from '@react-navigation/native';
import SvgIcons from '../../../components/SvgIcons';
import { dashboardsalesscantab } from '../../../constants/dashboardsalesscantab';
import AnalyticsChart from '../AnalyticsChart';
import { ticketService } from '../../../api/apiService';
import BoxOfficeSales from '../BoxOfficeSales';
import CheckInSoldTicketsCard from '../CheckInSolidTicketsCard';
import ScanAnalytics from '../ScanAnalytics';
import ScanCategories from '../ScanCategories';
import ScanCategoriesDetails from '../ScanCategoriesDetails';
import ScanListComponent from '../ScanListComponent';
import OverallStatistics from '../OverallStatistics';
import EventsModal from '../../../components/EventsModal';
import AdminBoxOfficePaymentChannel from '../AdminBoxOfficePaymentChannel';
import TotalPaymentChannelCard from '../TotalPaymentChannelCard';
import PaymentChannelAnalytics from '../PaymentChannelAnalytics';
import AvailableTicketsCard from '../AvailableTicketsCard';
import { truncateCityName } from '../../../utils/stringUtils';
import { truncateEventName } from '../../../utils/stringUtils';
import { formatDateWithMonthName } from '../../../constants/dateAndTime';
import { logger } from '../../../utils/logger';
import { DASHBOARD_SERVICES } from '../../../services/DashboardService';
import { styles } from './index.styles';

const StaffDashboard: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { eventInfo, staffUuid, staffName, onEventChange } = route.params as any;

  // Calculate top padding: use safe area insets, or StatusBar height on Android
  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  // Local state for current event info
  const [currentEventInfo, setCurrentEventInfo] = useState<any>(eventInfo);

  const [selectedSaleScanTab, setSelectedSaleScanTab] = useState(dashboardsalesscantab[0]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTitle, setAnalyticsTitle] = useState('');
  const [activeAnalytics, setActiveAnalytics] = useState<any>(null);
  const [scanAnalyticsData, setScanAnalyticsData] = useState<any>(null);
  const [scanAnalyticsTitle, setScanAnalyticsTitle] = useState('');
  const [activeScanAnalytics, setActiveScanAnalytics] = useState<any>(null);
  const [checkInAnalyticsData, setCheckInAnalyticsData] = useState<any>(null);
  const [checkInAnalyticsTitle, setCheckInAnalyticsTitle] = useState('');
  const [activeCheckInAnalytics, setActiveCheckInAnalytics] = useState<any>(null);
  const [activePaymentChannel, setActivePaymentChannel] = useState<any>(null);
  const [staffEventStats, setStaffEventStats] = useState<any>(null);

  useEffect(() => {
    const fetchStaffEventStats = async () => {
      if (!staffUuid) return;
      try {
        const res = await DASHBOARD_SERVICES.fetchStaffEventStats(staffUuid);
        logger.log('[StaffDashboard] event-stats response:', JSON.stringify(res?.data, null, 2));
        setStaffEventStats(res?.data);
      } catch (err: any) {
        logger.error('[StaffDashboard] event-stats error:', err.response.data);
      }
    };
    fetchStaffEventStats();
  }, [staffUuid]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (currentEventInfo?.eventUuid && staffUuid) {
          setLoading(true);

          // For staff, we need to pass 'box_office' as sales parameter
          // This tells the backend to return box office sales data for this staff member
          const salesParam = 'box_office';

          // Log the parameters being sent
          logger.log('StaffDashboard - Fetching stats with params:', {
            eventUuid: currentEventInfo.eventUuid,
            sales: salesParam,
            ticketType: null,
            ticketUuid: null,
            staffUuid: staffUuid
          });

          // Use the same API but with staff_uuid parameter and sales=box_office
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

  const handleSaleScanTabPress = (tab: any) => {
    setSelectedSaleScanTab(tab);
  };


  const handlePaymentChannelPress = (paymentChannel: any) => {
    logger.log('Payment channel pressed:', paymentChannel);
    // Toggle active payment channel
    if (activePaymentChannel === paymentChannel) {
      setActivePaymentChannel(null);
    } else {
      setActivePaymentChannel(paymentChannel);
    }
  };

  const handleEventSelect = (event: any) => {
    setSelectedEvent(event);
    logger.log('Selected event:', event);

    // If the selected event is different from the current event
    if (event.uuid !== currentEventInfo?.eventUuid) {
      // Call the onEventChange callback if it exists
      if (onEventChange) {
        onEventChange(event);
      }
      // Go back to the previous screen
      navigation.goBack();
    }

    // Close the modal
    setEventsModalVisible(false);
  };

  const handleAnalyticsPress = async (ticketType: any, title: any, ticketUuid: any = null, subitemLabel: any = null) => {
    if (!currentEventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid ? `${title}-${ticketUuid}` : `${title}-${ticketType}`;

    // If already active, deactivate
    if (activeAnalytics === analyticsKey) {
      setActiveAnalytics(null);
      setAnalyticsData(null);
      setAnalyticsTitle('');
      return;
    }

    try {
      // Don't send sales parameter when filtering by ticket_type or ticket_uuid
      let salesParam = null;

      const response = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, ticketType, ticketUuid, staffUuid);

      // Handle both sold tickets and check-in analytics
      let analyticsData = null;
      let analyticsTitle = '';

      if (title === 'Check-Ins' && response?.data?.checkin_analytics?.data) {
        // Handle Check-Ins analytics
        analyticsData = response.data.checkin_analytics.data;
        analyticsTitle = subitemLabel ? `${subitemLabel} Check-Ins` : `${ticketType} Check-Ins`;
      } else if (response?.data?.sold_tickets_analytics?.data) {
        // Handle Sold Tickets analytics
        analyticsData = response.data.sold_tickets_analytics.data;
        analyticsTitle = subitemLabel ? `${subitemLabel} Sales` : `${ticketType} Sales`;
      }

      if (analyticsData) {
        const chartData = Object.entries(analyticsData).map(([hour, value]) => {
          // Format time from "12:00 AM" to "12am" or "12:00 PM" to "12pm"
          let formattedTime = hour;
          if (hour.includes(':00 ')) {
            const [time, period] = hour.split(' ');
            const [hours] = time.split(':');
            formattedTime = `${hours}${period.toLowerCase()}`;
          }

          return {
            time: formattedTime,
            value: value || 0
          };
        });

        setAnalyticsData(chartData);
        setAnalyticsTitle(analyticsTitle);
        setActiveAnalytics(analyticsKey);
      }
    } catch (error) {
      logger.error('Error fetching analytics for', ticketType, error);
    }
  };

  const handleScanAnalyticsPress = async (scanType: any, parentCategory: any, ticketUuid: any = null) => {
    if (!currentEventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid ? `Scan-${parentCategory}-${ticketUuid}` : `Scan-${parentCategory}-${scanType}`;

    // If already active, deactivate
    if (activeScanAnalytics === analyticsKey) {
      setActiveScanAnalytics(null);
      setScanAnalyticsData(null);
      setScanAnalyticsTitle('');
      return;
    }

    try {
      logger.log('🔍 Fetching scan analytics for:', {
        scanType,
        parentCategory,
        ticketUuid
      });

      // Don't send sales parameter when filtering by ticket_type or ticket_uuid
      let salesParam = null;

      // Fetch fresh data with ticketType, ticketUuid, and staffUuid parameters
      const response = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, parentCategory, ticketUuid, staffUuid);

      // Handle Scan analytics
      if (response?.data?.scan_analytics?.data) {
        const analyticsData = response.data.scan_analytics.data;
        const analyticsTitle = ticketUuid ? `${scanType} Scans` : `${parentCategory} Scans`;

        logger.log('Scan Analytics Data:', analyticsData);
        logger.log('Scan Analytics Response:', response.data.scan_analytics);

        const chartData = Object.entries(analyticsData)
          .filter(([hour, value]) => value > 0) // Filter out zero values
          .map(([hour, value]) => {
            // Format time from "12:00 AM" to "12am" or "12:00 PM" to "12pm"
            let formattedTime = hour;
            if (hour.includes(':00 ')) {
              const [time, period] = hour.split(' ');
              const [hours] = time.split(':');
              formattedTime = `${hours}${period.toLowerCase()}`;
            }

            return {
              time: formattedTime,
              value: value || 0
            };
          });

        logger.log('Formatted Scan Chart Data:', chartData);
        setScanAnalyticsData(chartData);
        setScanAnalyticsTitle(analyticsTitle);
        setActiveScanAnalytics(analyticsKey);
      } else {
        logger.warn('No scan analytics data found in response');
      }
    } catch (error) {
      logger.error('Error fetching scan analytics for', scanType, error);
    }
  };

  const handleCheckInAnalyticsPress = async (ticketType: any, title: any, ticketUuid: any = null, subitemLabel: any = null) => {
    if (!currentEventInfo?.eventUuid) return;

    const analyticsKey = ticketUuid ? `${title}-${ticketUuid}` : `${title}-${ticketType}`;

    // If already active, deactivate
    if (activeCheckInAnalytics === analyticsKey) {
      setActiveCheckInAnalytics(null);
      setCheckInAnalyticsData(null);
      setCheckInAnalyticsTitle('');
      return;
    }

    try {
      // Don't send sales parameter when filtering by ticket_type or ticket_uuid
      let salesParam = null;

      const response = await ticketService.fetchDashboardStats(currentEventInfo.eventUuid, salesParam, ticketType, ticketUuid, staffUuid);

      // Handle Check-Ins analytics
      if (response?.data?.checkin_analytics?.data) {
        const analyticsData = response.data.checkin_analytics.data;
        const analyticsTitle = subitemLabel ? `${subitemLabel} Check-Ins` : `${ticketType} Check-Ins`;

        const chartData = Object.entries(analyticsData).map(([hour, value]) => {
          // Format time from "12:00 AM" to "12am" or "12:00 PM" to "12pm"
          let formattedTime = hour;
          if (hour.includes(':00 ')) {
            const [time, period] = hour.split(' ');
            const [hours] = time.split(':');
            formattedTime = `${hours}${period.toLowerCase()}`;
          }

          return {
            time: formattedTime,
            value: value || 0
          };
        });

        setCheckInAnalyticsData(chartData);
        setCheckInAnalyticsTitle(analyticsTitle);
        setActiveCheckInAnalytics(analyticsKey);
      }
    } catch (error) {
      logger.error('Error fetching check-in analytics for', ticketType, error);
    }
  };

  const getSoldTicketsData = () => {
    const dataSource = dashboardStats?.data?.sold_tickets;

    if (dataSource?.total_tickets === undefined || dataSource?.sold_tickets === undefined) {
      return [{
        label: "Total Sold",
        checkedIn: 0,
        total: 0,
        percentage: 0
      }];
    }

    const totalSold = dataSource.sold_tickets || 0;
    const totalTickets = dataSource.total_tickets || 0;

    const byCategory = dataSource.by_category;
    let typeRows: any[] = [];
    if (byCategory) {
      const types = Object.keys(byCategory || {});
      typeRows = types.map(type => {
        const categoryData = byCategory[type];
        const sold = categoryData?.sold_tickets || 0;
        const total = categoryData?.total_tickets || 0;

        // Create subitems from the ticket_wise data for staff users
        const subItems: any[] = [];
        if (categoryData && typeof categoryData === 'object') {
          Object.keys(categoryData).forEach(ticketName => {
            if (ticketName !== 'total_tickets' && ticketName !== 'sold_tickets' && categoryData[ticketName]) {
              const ticketInfo = categoryData[ticketName];
              if (ticketInfo.total !== undefined && ticketInfo.sold !== undefined) {
                subItems.push({
                  label: ticketName,
                  checkedIn: ticketInfo.sold,
                  total: ticketInfo.total,
                  percentage: ticketInfo.total > 0 ? Math.round((ticketInfo.sold / ticketInfo.total) * 100) : 0,
                  ticketUuid: ticketInfo.ticket_uuid
                });
              }
            }
          });
        }

        return {
          label: type,
          checkedIn: sold,
          total: total,
          percentage: total ? Math.round((sold / total) * 100) : 0,
          subItems: subItems.length > 0 ? subItems : undefined
        };
      });
    }

    return [
      {
        label: "Total Sold",
        checkedIn: totalSold,
        total: totalTickets,
        percentage: totalTickets ? Math.round((totalSold / totalTickets) * 100) : 0
      },
      ...typeRows
    ];
  };

  function formatHourLabel(hourStr: any): string {
    if (!hourStr || typeof hourStr !== 'string') {
      logger.warn('formatHourLabel: Invalid input', hourStr);
      return '';
    }

    const parts = hourStr.split(":");
    if (parts.length < 2) {
      return hourStr; // Return as-is if format is unexpected
    }

    const [hour, minutePart] = parts;
    if (!minutePart) {
      return hour; // Return just the hour if no minute part
    }

    const minuteAndPeriod = minutePart.split(" ");
    if (minuteAndPeriod.length < 2) {
      return `${parseInt(hour, 10)}${hourStr.includes('PM') ? 'pm' : 'am'}`; // Default based on PM/AM
    }

    const [minute, period] = minuteAndPeriod;
    return `${parseInt(hour, 10)}${period.toLowerCase()}`;
  }

  function mapSoldTicketsAnalytics(analyticsData: any) {
    if (!analyticsData) return [];
    return Object.entries(analyticsData).map(([hour, value]) => ({
      time: formatHourLabel(hour),
      value,
    }));
  }

  function getCheckinAnalyticsChartData(checkinAnalytics: any) {
    if (!checkinAnalytics?.data) return [];
    return Object.entries(checkinAnalytics.data).map(([hour, value]) => ({
      time: formatHourLabel(hour),
      value,
    }));
  }

  const getCheckInData = () => {
    const dataSource = dashboardStats?.data?.check_ins;

    if (dataSource?.total_checkins === undefined) {
      return [{
        label: "Total Check-Ins",
        checkedIn: 0,
        total: 0,
        percentage: 0
      }];
    }

    const totalCheckedIn = dataSource.total_checkins || 0;
    const totalTickets = dashboardStats?.data?.sold_tickets?.total_tickets || 0;

    const byCategory = dataSource.by_category;
    let typeRows: any[] = [];
    if (byCategory) {
      const types = Object.keys(byCategory || {});
      typeRows = types.map(type => {
        const categoryData = byCategory[type];
        const checkedIn = categoryData?.total_checkins || 0;
        const total = categoryData?.total_tickets || 0;

        // Create subitems from the ticket_wise data for staff users
        const subItems: any[] = [];
        if (categoryData && typeof categoryData === 'object') {
          Object.keys(categoryData).forEach(ticketName => {
            if (ticketName !== 'total_tickets' && ticketName !== 'total_checkins' && categoryData[ticketName]) {
              const ticketInfo = categoryData[ticketName];
              if (ticketInfo.total !== undefined && ticketInfo.checked_in !== undefined) {
                subItems.push({
                  label: ticketName,
                  checkedIn: ticketInfo.checked_in,
                  total: ticketInfo.total,
                  percentage: ticketInfo.total > 0 ? Math.round((ticketInfo.checked_in / ticketInfo.total) * 100) : 0,
                  ticketUuid: ticketInfo.ticket_uuid
                });
              }
            }
          });
        }

        return {
          label: type,
          checkedIn: checkedIn,
          total: total,
          percentage: total ? Math.round((checkedIn / total) * 100) : 0,
          subItems: subItems.length > 0 ? subItems : undefined
        };
      });
    }

    return [
      {
        label: "Total Check-Ins",
        checkedIn: totalCheckedIn,
        total: totalTickets,
        percentage: totalTickets ? Math.round((totalCheckedIn / totalTickets) * 100) : 0
      },
      ...typeRows
    ];
  };

  const getAvailableTicketsData = () => {
    if (!dashboardStats?.data?.available_tickets) {
      return [{
        label: "Available",
        checkedIn: 0,
        total: 0,
        percentage: 0
      }];
    }

    const availableTickets = dashboardStats?.data?.available_tickets;
    const byCategory = availableTickets;

    let typeRows: any[] = [];
    if (byCategory) {
      const types = Object.keys(byCategory || {});
      typeRows = types.map(type => {
        const categoryData = byCategory[type];
        const available = categoryData?.available_tickets || 0;
        const total = categoryData?.total_tickets || 0;

        // Create subitems from the ticket_wise data for staff users
        const subItems: any[] = [];
        if (categoryData && typeof categoryData === 'object') {
          Object.keys(categoryData).forEach(ticketName => {
            if (ticketName !== 'total_tickets' && ticketName !== 'available_tickets' && categoryData[ticketName]) {
              const ticketInfo = categoryData[ticketName];
              if (ticketInfo.total !== undefined && ticketInfo.available !== undefined) {
                subItems.push({
                  label: ticketName,
                  checkedIn: ticketInfo.available,
                  total: ticketInfo.total,
                  percentage: ticketInfo.total > 0 ? Math.round((ticketInfo.available / ticketInfo.total) * 100) : 0,
                  ticketUuid: ticketInfo.ticket_uuid
                });
              }
            }
          });
        }

        return {
          label: type,
          checkedIn: available,
          total: total,
          percentage: total > 0 ? Math.round((available / total) * 100) : 0,
          subItems: subItems.length > 0 ? subItems : undefined
        };
      });
    }

    return typeRows;
  };


  const renderContent = () => {
    if (!dashboardStats?.data) return null;

    if (selectedSaleScanTab === "Sales") {
      const soldTicketsData = getSoldTicketsData();
      const remainingTicketsData = soldTicketsData.filter(
        (item) => item.label !== "Total Sold"
      );
      const soldTicketsChartData = mapSoldTicketsAnalytics(
        dashboardStats?.data?.sold_tickets_analytics?.data
      );

      return (
        <>
          <BoxOfficeSales
            stats={dashboardStats}
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
          <AdminBoxOfficePaymentChannel stats={{
            ...dashboardStats,
            data: {
              ...dashboardStats?.data,
              box_office_sales: {
                ...dashboardStats?.data?.box_office_sales,
                // Map payment_channels (plural) to payment_channel (singular) for compatibility
                payment_channel: dashboardStats?.data?.payment_channels || dashboardStats?.data?.payment_channel
              }
            }
          }} />

          {/* Total Payment Channel Card */}
          <TotalPaymentChannelCard
            stats={dashboardStats}
            onPaymentChannelPress={handlePaymentChannelPress}
            activePaymentChannel={activePaymentChannel}
          />

          {/* Payment Channel Analytics */}
          <PaymentChannelAnalytics
            stats={dashboardStats}
            selectedPaymentChannel={activePaymentChannel}
            eventInfo={currentEventInfo}
            userRole="STAFF"
            staffUuid={staffUuid}
          />

        </>
      );
    } else if (selectedSaleScanTab === "Scans") {
      // Show ScanAnalytics view in the Scans tab
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
              data={getCheckinAnalyticsChartData(dashboardStats?.data?.scan_analytics)}
              dataType="checked in"
            />
          )}
          <ScanListComponent eventInfo={currentEventInfo} staffUuid={staffUuid} />
        </>
      );
    }

    return null;
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
              <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">{truncateEventName(currentEventInfo?.event_title) || 'OUTMOSPHERE'}</Text>
            </View>
            <View style={styles.headerSpacer} />
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">{formatDateWithMonthName(eventInfo?.date) || '30 Oct 2025'}</Text>
            <Text style={styles.separator}>at</Text>
            <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">{eventInfo?.time || '7:00 PM'}</Text>
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

      {/* Staff Event Stats */}
      {staffEventStats && (
        <View style={styles.overallStatisticsContainer}>
          {Object.entries(staffEventStats).map(([key, value]) => {
            if (value === null || value === undefined) return null;
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return (
              <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8 }}>
                <Text style={{ fontWeight: '600', color: '#444', fontSize: 13 }}>{displayKey}</Text>
                <Text style={{ color: '#222', fontSize: 13 }}>{displayValue}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Overall Statistics */}
      <View style={styles.overallStatisticsContainer}>
        <OverallStatistics
          stats={dashboardStats}
          showHeading={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.wrapper}>
          {loading ? (
            <Text style={styles.loadingText}>Loading staff dashboard stats...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <View style={styles.saleScanTabContainer}>
                <View style={styles.saleScanTabRow}>
                  {dashboardsalesscantab.map((item) => (
                    <TouchableOpacity
                      key={item}
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
                  ))}
                </View>
              </View>

              {renderContent()}
            </>
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

export default StaffDashboard;
