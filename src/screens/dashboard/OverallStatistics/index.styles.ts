import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
    },
    wrapper: {
        marginVertical: 16,
        padding: 16,
        paddingHorizontal: 15,
        backgroundColor: color.white_FFFFFF,
        borderColor: color.white_FFFFFF,
        borderRadius: 16,
        marginBottom: 5,
        borderWidth: 1,
    },
    heading: {
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'left',
        color: color.placeholderTxt_24282C,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 6,
    },
    statContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 3,
        backgroundColor: color.white_FFFFFF,
        borderColor: color.brown_CEBCA04D,
        borderWidth: 1,
    },
    statContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statTextContainer: {
        flex: 1,
    },
    statTitle: {
        fontSize: 12,
        color: color.placeholderTxt_24282C,
        fontWeight: '400',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
        color: color.brown_3C200A,
    },
});
