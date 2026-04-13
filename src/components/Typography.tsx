import React from 'react';
import { Text as RNText, StyleProp, TextStyle, ColorValue } from 'react-native';
import { typography, createTypographyStyle, getTypographyStyle } from '../constants/typography';

type TypographyVariant = keyof typeof typography;

interface TypographyProps {
    children?: React.ReactNode;
    variant?: TypographyVariant;
    style?: StyleProp<TextStyle>;
    weight?: TextStyle['fontWeight'];
    size?: number;
    lineHeight?: number;
    letterSpacing?: number;
    color?: ColorValue;
    align?: TextStyle['textAlign'];
    numberOfLines?: number;
    onPress?: () => void;
    [key: string]: any;
}

const Typography: React.FC<TypographyProps> = ({
    children,
    variant = 'body1',
    style,
    weight,
    size,
    lineHeight,
    letterSpacing,
    color,
    align = 'left',
    numberOfLines,
    onPress,
    ...props
}) => {
    let textStyle = getTypographyStyle(variant);

    if (weight || size || lineHeight || letterSpacing) {
        textStyle = {
            ...textStyle,
            ...createTypographyStyle({
                weight: weight || textStyle.fontWeight,
                size: size || textStyle.fontSize,
                lineHeightPercent: lineHeight || 120,
                letterSpacingValue: letterSpacing || 0,
            }),
        };
    }

    const finalStyle: StyleProp<TextStyle> = [
        textStyle,
        { color, textAlign: align },
        style,
    ];

    return (
        <RNText
            style={finalStyle}
            numberOfLines={numberOfLines}
            onPress={onPress}
            {...props}
        >
            {children}
        </RNText>
    );
};

export const Heading1 = (props: TypographyProps) => <Typography variant="h1" {...props} />;
export const Heading2 = (props: TypographyProps) => <Typography variant="h2" {...props} />;
export const Heading3 = (props: TypographyProps) => <Typography variant="h3" {...props} />;
export const Heading4 = (props: TypographyProps) => <Typography variant="h4" {...props} />;
export const Heading5 = (props: TypographyProps) => <Typography variant="h5" {...props} />;
export const Heading6 = (props: TypographyProps) => <Typography variant="h6" {...props} />;

export const Body1 = (props: TypographyProps) => <Typography variant="body1" {...props} />;
export const Body2 = (props: TypographyProps) => <Typography variant="body2" {...props} />;

export const ButtonText = (props: TypographyProps) => <Typography variant="button" {...props} />;
export const ButtonTextDemiBold = (props: TypographyProps) => <Typography variant="buttonDemiBold" {...props} />;
export const ButtonTextSmall = (props: TypographyProps) => <Typography variant="buttonSmall" {...props} />;

export const Caption = (props: TypographyProps) => <Typography variant="caption" {...props} />;
export const Overline = (props: TypographyProps) => <Typography variant="overline" {...props} />;

export const Label = (props: TypographyProps) => <Typography variant="label" {...props} />;

export const TabText = (props: TypographyProps) => <Typography variant="tab" {...props} />;
export const TabTextActive = (props: TypographyProps) => <Typography variant="tabActive" {...props} />;

export const InputText = (props: TypographyProps) => <Typography variant="input" {...props} />;
export const InputPlaceholder = (props: TypographyProps) => <Typography variant="inputPlaceholder" {...props} />;

export default Typography;
