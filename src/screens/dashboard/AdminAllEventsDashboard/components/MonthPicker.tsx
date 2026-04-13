import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import SvgIcons from '../../../../components/SvgIcons';
import { color } from '../../../../color/color';
import Typography from '../../../../components/Typography';
import { styles } from './MonthPicker.styles';

interface MonthPickerProps {
    onMonthSelect: (monthIndex: number, year: number) => void;
    selectedMonth: number | null;
    selectedYear: number | null;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ onMonthSelect, selectedMonth, selectedYear }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const [displayYear, setDisplayYear] = useState(selectedYear || currentYear);

    useEffect(() => {
        if (selectedYear !== null && selectedYear !== undefined) {
            setDisplayYear(selectedYear);
        }
    }, [selectedYear]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const isCurrentMonth = (idx: number) => idx === currentMonth && displayYear === currentYear;
    const isSelectedMonth = (idx: number) => idx === selectedMonth && displayYear === selectedYear;

    return (
        <View style={styles.monthPickerContainer}>
            <View style={styles.pickerNav}>
                <TouchableOpacity style={styles.navButton} onPress={() => setDisplayYear(displayYear - 1)}>
                    <SvgIcons.leftArrowGreyBg />
                </TouchableOpacity>
                <Typography weight="700" size={14} color={color.brown_3C200A}>
                    {displayYear}
                </Typography>
                <TouchableOpacity style={styles.navButton} onPress={() => setDisplayYear(displayYear + 1)}>
                    <SvgIcons.rightArrowGreyBg />
                </TouchableOpacity>
            </View>
            <View style={styles.monthsGrid}>
                {monthNames.map((month, index) => (
                    <TouchableOpacity
                        key={month}
                        style={[
                            styles.monthCell,
                            isSelectedMonth(index) && styles.cellSelected,
                            isCurrentMonth(index) && !isSelectedMonth(index) && styles.cellCurrent,
                        ]}
                        onPress={() => onMonthSelect(index, displayYear)}
                    >
                        <Typography
                            weight={isSelectedMonth(index) || isCurrentMonth(index) ? '600' : '400'}
                            size={14}
                            color={isSelectedMonth(index) ? color.btnBrown_AE6F28 : color.black_2F251D}
                        >
                            {month}
                        </Typography>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default MonthPicker;
