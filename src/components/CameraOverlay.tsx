import { useState, useEffect } from 'react';
import { View } from 'react-native';
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
    linePosition: number;
    scannedData?: string;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ linePosition, scannedData }) => {
    const [lineColor, setLineColor] = useState<string>('#AE6F28');

    useEffect(() => {
        if (scannedData) {
            setLineColor(scannedData);
        }
    }, [scannedData]);

    return (
        <View style={styles.overlayContainer}>
            <View style={styles.frame}>
                {marker({ color: '#AE6F28', size: '80%', borderLength: '20%', thickness: 4, borderRadius: 10 })}
                <View
                    style={[
                        styles.scannerLine,
                        { top: linePosition + 35, backgroundColor: lineColor, shadowColor: lineColor },
                    ]}
                />
            </View>
        </View>
    );
};

export default CameraOverlay;
