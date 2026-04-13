import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import SvgIcons from '../../../../components/SvgIcons';
import { color } from '../../../../color/color';
import Typography from '../../../../components/Typography';
import { styles } from './QuarterPicker.styles';

interface Quarter {
    label: string;
    subtitle: string;
    index: number;
}

interface QuarterPickerProps {
    onQuarterSelect: (quarterIndex: number, year: number) => void;
    selectedQuarter: number | null;
    selectedYear: number | null;
}

const QuarterPicker: React.FC<QuarterPickerProps> = ({ onQuarterSelect, selectedQuarter, selectedYear }) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
    const [displayYear, setDisplayYear] = useState(selectedYear || currentYear);

    useEffect(() => {
        if (selectedYear !== null && selectedYear !== undefined) {
            setDisplayYear(selectedYear);
        }
    }, [selectedYear]);

    const quarters: Quarter[] = [
        { label: 'Q1', subtitle: 'Jan - Mar', index: 0 },
        { label: 'Q2', subtitle: 'Apr - Jun', index: 1 },
        { label: 'Q3', subtitle: 'Jul - Sep', index: 2 },
        { label: 'Q4', subtitle: 'Oct - Dec', index: 3 },
    ];

    const isCurrentQuarter = (idx: number) => idx === currentQuarter && displayYear === currentYear;
    const isSelectedQuarter = (idx: number) => idx === selectedQuarter && displayYear === selectedYear;

    return (
        <View style={styles.quarterPickerContainer}>
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
            <View style={styles.quartersGrid}>
                {quarters.map((quarter) => (
                    <TouchableOpacity
                        key={quarter.label}
                        style={[
                            styles.quarterCell,
                            isSelectedQuarter(quarter.index) && styles.cellSelected,
                            isCurrentQuarter(quarter.index) && !isSelectedQuarter(quarter.index) && styles.cellCurrent,
                        ]}
                        onPress={() => onQuarterSelect(quarter.index, displayYear)}
                    >
                        <Typography
                            weight={isSelectedQuarter(quarter.index) || isCurrentQuarter(quarter.index) ? '600' : '500'}
                            size={16}
                            color={isSelectedQuarter(quarter.index) ? color.btnBrown_AE6F28 : color.black_2F251D}
                        >
                            {quarter.label}
                        </Typography>
                        <Typography
                            weight="400"
                            size={12}
                            color={isSelectedQuarter(quarter.index) ? color.btnBrown_AE6F28 : color.grey_87807C}
                            style={{ marginTop: 4 }}
                        >
                            {quarter.subtitle}
                        </Typography>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default QuarterPicker;
