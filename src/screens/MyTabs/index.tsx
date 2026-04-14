import React, { useState, useEffect, useRef, MutableRefObject } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getUser } from '../../redux/reducers/userReducer';
import { useEventInfo } from '../../hooks/useEventInfo';

import AdminTabs from '../tabs/AdminTabs';
import AgentTabs from '../tabs/AgentTabs';
import StaffTabs from '../tabs/StaffTabs';

export interface TabProps {
  eventInformation: any;
  updateScanCount: () => Promise<void>;
  handleEventChange: (newEvent: any) => Promise<any>;
  activeHeaderTab: string;
  setActiveHeaderTab: React.Dispatch<React.SetStateAction<string>>;
  normalTicketMode: MutableRefObject<boolean>;
  userRole: string | null;
  tabBarHeight: number;
  insets: ReturnType<typeof useSafeAreaInsets>;
}

function MyTabs(): React.ReactElement {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const authUser = useSelector(getUser);
  const userRole: string | null = authUser?.role ?? null;

  const [activeHeaderTab, setActiveHeaderTab] = useState<string>('Sell');
  const normalTicketMode = useRef<boolean>(false);

  const tabBarHeight =
    66 + (Platform.OS === 'android' ? Math.max(0, insets.bottom) : insets.bottom);

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

  const tabProps: TabProps = {
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
