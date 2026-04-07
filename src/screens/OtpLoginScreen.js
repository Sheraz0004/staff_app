import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage, ImageBackground as ExpoImageBackground } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import { authService } from '../api/apiService';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import Typography, { Body1, Caption } from '../components/Typography';
import MiddleSection from '../components/MiddleSection';
import OtpSuccessPopup from '../constants/OtpSuccessPopup';
import OtpErrorPopup from '../constants/OtpErrorPopup';
import { logger } from '../utils/logger';

// Helper function to format seconds as mm:ss
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Helper function to detect if user identifier is email or phone
function isEmail(identifier) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier);
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
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showOtpSourceModal, setShowOtpSourceModal] = useState(false);
  const [selectedOtpSource, setSelectedOtpSource] = useState('WHATSAPP');

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

  const gotologinscreen = () => {
    navigation.navigate('Login');
  }

  const handleSignIn = async (otpArray) => {
    const enteredOtp = otpArray.join('');
    if (enteredOtp.length === 6) {
      setLoading(true);
      try {
        const payload = { traceId, otp: enteredOtp, role: 'CUSTOMER' };
        logger.log('verifyOtp body:', payload);
        const response = await authService.verifyOtp(payload);
        logger.log('verifyOtp response:', JSON.stringify(response, null, 2));

        const accessToken = response?.data?.access_token || response?.access_token;

        if (accessToken) {
          setShowError(false);
          setErrorMessage('');
          setLoading(false);
          dispatch(loginSuccess({ accessToken }));
        } else {
          logger.error('verifyOtp error: no access token in response', JSON.stringify(response, null, 2));
          setErrorMessage('You have entered an invalid OTP');
          setShowError(true);
          setLoading(false);
        }
      } catch (error) {
        logger.error('verifyOtp error:', { message: error?.message, response: error?.response?.data, status: error?.response?.status });
        setErrorMessage(error?.message || 'You have entered an invalid OTP');
        setShowError(true);
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    setShowError(false);
    setErrorMessage('');
    setShowErrorPopup(false);
    setShowOtpSourceModal(true);
  };

  const handleOtpSourceSelect = async (otpSource) => {
    setSelectedOtpSource(otpSource);
    setShowOtpSourceModal(false);

    try {
      const channelMap = { WHATSAPP: 'whatsapp', SMS: 'sms', EMAIL: 'email' };
      const payload = { identityKey: userIdentifier, channel: channelMap[otpSource] || 'sms' };
      logger.log('requestOtp body:', payload);
      const response = await authService.requestOtp(payload);
      logger.log('requestOtp response:', JSON.stringify(response, null, 2));
      if (response && response.success) {
        setOtp(['', '', '', '', '', '']);
        setOtpResendTime(120);
        setShowSuccessPopup(true);
      } else {
        setShowErrorPopup(true);
      }
    } catch (error) {
      logger.error('requestOtp error:', error);
      setShowErrorPopup(true);
    }
  };

  const handleCloseSuccessPopup = useCallback(() => {
    setShowSuccessPopup(false);
  }, []);

  const handleCloseErrorPopup = useCallback(() => {
    setShowErrorPopup(false);
  }, []);

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
          {/* <ExpoImageBackground
            source={require('../../assets/images/bg-img-signup.png')}
            contentFit="cover"
            style={styles.background}
          > */}
          {/* <View style={styles.topSection}>
              <SvgIcons.hexalloSvg width={36} height={40} fill="transparent" />
              <Text style={styles.topText}>HEXALLO</Text>
            </View>

            <Text style={styles.additionalText}>Get Started{'\n'}to do more!</Text> */}

          <View style={styles.container}>
            <Typography
              weight="700"
              size={20}
              color={color.grey_DEDCDC}
              style={styles.appName}
            >
              Enter OTP
            </Typography>
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

            {/* Remove the 'Didn't receive OTP?' label for a cleaner look */}
            <OtpSuccessPopup
              visible={showSuccessPopup}
              onClose={handleCloseSuccessPopup}
              title="OTP Sent Successfully"
              subtitle={
                selectedOtpSource === 'WHATSAPP' 
                  ? "We've sent a one-time password to your WhatsApp"
                  : selectedOtpSource === 'SMS'
                  ? "We've sent a one-time password via SMS"
                  : "We've sent a one-time password to your email"
              }
            />
            <OtpErrorPopup
              visible={showErrorPopup}
              onClose={handleCloseErrorPopup}
              title="Sending Failed"
              subtitle="We couldn't send the OTP. Please try again shortly."
              showResendButton={true}
              onResend={handleResendOtp}
            />

            {/* OTP Source Selection Modal */}
            <Modal
              visible={showOtpSourceModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowOtpSourceModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowOtpSourceModal(false)}
              >
                <View style={styles.modalContainer}>
                  {/* Close Button 
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowOtpSourceModal(false)}
                  >
                    <SvgIcons.CrossIconBrownbg width={24} height={24} />
                  </TouchableOpacity>*/}

                  <Typography
                    weight="500"
                    size={18}
                    color={color.grey_DEDCDC}
                    style={styles.modalTitle}
                  >
                    Get another Code
                  </Typography>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleOtpSourceSelect('WHATSAPP')}
                  >
                    <View style={styles.optionContent}>
                      <SvgIcons.whatsappIcon width={24} height={24} />
                      <Typography
                        weight="400"
                        size={14}
                        color={color.grey_DEDCDC}
                        style={styles.optionText}
                      >
                        Send code by whatsapp
                      </Typography>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleOtpSourceSelect('SMS')}
                  >
                    <View style={styles.optionContent}>
                      <SvgIcons.smsIcon width={24} height={24} />
                      <Typography
                        weight="400"
                        size={14}
                        color={color.grey_DEDCDC}
                        style={styles.optionText}
                      >
                        Send code by text message (sms)
                      </Typography>
                    </View>
                  </TouchableOpacity>

                  {/* Show "Send code by email" option only for phone numbers */}
                  {!isEmail(userIdentifier) && (
                    <TouchableOpacity
                      style={styles.modalOption}
                      onPress={() => handleOtpSourceSelect('EMAIL')}
                    >
                      <View style={styles.optionContent}>
                        <SvgIcons.emailIcon width={24} height={24} />
                        <Typography
                          weight="400"
                          size={14}
                          color={color.grey_DEDCDC}
                          style={styles.optionText}
                        >
                          Send code by email
                        </Typography>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </Modal>
            <View style={styles.rowContainer}>
              {otpResendTime > 0 ? (
                <View style={styles.timerRow}>
                  <Typography
                    weight="400"
                    size={14}
                    color={color.grey_E0E0E0}
                  >
                    Request code again in {' '}
                  </Typography>
                  <Typography
                    weight="400"
                    size={14}
                    color={color.btnBrown_AE6F28}
                  >
                    {formatTime(otpResendTime)}
                  </Typography>
                </View>
              ) : (
                <TouchableOpacity style={styles.resendOtpButton} onPress={handleResendOtp}>
                  <Typography
                    weight="400"
                    size={14}
                    color={color.btnBrown_AE6F28}
                  >
                    Resend Otp
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

          {!isKeyboardVisible && (
            <LinearGradient colors={["#000000", "#281c10"]} style={styles.bottomGradient}>
              <MiddleSection showGetStartedButton={false} />
            </LinearGradient>
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
    marginTop: 230
  },
  appName: {
    marginBottom: 20,
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
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: -1,
  },
});

export default OtpLoginScreen;
