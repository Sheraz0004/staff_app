import React from 'react';
import { View, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../color/color';
import SvgIcons from './SvgIcons';
import Typography, { ButtonTextDemiBold, Caption } from '../components/Typography';

const MiddleSection = ({ showGetStartedButton = false, onGetStartedPress, useFlexLayout = false }) => {
    const { height: screenHeight } = Dimensions.get('window');
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(16, insets.bottom);

    // Flex layout: normal document flow, no overlapping (used by LoginScreen / OtpLoginScreen)
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
                    <Caption color={color.grey_DEDCDC} size={12} marginBottom={10} align="center">By Hexallo Enterprise</Caption>
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

    // Absolute layout: legacy behaviour used by SplashScreen
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
                <TouchableOpacity style={[styles.button, { bottom: screenHeight * 0.15 }]} onPress={onGetStartedPress}>
                    <ButtonTextDemiBold size={16} color={color.btnTxt_FFF6DF} align="center" weight="600">
                        Get Started
                    </ButtonTextDemiBold>
                </TouchableOpacity>
            )}

            <SafeAreaView style={[styles.bottomtextbg, { bottom: bottomPadding }]}>
                <Caption color={color.grey_DEDCDC} size={12} marginBottom={10} align="center">By Hexallo Enterprise</Caption>
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

const styles = {
    flexContainer: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 12,
        paddingHorizontal: 20,
        width: '100%',
    },
    buttonFlex: {
        backgroundColor: color.btnBrown_AE6F28,
        width: '100%',
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 12,
    },
    footerFlex: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 8,
    },
    middleSection: {
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    subtitle: {
        marginBottom: 15,
    },
    button: {
        backgroundColor: color.btnBrown_AE6F28,
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 8,
        position: 'absolute',
        left: 20,
        right: 20,
    },
    bottomtextbg: {
        width: 'auto',
        paddingHorizontal: 20,
        paddingVertical: 8,
        minHeight: 60,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        position: 'absolute',
        left: 0,
        right: 0,
    },
    footerText: {
        textAlign: 'center',
        lineHeight: 15,
    },
    linkText: {
        textDecorationLine: 'underline',
},
};

export default MiddleSection; 