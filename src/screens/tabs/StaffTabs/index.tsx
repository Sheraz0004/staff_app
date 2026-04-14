import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../../dashboard';
import Tickets from '../../Tickets';
import HomeScreen from '../../CheckIn';
import ManualScan from '../../ManualScan';
import ProfileScreen from '../../ProfileScreen';
import { buildScreenOptions, commonTabOptions } from '../tabHelpers';

const Tab = createBottomTabNavigator();

interface StaffTabsProps {
  eventInformation: any;
  updateScanCount: any;
  handleEventChange: any;
  activeHeaderTab: any;
  setActiveHeaderTab: any;
  userRole: any;
  tabBarHeight: any;
  insets: any;
}

function StaffTabs({
  eventInformation,
  updateScanCount,
  handleEventChange,
  activeHeaderTab,
  setActiveHeaderTab,
  userRole,
  tabBarHeight,
  insets,
}: StaffTabsProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) =>
        buildScreenOptions({ route, navigation, tabBarHeight, insets, userRole })
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

      <Tab.Screen
        name="Tickets"
        options={commonTabOptions}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Tickets', params: { fromTab: true, eventInfo: eventInformation } }],
            });
          },
        })}
      >
        {(props) => (
          <Tickets
            {...props}
            eventInfo={eventInformation}
            onScanCountUpdate={updateScanCount}
            activeHeaderTab={activeHeaderTab}
            onHeaderTabChange={setActiveHeaderTab}
            userRole={userRole}
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

      <Tab.Screen
        name="Manual"
        options={commonTabOptions}
        listeners={{ tabPress: () => setActiveHeaderTab('Manual') }}
      >
        {() => (
          <ManualScan
            eventInfo={eventInformation}
            onScanCountUpdate={updateScanCount}
            activeHeaderTab={activeHeaderTab}
            onHeaderTabChange={setActiveHeaderTab}
            userRole={userRole}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Profile" component={ProfileScreen} options={commonTabOptions} />
    </Tab.Navigator>
  );
}

export default StaffTabs;
