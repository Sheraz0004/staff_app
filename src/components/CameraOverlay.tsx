import { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { styles } from './CameraOverlay.styles';

interface MarkerProps {
    color: string;
    size: number | string;
    borderLength: number | string;
    thickness?: number;
    borderRadius?: number;
}

function marker({ color, size, borderLength, thickness = 2, borderRadius = 0 }: MarkerProps): React.ReactElement {
    return (
        <View style={{ height: size as number, width: size as number }}>
            <View
                style={{
                    position: 'absolute',
                    height: borderLength as number,
                    width: borderLength as number,
                    top: 0,
                    left: 0,
                    borderColor: color,
                    borderTopWidth: thickness,
                    borderLeftWidth: thickness,
                    borderTopLeftRadius: borderRadius,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    height: borderLength as number,
                    width: borderLength as number,
                    top: 0,
                    right: 0,
                    borderColor: color,
                    borderTopWidth: thickness,
                    borderRightWidth: thickness,
                    borderTopRightRadius: borderRadius,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    height: borderLength as number,
                    width: borderLength as number,
                    bottom: 0,
                    left: 0,
                    borderColor: color,
                    borderBottomWidth: thickness,
                    borderLeftWidth: thickness,
                    borderBottomLeftRadius: borderRadius,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    height: borderLength as number,
                    width: borderLength as number,
                    bottom: 0,
                    right: 0,
                    borderColor: color,
                    borderBottomWidth: thickness,
                    borderRightWidth: thickness,
                    borderBottomRightRadius: borderRadius,
                }}
            />
        </View>
    );
}

interface CameraOverlayProps {
    scannedData?: string;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ scannedData }) => {
    const lineAnim = useRef(new Animated.Value(0)).current;
    const lineColor = scannedData || '#AE6F28';

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(lineAnim, { toValue: 225, duration: 1200, useNativeDriver: true }),
                Animated.timing(lineAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [lineAnim]);

    return (
        <View style={styles.overlayContainer}>
            <View style={styles.frame}>
                {marker({ color: '#AE6F28', size: '80%', borderLength: '20%', thickness: 4, borderRadius: 10 })}
                <Animated.View
                    style={[
                        styles.scannerLine,
                        {
                            top: 35,
                            backgroundColor: lineColor,
                            shadowColor: lineColor,
                            transform: [{ translateY: lineAnim }],
                        },
                    ]}
                />
            </View>
        </View>
    );
};

export default CameraOverlay;
