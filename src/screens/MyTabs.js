import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getUser } from '../redux/reducers/userReducer';
import { useEventInfo } from '../hooks/useEventInfo';

import AdminTabs from './tabs/AdminTabs';
import AgentTabs from './tabs/AgentTabs';
import StaffTabs from './tabs/StaffTabs';

function MyTabs() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const authUser = useSelector(getUser);
  const userRole = authUser?.role ?? null;

  const [activeHeaderTab, setActiveHeaderTab] = useState('Sell');
  const normalTicketMode = useRef(false);

  const tabBarHeight = 66 + (Platform.OS === 'android' ? Math.max(0, insets.bottom) : insets.bottom);

  const { eventInformation, updateScanCount, handleEventChange } = useEventInfo(
    route?.params?.eventInfo,
    authUser?.identityId,
  );
  useEffect(() => {
    const screenParam = route?.params?.screen;
    if (screenParam === 'Check In') setActiveHeaderTab('Auto');
    else if (screenParam === 'Manual') setActiveHeaderTab('Manual');
    else if (screenParam === 'Tickets') setActiveHeaderTab('Sell');
  }, [route?.params?.screen, route?.params?.params?.screen]);

  const tabProps = {
    eventInformation,
    updateScanCount,
    handleEventChange,
    activeHeaderTab,
    setActiveHeaderTab,
    normalTicketMode,
    userRole,
    tabBarHeight,
    insets,
  };

  if (userRole === 'ADMIN') return <AdminTabs {...tabProps} />;
  if (userRole === 'AGENT') return <AgentTabs {...tabProps} />;
  return <StaffTabs {...tabProps} />;
}

export default MyTabs;
