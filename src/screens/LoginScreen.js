import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, TextInput, TouchableOpacity, Platform, Keyboard,
  TouchableWithoutFeedback, Text, Dimensions, Animated
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

  const { height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenHeight < 700;
  const isLargeScreen = screenHeight > 800;

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
  });

  const handleSignIn = async (values) => {
    try {
      let userIdentifier = values.user_identifier.trim();

      // If it's a phone number, add the country code
      if (inputType === 'phone') {
        userIdentifier = selectedCountry.dialCode + userIdentifier;
      }

      const response = await authService.requestOtp({
        user_identifier: userIdentifier,
      });
      if (response && response.success) {
        navigation.navigate('OtpLogin', {
          uuid: response.data.uuid,
          user_identifier: userIdentifier
        });
      } else {
        setShowError(false);
        setErrorMessage('');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setErrorMessage(`Invalid ${inputType === 'email' ? 'email' : 'phone number'}`);
        setShowError(true);
      } else {
        setErrorMessage('Failed to request OTP. Please try again.');
        setShowError(true);
      }
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
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={[styles.centeredContent, { paddingTop: screenHeight * 0.40 }]}>
              <Formik
                initialValues={{ user_identifier: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSignIn}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                  <Animated.View style={{ width: '100%', opacity: fadeAnim }}>
                    <View style={[
                      styles.inputRow,
                      (touched.user_identifier && errors.user_identifier) || showError ? styles.inputError : null
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
                      <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={handleSubmit}
                        disabled={!values.user_identifier.trim()}
                      >
                        <SvgIcons.rightArrowWhite width={28} height={28} fill={color.black_544B45} />
                      </TouchableOpacity>
                    </View>
                    {touched.user_identifier && errors.user_identifier && (
                      <Caption color={color.red_FF0000} style={styles.errorText}>{errors.user_identifier}</Caption>
                    )}
                    
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
                  </Animated.View>
                )}
              </Formik>
              {showError && (
                <View style={[styles.errorContainer, { top: screenHeight * 0.48 }]}>
                  <TouchableOpacity onPress={dismissError}>
                    <SvgIcons.crossIconRed width={20} height={20} fill={color.red_FF3B30} />
                  </TouchableOpacity>
                  <Typography weight="400" size={14} color={color.red_EF3E32} style={styles.errorTextCross}>
                    {errorMessage}
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {!isKeyboardVisible && (
            <LinearGradient
              colors={["#000000", "#281c10"]}
              style={{ flex: 1 }}
            >
              <MiddleSection showGetStartedButton={false} />
            </LinearGradient>
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
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    backgroundColor: "#000000",
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
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  inputError: {
    borderColor: color.red_FF0000,
  },
  errorText: {
    width: '100%',
    marginHorizontal: 20
  },
  errorContainer: {
    position: 'absolute',
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '90%',
    alignSelf: 'center',
    borderWidth: 2,
    gap: 10,
    zIndex: 1000,
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
  },
});

export default LoginScreen;
