import { StyleSheet } from 'react-native';
import { color } from '../../../../color/color';

export const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    datePickerModal: {
        backgroundColor: color.white_FFFFFF,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: color.grey_AFAFAF,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    filtersScroll: {
        marginBottom: 20,
        marginHorizontal: -20,
        paddingVertical: 8,
        backgroundColor: color.grey_E5E7EB,
    },
    filtersScrollContent: {
        paddingLeft: 20,
        paddingRight: 40,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    filterChipActive: { backgroundColor: color.btnBrown_AE6F28 },
    calendarNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dayHeaders: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    dayHeader: {
        fontSize: 14,
        color: color.grey_87807C,
        width: 48,
        textAlign: 'center',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    dayCell: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCellInRange: { backgroundColor: color.lightBrown_FFF6DF },
    dayCellStart: {
        backgroundColor: color.brown_D58E00,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    dayCellEnd: {
        backgroundColor: color.brown_D58E00,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    dayCellSingle: { backgroundColor: color.brown_D58E00, borderRadius: 12 },
    applyButton: {
        backgroundColor: color.btnBrown_AE6F28,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
    },
});
