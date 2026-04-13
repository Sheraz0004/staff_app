import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    ticketWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    ticketContainer: {
        backgroundColor: color.lightBrown_FFF6DF,
        borderRadius: 16,
    },
    ticketTopSection: {
        padding: 16,
        paddingBottom: 12,
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ticketIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: color.white_FFFFFF,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ticketDividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 2,
        paddingHorizontal: 24,
    },
    ticketBottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 12,
    },
    ticketAmountItem: {
        flex: 1,
    },
    cutoutAbsolute: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: color.white_FFFFFF,
    },
    miniStatCard: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    miniStatIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: color.white_FFFFFF,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    miniStatLabel: {
        fontSize: 12,
        color: color.brown_766F6A,
        marginBottom: 4,
        textAlign: 'center',
    },
    miniStatCount: {
        fontSize: 14,
        fontWeight: '700',
        color: color.black_2F251D,
        marginBottom: 2,
    },
});
