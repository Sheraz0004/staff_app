import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    overlayWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    pickerModal: {
        backgroundColor: color.white_FFFFFF,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: color.grey_AFAFAF,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    pickerTitle: {
        marginBottom: 20,
    },
    optionsList: {
        maxHeight: 400,
    },
    radioOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: color.borderBrown_CEBCA0,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    radioOuterSelected: {
        borderColor: color.btnBrown_AE6F28,
        borderWidth: 2.5,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color.btnBrown_AE6F28,
    },
    radioLabel: {
        flex: 1,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});
