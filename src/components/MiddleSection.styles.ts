import { color } from '../color/color';

export const styles = {
    flexContainer: {
        alignItems: 'center' as const,
        paddingTop: 24,
        paddingBottom: 12,
        paddingHorizontal: 20,
        width: '100%' as const,
    },
    buttonFlex: {
        backgroundColor: color.btnBrown_AE6F28,
        width: '100%' as const,
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 12,
    },
    footerFlex: {
        width: '100%' as const,
        alignItems: 'center' as const,
        paddingTop: 8,
    },
    middleSection: {
        alignItems: 'center' as const,
        position: 'absolute' as const,
        left: 0,
        right: 0,
        width: '100%' as const,
    },
    logoContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
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
        position: 'absolute' as const,
        left: 20,
        right: 20,
    },
    bottomtextbg: {
        width: 'auto' as const,
        paddingHorizontal: 20,
        paddingVertical: 8,
        minHeight: 60,
        borderRadius: 6,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        alignSelf: 'center' as const,
        backgroundColor: 'transparent',
        position: 'absolute' as const,
        left: 0,
        right: 0,
    },
    footerText: {
        textAlign: 'center' as const,
        lineHeight: 15,
    },
    linkText: {
        textDecorationLine: 'underline' as const,
    },
};
