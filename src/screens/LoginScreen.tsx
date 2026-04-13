import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, TextInput, TouchableOpacity, Platform, Keyboard,
  TouchableWithoutFeedback, Text, Animated, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import Typography, { Caption } from '../components/Typography';
import MiddleSection from '../components/MiddleSection';
import CountryCodePicker from '../components/CountryCodePicker';
import { defaultCountryCode, CountryCode } from '../constants/countryCodes';
import { getAutoDetectedCountry } from '../utils/countryDetection';
import { logger } from '../utils/logger';
import { useApi } from '../services/useApi';
import { AUTH_SERVICES } from '../services/AuthService';
import { useToast } from '../components/Toast';
import { styles } from './LoginScreen.styles';


const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showErrorToast } = useToast();
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountryCode);
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);
  const [inputType, setInputType] = useState<string>('phone');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [isDetectingCountry, setIsDetectingCountry] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { loading, requestCall } = useApi(AUTH_SERVICES.twoFactorInitiate, false, false);

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

  useEffect(() => {
    const autoDetectCountry = async () => {
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
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        return /^[0-9]{7,15}$/.test(value);
      }),
    password: Yup.string().min(1, 'Required').required('Password is required'),
  });

  const handleSignIn = async (values: { user_identifier: string; password: string }) => {
    try {
      let identityKey = values.user_identifier.trim();
      if (inputType === 'phone') {
        identityKey = selectedCountry.dialCode + identityKey;
      }

      const response = await requestCall({ key: identityKey, secret: values.password });
      const { traceId, maskedContact } = response?.data || {};

      navigation.navigate('OtpLogin' as never, {
        traceId,
        maskedContact,
        user_identifier: identityKey,
      } as never);
    } catch (error: any) {
      const raw = error?.response?.data?.reason
        || error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || '';

      let message = 'Invalid credentials. Please try again.';
      if (raw) {
        const lower = raw.toLowerCase();
        if (lower.includes('customer') || lower.includes('not_allowed')) {
          message = 'This account is not authorized for staff login.';
        } else if (lower.includes('blocked')) {
          message = 'Your account has been blocked. Please contact support.';
        } else if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('password')) {
          message = 'Incorrect email/phone or password.';
        } else {
          message = raw;
        }
      }
      showErrorToast(message);
    }
  };

  const toggleInputType = (setFieldValue: (field: string, value: any) => void) => {
    setFieldValue('user_identifier', '');
    const newInputType = inputType === 'phone' ? 'email' : 'phone';
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: newInputType === 'phone' ? 0 : 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setInputType(newInputType);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>

          {!isKeyboardVisible && (
            <LinearGradient
              colors={["#000000", "#281c10"]}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <View style={{ height: isSmallScreen ? screenHeight * 0.28 : isLargeScreen ? screenHeight * 0.38 : screenHeight * 0.33 }} />

          <View style={styles.centeredContent}>
            <Formik
              initialValues={{ user_identifier: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={handleSignIn}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

                  {/* Identifier field */}
                  <View style={[styles.inputRow, touched.user_identifier && errors.user_identifier ? styles.inputError : null]}>
                    {inputType === 'phone' && (
                      <TouchableOpacity
                        style={styles.countryCodeButton}
                        onPress={() => setShowCountryPicker(true)}
                        disabled={isDetectingCountry}
                      >
                        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                        <Typography weight="600" size={14} color={isDetectingCountry ? color.grey_87807C : color.grey_DEDCDC} style={styles.countryCodeText}>
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
                        inputType === 'phone' ? styles.inputFieldWithCountryCode : styles.inputFieldWithoutCountryCode,
                      ]}
                      placeholder={inputType === 'phone' ? 'Enter Phone Number' : 'Enter Email'}
                      placeholderTextColor={color.grey_87807C}
                      onChangeText={(text) => setFieldValue('user_identifier', text)}
                      onBlur={handleBlur('user_identifier')}
                      value={values.user_identifier}
                      keyboardType={inputType === 'phone' ? 'numeric' : 'email-address'}
                      selectionColor={color.selectField_CEBCA0}
                      autoCapitalize="none"
                      autoComplete={inputType === 'phone' ? 'tel' : 'email'}
                    />
                  </View>
                  {touched.user_identifier && errors.user_identifier && (
                    <Caption color={color.red_FF0000} style={styles.errorText}>{errors.user_identifier}</Caption>
                  )}

                  {/* Password field */}
                  <View style={[styles.inputRow, touched.password && errors.password ? styles.inputError : null, { marginTop: 10 }]}>
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
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
                      {showPassword
                        ? <SvgIcons.eyeOpen width={20} height={20} fill={color.grey_87807C} />
                        : <SvgIcons.eyeClosed width={20} height={20} fill={color.grey_87807C} />
                      }
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Caption color={color.red_FF0000} style={styles.errorText}>{errors.password}</Caption>
                  )}

                  {/* Submit */}
                  <TouchableOpacity
                    style={[styles.submitButton, (loading || !values.user_identifier.trim() || !values.password.trim()) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading || !values.user_identifier.trim() || !values.password.trim()}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color={color.white_FFFFFF} />
                      : <Typography weight="600" size={15} color={color.white_FFFFFF}>Sign In</Typography>
                    }
                  </TouchableOpacity>

                  {/* Toggle phone / email */}
                  <TouchableOpacity style={styles.toggleButton} onPress={() => toggleInputType(setFieldValue)}>
                    <Typography weight="400" size={14} color={color.btnBrown_AE6F28}>
                      {inputType === 'phone' ? 'Sign In with Email' : 'Sign In with Phone Number'}
                    </Typography>
                  </TouchableOpacity>

                </Animated.View>
              )}
            </Formik>
          </View>

          <View style={{ flex: 0.8 }} />

          {!isKeyboardVisible && (
            <MiddleSection showGetStartedButton={false} useFlexLayout />
          )}
        </View>
      </TouchableWithoutFeedback>

      <CountryCodePicker
        selectedCountry={selectedCountry}
        onSelectCountry={(country) => setSelectedCountry(country)}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
      />
    </>
  );
};

export default LoginScreen;
