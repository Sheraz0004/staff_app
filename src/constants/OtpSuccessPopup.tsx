import React, { useEffect, useRef } from 'react';
import { View, Modal } from 'react-native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import Typography from '../components/Typography';
import { styles } from './OtpSuccessPopup.styles';

interface OtpSuccessPopupProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

const OtpSuccessPopup: React.FC<OtpSuccessPopupProps> = ({
    visible,
    onClose,
    title = "OTP Sent Successfully",
    subtitle = "We've sent a one-time password to your email",
}) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                onClose();
            }, 2000);
        } else {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [visible, onClose]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.modalContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.successIconCircle}>
                                <SvgIcons.successBrownSVG width={48} height={48} fill={color.white_FFFFFF} />
                            </View>
                        </View>

                        <Typography
                            style={styles.title}
                            weight="500"
                            size={18}
                            color={color.grey_DEDCDC}
                        >
                            {title}
                        </Typography>

                        <Typography
                            style={styles.subtitle}
                            weight="400"
                            size={14}
                            color={color.white_CDCDCD}
                        >
                            {subtitle}
                        </Typography>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default OtpSuccessPopup;
