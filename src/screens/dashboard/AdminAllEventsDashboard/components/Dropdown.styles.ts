import { StyleSheet } from 'react-native';
import { color } from '../../../../color/color';

export const styles = StyleSheet.create({
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.white_FFFFFF,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 0.1,
        borderColor: color.grey_DADADA,
        justifyContent: 'space-between',
        width: '100%',
    },
    dropdownValue: {
        fontSize: 14,
        color: color.brown_766F6A,
        flex: 1,
    },
});
