import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bellButton: { position: 'relative' },
    headerDivider: { width: 2, height: 40, backgroundColor: color.grey_E5E7EB },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.btnBrown_AE6F28, justifyContent: 'center', alignItems: 'center' },
    filters: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12, width: '100%' },
    dropdownWrapper: { flex: 1 },
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
        minWidth: 80,
    },
    dropdownValue: { fontSize: 14, color: color.brown_766F6A, flex: 1 },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.white_FFFFFF,
        marginHorizontal: 20,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderWidth: 0.1,
        borderColor: color.grey_DADADA,
        marginBottom: 16,
    },
    dateSelectorText: { flex: 1, fontSize: 14, color: color.brown_766F6A },
    // Date Picker Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
    datePickerModal: {
        backgroundColor: color.white_FFFFFF,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHandle: { width: 40, height: 4, backgroundColor: color.grey_AFAFAF, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

    // ──────────────────────────────────────────────────────────────────────────
    // FIX: Filter chips - 3 changes that fix the clipping on S22+
    //
    // 1. filtersScroll: uses marginHorizontal: -20 to bleed into parent padding
    //    so the grey background spans full width, but NO paddingHorizontal here
    //    (that goes on contentContainerStyle so it affects the inner content only)
    //
    // 2. filtersScrollContent: paddingLeft: 20 matches the parent's padding so
    //    the first chip ("Today") starts at the same indent as "Dashboard".
    //    paddingRight: 40 ensures the LAST chip ("This Year") can scroll fully
    //    into view and isn't hidden behind the right edge.
    //
    // 3. filterChip: paddingHorizontal: 14 gives each chip enough internal space
    //    so text like "Last Quarter" is never truncated. marginRight: 8 keeps
    //    chips close together without excessive gaps.
    // ──────────────────────────────────────────────────────────────────────────
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

    calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dayHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
    dayHeader: { fontSize: 14, color: color.grey_87807C, width: 48, textAlign: 'center' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    dayCell: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    dayCellInRange: { backgroundColor: color.lightBrown_FFF6DF },
    dayCellStart: { backgroundColor: color.brown_D58E00, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
    dayCellEnd: { backgroundColor: color.brown_D58E00, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
    dayCellSingle: { backgroundColor: color.brown_D58E00, borderRadius: 12 },
    applyButton: { backgroundColor: color.btnBrown_AE6F28, paddingVertical: 14, borderRadius: 12, marginTop: 20, alignItems: 'center' },
    // Picker shared styles
    pickerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 10 },
    navButton: { padding: 10 },
    cellSelected: { backgroundColor: color.white_FFFFFF, borderWidth: 2, borderColor: color.btnBrown_AE6F28 },
    cellCurrent: { backgroundColor: color.lightBrown_FFF6DF },
    cellOutside: { backgroundColor: 'transparent' },
    // Year Picker
    yearPickerContainer: { paddingVertical: 10 },
    yearsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10 },
    yearCell: { width: '23%', paddingVertical: 16, marginBottom: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    // Month Picker
    monthPickerContainer: { paddingVertical: 10 },
    monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10 },
    monthCell: { width: '23%', paddingVertical: 16, marginBottom: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    // Quarter Picker
    quarterPickerContainer: { paddingVertical: 10 },
    quartersGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10 },
    quarterCell: { width: '48%', paddingVertical: 20, marginBottom: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9F9' },
});
