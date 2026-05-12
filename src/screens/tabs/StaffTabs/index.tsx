import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { getUser } from '../../../redux/reducers/userReducer';
import StaffDashboard from '../../dashboard/StaffDashboard';
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
  const authUser = useSelector(getUser);
  const staffName = [authUser?.firstName ?? authUser?.first_name, authUser?.lastName ?? authUser?.last_name]
    .filter(Boolean)
    .join(' ') || authUser?.name || 'Staff';

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) =>
        buildScreenOptions({ route, navigation, tabBarHeight, insets, userRole })
      }
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard" options={commonTabOptions}>
        {() => (
          <StaffDashboard
            eventInfoProp={eventInformation}
            staffUuidProp={authUser?.identityId}
            staffNameProp={staffName}
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
