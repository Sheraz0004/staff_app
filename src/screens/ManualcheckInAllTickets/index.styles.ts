import { StyleSheet } from 'react-native';
import { color } from '../../color/color';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: 10,
    },
    popUp: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        width: '100%',
        marginTop: 16,
        marginBottom: -4,
    },
    button: {
        backgroundColor: color.btnBrown_AE6F28,
        width: '100%',
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: color.btnBrown_AE6F28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: color.btnTxt_FFF6DF,
        fontSize: 16,
        fontWeight: 'bold',
    },
    ticketHolder: {
        color: color.placeholderTxt_24282C,
        fontSize: 14,
        marginTop: 10,
        fontWeight: '400',
    },
    ticketPurchaseDate: {
        color: color.black_544B45,
        fontSize: 14,
        marginTop: 10,
        fontWeight: '400',
    },
    ticketsList: {
        marginTop: 20,
        flex: 1,
    },
    userName: {
        color: color.placeholderTxt_24282C,
        fontSize: 16,
        marginTop: 10,
        fontWeight: '500',
    },
    successImageIcon: {
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        textAlign: 'center',
        color: 'red',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999999',
    },
    ticketContainer: {
        borderWidth: 1,
        borderColor: color.white_FFFFFF,
        borderRadius: 10,
        backgroundColor: color.white_FFFFFF,
        padding: 16,
        marginTop: 15,
        marginBottom: 6,
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftColumnContent: {
        width: '58%',
        alignItems: 'flex-start',
    },
    rightColumnContent: {
        width: '50%',
        alignItems: 'flex-start',
        paddingLeft: 50,
    },
    values: {
        fontSize: 14,
        fontWeight: '500',
        color: color.black_2F251D,
    },
    value: {
        fontSize: 14,
        fontWeight: '400',
        color: color.black_544B45,
    },
    valueScanCount: {
        fontSize: 14,
        fontWeight: '400',
        color: color.black_544B45,
    },
    ticketNumber: {
        fontSize: 14,
        fontWeight: '400',
        color: color.black_544B45,
        marginBottom: 10,
    },
    marginTop10: {
        marginTop: 10,
    },
    marginTop9: {
        marginTop: 9,
    },
    marginTop8: {
        marginTop: 8,
    },
    noteContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: color.brown_F7E4B6,
        borderRadius: 10,
        backgroundColor: color.brown_F7E4B6,
        paddingHorizontal: 16,
        paddingVertical: 5,
        marginTop: 10,
        marginBottom: 10,
        width: '100%',
    },
    LabelNote: {
        fontSize: 14,
        fontWeight: '500',
        color: color.black_2F251D,
    },
    noteDescription: {
        fontSize: 14,
        fontWeight: '400',
        color: color.brown_766F6A,
        opacity: 0.7,
        marginTop: 5,
    },
    queuedBanner: {
        backgroundColor: '#FFA726',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    queuedText: {
        color: color.white_FFFFFF,
        fontSize: 12,
        fontWeight: '500',
    },
    buttonOffline: {
        backgroundColor: '#9E9E9E',
        borderColor: '#9E9E9E',
    },
    buttonQueued: {
        backgroundColor: '#FFA726',
        borderColor: '#FFA726',
    },
});
