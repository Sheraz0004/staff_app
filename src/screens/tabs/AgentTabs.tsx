import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import DashboardScreen from '../dashboard';
import TerminalEventsTab from '../dashboard/TerminalDashboardPortal/TerminalEventsTab';
import { buildScreenOptions, commonTabOptions, ServicesScreen } from './tabHelpers';

const Tab = createBottomTabNavigator();

interface AgentTabsProps {
  eventInformation: any;
  updateScanCount: any;
  handleEventChange: any;
  userRole: any;
  tabBarHeight: any;
  insets: any;
}

function AgentTabs({
  eventInformation,
  updateScanCount,
  handleEventChange,
  userRole,
  tabBarHeight,
  insets,
}: AgentTabsProps) {
  const navigation = useNavigation();

  // User selects an event from the terminal Events tab → navigate to DashboardDetail
  const onEventSelected = async (newEvent: any) => {
    const resolved = await handleEventChange(newEvent);
    navigation.navigate('DashboardDetail' as never, {
      eventInfo: resolved,
      showEventDashboard: true,
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
          <TerminalEventsTab
            eventInfo={eventInformation}
            onEventChange={onEventSelected}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Services" options={commonTabOptions}>
        {() => <ServicesScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default AgentTabs;
