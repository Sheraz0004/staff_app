import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { setOnboardingComplete } from '../store/slices/authSlice';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import Typography, { Heading3, Body1, ButtonTextDemiBold, Caption } from '../components/Typography';
import MiddleSection from '../components/MiddleSection';
import { logger } from '../utils/logger';

const { width, height } = Dimensions.get('window');

const SplashScreenComponent = () => {
  const dispatch = useDispatch();

  const handleGetStarted = () => {
    // Persists the flag and flips auth.hasSeenOnboarding to true.
    // The navigator sees the change and automatically shows the Login screen.
    dispatch(setOnboardingComplete()).catch((error) => {
      logger.error('Error saving onboarding status:', error);
    });
  };

  return (

    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topSection}>
          <SvgIcons.splashQrImg width={172} height={163} fill="transparent" />
        </View>
        <LinearGradient colors={["#000000", "#281c10"]} style={{ flex: 1 }}>
          <MiddleSection
            showGetStartedButton={true}
            onGetStartedPress={handleGetStarted}
          />
        </LinearGradient>
      </SafeAreaView>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  topSection: {
    alignItems: 'center',
    marginTop: height * 0.3,
  },
});

export default SplashScreenComponent;
