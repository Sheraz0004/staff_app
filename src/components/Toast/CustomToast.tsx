import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Image,
  Easing,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";
import SvgIcons from "../../components/SvgIcons";
import { mvs } from "../../../constants/responsive";
import { APP_IMAGES } from "../../../assets/images";

interface CustomToastProps {
  visible: boolean;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const CustomToast: React.FC<CustomToastProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  duration = 3000,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const closeScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      iconScale.setValue(0);
      iconRotate.setValue(0);
      showToast();

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          if (!isClosingRef.current) {
            hideToast();
          }
        }, duration);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible]);

  const showToast = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 5,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start(() => {
      animateIcon();
    });
  };

  const animateIcon = () => {
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 5,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();
  };

  const hideToast = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.back(1.5)),
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleClosePressIn = () => {
    Animated.spring(closeScale, {
      toValue: 0.8,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const handleClosePressOut = () => {
    Animated.spring(closeScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  };

  const getIconConfig = () => {
    switch (type) {
      case "success":
        return { image: APP_IMAGES.checked, bgColor: "#22C55E" };
      case "error":
        return { image: APP_IMAGES.closed, bgColor: "#EF4444" };
      case "info":
        return { image: APP_IMAGES.checked, bgColor: "#3B82F6" };
      default:
        return { image: APP_IMAGES.checked, bgColor: "#22C55E" };
    }
  };

  if (!visible) return null;

  const iconConfig = getIconConfig();

  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-180deg", "0deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + mvs(10),
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.backgroundLayer1} />
      <View style={styles.mainCard}>
        <View style={[styles.iconContainer]}>
          <Image source={iconConfig.image} style={styles.iconImage} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message} numberOfLines={3}>
            {message}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          onPressIn={handleClosePressIn}
          onPressOut={handleClosePressOut}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: closeScale }] }}>
            <SvgIcons.crossIconRed width={20} height={20} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default CustomToast;
