import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import PopoverDropdown from '../../../constants/popOverDropdown';
import { DASHBOARD_SERVICES } from '../../../services/DashboardService';
import {
  selectCurrencies,
  selectSelectedCurrencyValue,
  setCurrencies,
  setCurrenciesLoading,
  setCurrenciesError,
  setSelectedCurrencyValue,
} from '../../../redux/reducers/dashboardReducer';

const EarningsChart = () => {
    const data = [
        { month: 'Jan', gross: 75, net: 60 },
        { month: 'Mar', gross: 85, net: 70 },
        { month: 'May', gross: 120, net: 95 },
        { month: 'Jul', gross: 200, net: 180 },
        { month: 'Sep', gross: 150, net: 130 },
        { month: 'Oct', gross: 140, net: 115 },
        { month: 'Dec', gross: 160, net: 140 },
    ];

    const maxValue = 200;
    const chartHeight = 150;
    const barWidth = 24;

    return (
        <View>
            <View style={styles.yAxisLabels}>
                {[200, 150, 100, 50, 0].map((val) => (
                    <Typography
                        key={val}
                        style={styles.axisLabel}
                        weight="400"
                        size={10}
                        color={color.grey_87807C}
                    >
                        {val}
                    </Typography>
                ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                <View style={styles.chartContainer}>
                    {data.map((item, index) => (
                        <View key={index} style={styles.barGroup}>
                            <View style={styles.barsContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: (item.gross / maxValue) * chartHeight,
                                            backgroundColor: color.brown_F7E4B6,
                                            width: barWidth / 2,
                                        },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: (item.net / maxValue) * chartHeight,
                                            backgroundColor: color.btnBrown_AE6F28,
                                            width: barWidth / 2,
                                            marginLeft: 2,
                                        },
                                    ]}
                                />
                            </View>
                            <Typography
                                style={styles.barLabel}
                                weight="400"
                                size={10}
                                color={color.grey_87807C}
                            >
                                {item.month}
                            </Typography>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.divider} />
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color.brown_F7E4B6 }]} />
                    <Typography weight="500" size={12} color={color.brown_3C200A}>
                        Gross
                    </Typography>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color.btnBrown_AE6F28 }]} />
                    <Typography weight="500" size={12} color={color.brown_3C200A}>
                        Net
                    </Typography>
                </View>
            </View>
        </View>
    );
};

const DropdownEarningFilter = ({ value, onPress }) => (
    <TouchableOpacity style={styles.dropdownEarningFilter} onPress={onPress}>
        <Typography
            style={styles.dropdownValue}
            weight="400"
            size={14}
            color={color.brown_766F6A}
            numberOfLines={1}
        >
            {value}
        </Typography>
        <SvgIcons.downArrow />
    </TouchableOpacity>
);

const AdminEarningCard = () => {
    const dispatch = useDispatch();
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const currencyRef = useRef(null);

    const currencies = useSelector(selectCurrencies);
    const selectedCurrencyValue = useSelector(selectSelectedCurrencyValue);

    const currencyOptions = currencies.map((c) => ({
        label: c.threeLetter,
        value: c.threeLetter,
    }));

    const selectedCurrency =
        currencyOptions.find((o) => o.value === selectedCurrencyValue)?.label ?? 'GHS';

    useEffect(() => {
        if (currencies.length === 0) fetchCurrencies();
    }, []);

    const fetchCurrencies = async () => {
        dispatch(setCurrenciesLoading(true));
        dispatch(setCurrenciesError(null));
        try {
            const response = await DASHBOARD_SERVICES.fetchCurrencies();
            dispatch(setCurrencies(response.data.data));
        } catch (error) {
            dispatch(setCurrenciesError(error?.message ?? 'Failed to fetch currencies'));
        } finally {
            dispatch(setCurrenciesLoading(false));
        }
    };

    return (
        <View style={styles.card}>
            <Typography
                style={styles.cardTitle}
                weight="700"
                size={13}
                color={color.placeholderTxt_24282C}
            >
                Earnings
            </Typography>
            <View style={styles.earningsHeader}>
                <View style={styles.earningsInfo}>
                    <SvgIcons.earningArrow />
                    <View>
                        <Typography weight="400" size={10} color={color.brown_3C200A}>
                            Earned:
                        </Typography>
                        <Typography weight="700" size={14} color={color.brown_3C200A}>
                            GHS 355,627.00
                        </Typography>
                    </View>
                </View>
                <View style={styles.filterContainer}>
                    <Typography
                        style={styles.filterLabel}
                        weight="400"
                        size={10}
                        color={color.brown_3C200A}
                    >
                        Currency:
                    </Typography>
                    <View ref={currencyRef} collapsable={false}>
                        <DropdownEarningFilter
                            value={selectedCurrency}
                            onPress={() => setShowCurrencyDropdown(true)}
                        />
                    </View>
                </View>
            </View>
            <EarningsChart />

            <PopoverDropdown
                visible={showCurrencyDropdown}
                onClose={() => setShowCurrencyDropdown(false)}
                options={currencyOptions}
                selectedValue={selectedCurrencyValue}
                onSelect={(option) => dispatch(setSelectedCurrencyValue(option.value))}
                anchorRef={currencyRef}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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

export default AdminEarningCard;