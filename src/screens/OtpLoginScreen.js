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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import { authService } from '../api/apiService';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import Typography from '../components/Typography';
import MiddleSection from '../components/MiddleSection';
import { logger } from '../utils/logger';

// Helper function to format seconds as mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}


const OtpLoginScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [otpResendTime, setOtpResendTime] = useState(120); // 2 minutes
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const traceId = route?.params?.traceId;
  const userIdentifier = route?.params?.user_identifier;
  const maskedContact = route?.params?.maskedContact;
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenHeight < 700;
  const isNarrowScreen = screenWidth < 400;
  // useEffect(() => {
  //   const checkLoggedIn = async () => {
  //     const token = await SecureStore.getItemAsync('accessToken');
  //     if (token) {
  //       navigation.navigate('LoggedIn'); // Navigate to your home screen
  //     }
  //   };

  //   checkLoggedIn();
  // }, [navigation]);

  useEffect(() => {
    if (!traceId || !userIdentifier) {
      Alert.alert('Error', 'Missing verification information');
      navigation.goBack();
    }
  }, [traceId, userIdentifier]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });

    const keyboardDidHideListener = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
      : Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSignIn = async (otpArray) => {
    const enteredOtp = otpArray.join('');
    if (enteredOtp.length === 6) {
      setLoading(true);
      try {
        logger.log('twoFactorVerify body:', { traceId, otp: enteredOtp });
        const response = await authService.twoFactorVerify({ traceId, otp: enteredOtp });
        logger.log('twoFactorVerify response:', JSON.stringify(response, null, 2));

        const accessToken = response?.data?.access_token || response?.access_token;

        if (accessToken) {
          setShowError(false);
          setErrorMessage('');
          setLoading(false);
          dispatch(loginSuccess({ accessToken }));
        } else {
          logger.error('twoFactorVerify error: no access token in response', JSON.stringify(response, null, 2));
          setErrorMessage('You have entered an invalid OTP');
          setShowError(true);
          setLoading(false);
        }
      } catch (error) {
        logger.error('twoFactorVerify error:', { message: error?.message, response: error?.response?.data, status: error?.response?.status });
        setErrorMessage(error?.message || 'You have entered an invalid OTP');
        setShowError(true);
        setLoading(false);
      }
    }
  };

  const handleResendOtp = () => {
    // 2FA requires re-entering credentials to re-initiate — go back to login
    navigation.navigate('Login');
  };

  useEffect(() => {
    if (otpResendTime > 0) {
      const timer = setInterval(() => {
        setOtpResendTime((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpResendTime]);

  const handleOtpChange = (value, index) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);
    setShowError(false);
    setErrorMessage('');
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (updatedOtp.every((digit) => digit.length === 1)) {
      handleSignIn(updatedOtp);
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const dismissError = () => {
    setShowError(false);
    setErrorMessage('');
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Full-screen gradient background */}
          <LinearGradient colors={["#000000", "#281c10"]} style={StyleSheet.absoluteFillObject} />

          {/* OTP form — flex: 1 centers it vertically */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.container}>
              <Typography
                weight="700"
                size={20}
                color={color.grey_DEDCDC}
                style={styles.appName}
              >
                Enter OTP
              </Typography>

              {maskedContact ? (
                <Typography
                  weight="400"
                  size={13}
                  color={color.grey_87807C}
                  style={styles.maskedContactText}
                >
                  Code sent to {maskedContact}
                </Typography>
              ) : null}

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={[
                      styles.otpInput,
                      showError ? styles.otpInputError : null
                    ]}
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

              <View style={styles.rowContainer}>
                {otpResendTime > 0 ? (
                  <View style={styles.timerRow}>
                    <Typography weight="400" size={14} color={color.grey_E0E0E0}>
                      Request code again in {' '}
                    </Typography>
                    <Typography weight="400" size={14} color={color.btnBrown_AE6F28}>
                      {formatTime(otpResendTime)}
                    </Typography>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.resendOtpButton} onPress={handleResendOtp}>
                    <Typography weight="400" size={14} color={color.btnBrown_AE6F28}>
                      Back to Login
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>

              {showError && (
                <View style={styles.errorContainer}>
                  <TouchableOpacity onPress={dismissError}>
                    <SvgIcons.crossIconRed width={20} height={20} fill={color.red_FF3B30} />
                  </TouchableOpacity>
                  <Typography weight="400" size={14} color={color.red_EF3E32} style={styles.errorText}>
                    {errorMessage}
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {/* Branding at bottom — normal flow, never overlaps form */}
          {!isKeyboardVisible && (
            <MiddleSection showGetStartedButton={false} useFlexLayout />
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );

};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: 50,
    paddingHorizontal: 20,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  additionalText: {
    color: color.white_FFFFFF,
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 30,
    paddingTop: 20
  },
  topText: {
    color: color.white_FFFFFF,
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 10,
  },
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    marginBottom: 8,
  },
  maskedContactText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  labelText: {
    fontSize: 14,
    color: color.black_544B45,
    textAlign: 'center',
    marginBottom: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    width: 43,
    height: 43,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.borderBrown_CEBCA0,
    textAlign: 'center',
    fontSize: 16,
    color: color.white_FFFFFF,
  },
  otpInputError: {
    borderColor: color.red_FF3B30,
    borderWidth: 2,
  },
  button: {
    backgroundColor: color.btnBrown_AE6F28,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10
  },
  changeDetailsButton: {
    marginTop: 3,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: color.borderBrown_CEBCA0,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    minHeight: 48,
    flexShrink: 0,
  },
  resendText: {
    color: color.blue,
    fontWeight: 'bold',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bottomtextbg: {
    width: 'auto',
    paddingHorizontal: 20,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
  },
  bottomText: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: '400',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    width: '80%',
    alignSelf: 'center',
    borderWidth: 2,
    gap: 10,
  },
  errorIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.red_FF3B30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  errorText: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  
  },
  modalContainer: {
    marginBottom: 200,
    backgroundColor: "#131314",
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  optionText: {
    marginLeft: 15,
    textAlign: 'left',
  },
  changeDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: color.grey_DEDCDC,
    textAlign: 'center',
    flexShrink: 1,
    numberOfLines: 1,
  },
  resendOtpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});

export default OtpLoginScreen;
