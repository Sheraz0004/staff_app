import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { color } from '../../color/color';
import { useDispatch } from 'react-redux';
import { loginSuccess, setUser } from '../../redux/reducers/userReducer';
import { LinearGradient } from 'expo-linear-gradient';
import Typography from '../../components/Typography';
import MiddleSection from '../../components/MiddleSection';
import { logger } from '../../utils/logger';
import { useApi } from '../../services/useApi';
import { AUTH_SERVICES } from '../../services/AuthService';
import { useToast } from '../../components/Toast';
import * as SecureStore from 'expo-secure-store';
import { styles } from './index.styles';

interface OtpLoginScreenProps {
  route: any;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const OtpLoginScreen: React.FC<OtpLoginScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showErrorToast } = useToast();

  const traceId = route?.params?.traceId;
  const userIdentifier = route?.params?.user_identifier;
  const maskedContact = route?.params?.maskedContact;

  const [otpResendTime, setOtpResendTime] = useState<number>(120);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<any[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  const { loading, requestCall } = useApi(AUTH_SERVICES.twoFactorVerify, false, false);

  useEffect(() => {
    if (!traceId || !userIdentifier) {
      Alert.alert('Error', 'Missing verification information');
      navigation.goBack();
    }
  }, [traceId, userIdentifier]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
      : Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (otpResendTime > 0) {
      const timer = setInterval(() => setOtpResendTime((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpResendTime]);

  const handleSignIn = async (otpArray: string[]) => {
    const enteredOtp = otpArray.join('');
    if (enteredOtp.length !== 6) return;

    try {
      logger.log('twoFactorVerify payload:', { traceId, otp: enteredOtp });
      const response = await requestCall({ traceId, otp: enteredOtp });
      const { authToken, refreshToken } = response?.data || {};

      if (!authToken) {
        logger.error('twoFactorVerify: no authToken in response', response?.data);
        showErrorToast('You have entered an invalid OTP');
        return;
      }

      // Persist tokens
      await SecureStore.setItemAsync('accessToken', authToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      const profileResponse = await AUTH_SERVICES.fetchUserProfile();
      const userData = profileResponse?.data;

      dispatch(setUser({ user: userData }));
      dispatch(loginSuccess({ token: authToken, user: userData }));
    } catch (error: any) {
      const message =
        error?.response?.data?.reason ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'You have entered an invalid OTP';
      showErrorToast(message);
      logger.error('twoFactorVerify error:', { message: error?.message, response: error?.response?.data });
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (updatedOtp.every((digit) => digit.length === 1)) {
      handleSignIn(updatedOtp);
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <LinearGradient colors={['#000000', '#281c10']} style={StyleSheet.absoluteFillObject} />

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.container}>
              <Typography weight="700" size={20} color={color.grey_DEDCDC} style={styles.appName}>
                Enter OTP
              </Typography>

              {maskedContact ? (
                <Typography weight="400" size={13} color={color.grey_87807C} style={styles.maskedContactText}>
                  Code sent to {maskedContact}
                </Typography>
              ) : null}

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    value={digit}
                    placeholder=""
                    placeholderTextColor={color.white_FFFFFF}
                    maxLength={1}
                    keyboardType="numeric"
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(event) => handleKeyPress(event, index)}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    selectionColor={color.selectField_CEBCA0}
                    editable={!loading}
                  />
                ))}
              </View>

              {loading && (
                <ActivityIndicator
                  size="small"
                  color={color.btnBrown_AE6F28}
                  style={{ marginBottom: 12 }}
                />
              )}

              <View style={styles.rowContainer}>
                {otpResendTime > 0 ? (
                  <View style={styles.timerRow}>
                    <Typography weight="400" size={14} color={color.grey_E0E0E0}>
                      Request code again in{' '}
                    </Typography>
                    <Typography weight="400" size={14} color={color.btnBrown_AE6F28}>
                      {formatTime(otpResendTime)}
                    </Typography>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.resendOtpButton}
                    onPress={() => navigation.navigate('Login' as never)}
                  >
                    <Typography weight="400" size={14} color={color.btnBrown_AE6F28}>
                      Back to Login
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {!isKeyboardVisible && (
            <MiddleSection showGetStartedButton={false} useFlexLayout />
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default OtpLoginScreen;
