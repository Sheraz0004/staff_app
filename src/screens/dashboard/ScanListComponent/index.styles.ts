import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
    },
    searchFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.white_FFFFFF,
        borderRadius: 10,
        paddingHorizontal: 15,
        borderColor: color.borderBrown_CEBCA0,
        borderWidth: 1,
        height: 45,
        marginRight: 10,
    },
    searchBarFocused: {
        borderColor: color.placeholderTxt_24282C,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 5,
        marginLeft: 5,
    },
    searchInputPlaceholder: {
        color: color.brown_766F6A,
        fontWeight: '200',
        fontSize: 13,
    },
    searchInputWithText: {
        color: color.black_544B45,
        fontWeight: '400',
        fontSize: 13,
    },
    searchIcon: {
        marginRight: 5,
    },
    filterButton: {
        backgroundColor: color.white_FFFFFF,
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: color.borderBrown_CEBCA0,
        height: 45,
        width: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        position: 'relative',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: color.placeholderTxt_24282C,
        marginBottom: 10,
    },
    value: {
        fontSize: 12,
        fontWeight: '400',
        color: color.black_544B45,
        marginBottom: 10,
    },
    qrCode: {
        width: 100,
        height: 100,
        paddingTop: 30,
    },
    badge: {
        position: 'absolute',
        top: 13,
        right: 18,
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkInBadge: {
        backgroundColor: '#FFE8BB',
        width: 90,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    checkInText: {
        color: color.brown_D58E00,
        fontSize: 10,
        fontWeight: '500',
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 10,
        color: color.black_2F251D,
        alignSelf: "flex-start",
    },
    valueID: {
        fontSize: 12,
        fontWeight: '400',
        color: color.black_544B45,
        marginTop: 16,
    },
    statusContainer: {
        position: 'absolute',
        top: 35,
        right: 18,
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: color.brown_3C200A,
    },
    clearAllText: {
        color: color.btnBrown_AE6F28,
        fontWeight: '400',
        fontSize: 14,
        textDecorationLine: 'underline',
        textDecorationColor: color.btnBrown_AE6F28
    },
    filterOptionsContainer: {
        width: '100%',
        marginBottom: 15,
    },
    filterOption: {
        paddingVertical: 8,
        marginBottom: 5,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: color.borderBrown_CEBCA0,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedCheckbox: {
        backgroundColor: color.btnBrown_AE6F28,
        borderColor: color.btnBrown_AE6F28
    },
    checkboxTick: {
        color: color.red_FF0000,
        fontSize: 14,
    },
    filterOptionText: {
        color: color.black_544B45,
        fontSize: 14,
        fontWeight: '400'
    },
    applyButton: {
        backgroundColor: color.btnBrown_AE6F28,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 48
    },
    applyButtonText: {
        color: color.btnTxt_FFF6DF,
        fontSize: 16,
        fontWeight: '700'
    },
    applyButtonDisabled: {
        backgroundColor: '#E0E0E0',
        borderColor: '#E0E0E0',
    },
    applyButtonTextDisabled: {
        color: '#9E9E9E',
    },
    lineView: {
        borderColor: '#F1F1F1',
        width: '100%',
        height: 1,
        borderWidth: 0.5,
    },
    tickettype: {
        fontWeight: '500',
        fontSize: 16,
        color: color.brown_3C200A,
        marginTop: 10,
        marginBottom: 10,
    },
});
