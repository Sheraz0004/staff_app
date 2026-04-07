import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './CheckIn';
import Tickets from './Tickets';
import ManualScan from './ManualScan';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import DashboardScreen from '../screens/dashboard';
import ProfileScreen from './ProfileScreen';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from '../store/slices/authSlice';
import { fetchUpdatedScanCount, updateEventInfoScanCount } from '../utils/scanCountUpdater';
import { eventService } from '../api/apiService';
import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';
import AdminAllEventsDashboard from './dashboard/AdminAllEventsDashboard/adminAllEventsDashboard';
import EventsScreen from './eventsTab/EventsScreen';
import EventsTicketsTab from './eventsTicketsTab/EventsTicketsTab';
import TerminalEventsTab from './dashboard/TerminalDashboardPortal/TerminalEventsTab';

const Tab = createBottomTabNavigator();

const ServicesScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F7F5' }}>
      <Text style={{ fontSize: 18, color: '#2D2A26' }}>Services</Text>
      <Text style={{ fontSize: 14, color: '#9B9189', marginTop: 8 }}>Services coming soon</Text>
    </View>
  );
};

function MyTabs() {
  const route = useRoute();
  const rootNavigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const initialEventInfo = route?.params?.eventInfo;
  const [eventInformation, setEventInformation] = useState(initialEventInfo);
  const [isLoadingEventInfo, setIsLoadingEventInfo] = useState(false);
  const authUser = useSelector((state) => state.auth.user);
  // console.log("authUser-->", authUser);
  const userRole = authUser?.role ?? null;

  // Fetch profile if it wasn't loaded yet (e.g. app restored from a stored token)
  useEffect(() => {
    if (!authUser) {
      dispatch(fetchUserProfile());
    }
  }, [authUser, dispatch]);
  const [activeHeaderTab, setActiveHeaderTab] = useState('Sell');

  // When true, user tapped bottom tab directly (normal mode = show Tickets tab)
  // When false, user came via Header Sell tab (sell mode = show BoxOffice tab)
  const normalTicketMode = useRef(false);

  // Sync activeHeaderTab when navigating to a specific bottom tab via route params
  useEffect(() => {
    const screenParam = route?.params?.screen;
    if (screenParam === 'Check In') {
      setActiveHeaderTab('Auto');
    } else if (screenParam === 'Manual') {
      setActiveHeaderTab('Manual');
    } else if (screenParam === 'Tickets') {
      setActiveHeaderTab('Sell');
    }
  }, [route?.params?.screen, route?.params?.params?.screen]);

  // Calculate dynamic tab bar height with safe area insets
  const tabBarHeight = 66 + (Platform.OS === 'android' ? Math.max(0, insets.bottom) : insets.bottom);


  // Update eventInfo when route params change
  useEffect(() => {
    if (route?.params?.eventInfo) {
      setEventInformation(route.params.eventInfo);
    }
  }, [route?.params?.eventInfo]);

  // Fetch event info if not available (app restart scenario)
  useEffect(() => {
    const fetchEventInfoIfNeeded = async () => {
      if (!eventInformation?.eventUuid) {
        try {
          setIsLoadingEventInfo(true);
          // logger.log('No eventInfo found, fetching from backend...');

          const lastEventUuid = await SecureStore.getItemAsync('lastSelectedEventUuid');
          // logger.log('Retrieved stored UUID:', lastEventUuid);

          if (lastEventUuid) {
            // logger.log('Found last event UUID in storage:', lastEventUuid);
            const eventInfoData = await eventService.fetchEventInfo(lastEventUuid);

            const transformedEventInfo = {
              staff_name: eventInfoData?.data?.staff_name,
              event_title: eventInfoData?.data?.event_title,
              cityName: eventInfoData?.data?.location?.city,
              date: eventInfoData?.data?.start_date,
              time: eventInfoData?.data?.start_time,
              userId: eventInfoData?.data?.staff_id,
              scanCount: eventInfoData?.data?.scan_count,
              event_uuid: eventInfoData?.data?.location?.uuid,
              eventUuid: lastEventUuid
            };

            // logger.log('Fetched event info from backend:', transformedEventInfo);
            setEventInformation(transformedEventInfo);
          } else {
            // logger.log('No last event UUID found in storage, fetching user events...');
            try {
              const staffEventsData = await eventService.fetchStaffEvents();
              const eventsList = staffEventsData?.data;

              if (eventsList && eventsList.length > 0) {
                let selectedEvent = null;

                if (eventsList[0].events && Array.isArray(eventsList[0].events)) {
                  if (eventsList[0].events.length > 0) {
                    selectedEvent = eventsList[0].events[0];
                  }
                } else {
                  selectedEvent = eventsList[0];
                }

                if (selectedEvent) {
                  const eventUuid = selectedEvent.uuid || selectedEvent.eventUuid;
                  logger.log('Using first available event:', eventUuid);

                  await SecureStore.setItemAsync('lastSelectedEventUuid', eventUuid);

                  const eventInfoData = await eventService.fetchEventInfo(eventUuid);

                  const transformedEventInfo = {
                    staff_name: eventInfoData?.data?.staff_name,
                    event_title: eventInfoData?.data?.event_title,
                    cityName: eventInfoData?.data?.location?.city,
                    date: eventInfoData?.data?.start_date,
                    time: eventInfoData?.data?.start_time,
                    userId: eventInfoData?.data?.staff_id,
                    scanCount: eventInfoData?.data?.scan_count,
                    event_uuid: eventInfoData?.data?.location?.uuid,
                    eventUuid: eventUuid
                  };

                  logger.log('Fetched fallback event info from backend:', transformedEventInfo);
                  setEventInformation(transformedEventInfo);
                } else {
                  logger.log('No events available for user');
                }
              } else {
                logger.log('No events found for user');
              }
            } catch (fallbackError) {
              logger.error('Error fetching fallback events:', fallbackError);
            }
          }
        } catch (error) {
          logger.error('Error fetching event info on app restart:', error);
        } finally {
          setIsLoadingEventInfo(false);
        }
      }
    };

    fetchEventInfoIfNeeded();
  }, []);

  // Function to update scan count
  const updateScanCount = async () => {
    if (!eventInformation?.eventUuid) return;

    try {
      const newScanCount = await fetchUpdatedScanCount(eventInformation.eventUuid);
      if (newScanCount !== null) {
        const updatedEventInfo = updateEventInfoScanCount(eventInformation, newScanCount);
        setEventInformation(updatedEventInfo);
      }
    } catch (error) {
      logger.error('Error updating scan count:', error);
    }
  };

  // ─── Core event change handler ───
  const handleEventChange = async (newEvent) => {
    logger.log('Event changed to:', newEvent);

    const eventUuid = newEvent.uuid || newEvent.eventUuid;

    try {
      if (eventUuid) {
        await SecureStore.setItemAsync('lastSelectedEventUuid', eventUuid);
        logger.log('Stored new selected event UUID:', eventUuid);
      }
    } catch (error) {
      logger.error('Error storing event UUID:', error);
    }

    try {
      if (eventUuid) {
        const eventInfoData = await eventService.fetchEventInfo(eventUuid);
        const fullEventInfo = {
          staff_name: eventInfoData?.data?.staff_name || newEvent.staff_name,
          event_title: eventInfoData?.data?.event_title || newEvent.event_title || newEvent.title,
          cityName: eventInfoData?.data?.location?.city || newEvent.cityName,
          date: eventInfoData?.data?.start_date || newEvent.date,
          time: eventInfoData?.data?.start_time || newEvent.time,
          userId: eventInfoData?.data?.staff_id || newEvent.userId,
          scanCount: eventInfoData?.data?.scan_count ?? newEvent.scanCount ?? 0,
          event_uuid: eventInfoData?.data?.location?.uuid || newEvent.event_uuid,
          eventUuid: eventUuid,
        };
        logger.log('Full event info after change:', fullEventInfo);
        setEventInformation(fullEventInfo);
        return;
      }
    } catch (error) {
      logger.error('Error fetching full event info after change, using fallback:', error);
    }

    const transformedEvent = {
      eventUuid: eventUuid,
      event_title: newEvent.title || newEvent.event_title,
      uuid: eventUuid,
      cityName: newEvent.cityName || eventInformation?.cityName || 'Accra',
      date: newEvent.date || eventInformation?.date,
      time: newEvent.time || eventInformation?.time,
      staff_name: newEvent.staff_name || eventInformation?.staff_name,
      userId: newEvent.userId || eventInformation?.userId,
      scanCount: newEvent.scanCount ?? eventInformation?.scanCount ?? 0,
      event_uuid: newEvent.event_uuid || eventInformation?.event_uuid,
    };
    setEventInformation(transformedEvent);
  };

  // ─── Flow 1: Called from EventsScreen ───
  const handleEventChangeFromEvents = async (newEvent) => {
    setActiveHeaderTab('Sell');
    const eventUuid = newEvent.uuid || newEvent.eventUuid;
    let fullEventInfo = { ...newEvent, eventUuid };
    try {
      if (eventUuid) {
        const eventInfoData = await eventService.fetchEventInfo(eventUuid);
        fullEventInfo = {
          staff_name: eventInfoData?.data?.staff_name || newEvent.staff_name,
          event_title: eventInfoData?.data?.event_title || newEvent.event_title || newEvent.title,
          cityName: eventInfoData?.data?.location?.city || newEvent.cityName,
          date: eventInfoData?.data?.start_date || newEvent.date,
          time: eventInfoData?.data?.start_time || newEvent.time,
          userId: eventInfoData?.data?.staff_id || newEvent.userId,
          scanCount: eventInfoData?.data?.scan_count ?? newEvent.scanCount ?? 0,
          event_uuid: eventInfoData?.data?.location?.uuid || newEvent.event_uuid,
          eventUuid: eventUuid,
        };
        setEventInformation(fullEventInfo);
      }
    } catch (error) {
      logger.error('Error fetching full event info for DashboardDetail:', error);
      await handleEventChange(newEvent);
    }

    rootNavigation.navigate('DashboardDetail', {
      eventInfo: fullEventInfo,
      showEventDashboard: true,
    });
  };

  // ─── Flow 2: Called from DashboardScreen ───
  const handleEventChangeFromDashboard = async (newEvent) => {
    await handleEventChange(newEvent);
  };

  // ─── Flow 3: Called from EventsTicketsTab or ExploreDetailScreenTicketsTab ───
  const handleEventChangeFromTicketsTab = async (newEvent) => {
    // Check if user came via normal bottom tab tap or via Header Sell
    const shouldOpenBoxOffice = !normalTicketMode.current;
    normalTicketMode.current = false; // Reset after use

    setActiveHeaderTab('Sell');
    const eventUuid = newEvent.uuid || newEvent.eventUuid;

    let fullEventInfo = { ...newEvent, eventUuid };
    try {
      if (eventUuid) {
        const eventInfoData = await eventService.fetchEventInfo(eventUuid);
        fullEventInfo = {
          staff_name: eventInfoData?.data?.staff_name || newEvent.staff_name,
          event_title: eventInfoData?.data?.event_title || newEvent.event_title || newEvent.title,
          cityName: eventInfoData?.data?.location?.city || newEvent.cityName,
          date: eventInfoData?.data?.start_date || newEvent.date,
          time: eventInfoData?.data?.start_time || newEvent.time,
          userId: eventInfoData?.data?.staff_id || newEvent.userId,
          scanCount: eventInfoData?.data?.scan_count ?? newEvent.scanCount ?? 0,
          event_uuid: eventInfoData?.data?.location?.uuid || newEvent.event_uuid,
          eventUuid: eventUuid,
        };
        setEventInformation(fullEventInfo);
      }
    } catch (error) {
      logger.error('Error fetching full event info for TicketsDetail:', error);
      await handleEventChange(newEvent);
    }

    rootNavigation.navigate('TicketsDetail', {
      eventInfo: fullEventInfo,
      activeHeaderTab: 'Sell',
      openBoxOffice: shouldOpenBoxOffice,
    });
  };

  const CustomTabBarButton = ({ children, accessibilityState, onPress }) => {
    return (
      <TouchableOpacity
        style={styles.tabBarButton}
        onPress={onPress}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    );
  };

  const CustomIcon = ({ route, focused, isCheckInActive, userRole }) => {
    let IconComponent;

    if (userRole === 'ADMIN') {
      if (route.name === 'Dashboard') {
        IconComponent = focused ? SvgIcons.adminDashboardActiveTab : SvgIcons.adminDashboardInactiveTab;
      } else if (route.name === 'Events') {
        IconComponent = focused ? SvgIcons.adminEventsActiveTab : SvgIcons.adminEventsInactiveTab;
      } else if (route.name === 'Check In') {
        IconComponent = focused ? SvgIcons.checkinActiveTabSVG : SvgIcons.adminCheckinInactiveTab;
      } else if (route.name === 'Services') {
        IconComponent = focused ? SvgIcons.adminServicesActiveTab : SvgIcons.adminServicesInactiveTab;
      } else if (route.name === 'Tickets') {
        IconComponent = focused ? SvgIcons.ticketActiveTabSvg : SvgIcons.ticketInactiveTabSvg;
      }
    } else if (userRole === 'AGENT') {
      if (route.name === 'Dashboard') {
        IconComponent = focused ? SvgIcons.adminDashboardActiveTab : SvgIcons.adminDashboardInactiveTab;
      } else if (route.name === 'Events') {
        IconComponent = focused ? SvgIcons.adminEventsActiveTab : SvgIcons.adminEventsInactiveTab;
      } else if (route.name === 'Services') {
        IconComponent = focused ? SvgIcons.adminServicesActiveTab : SvgIcons.adminServicesInactiveTab;
      }
    } else {
      if (route.name === 'Dashboard') {
        IconComponent = focused ? SvgIcons.dashboardActiveIcon : SvgIcons.dashboardInactiveIcon;
      } else if (route.name === 'Tickets') {
        IconComponent = focused ? SvgIcons.ticketActiveTabSvg : SvgIcons.ticketInactiveTabSvg;
      } else if (route.name === 'Check In') {
        IconComponent = focused ? SvgIcons.checkinActiveTabSVG : SvgIcons.checkinInActiveTabSVG;
      } else if (route.name === 'Manual') {
        IconComponent = focused ? SvgIcons.manualActiveTabSVG : SvgIcons.manualInActiveTabSVG;
      } else if (route.name === 'Profile') {
        IconComponent = focused ? SvgIcons.profileIconActive : SvgIcons.profileIconInActive;
      }
    }

    return <IconComponent width={24} height={24} fill="transparent" />;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => {
        const state = navigation.getState();
        const currentRoute = state.routes[state.index];
        const isCheckInActive = currentRoute?.name === 'Check In';

        return {
          tabBarIcon: ({ focused }) => {
            const icon = (
              <CustomIcon
                route={route}
                focused={focused}
                isCheckInActive={isCheckInActive}
                userRole={userRole}
              />
            );

            const label = (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.tabBarLabel,
                  {
                    color: focused
                      ? '#AE6F28'
                      : isCheckInActive
                        ? '#766F6A'
                        : color.brown_766F6A,
                    fontWeight: focused ? 'bold' : 'normal',
                  },
                ]}
              >
                {route.name}
              </Text>
            );

            return (
              <View
                style={[
                  styles.iconLabelWrapper,
                  focused && styles.focusedTabWrapper,
                ]}
              >
                {icon}
                {label}
              </View>
            );
          },

          tabBarStyle: {
            height: tabBarHeight,
            backgroundColor: isCheckInActive ? '#f3f3f3' : '#f3f3f3',
            paddingBottom: Platform.OS === 'android' ? Math.max(0, insets.bottom) : insets.bottom,
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarShowLabel: false,
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} route={route} />
          ),
        };
      }}
      initialRouteName="Dashboard"
    >
      {/* ── Dashboard tab: shared by all roles ── */}
      <Tab.Screen
        name="Dashboard"
        options={{
          headerShown: false,
          unmountOnBlur: true,
          statusBarStyle: 'dark',
          statusBarBackgroundColor: 'white',
          statusBarTranslucent: false
        }}
      >
        {() => (
          <DashboardScreen
            eventInfo={eventInformation}
            onScanCountUpdate={updateScanCount}
            onEventChange={handleEventChangeFromDashboard}
          />
        )}
      </Tab.Screen>

      {/* ── ADMIN tabs ── */}
      {userRole === 'ADMIN' ? (
        <>
          <Tab.Screen
            name="Events"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
          >
            {() => (
              <EventsScreen
                eventInfo={eventInformation}
                onEventChange={handleEventChangeFromEvents}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Check In"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
            listeners={{
              tabPress: () => {
                setActiveHeaderTab('Auto');
              },
            }}
          >
            {() => (
              <HomeScreen
                eventInfo={eventInformation}
                onScanCountUpdate={updateScanCount}
                activeHeaderTab={activeHeaderTab}
                onHeaderTabChange={(tab) => {
                  setActiveHeaderTab(tab);
                }}
                userRole={userRole}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Services"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
          >
            {() => <ServicesScreen />}
          </Tab.Screen>

          <Tab.Screen
            name="Tickets"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
            listeners={{
              tabPress: () => {
                setActiveHeaderTab('Sell');
                // User physically tapped the bottom tab = normal mode (show Tickets tab)
                normalTicketMode.current = true;
              },
            }}
          >
            {() => (
              <EventsTicketsTab
                eventInfo={eventInformation}
                onEventChange={handleEventChangeFromTicketsTab}
                activeHeaderTab={activeHeaderTab}
                onHeaderTabChange={(tab) => {
                  setActiveHeaderTab(tab);
                }}
                userRole={userRole}
              />
            )}
          </Tab.Screen>
        </>

      ) : userRole === 'AGENT' ? (
        // ── AGENT tabs: Dashboard + Events (TerminalEventsTab) + Services ──
        <>
          <Tab.Screen
            name="Events"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
          >
            {() => (
              <TerminalEventsTab
                eventInfo={eventInformation}
                onEventChange={handleEventChangeFromEvents}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Services"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
          >
            {() => <ServicesScreen />}
          </Tab.Screen>
        </>

      ) : (
        // ── Default (STAFF / ORGANIZER / etc.) tabs ──
        <>
          <Tab.Screen
            name="Tickets"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'Tickets',
                      params: { fromTab: true, eventInfo: eventInformation },
                    },
                  ],
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
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
            listeners={{
              tabPress: () => {
                setActiveHeaderTab('Auto');
              },
            }}
          >
            {() => (
              <HomeScreen
                eventInfo={eventInformation}
                onScanCountUpdate={updateScanCount}
                activeHeaderTab={activeHeaderTab}
                onHeaderTabChange={(tab) => {
                  setActiveHeaderTab(tab);
                }}
                userRole={userRole}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Manual"
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
            listeners={{
              tabPress: () => {
                setActiveHeaderTab('Manual');
              },
            }}
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

          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: false,
              unmountOnBlur: true,
              statusBarStyle: 'dark',
              statusBarBackgroundColor: 'white',
              statusBarTranslucent: false
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    // Android Shadow
    elevation: 1,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MyTabs;