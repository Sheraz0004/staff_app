import React from 'react';
import { View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../color/color';
import SvgIcons from './SvgIcons';
import Typography, { ButtonTextDemiBold, Caption } from '../components/Typography';
import { styles } from './MiddleSection.styles';

interface MiddleSectionProps {
    showGetStartedButton?: boolean;
    onGetStartedPress?: () => void;
    useFlexLayout?: boolean;
}

const MiddleSection: React.FC<MiddleSectionProps> = ({
    showGetStartedButton = false,
    onGetStartedPress,
    useFlexLayout = false,
}) => {
    const { height: screenHeight } = Dimensions.get('window');
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(16, insets.bottom);

    if (useFlexLayout) {
        return (
            <View style={styles.flexContainer}>
                <View style={styles.logoContainer}>
                    <SvgIcons.hexalloSvg width={35} height={40} fill="transparent" />
                    <Typography weight="700" size={20} color={color.grey_DEDCDC}>
                        Hexallo
                    </Typography>
                </View>
                <Typography weight="500" size={16} color={color.grey_DEDCDC} style={styles.subtitle}>
                    Fast . Secure . Seamless
                </Typography>

                {showGetStartedButton && (
                    <TouchableOpacity style={styles.buttonFlex} onPress={onGetStartedPress}>
                        <ButtonTextDemiBold size={16} color={color.btnTxt_FFF6DF} align="center" weight="600">
                            Get Started
                        </ButtonTextDemiBold>
                    </TouchableOpacity>
                )}

                <SafeAreaView style={[styles.footerFlex, { paddingBottom: bottomPadding }]}>
                    <Caption color={color.grey_DEDCDC} size={12} marginBottom={10} align="center">
                        By Hexallo Enterprise
                    </Caption>
                    <Typography weight="450" size={12} color={color.grey_DEDCDC} style={styles.footerText}>
                        By logging in you accept our{' '}
                        <Typography weight="600" size={12} color={color.grey_DEDCDC} style={styles.linkText}>
                            Terms of Use
                        </Typography>
                        {' '}{'\n'}and{' '}
                        <Typography weight="600" size={12} color={color.grey_DEDCDC} style={styles.linkText}>
                            Privacy Policy
                        </Typography>
                    </Typography>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <>
            <View style={[styles.middleSection, { bottom: screenHeight * 0.25 }]}>
                <View style={styles.logoContainer}>
                    <SvgIcons.hexalloSvg width={35} height={40} fill="transparent" />
                    <Typography weight="700" size={20} color={color.grey_DEDCDC}>
                        Hexallo
                    </Typography>
                </View>
                <Typography weight="500" size={16} color={color.grey_DEDCDC} style={styles.subtitle}>
                    Fast . Secure . Seamless
                </Typography>
            </View>

            {showGetStartedButton && (
                <TouchableOpacity
                    style={[styles.button, { bottom: screenHeight * 0.15 }]}
                    onPress={onGetStartedPress}
                >
                    <ButtonTextDemiBold size={16} color={color.btnTxt_FFF6DF} align="center" weight="600">
                        Get Started
                    </ButtonTextDemiBold>
                </TouchableOpacity>
            )}

            <SafeAreaView style={[styles.bottomtextbg, { bottom: bottomPadding }]}>
                <Caption color={color.grey_DEDCDC} size={12} marginBottom={10} align="center">
                    By Hexallo Enterprise
                </Caption>
                <Typography weight="450" size={12} color={color.grey_DEDCDC} style={styles.footerText}>
                    By logging in you accept our{' '}
                    <Typography weight="600" size={12} color={color.grey_DEDCDC} style={styles.linkText}>
                        Terms of Use
                    </Typography>
                    {' '}{'\n'}and{' '}
                    <Typography weight="600" size={12} color={color.grey_DEDCDC} style={styles.linkText}>
                        Privacy Policy
                    </Typography>
                </Typography>
            </SafeAreaView>
        </>
    );
};

export default MiddleSection;
