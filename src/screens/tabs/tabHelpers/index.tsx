import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { color } from '../../../color/color';
import SvgIcons from '../../../components/SvgIcons';
import { styles } from './index.styles';

export const ServicesScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F5' }}>
    <Text style={{ fontSize: 18, color: '#2D2A26' }}>Services</Text>
    <Text style={{ fontSize: 14, color: '#9B9189', marginTop: 8 }}>Services coming soon</Text>
  </View>
);

interface CustomTabBarButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
}

export const CustomTabBarButton: React.FC<CustomTabBarButtonProps> = ({ children, onPress }) => (
  <TouchableOpacity style={styles.tabBarButton} onPress={onPress} activeOpacity={1}>
    {children}
  </TouchableOpacity>
);

interface CustomIconProps {
  route: any;
  focused: boolean;
  userRole: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ route, focused, userRole }) => {
  let IconComponent: any;

  if (userRole === 'ADMIN') {
    const map: Record<string, any> = {
      Dashboard: focused ? SvgIcons.adminDashboardActiveTab : SvgIcons.adminDashboardInactiveTab,
      Events: focused ? SvgIcons.adminEventsActiveTab : SvgIcons.adminEventsInactiveTab,
      'Check In': focused ? SvgIcons.checkinActiveTabSVG : SvgIcons.adminCheckinInactiveTab,
      Services: focused ? SvgIcons.adminServicesActiveTab : SvgIcons.adminServicesInactiveTab,
      Tickets: focused ? SvgIcons.ticketActiveTabSvg : SvgIcons.ticketInactiveTabSvg,
    };
    IconComponent = map[route.name];
  } else if (userRole === 'AGENT') {
    const map: Record<string, any> = {
      Dashboard: focused ? SvgIcons.adminDashboardActiveTab : SvgIcons.adminDashboardInactiveTab,
      Events: focused ? SvgIcons.adminEventsActiveTab : SvgIcons.adminEventsInactiveTab,
      Services: focused ? SvgIcons.adminServicesActiveTab : SvgIcons.adminServicesInactiveTab,
    };
    IconComponent = map[route.name];
  } else {
    const map: Record<string, any> = {
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

interface BuildScreenOptionsParams {
  route: any;
  navigation: any;
  tabBarHeight: number;
  insets: any;
  userRole: string;
}

export const buildScreenOptions = ({ route, navigation, tabBarHeight, insets, userRole }: BuildScreenOptionsParams) => {
  const state = navigation.getState();
  const isCheckInActive = state.routes[state.index]?.name === 'Check In';

  return {
    tabBarIcon: ({ focused }: { focused: boolean }) => (
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
    tabBarButton: (props: any) => <CustomTabBarButton {...props} />,
  };
};

export const commonTabOptions = {
  headerShown: false,
  unmountOnBlur: true,
  statusBarStyle: 'dark',
  statusBarBackgroundColor: '#f2f2f2',
  statusBarTranslucent: true,
};
