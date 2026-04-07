import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { color } from "../color/color";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/reducers/userReducer";
import { LinearGradient } from "expo-linear-gradient";
import Typography from "../components/Typography";
import MiddleSection from "../components/MiddleSection";
import { logger } from "../utils/logger";
import { useApi } from "../services/useApi";
import { AUTH_SERVICES } from "../services/AuthService";
import { useToast } from "../components/Toast";
import * as SecureStore from "expo-secure-store";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const OtpLoginScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showErrorToast } = useToast();

  const traceId = route?.params?.traceId;
  const userIdentifier = route?.params?.user_identifier;
  const maskedContact = route?.params?.maskedContact;

  const [otpResendTime, setOtpResendTime] = useState(120);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const { loading, requestCall } = useApi(AUTH_SERVICES.twoFactorVerify, false, false);


  useEffect(() => {
    if (!traceId || !userIdentifier) {
      Alert.alert("Error", "Missing verification information");
      navigation.goBack();
    }
  }, [traceId, userIdentifier]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Platform.OS === "ios"
      ? Keyboard.addListener("keyboardWillHide", () => setKeyboardVisible(false))
      : Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

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

  const handleSignIn = async (otpArray) => {
    const enteredOtp = otpArray.join("");
    if (enteredOtp.length !== 6) return;

    try {
      logger.log("twoFactorVerify payload:", { traceId, otp: enteredOtp });
      const response = await requestCall({ traceId, otp: enteredOtp });
      const { authToken, refreshToken } = response?.data || {};

      if (!authToken) {
        logger.error("twoFactorVerify: no authToken in response", response?.data);
        showErrorToast("You have entered an invalid OTP");
        return;
      }

      // Persist tokens
      await SecureStore.setItemAsync("accessToken", authToken);
      if (refreshToken) {
        await SecureStore.setItemAsync("refreshToken", refreshToken);
      }

      // Update Redux — navigation will switch to the LoggedIn stack automatically
      dispatch(loginSuccess({ token: authToken }));
    } catch (error) {
      const message =
        error?.response?.data?.reason ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "You have entered an invalid OTP";
      showErrorToast(message);
      logger.error("twoFactorVerify error:", { message: error?.message, response: error?.response?.data });
    }
  };

  const handleOtpChange = (value, index) => {
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

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <LinearGradient colors={["#000000", "#281c10"]} style={StyleSheet.absoluteFillObject} />

          <View style={{ flex: 1, justifyContent: "center" }}>
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
                      Request code again in{" "}
                    </Typography>
                    <Typography weight="400" size={14} color={color.btnBrown_AE6F28}>
                      {formatTime(otpResendTime)}
                    </Typography>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.resendOtpButton}
                    onPress={() => navigation.navigate("Login")}
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    marginBottom: 8,
  },
  maskedContactText: {
    marginBottom: 20,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "92%",
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    width: 43,
    height: 43,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.borderBrown_CEBCA0,
    textAlign: "center",
    fontSize: 16,
    color: color.white_FFFFFF,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  resendOtpButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
});

export default OtpLoginScreen;
