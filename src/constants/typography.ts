import { Platform } from 'react-native';

export const fontFamily = {
    primary: Platform.select({
        ios: 'TTNormsPro',
        android: 'TTNormsPro',
    }),
    fallback: Platform.select({
        ios: 'System',
        android: 'Roboto',
    }),
};

export const fontWeight: Record<string, string> = {
    thin: '100',
    extraLight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    demiBold: '600',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
};

export const fontSize: Record<string, number> = {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
};

export const lineHeight: Record<string, number> = {
    tight: 100,
    normal: 120,
    relaxed: 140,
    loose: 160,
};

export const letterSpacing: Record<string, number> = {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
};

export const typography = {
    display1: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize['6xl'],
        lineHeight: fontSize['6xl'] * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    display2: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize['5xl'],
        lineHeight: fontSize['5xl'] * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    h1: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize['4xl'],
        lineHeight: fontSize['4xl'] * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    h2: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.semiBold,
        fontSize: fontSize['3xl'],
        lineHeight: fontSize['3xl'] * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    h3: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.semiBold,
        fontSize: fontSize['2xl'],
        lineHeight: fontSize['2xl'] * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    h4: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.semiBold,
        fontSize: fontSize.xl,
        lineHeight: fontSize.xl * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    h5: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.medium,
        fontSize: fontSize.lg,
        lineHeight: fontSize.lg * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    h6: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.medium,
        fontSize: fontSize.base,
        lineHeight: fontSize.base * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    body1: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.regular,
        fontSize: fontSize.base,
        lineHeight: fontSize.base * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    body2: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.regular,
        fontSize: fontSize.sm,
        lineHeight: fontSize.sm * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    button: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.base,
        lineHeight: fontSize.base * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.wide,
    },
    buttonDemiBold: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.demiBold,
        fontSize: fontSize.base,
        lineHeight: fontSize.base * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.wide,
    },
    buttonSmall: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.sm,
        lineHeight: fontSize.sm * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.wide,
    },
    caption: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.regular,
        fontSize: fontSize.xs,
        lineHeight: fontSize.xs * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    overline: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.medium,
        fontSize: fontSize.xs,
        lineHeight: fontSize.xs * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.wider,
    },
    label: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.medium,
        fontSize: fontSize.sm,
        lineHeight: fontSize.sm * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    tab: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.regular,
        fontSize: fontSize.xs,
        lineHeight: fontSize.xs * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    tabActive: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.xs,
        lineHeight: fontSize.xs * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    input: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.regular,
        fontSize: fontSize.base,
        lineHeight: fontSize.base * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
    inputPlaceholder: {
        fontFamily: fontFamily.primary,
        fontWeight: fontWeight.regular,
        fontSize: fontSize.base,
        lineHeight: fontSize.base * (lineHeight.normal / 100),
        letterSpacing: letterSpacing.normal,
    },
};

interface CreateTypographyStyleOptions {
    weight?: string;
    size?: number;
    lineHeightPercent?: number;
    letterSpacingValue?: number;
}

export function createTypographyStyle({
    weight,
    size = fontSize.base,
    lineHeightPercent = lineHeight.normal,
    letterSpacingValue = letterSpacing.normal,
}: CreateTypographyStyleOptions) {
    return {
        fontFamily: fontFamily.primary,
        fontWeight: weight as any,
        fontSize: size,
        lineHeight: size * (lineHeightPercent / 100),
        letterSpacing: letterSpacingValue,
    };
}

export function getTypographyStyle(variant: keyof typeof typography) {
    return typography[variant] ?? typography.body1;
}
