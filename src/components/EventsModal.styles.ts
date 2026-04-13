import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContainer: {
        backgroundColor: color.white_FFFFFF,
        marginTop: 48,
        marginHorizontal: 16,
        width: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 8,
    },
    eventsList: {},
    eventItem: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        backgroundColor: color.white_FFFFFF,
    },
    selectedEventItem: {
        backgroundColor: color.brown_CEBCA04D,
        borderRadius: 8,
    },
    eventTitle: {
        color: color.black_544B45,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'left',
    },
    selectedEventTitle: {
        color: color.brown_3C200A,
        fontWeight: '600',
    },
    firstEventItem: {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    lastEventItem: {
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderBottomWidth: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        color: color.brown_3C200A,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: color.btnBrown_AE6F28,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: color.white_FFFFFF,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: color.black_544B45,
        textAlign: 'center',
    },
});
