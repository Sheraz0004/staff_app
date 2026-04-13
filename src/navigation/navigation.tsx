import React, { useEffect } from 'react';
import { Platform, useColorScheme, View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as NavigationBar from 'expo-navigation-bar';
import { useDispatch, useSelector } from 'react-redux';
import {
    isLoading,
    isAuthenticated,
    isOnBoardingStatus,
    setLoading,
} from '../redux/reducers/userReducer';

import SplashScreenComponent from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpLoginScreen from '../screens/OtpLoginScreen';

import MyTabs from '../screens/MyTabs';
import TicketsTab from '../screens/TicketsTab';
import BoxOfficeTab from '../screens/BoxOfficeTab';
import CheckInAllTickets from '../screens/CheckInAllTickets';
import ManualCheckInAllTickets from '../screens/ManualcheckInAllTickets';
import TicketScanned from '../screens/TicketScanned';
import StaffDashboard from '../screens/dashboard/StaffDashboard';
import ExploreEventScreen from '../screens/eventsTab/Exploreeventscreen';
import ExploreDetailScreenTicketsTab from '../screens/eventsTicketsTab/ExploreDetailScreenTicketsTab';
import Tickets from '../screens/Tickets';
import DashboardScreen from '../screens/dashboard';
import ManualScan from '../screens/ManualScan';
import ProfileScreen from '../screens/ProfileScreen';
import AdminTerminalDashboard from '../screens/dashboard/AdminTerminalDashboard';

const RootStack = createNativeStackNavigator();
const AuthNav = createNativeStackNavigator();
const MainNav = createNativeStackNavigator();

const authScreenOptions = {
    headerShown: false,
    unmountOnBlur: true,
    statusBarStyle: 'light' as const,
    statusBarTranslucent: true,
    animation: 'fade' as const,
};

const mainScreenOptions = {
    headerShown: false,
    unmountOnBlur: true,
    statusBarStyle: 'dark' as const,
    statusBarBackgroundColor: 'white',
    statusBarTranslucent: true,
};

function LoadingScreen(): React.ReactElement {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <ActivityIndicator size="large" color="#AE6F28" />
        </View>
    );
}

function AuthStack(): React.ReactElement {
    const hasSeenOnboarding = useSelector(isOnBoardingStatus);

    return (
        <AuthNav.Navigator
            initialRouteName={hasSeenOnboarding ? 'Login' : 'Splash'}
            screenOptions={{ headerShown: false }}
        >
            <AuthNav.Screen
                name="Splash"
                component={SplashScreenComponent}
                options={authScreenOptions}
            />
            <AuthNav.Screen
                name="Login"
                component={LoginScreen}
                options={authScreenOptions}
            />
            <AuthNav.Screen
                name="OtpLogin"
                component={OtpLoginScreen}
                options={authScreenOptions}
            />
        </AuthNav.Navigator>
    );
}

function MainStack(): React.ReactElement {
    return (
        <MainNav.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
        >
            <MainNav.Screen name="Home" component={MyTabs} options={mainScreenOptions} />
            <MainNav.Screen name="TicketsTab" component={TicketsTab} options={mainScreenOptions} />
            <MainNav.Screen
                name="BoxOfficeTab"
                component={BoxOfficeTab}
                options={{ ...mainScreenOptions, unmountOnBlur: false }}
            />
            <MainNav.Screen
                name="CheckInAllTickets"
                component={CheckInAllTickets}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="ManualCheckInAllTickets"
                component={ManualCheckInAllTickets}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="TicketScanned"
                component={TicketScanned}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="StaffDashboard"
                component={StaffDashboard}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="ExploreEventScreen"
                component={ExploreEventScreen}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="ExploreDetailScreenTicketsTab"
                component={ExploreDetailScreenTicketsTab}
                options={mainScreenOptions}
            />
            <MainNav.Screen name="TicketsDetail" component={Tickets} options={mainScreenOptions} />
            <MainNav.Screen
                name="DashboardDetail"
                component={DashboardScreen}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="ManualScanDetail"
                component={ManualScan}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="Profile"
                component={ProfileScreen}
                options={mainScreenOptions}
            />
            <MainNav.Screen
                name="AdminTerminalDashboard"
                component={AdminTerminalDashboard}
                options={mainScreenOptions}
            />
        </MainNav.Navigator>
    );
}

function Navigation(): React.ReactElement {
    const scheme = useColorScheme();
    const dispatch = useDispatch();
    const loading = useSelector(isLoading);
    const authenticated = useSelector(isAuthenticated);

    useEffect(() => {
        dispatch(setLoading({ loading: false }));
    }, []);

    useEffect(() => {
        if (Platform.OS !== 'android') return;
        NavigationBar.setBehaviorAsync('overlay-swipe');
        const isDark = loading || !authenticated;
        NavigationBar.setBackgroundColorAsync(isDark ? '#281c10' : '#fff');
        NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }, [loading, authenticated, scheme]);

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
            {loading ? (
                <RootStack.Screen
                    name="Loading"
                    component={LoadingScreen}
                    options={{ statusBarStyle: 'light', statusBarTranslucent: true }}
                />
            ) : !authenticated ? (
                <RootStack.Screen
                    name="AuthStack"
                    component={AuthStack}
                    options={{ animation: 'fade' }}
                />
            ) : (
                <RootStack.Screen
                    name="MainStack"
                    component={MainStack}
                    options={{ animation: 'fade' }}
                />
            )}
        </RootStack.Navigator>
    );
}

export default Navigation;
