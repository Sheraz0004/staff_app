import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import DashboardScreen from '../dashboard';
import EventsScreen from '../eventsTab/EventsScreen';
import HomeScreen from '../CheckIn';
import EventsTicketsTab from '../eventsTicketsTab/EventsTicketsTab';
import { buildScreenOptions, commonTabOptions, ServicesScreen } from './tabHelpers';

const Tab = createBottomTabNavigator();

interface AdminTabsProps {
  eventInformation: any;
  updateScanCount: any;
  handleEventChange: any;
  activeHeaderTab: any;
  setActiveHeaderTab: any;
  normalTicketMode: any;
  userRole: any;
  tabBarHeight: any;
  insets: any;
}

function AdminTabs({
  eventInformation,
  updateScanCount,
  handleEventChange,
  activeHeaderTab,
  setActiveHeaderTab,
  normalTicketMode,
  userRole,
  tabBarHeight,
  insets,
}: AdminTabsProps) {
  const navigation = useNavigation();

  const onEventSelected = async (newEvent: any) => {
    setActiveHeaderTab('Sell');
    const resolved = await handleEventChange(newEvent);
    navigation.navigate('DashboardDetail' as never, {
      eventInfo: resolved,
      showEventDashboard: true,
    } as never);
  };
  const onTicketEventSelected = async (newEvent: any) => {
    const shouldOpenBoxOffice = !normalTicketMode.current;
    normalTicketMode.current = false;
    setActiveHeaderTab('Sell');
    const resolved = await handleEventChange(newEvent);
    navigation.navigate('TicketsDetail' as never, {
      eventInfo: resolved,
      activeHeaderTab: 'Sell',
      openBoxOffice: shouldOpenBoxOffice,
    } as never);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation: nav }) =>
        buildScreenOptions({ route, navigation: nav, tabBarHeight, insets, userRole })
      }
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard" options={commonTabOptions}>
        {() => (
          <DashboardScreen
            eventInfo={eventInformation}
            onScanCountUpdate={updateScanCount}
            onEventChange={handleEventChange}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Events" options={commonTabOptions}>
        {() => (
          <EventsScreen
            eventInfo={eventInformation}
            onEventChange={onEventSelected}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Check In"
        options={commonTabOptions}
        listeners={{ tabPress: () => setActiveHeaderTab('Auto') }}
      >
        {() => (
          <HomeScreen
            eventInfo={eventInformation}
            onScanCountUpdate={updateScanCount}
            activeHeaderTab={activeHeaderTab}
            onHeaderTabChange={setActiveHeaderTab}
            userRole={userRole}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Services" options={commonTabOptions}>
        {() => <ServicesScreen />}
      </Tab.Screen>

      <Tab.Screen
        name="Tickets"
        options={commonTabOptions}
        listeners={{
          tabPress: () => {
            setActiveHeaderTab('Sell');
            normalTicketMode.current = true;
          },
        }}
      >
        {() => (
          <EventsTicketsTab
            eventInfo={eventInformation}
            onEventChange={onTicketEventSelected}
            activeHeaderTab={activeHeaderTab}
            onHeaderTabChange={setActiveHeaderTab}
            userRole={userRole}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default AdminTabs;
