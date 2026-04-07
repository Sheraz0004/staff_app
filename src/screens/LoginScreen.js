import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, TextInput, TouchableOpacity, Platform, Keyboard,
  TouchableWithoutFeedback, Text, Animated, useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import { authService } from '../api/apiService';
import Typography, { Body1, Caption } from '../components/Typography';
import { fontSize, fontWeight } from '../constants/typography';
import MiddleSection from '../components/MiddleSection';
import CountryCodePicker from '../components/CountryCodePicker';
import { defaultCountryCode } from '../constants/countryCodes';
import { getAutoDetectedCountry } from '../utils/countryDetection';
import { logger } from '../utils/logger';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountryCode);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [inputType, setInputType] = useState('phone'); // Start with 'phone' as default
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [isDetectingCountry, setIsDetectingCountry] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 900;

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

  // Auto-detect country code when component mounts
  useEffect(() => {
    const autoDetectCountry = async () => {
      // Only auto-detect if we're still using the default country
      if (selectedCountry.code === defaultCountryCode.code) {
        setIsDetectingCountry(true);
        try {
          const detectedCountry = await getAutoDetectedCountry();
          if (detectedCountry && detectedCountry.code !== defaultCountryCode.code) {
            setSelectedCountry(detectedCountry);
          }
        } catch (error) {
          logger.error('Failed to auto-detect country:', error);
        } finally {
          setIsDetectingCountry(false);
        }
      }
    };

    autoDetectCountry();
  }, []);

  const validationSchema = Yup.object().shape({
    user_identifier: Yup.string()
      .min(1, 'Required')
      .required('Required')
      .test('emailOrPhone', 'Invalid email or phone number', (value) => {
        if (!value) return false;
        if (inputType === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        } else {
          const phoneRegex = /^[0-9]{7,15}$/;
          return phoneRegex.test(value);
        }
      }),
    password: Yup.string()
      .min(1, 'Required')
      .required('Password is required'),
  });

  const handleSignIn = async (values) => {
    setIsLoading(true);
    setShowError(false);
    setErrorMessage('');
    try {
      let identityKey = values.user_identifier.trim();

      // For phone, prepend dial code to form E.164 number (e.g. +923001234567)
      if (inputType === 'phone') {
        identityKey = selectedCountry.dialCode + identityKey;
      }

      // 2FA Step 1: POST /login/2fa/initiate — { key, secret }
      const response = await authService.twoFactorInitiate({ key: identityKey, secret: values.password });
      navigation.navigate('OtpLogin', {
        traceId: response.traceId,
        maskedContact: response.maskedContact,
        user_identifier: identityKey,
      });
    } catch (error) {
      const raw = error?.message || '';
      let message = 'Invalid credentials. Please try again.';
      if (raw) {
        const lower = raw.toLowerCase();
        if (lower.includes('customer') || lower.includes('otp/request') || lower.includes('not_allowed')) {
          message = 'This account is not authorized for staff login.';
        } else if (lower.includes('blocked')) {
          message = 'Your account has been blocked. Please contact support.';
        } else if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('password')) {
          message = 'Incorrect email/phone or password.';
        } else {
          message = raw;
        }
      }
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissError = () => {
    setShowError(false);
    setErrorMessage('');
  };

  const toggleInputType = (setFieldValue) => {
    // Clear the input field when switching types
    setFieldValue('user_identifier', '');
    const newInputType = inputType === 'phone' ? 'email' : 'phone';
    
    // Animate the transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newInputType === 'phone' ? 0 : 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInputType(newInputType);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleInputChange = (text, setFieldValue) => {
    setFieldValue('user_identifier', text);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>

          {/* Gradient covers full screen as background */}
          {!isKeyboardVisible && (
            <LinearGradient
              colors={["#000000", "#281c10"]}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* Top spacer — pushes form down without paddingTop so error won't overlap branding */}
          <View style={{ height: isSmallScreen ? screenHeight * 0.28 : isLargeScreen ? screenHeight * 0.38 : screenHeight * 0.33 }} />

          {/* Form area */}
          <View style={styles.centeredContent}>
            <Formik
              initialValues={{ user_identifier: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={handleSignIn}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                <Animated.View style={{ width: '100%', opacity: fadeAnim }}>
                  <View style={[
                    styles.inputRow,
                    touched.user_identifier && errors.user_identifier ? styles.inputError : null
                  ]}>
                    {/* Country Code Picker (only show for phone input) */}
                    {inputType === 'phone' && (
                      <TouchableOpacity
                        style={styles.countryCodeButton}
                        onPress={() => setShowCountryPicker(true)}
                        disabled={isDetectingCountry}
                      >
                        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                        <Typography
                          weight="600"
                          size={14}
                          color={isDetectingCountry ? color.grey_87807C : color.grey_DEDCDC}
                          style={styles.countryCodeText}
                        >
                          {isDetectingCountry ? '...' : selectedCountry.dialCode}
                        </Typography>
                        {!isDetectingCountry && (
                          <SvgIcons.downArrow width={12} height={12} fill={color.grey_87807C} />
                        )}
                      </TouchableOpacity>
                    )}

                    <TextInput
                      style={[
                        styles.inputField,
                        touched.user_identifier && errors.user_identifier ? styles.inputError : null,
                        inputType === 'phone' ? styles.inputFieldWithCountryCode : styles.inputFieldWithoutCountryCode
                      ]}
                      placeholder={inputType === 'phone' ? "Enter Phone Number" : "Enter Email"}
                      placeholderTextColor={color.grey_87807C}
                      onChangeText={(text) => handleInputChange(text, setFieldValue)}
                      onBlur={handleBlur('user_identifier')}
                      value={values.user_identifier}
                      keyboardType={inputType === 'phone' ? "numeric" : "email-address"}
                      selectionColor={color.selectField_CEBCA0}
                      autoCapitalize="none"
                      autoComplete={inputType === 'phone' ? "tel" : "email"}
                    />
                  </View>
                  {touched.user_identifier && errors.user_identifier && (
                    <Caption color={color.red_FF0000} style={styles.errorText}>{errors.user_identifier}</Caption>
                  )}

                  {/* Password Field */}
                  <View style={[
                    styles.inputRow,
                    touched.password && errors.password ? styles.inputError : null,
                    { marginTop: 10 }
                  ]}>
                    <TextInput
                      style={[styles.inputField, styles.inputFieldWithoutCountryCode]}
                      placeholder="Enter Password"
                      placeholderTextColor={color.grey_87807C}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      value={values.password}
                      secureTextEntry={!showPassword}
                      selectionColor={color.selectField_CEBCA0}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword
                        ? <SvgIcons.eyeOpen width={20} height={20} fill={color.grey_87807C} />
                        : <SvgIcons.eyeClosed width={20} height={20} fill={color.grey_87807C} />
                      }
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Caption color={color.red_FF0000} style={styles.errorText}>{errors.password}</Caption>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, (isLoading || !values.user_identifier.trim() || !values.password.trim()) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading || !values.user_identifier.trim() || !values.password.trim()}
                  >
                    <Typography weight="600" size={15} color={color.white_FFFFFF}>
                      {isLoading ? 'Please wait...' : 'Sign In'}
                    </Typography>
                  </TouchableOpacity>

                  {/* Toggle Button */}
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => toggleInputType(setFieldValue)}
                  >
                    <Typography
                      weight="400"
                      size={14}
                      color={color.btnBrown_AE6F28}
                    >
                      {inputType === 'phone' ? 'Sign In with Email' : 'Sign In with Phone Number'}
                    </Typography>
                  </TouchableOpacity>

                  {showError && (
                    <View style={styles.errorContainer}>
                      <TouchableOpacity onPress={dismissError}>
                        <SvgIcons.crossIconRed width={20} height={20} fill={color.red_FF3B30} />
                      </TouchableOpacity>
                      <Typography weight="400" size={14} color={color.red_EF3E32} style={styles.errorTextCross}>
                        {errorMessage}
                      </Typography>
                    </View>
                  )}
                </Animated.View>
              )}
            </Formik>
          </View>

          {/* Flex spacer pushes branding to bottom in normal flow */}
          <View style={{ flex: 0.8 }} />

          {/* Branding at bottom — normal flow, never overlaps form */}
          {!isKeyboardVisible && (
            <MiddleSection showGetStartedButton={false} useFlexLayout />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Country Code Picker Modal */}
      <CountryCodePicker
        selectedCountry={selectedCountry}
        onSelectCountry={handleCountrySelect}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  centeredContent: {
    width: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
    width: '100%',
  },
  hexalloText: {
    marginTop: 18,
    marginBottom: 8,
  },
  tagline: {
    marginBottom: 0,
  },
  inputRow: {
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color.borderBrown_CEBCA0,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    marginBottom: 5,
    height: 54,
    marginHorizontal: 20

  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: color.borderBrown_CEBCA0,
    backgroundColor: 'transparent',
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    marginRight: 4,
  },
  inputField: {
    flex: 1,
    color: color.grey_DEDCDC,
    fontSize: 14,
    fontWeight: '400',
    height: '100%',
    backgroundColor: 'transparent',
    paddingRight: 10,
  },
  inputFieldWithCountryCode: {
    paddingLeft: 15,
  },
  inputFieldWithoutCountryCode: {
    paddingLeft: 20,
  },
  arrowButton: {
    backgroundColor: color.btnBrown_AE6F28,
    height: '100%',
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  eyeButton: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: color.btnBrown_AE6F28,
    marginHorizontal: 20,
    marginTop: 16,
    height: 54,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  inputError: {
    borderColor: color.red_FF0000,
  },
  errorText: {
    width: '100%',
    marginHorizontal: 20
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
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
  errorTextCross: {
    flex: 1,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
});

export default LoginScreen;
