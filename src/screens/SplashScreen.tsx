import React from 'react';
import { SafeAreaView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import MiddleSection from '../components/MiddleSection';
import SvgIcons from '../components/SvgIcons';
import { styles } from './SplashScreen.styles';

interface Props {
  navigation: any;
}

const SplashScreenComponent: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient colors={['#000000', '#281c10']} style={styles.gradient}>
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

export default SplashScreenComponent;
