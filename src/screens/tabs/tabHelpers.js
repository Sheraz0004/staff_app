import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { color } from '../../color/color';
import SvgIcons from '../../components/SvgIcons';

export const ServicesScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F5' }}>
    <Text style={{ fontSize: 18, color: '#2D2A26' }}>Services</Text>
    <Text style={{ fontSize: 14, color: '#9B9189', marginTop: 8 }}>Services coming soon</Text>
  </View>
);

export const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity style={styles.tabBarButton} onPress={onPress} activeOpacity={1}>
    {children}
  </TouchableOpacity>
);

export const CustomIcon = ({ route, focused, userRole }) => {
  let IconComponent;

  if (userRole === 'ADMIN') {
    const map = {
      Dashboard: focused ? SvgIcons.adminDashboardActiveTab : SvgIcons.adminDashboardInactiveTab,
      Events: focused ? SvgIcons.adminEventsActiveTab : SvgIcons.adminEventsInactiveTab,
      'Check In': focused ? SvgIcons.checkinActiveTabSVG : SvgIcons.adminCheckinInactiveTab,
      Services: focused ? SvgIcons.adminServicesActiveTab : SvgIcons.adminServicesInactiveTab,
      Tickets: focused ? SvgIcons.ticketActiveTabSvg : SvgIcons.ticketInactiveTabSvg,
    };
    IconComponent = map[route.name];
  } else if (userRole === 'AGENT') {
    const map = {
      Dashboard: focused ? SvgIcons.adminDashboardActiveTab : SvgIcons.adminDashboardInactiveTab,
      Events: focused ? SvgIcons.adminEventsActiveTab : SvgIcons.adminEventsInactiveTab,
      Services: focused ? SvgIcons.adminServicesActiveTab : SvgIcons.adminServicesInactiveTab,
    };
    IconComponent = map[route.name];
  } else {
    const map = {
      Dashboard: focused ? SvgIcons.dashboardActiveIcon : SvgIcons.dashboardInactiveIcon,
      Tickets: focused ? SvgIcons.ticketActiveTabSvg : SvgIcons.ticketInactiveTabSvg,
      'Check In': focused ? SvgIcons.checkinActiveTabSVG : SvgIcons.checkinInActiveTabSVG,
      Manual: focused ? SvgIcons.manualActiveTabSVG : SvgIcons.manualInActiveTabSVG,
      Profile: focused ? SvgIcons.profileIconActive : SvgIcons.profileIconInActive,
    };
    IconComponent = map[route.name];
  }

  if (!IconComponent) return null;
  return <IconComponent width={24} height={24} fill="transparent" />;
};

export const buildScreenOptions = ({ route, navigation, tabBarHeight, insets, userRole }) => {
  const state = navigation.getState();
  const isCheckInActive = state.routes[state.index]?.name === 'Check In';

  return {
    tabBarIcon: ({ focused }) => (
      <View style={[styles.iconLabelWrapper, focused && styles.focusedTabWrapper]}>
        <CustomIcon route={route} focused={focused} userRole={userRole} />
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.tabBarLabel,
            { color: focused ? '#AE6F28' : color.brown_766F6A, fontWeight: focused ? 'bold' : 'normal' },
          ]}
        >
          {route.name}
        </Text>
      </View>
    ),
    tabBarStyle: {
      height: tabBarHeight,
      backgroundColor: '#f3f3f3',
      paddingBottom: Platform.OS === 'android' ? Math.max(0, insets.bottom) : insets.bottom,
      borderTopWidth: 0,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tabBarShowLabel: false,
    tabBarButton: (props) => <CustomTabBarButton {...props} />,
  };
};

export const commonTabOptions = {
  headerShown: false,
  unmountOnBlur: true,
  statusBarStyle: 'dark',
  statusBarBackgroundColor: 'white',
  statusBarTranslucent: false,
};

const styles = StyleSheet.create({
  tabBarButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
  },
  iconLabelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  focusedTabWrapper: {
    marginHorizontal: 6,
    marginVertical: -10,
    backgroundColor: color.white_FFFFFF,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
