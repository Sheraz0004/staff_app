import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import Typography from '../components/Typography';
import { styles } from './OtpErrorPopup.styles';

interface OtpErrorPopupProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    showResendButton?: boolean;
    onResend?: () => void;
}

const OtpErrorPopup: React.FC<OtpErrorPopupProps> = ({
    visible,
    onClose,
    title = "Sending Failed",
    subtitle = "We couldn't send the OTP. Please try shortly.",
    showResendButton = false,
    onResend,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.conatiner}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <SvgIcons.CrossIconBrownbg width={24} height={24} />
                        </TouchableOpacity>

                        <View style={styles.iconContainer}>
                            <View style={styles.errorIconCircle}>
                                <SvgIcons.errorRedCircleIcon width={48} height={48} fill={color.white_FFFFFF} />
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

                        {showResendButton && onResend && (
                            <TouchableOpacity style={styles.resendButton} onPress={onResend}>
                                <Typography weight="600" size={16} color={color.btnBrown_AE6F28}>
                                    Resend
                                </Typography>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default OtpErrorPopup;
