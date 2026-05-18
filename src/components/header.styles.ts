import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: 'transparent',
    },
    safeAreaContainer: {},
    headerColumn: {
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        width: '100%',
        backgroundColor: color.btnBrown_AE6F28,
        height: 48,
    },
    headerBackButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
    },
    headerContentWithBack: {
        justifyContent: 'space-between',
    },
    headerSpacer: {
        flex: 1,
    },
    separator: {
        fontSize: 12,
        fontWeight: '400',
        color: color.white_FFFFFF,
        marginHorizontal: 6,
    },
    eventName: {
        color: color.white_FFFFFF,
        fontSize: 14,
        fontWeight: '500',
    },
    cityName: {
        color: color.white_FFFFFF,
        fontSize: 14,
        fontWeight: '400',
    },
    date: {
        color: color.white_FFFFFF,
        fontSize: 12,
        fontWeight: '400',
    },
    time: {
        color: color.white_FFFFFF,
        fontSize: 12,
        fontWeight: '400',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
    },
    tabWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingLeft: 16,
    },
    staffName: {
        fontSize: 12,
        fontWeight: '400',
        color: color.drak_black_000000,
        marginLeft: 10,
        flexShrink: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#00000030',
        borderRadius: 20,
        padding: 3,
        alignItems: 'center',
    },
    tab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 18,
    },
    activeTab: {
        backgroundColor: color.white_FFFFFF,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '500',
        color: color.white_FFFFFF,
    },
    activeTabText: {
        color: '#241F21',
        fontWeight: '400',
        fontSize: 10,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 16,
        paddingLeft: 12,
    },
    scansLabel: {
        fontSize: 14,
        fontWeight: '400',
        color: '#999999',
    },
    scansCount: {
        fontSize: 14,
        fontWeight: '700',
        color: color.brown_3C200A,
    },
    avatarContainer: {
        width: 22,
        height: 22,
        borderRadius: 22,
        borderColor: color.btnBrown_AE6F28,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    avatar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 22,
        height: 22,
        borderRadius: 22,
    },
});
