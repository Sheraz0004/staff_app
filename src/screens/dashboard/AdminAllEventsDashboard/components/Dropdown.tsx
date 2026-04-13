import React from 'react';
import { TouchableOpacity } from 'react-native';
import SvgIcons from '../../../../components/SvgIcons';
import { color } from '../../../../color/color';
import Typography from '../../../../components/Typography';
import { styles } from './Dropdown.styles';

interface DropdownProps {
    value: string;
    onPress: () => void;
}

const Dropdown: React.FC<DropdownProps> = ({ value, onPress }) => (
    <TouchableOpacity style={styles.dropdown} onPress={onPress}>
        <Typography
            style={styles.dropdownValue}
            weight="400"
            size={14}
            color={color.brown_766F6A}
            numberOfLines={1}
        >
            {value}
        </Typography>
        <SvgIcons.downArrow />
    </TouchableOpacity>
);

export default Dropdown;
