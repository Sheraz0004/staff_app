import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import SvgIcons from '../../../../components/SvgIcons';
import { color } from '../../../../color/color';
import Typography from '../../../../components/Typography';
import { styles } from './YearPicker.styles';

interface YearPickerProps {
    onYearSelect: (year: number) => void;
    selectedYear: number | null;
}

const YearPicker: React.FC<YearPickerProps> = ({ onYearSelect, selectedYear }) => {
    const currentYear = new Date().getFullYear();
    const [decadeStart, setDecadeStart] = useState(
        Math.floor((selectedYear || currentYear) / 10) * 10
    );

    const years: number[] = [];
    for (let i = -1; i < 11; i++) {
        years.push(decadeStart + i);
    }

    const isOutsideDecade = (year: number) => year < decadeStart || year >= decadeStart + 10;
    const isCurrentYear = (year: number) => year === currentYear;
    const isSelectedYear = (year: number) => year === selectedYear;

    return (
        <View style={styles.yearPickerContainer}>
            <View style={styles.pickerNav}>
                <TouchableOpacity style={styles.navButton} onPress={() => setDecadeStart(decadeStart - 10)}>
                    <SvgIcons.leftArrowGreyBg />
                </TouchableOpacity>
                <Typography weight="700" size={14} color={color.brown_3C200A}>
                    {decadeStart}-{decadeStart + 9}
                </Typography>
                <TouchableOpacity style={styles.navButton} onPress={() => setDecadeStart(decadeStart + 10)}>
                    <SvgIcons.rightArrowGreyBg />
                </TouchableOpacity>
            </View>
            <View style={styles.yearsGrid}>
                {years.map((year) => (
                    <TouchableOpacity
                        key={year}
                        style={[
                            styles.yearCell,
                            isOutsideDecade(year) && styles.cellOutside,
                            isSelectedYear(year) && styles.cellSelected,
                            isCurrentYear(year) && !isSelectedYear(year) && styles.cellCurrent,
                        ]}
                        onPress={() => onYearSelect(year)}
                    >
                        <Typography
                            weight={isSelectedYear(year) || isCurrentYear(year) ? '600' : '400'}
                            size={14}
                            color={
                                isSelectedYear(year)
                                    ? color.btnBrown_AE6F28
                                    : isOutsideDecade(year)
                                        ? color.grey_87807C
                                        : color.black_2F251D
                            }
                        >
                            {year}
                        </Typography>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default YearPicker;
