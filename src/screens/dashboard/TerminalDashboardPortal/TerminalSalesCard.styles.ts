import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
    card: {
        backgroundColor: color.white_FFFFFF,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    cardTitle: {
        marginBottom: 16,
    },
    earningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    earningsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 12,
    },
    filterContainer: {
        alignItems: 'flex-end',
        flex: 0,
        minWidth: 100,
        maxWidth: 150,
    },
    filterLabel: {
        marginBottom: 4,
    },
    dropdownEarningFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.white_FFFFFF,
        borderRadius: 24,
        paddingHorizontal: 14,
        paddingVertical: 6,
        gap: 8,
        borderWidth: 0.1,
        borderColor: color.grey_DADADA,
        justifyContent: 'space-between',
        minWidth: 75,
        maxWidth: 120,
    },
    dropdownValue: {
        fontSize: 14,
        color: color.brown_766F6A,
        flex: 1,
    },
    yAxisLabels: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 150,
        justifyContent: 'space-between',
    },
    axisLabel: {
        fontSize: 10,
        color: color.grey_87807C,
    },
    chartScroll: {
        marginLeft: 30,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 180,
        paddingTop: 20,
    },
    barGroup: {
        alignItems: 'center',
        marginRight: 20,
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    bar: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barLabel: {
        fontSize: 10,
        color: color.grey_87807C,
        marginTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: color.grey_E5E7EB,
        marginTop: 16,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 4,
        borderRadius: 2,
    },
});
