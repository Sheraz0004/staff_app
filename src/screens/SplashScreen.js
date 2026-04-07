import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, SafeAreaView, StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";
import MiddleSection from "../components/MiddleSection";
import SvgIcons from "../components/SvgIcons";

const { width, height } = Dimensions.get("window");

const SplashScreenComponent = ({navigation}) => {
  const dispatch = useDispatch();

  const handleGetStarted = () => {
    navigation.navigate("Login");
    // dispatch(setOnBoarding({ isOnboarding: true }));
  };

  return (
    <LinearGradient colors={["#000000", "#281c10"]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topSection}>
          <SvgIcons.splashQrImg width={172} height={163} fill="transparent" />
        </View>
        <MiddleSection
          showGetStartedButton={true}
          onGetStartedPress={handleGetStarted}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topSection: {
    alignItems: "center",
    marginTop: height * 0.28,
  },
});

export default SplashScreenComponent;
