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
import { useNavigation } from '@react-navigation/native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import Typography, { Heading3, Body1, ButtonTextDemiBold, Caption } from '../components/Typography';
import MiddleSection from '../components/MiddleSection';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const { width, height } = Dimensions.get('window');

const SplashScreenComponent = () => {
  const navigation = useNavigation();

  const handleGetStarted = async () => {
    try {
      // Mark that the user has seen the onboarding
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');

      // Keep SecureStore in sync (optional; helps with migration/back-compat)
      await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
      
      // After onboarding, go to login
      navigation.replace('Login');
    } catch (error) {
      logger.error('Error saving onboarding status:', error);
      // On error, still go to login
      navigation.replace('Login');
    }
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
