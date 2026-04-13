import { StyleSheet } from 'react-native';
import { color } from '../../../../color/color';

export const styles = StyleSheet.create({
    monthPickerContainer: { paddingVertical: 10 },
    pickerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    navButton: { padding: 10 },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    monthCell: {
        width: '23%',
        paddingVertical: 16,
        marginBottom: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellSelected: {
        backgroundColor: color.white_FFFFFF,
        borderWidth: 2,
        borderColor: color.btnBrown_AE6F28,
    },
    cellCurrent: { backgroundColor: color.lightBrown_FFF6DF },
});
