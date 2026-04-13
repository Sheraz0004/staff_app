import React, { useState, useEffect, RefObject } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import { color } from '../color/color';
import Typography from '../components/Typography';
import { styles } from './popOverDropdown.styles';

const { width } = Dimensions.get('window');

export interface DropdownOption {
    value: string | number;
    label: string;
}

interface PopoverDropdownProps {
    visible: boolean;
    onClose: () => void;
    options: DropdownOption[];
    selectedValue?: string | number;
    onSelect: (option: DropdownOption) => void;
    anchorRef?: RefObject<any>;
}

const PopoverDropdown: React.FC<PopoverDropdownProps> = ({
    visible,
    onClose,
    options,
    selectedValue,
    onSelect,
    anchorRef,
}) => {
    const [position, setPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (visible && anchorRef?.current) {
            anchorRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                setPosition({
                    top: y + h + 4,
                    right: width - (x + w),
                });
            });
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.container, { top: position.top, right: position.right }]}>
                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={option.value || index}
                                style={[styles.option, index < options.length - 1 && styles.optionBorder]}
                                onPress={() => {
                                    onSelect(option);
                                    onClose();
                                }}
                            >
                                <Typography weight="400" size={12} color={color.black_544B45}>
                                    {option.label}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default PopoverDropdown;
