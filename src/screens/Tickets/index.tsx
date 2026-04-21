import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/header';
import TicketsTab from '../TicketsTab';
import BoxOfficeTab from '../BoxOfficeTab';
import SvgIcons from '../../components/SvgIcons';
import { useApi } from '../../services/useApi';
import { EVENT_SERVICES } from '../../services/EventService';
import { styles } from './index.styles';

interface SettingsScreenProps {
  navigation?: any;
  route?: any;
  eventInfo?: any;
  onScanCountUpdate?: (...args: any[]) => void;
  activeHeaderTab?: string;
  onHeaderTabChange?: (tab: string) => void;
  userRole?: any;
}

const SettingsScreen = (props: SettingsScreenProps) => {
  const routeFromHook = useRoute();
  const navigationFromHook = useNavigation();
  const route = props.route || routeFromHook;
  const navigation = props.navigation || navigationFromHook;

  const routeParams = route?.params || {};
  const { initialTab, eventInfo: routeEventInfo, selectedTab } = routeParams;
  const finalEventInfo = props.eventInfo || routeEventInfo;
  const { onScanCountUpdate, activeHeaderTab: propActiveHeaderTab, onHeaderTabChange, userRole } = props;
  const defaultHeaderTab = propActiveHeaderTab || routeParams?.activeHeaderTab || 'Sell';

  const isFromRootStack = route?.name === 'TicketsDetail';
  const shouldOpenBoxOffice = routeParams?.openBoxOffice || routeParams?.screen === 'BoxOfficeTab';

  const { requestCall: requestEventInfo } = useApi(EVENT_SERVICES.fetchEventInfo, false, false);
  const [dynamicEventInfo, setDynamicEventInfo] = useState<any>(null);

  const [activeView, setActiveView] = useState<string>(shouldOpenBoxOffice ? 'BoxOfficeTab' : 'TicketsTab');
  const [tabKey, setTabKey] = useState<number>(0);

  // FIX: Make activeHeaderTab a state so it updates when switching Tickets/Box Office
  const [activeHeaderTab, setActiveHeaderTab] = useState<string>(
    shouldOpenBoxOffice ? 'Sell' : defaultHeaderTab
  );

  const eventUuidForSell = finalEventInfo?.eventUuid || finalEventInfo?.uuid;
  useEffect(() => {
    if (!eventUuidForSell) return;
    requestEventInfo(String(eventUuidForSell))
      .then((infoRes: any) => {
        const info = infoRes?.data;
        if (info) {
          setDynamicEventInfo({
            ...(finalEventInfo || {}),
            event_title: info?.eventTitle || info?.event_title,
            date: info?.startDate || info?.start_date,
            time: info?.startTime || info?.start_time,
            staff_name: info?.staff_name,
            scanCount: info?.scanCount ?? info?.scan_count,
            event_uuid: info?.location?.uuid,
            eventUuid: String(eventUuidForSell),
            cityName: info?.location?.city,
          });
        }
      })
      .catch(() => {});
  }, [eventUuidForSell]);

  useEffect(() => {
    if (routeParams?.initialTab === 'Scanned') {
      setActiveView('TicketsTab');
    }
  }, [routeParams?.initialTab]);

  useEffect(() => {
    if (routeParams?.screen === 'BoxOfficeTab' || routeParams?.openBoxOffice) {
      setActiveView('BoxOfficeTab');
      setActiveHeaderTab('Sell');
    }
  }, [routeParams]);

  const handleBackPress = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  // FIX: Switch header toggle to 'Sell' when Box Office is selected
  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (view === 'BoxOfficeTab') {
      setActiveHeaderTab('Sell');
    }
  };

  // FIX: Sync when Header's own tab toggle is pressed
  const handleHeaderTabChange = (tab: string) => {
    setActiveHeaderTab(tab);
    onHeaderTabChange?.(tab);
  };

  return (
    <View style={styles.mainContainer}>
      <Header
        eventInfo={dynamicEventInfo || finalEventInfo}
        showBackButton={isFromRootStack}
        onBackPress={handleBackPress}
        activeTab={activeHeaderTab}
        onTabChange={handleHeaderTabChange}
        userRole={userRole}
      />
      <View style={styles.contentContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => handleViewChange('TicketsTab')}
            style={[styles.button, activeView === 'TicketsTab' && styles.activeButton]}
          >
            <Text style={[styles.buttonText, activeView === 'TicketsTab' && styles.activeButtonText]}>
              Tickets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleViewChange('BoxOfficeTab')}
            style={[styles.button, activeView === 'BoxOfficeTab' && styles.activeButton]}
          >
            <Text style={[styles.buttonText, activeView === 'BoxOfficeTab' && styles.activeButtonText]}>
              Box Office
            </Text>
          </TouchableOpacity>
        </View>
        {activeView === 'TicketsTab' && (
          <TicketsTab key={tabKey} eventInfo={finalEventInfo} initialTab={initialTab} />
        )}
        {activeView === 'BoxOfficeTab' && (
          <BoxOfficeTab eventInfo={finalEventInfo} onScanCountUpdate={onScanCountUpdate} selectedTab={selectedTab} />
        )}
      </View>
    </View>
  );
};

export default SettingsScreen;
