import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import PopoverDropdown from '../../../constants/popOverDropdown';
import { styles } from './TerminalSalesCard.styles';

const EarningsChart: React.FC = () => {
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

interface DropdownEarningFilterProps {
    value: string;
    onPress: () => void;
}

const DropdownEarningFilter: React.FC<DropdownEarningFilterProps> = ({ value, onPress }) => (
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

const TerminalSalesCard: React.FC = () => {
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('GHS');
    const currencyRef = useRef(null);

    const currencyOptions = [
        { label: 'USD', value: 'USD' },
        { label: 'Pounds', value: 'Pounds' },
        { label: 'EUR', value: 'EUR' },
        { label: 'AED', value: 'AED' },
        { label: 'QAR', value: 'QAR' },
        { label: 'GHS', value: 'GHS' },
        { label: 'PKR', value: 'PKR' },
    ];

    return (
        <View style={styles.card}>
            <Typography
                style={styles.cardTitle}
                weight="700"
                size={13}
                color={color.placeholderTxt_24282C}
            >
                Sales
            </Typography>
            <View style={styles.earningsHeader}>
                <View style={styles.earningsInfo}>
                    <SvgIcons.earningArrow />
                    <View>
                        <Typography weight="400" size={10} color={color.brown_3C200A}>
                            Sold:
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
                selectedValue={selectedCurrency}
                onSelect={(option: any) => setSelectedCurrency(option.value)}
                anchorRef={currencyRef}
            />
        </View>
    );
};

export default TerminalSalesCard;
