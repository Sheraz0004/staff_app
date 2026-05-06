import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { color } from '../../color/color';
import { EVENT_SERVICES } from '../../services/EventService';
import store from '../../redux/store';
import { logger } from '../../utils/logger';
import { styles } from './index.styles';

/**
 * InitialScreen - Handles app launch routing logic
 * This is the launcher screen that determines where to navigate on app start
 */
const InitialScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    // Add a small delay to ensure navigation is ready
    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    let hasSeenOnboarding: string | null = null;
    let token: string | null = null;

    // Check if user has seen onboarding (use AsyncStorage; migrate from SecureStore if needed)
    try {
      hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

      // Migration: if AsyncStorage doesn't have it, check SecureStore once and copy over
      if (!hasSeenOnboarding) {
        const legacyValue = await SecureStore.getItemAsync('hasSeenOnboarding');
        if (legacyValue) {
          hasSeenOnboarding = legacyValue;
          await AsyncStorage.setItem('hasSeenOnboarding', legacyValue);
        }
      }
    } catch (onboardingError) {
      // If storage fails, assume first time user
      logger.log('Error reading onboarding status, showing splash:', onboardingError);
      hasSeenOnboarding = null;
    }

    // First time user - show onboarding (null, undefined, empty string, or not 'true')
    if (!hasSeenOnboarding || hasSeenOnboarding !== 'true') {
      navigation.replace('Splash');
      return;
    }

    // User has seen onboarding - check auth token from Redux store
    try {
      token = (store.getState() as any)?.entities?.user?.userToken ?? null;
    } catch (tokenError) {
      logger.log('Error reading token:', tokenError);
      token = null;
    }

    // User has seen onboarding
    if (token) {
      // User is logged in - go directly to home screen
      try {
        // Try to get the last selected event
        const lastEventUuid = await SecureStore.getItemAsync('lastSelectedEventUuid');

        if (lastEventUuid) {
          // Fetch event info for the last selected event
          const eventInfoData = await EVENT_SERVICES.fetchEventInfo(lastEventUuid);

          navigation.replace('LoggedIn', {
            eventInfo: {
              staff_name: eventInfoData?.data?.staff_name,
              event_title: eventInfoData?.data?.eventTitle || eventInfoData?.data?.event_title,
              cityName: eventInfoData?.data?.location?.city,
              date: eventInfoData?.data?.startDate || eventInfoData?.data?.start_date,
              time: eventInfoData?.data?.startTime || eventInfoData?.data?.start_time,
              userId: eventInfoData?.data?.staff_id,
              scanCount: eventInfoData?.data?.scanCount ?? eventInfoData?.data?.scan_count,
              event_uuid: eventInfoData?.data?.location?.uuid,
              eventUuid: lastEventUuid,
            },
          });
        } else {
          // No last event, just go to logged in screen
          navigation.replace('LoggedIn');
        }
      } catch (eventError) {
        // Still navigate to logged in screen even if event fetch fails
        navigation.replace('LoggedIn');
      }
    } else {
      // No token - go to login
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
    </View>
  );
};

export default InitialScreen;
