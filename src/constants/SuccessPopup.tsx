import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import Typography from '../components/Typography';
import { styles } from './SuccessPopup.styles';

interface SuccessPopupProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({
    visible,
    onClose,
    title = "",
    subtitle = "",
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <SvgIcons.CrossIconBrownbg width={24} height={24} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <SvgIcons.successBrownSVG width={48} height={48} />
                    </View>
                    <Typography
                        style={styles.title}
                        weight="500"
                        size={18}
                        color={color.placeholderTxt_24282C}
                    >
                        {title}
                    </Typography>

                    <Typography
                        style={styles.subtitle}
                        weight="400"
                        size={14}
                        color={color.placeholderTxt_24282C}
                    >
                        {subtitle}
                    </Typography>
                </View>
            </View>
        </Modal>
    );
};

export default SuccessPopup;
