import React, { useEffect } from 'react';
import { Platform, useColorScheme, View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigationState } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from '../store/slices/authSlice';

import LoginScreen from '../screens/LoginScreen';
import MyTabs from '../screens/MyTabs';
import OtpLoginScreen from '../screens/OtpLoginScreen';
import TicketsTab from '../screens/TicketsTab';
import BoxOfficeTab from '../screens/BoxOfficeTab';
import CheckInAllTickets from '../screens/CheckInAllTickets';
import ManualCheckInAllTickets from '../screens/ManualcheckInAllTickets';
import TicketScanned from '../screens/TicketScanned';
import SplashScreenComponent from '../screens/SplashScreen';
import StaffDashboard from '../screens/dashboard/StaffDashboard';
import ExploreEventScreen from '../screens/eventsTab/Exploreeventscreen';
import ExploreDetailScreenTicketsTab from '../screens/eventsTicketsTab/ExploreDetailScreenTicketsTab';
import Tickets from '../screens/Tickets';
import DashboardScreen from '../screens/dashboard';
import ManualScan from '../screens/ManualScan';
import ProfileScreen from '../screens/ProfileScreen';
import AdminTerminalDashboard from '../screens/dashboard/AdminTerminalDashboard';

const Stack = createNativeStackNavigator();

const darkScreens = ['Loading', 'Splash', 'Login', 'OtpLogin'];

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#AE6F28" />
    </View>
  );
}

function LoggedInScreen() {
  return <MyTabs />;
}

const mainOptions = {
  headerShown: false,
  unmountOnBlur: true,
  statusBarStyle: 'dark',
  statusBarBackgroundColor: 'white',
  statusBarTranslucent: true,
};

function Navigation() {
  const scheme = useColorScheme();
  const dispatch = useDispatch();
  const { status, hasSeenOnboarding } = useSelector((state) => state.auth);

  // Kick off auth initialisation once on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const routeName = useNavigationState((state) => {
    if (!state) return 'Loading';
    return state.routes[state.index].name;
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBehaviorAsync('overlay-swipe');
      const isDark = darkScreens.includes(routeName);
      NavigationBar.setBackgroundColorAsync(isDark ? '#281c10' : '#fff');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [routeName, scheme]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* ── 1. Initialising ─────────────────────────────────────── */}
      {status === 'loading' ? (
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ animation: 'none', statusBarStyle: 'light', statusBarTranslucent: true }}
        />

      /* ── 2. First-time user → onboarding ────────────────────── */
      ) : !hasSeenOnboarding ? (
        <Stack.Screen
          name="Splash"
          component={SplashScreenComponent}
          options={{
            headerShown: false,
            unmountOnBlur: true,
            statusBarStyle: 'light',
            statusBarTranslucent: true,
            animation: 'fade',
          }}
        />

      /* ── 3. Unauthenticated → auth stack ────────────────────── */
      ) : status === 'unauthenticated' ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'light',
              statusBarTranslucent: true,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="OtpLogin"
            component={OtpLoginScreen}
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'light',
              statusBarTranslucent: true,
              animation: 'fade',
            }}
          />
        </>

      /* ── 4. Authenticated → main app stack ──────────────────── */
      ) : (
        <>
          <Stack.Screen
            name="LoggedIn"
            component={LoggedInScreen}
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: true,
            }}
          />
          <Stack.Screen name="TicketsTab" component={TicketsTab} options={mainOptions} />
          <Stack.Screen
            name="BoxOfficeTab"
            component={BoxOfficeTab}
            options={{ ...mainOptions, unmountOnBlur: false }}
          />
          <Stack.Screen name="CheckInAllTickets" component={CheckInAllTickets} options={mainOptions} />
          <Stack.Screen name="ManualCheckInAllTickets" component={ManualCheckInAllTickets} options={mainOptions} />
          <Stack.Screen name="TicketScanned" component={TicketScanned} options={mainOptions} />
          <Stack.Screen name="StaffDashboard" component={StaffDashboard} options={mainOptions} />
          <Stack.Screen name="ExploreEventScreen" component={ExploreEventScreen} options={mainOptions} />
          <Stack.Screen
            name="ExploreDetailScreenTicketsTab"
            component={ExploreDetailScreenTicketsTab}
            options={mainOptions}
          />
          <Stack.Screen name="TicketsDetail" component={Tickets} options={mainOptions} />
          <Stack.Screen name="DashboardDetail" component={DashboardScreen} options={mainOptions} />
          <Stack.Screen name="ManualScanDetail" component={ManualScan} options={mainOptions} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={mainOptions} />
          <Stack.Screen name="AdminTerminalDashboard" component={AdminTerminalDashboard} options={mainOptions} />
        </>
      )}

    </Stack.Navigator>
  );
}

export default Navigation;
