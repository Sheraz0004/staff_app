import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    PanResponder,
    Animated,
} from 'react-native';
import SvgIcons from '../../../../components/SvgIcons';
import { color } from '../../../../color/color';
import Typography from '../../../../components/Typography';
import YearPicker from './YearPicker';
import MonthPicker from './MonthPicker';
import QuarterPicker from './QuarterPicker';
import { styles } from './DateRangePicker.styles';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

interface DateRangePickerProps {
    visible: boolean;
    onClose: () => void;
    onDateRangeSelect: (range: DateRange) => void;
}

interface CalendarDay {
    day: number;
    month: 'prev' | 'current' | 'next';
    date: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ visible, onClose, onDateRangeSelect }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>('Today');
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedMonthYear, setSelectedMonthYear] = useState<number | null>(null);
    const [showQuarterPicker, setShowQuarterPicker] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
    const [selectedQuarterYear, setSelectedQuarterYear] = useState<number | null>(null);

    const filtersScrollRef = useRef<ScrollView | null>(null);
    const chipLayoutsRef = useRef<Record<number, { x: number; width: number }>>({});
    const translateY = useRef(new Animated.Value(0)).current;

    const filters = ['Today', 'Yesterday', 'Last Week', 'This Week', 'Last Month', 'This Month', 'Last Quarter', 'This Quarter', 'Last Year', 'This Year'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) translateY.setValue(gs.dy);
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > 100) {
                    Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true }).start(() => {
                        translateY.setValue(0);
                        onClose();
                    });
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            translateY.setValue(0);
            const todayDate = new Date();
            const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
            setStartDate(todayStart);
            setEndDate(todayStart);
            setCurrentDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
            setActiveFilter('Today');
            setShowYearPicker(false);
            setShowMonthPicker(false);
            setShowQuarterPicker(false);
            setSelectedYear(null);
            setSelectedMonth(null);
            setSelectedMonthYear(null);
            setSelectedQuarter(null);
            setSelectedQuarterYear(null);
            chipLayoutsRef.current = {};
        }
    }, [visible]);

    useEffect(() => {
        if (activeFilter && filtersScrollRef.current) {
            const index = filters.indexOf(activeFilter);
            if (index >= 0) {
                setTimeout(() => {
                    const layout = chipLayoutsRef.current[index];
                    if (layout) {
                        const scrollX = Math.max(0, layout.x - 12);
                        filtersScrollRef.current?.scrollTo({ x: scrollX, animated: true });
                    }
                }, 200);
            }
        }
    }, [activeFilter]);

    const handleChipLayout = (index: number, event: any) => {
        const { x, width } = event.nativeEvent.layout;
        chipLayoutsRef.current[index] = { x, width };
    };

    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const generateCalendar = (): CalendarDay[][] => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
        const prevMonthDays = getDaysInMonth(prevMonth);

        const weeks: CalendarDay[][] = [];
        let week: CalendarDay[] = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            week.push({
                day: prevMonthDays - i,
                month: 'prev',
                date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthDays - i),
            });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            week.push({
                day,
                month: 'current',
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
            });
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }

        let nextMonthDay = 1;
        while (week.length < 7 && week.length > 0) {
            week.push({
                day: nextMonthDay,
                month: 'next',
                date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, nextMonthDay),
            });
            nextMonthDay++;
        }
        if (week.length > 0) weeks.push(week);

        return weeks;
    };

    const weeks = generateCalendar();

    const isSameDay = (d1: Date | null, d2: Date | null) => {
        if (!d1 || !d2) return false;
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    };

    const isInRange = (dayObj: CalendarDay) => {
        if (!startDate || !endDate) return false;
        const d = new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), dayObj.date.getDate());
        const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return d > s && d < e;
    };

    const isStartDate = (dayObj: CalendarDay) => isSameDay(dayObj.date, startDate);
    const isEndDate = (dayObj: CalendarDay) => isSameDay(dayObj.date, endDate);

    const handleDayPress = (dayObj: CalendarDay) => {
        if (dayObj.month !== 'current') return;
        const selected = new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), dayObj.date.getDate());
        setActiveFilter(null);
        setShowYearPicker(false);
        setShowMonthPicker(false);
        setShowQuarterPicker(false);

        if (!startDate || (startDate && endDate)) {
            setStartDate(selected);
            setEndDate(null);
        } else if (selected < startDate) {
            setStartDate(selected);
            setEndDate(null);
        } else {
            setEndDate(selected);
        }
    };

    const hideAllPickers = () => {
        setShowYearPicker(false);
        setShowMonthPicker(false);
        setShowQuarterPicker(false);
    };

    const handleYearSelect = (year: number) => {
        setSelectedYear(year);
        setStartDate(new Date(year, 0, 1));
        setEndDate(new Date(year, 11, 31));
        setCurrentDate(new Date(year, 0, 1));
        setShowYearPicker(false);
    };

    const handleMonthSelect = (monthIndex: number, year: number) => {
        setSelectedMonth(monthIndex);
        setSelectedMonthYear(year);
        setStartDate(new Date(year, monthIndex, 1));
        setEndDate(new Date(year, monthIndex + 1, 0));
        setCurrentDate(new Date(year, monthIndex, 1));
        setShowMonthPicker(false);
    };

    const handleQuarterSelect = (quarterIndex: number, year: number) => {
        setSelectedQuarter(quarterIndex);
        setSelectedQuarterYear(year);
        const startMonth = quarterIndex * 3;
        setStartDate(new Date(year, startMonth, 1));
        setEndDate(new Date(year, startMonth + 3, 0));
        setCurrentDate(new Date(year, startMonth, 1));
        setShowQuarterPicker(false);
    };

    const handleFilterPress = (filter: string) => {
        setActiveFilter(filter);
        const todayDate = new Date();

        if (filter === 'Last Year') {
            hideAllPickers();
            const prevYear = todayDate.getFullYear() - 1;
            setSelectedYear(prevYear);
            setStartDate(new Date(prevYear, 0, 1));
            setEndDate(new Date(prevYear, 11, 31));
            setCurrentDate(new Date(prevYear, 0, 1));
            setShowYearPicker(true);
            return;
        }

        if (filter === 'This Year') {
            hideAllPickers();
            const thisYear = todayDate.getFullYear();
            setSelectedYear(thisYear);
            setStartDate(new Date(thisYear, 0, 1));
            setEndDate(new Date(thisYear, 11, 31));
            setCurrentDate(new Date(thisYear, 0, 1));
            setShowYearPicker(true);
            return;
        }

        if (filter === 'Last Month') {
            hideAllPickers();
            let prevMonth = todayDate.getMonth() - 1;
            let prevMonthYear = todayDate.getFullYear();
            if (prevMonth < 0) {
                prevMonth = 11;
                prevMonthYear -= 1;
            }
            setSelectedMonth(prevMonth);
            setSelectedMonthYear(prevMonthYear);
            setStartDate(new Date(prevMonthYear, prevMonth, 1));
            setEndDate(new Date(prevMonthYear, prevMonth + 1, 0));
            setCurrentDate(new Date(prevMonthYear, prevMonth, 1));
            setShowMonthPicker(true);
            return;
        }

        if (filter === 'This Month') {
            hideAllPickers();
            setSelectedMonth(todayDate.getMonth());
            setSelectedMonthYear(todayDate.getFullYear());
            setStartDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
            setEndDate(new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0));
            setCurrentDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
            setShowMonthPicker(true);
            return;
        }

        if (filter === 'Last Quarter') {
            hideAllPickers();
            let prevQuarter = Math.floor(todayDate.getMonth() / 3) - 1;
            let prevQuarterYear = todayDate.getFullYear();
            if (prevQuarter < 0) {
                prevQuarter = 3;
                prevQuarterYear -= 1;
            }
            setSelectedQuarter(prevQuarter);
            setSelectedQuarterYear(prevQuarterYear);
            const sm = prevQuarter * 3;
            setStartDate(new Date(prevQuarterYear, sm, 1));
            setEndDate(new Date(prevQuarterYear, sm + 3, 0));
            setCurrentDate(new Date(prevQuarterYear, sm, 1));
            setShowQuarterPicker(true);
            return;
        }

        if (filter === 'This Quarter') {
            hideAllPickers();
            const currentQuarter = Math.floor(todayDate.getMonth() / 3);
            setSelectedQuarter(currentQuarter);
            setSelectedQuarterYear(todayDate.getFullYear());
            const sm = currentQuarter * 3;
            setStartDate(new Date(todayDate.getFullYear(), sm, 1));
            setEndDate(new Date(todayDate.getFullYear(), sm + 3, 0));
            setCurrentDate(new Date(todayDate.getFullYear(), sm, 1));
            setShowQuarterPicker(true);
            return;
        }

        hideAllPickers();

        let start: Date | undefined;
        let end: Date | undefined;

        switch (filter) {
            case 'Today':
                start = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                end = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
                break;
            case 'Yesterday': {
                const y = new Date(todayDate);
                y.setDate(y.getDate() - 1);
                start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
                end = new Date(y.getFullYear(), y.getMonth(), y.getDate());
                break;
            }
            case 'This Week':
                start = new Date(todayDate);
                start.setDate(start.getDate() - start.getDay());
                start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                break;
            case 'Last Week':
                start = new Date(todayDate);
                start.setDate(start.getDate() - start.getDay() - 7);
                start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                break;
            default:
                return;
        }

        if (start && end) {
            setStartDate(start);
            setEndDate(end);
            setCurrentDate(new Date(start.getFullYear(), start.getMonth(), 1));
        }
    };

    const handleApply = () => {
        if (startDate && endDate && onDateRangeSelect) onDateRangeSelect({ startDate, endDate });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <Animated.View style={[styles.datePickerModal, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
                    <View style={styles.modalHandle} />

                    <ScrollView
                        ref={filtersScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filtersScroll}
                        contentContainerStyle={styles.filtersScrollContent}
                    >
                        {filters.map((filter, index) => (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                                onPress={() => handleFilterPress(filter)}
                                onLayout={(e) => handleChipLayout(index, e)}
                            >
                                <Typography
                                    weight={activeFilter === filter ? '600' : '400'}
                                    size={13}
                                    color={activeFilter === filter ? 'white' : color.brown_766F6A}
                                    numberOfLines={1}
                                >
                                    {filter}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {showYearPicker ? (
                        <YearPicker onYearSelect={handleYearSelect} selectedYear={selectedYear} />
                    ) : showMonthPicker ? (
                        <MonthPicker onMonthSelect={handleMonthSelect} selectedMonth={selectedMonth} selectedYear={selectedMonthYear} />
                    ) : showQuarterPicker ? (
                        <QuarterPicker onQuarterSelect={handleQuarterSelect} selectedQuarter={selectedQuarter} selectedYear={selectedQuarterYear} />
                    ) : (
                        <>
                            <View style={styles.calendarNav}>
                                <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                                    <SvgIcons.leftArrowGreyBg />
                                </TouchableOpacity>
                                <Typography weight="700" size={16} color={color.brown_3C200A}>
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </Typography>
                                <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                                    <SvgIcons.rightArrowGreyBg />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dayHeaders}>
                                {days.map((day) => (
                                    <Typography key={day} style={styles.dayHeader} weight="400" size={14} color={color.grey_87807C}>
                                        {day}
                                    </Typography>
                                ))}
                            </View>

                            {weeks.map((week, weekIndex) => (
                                <View key={weekIndex} style={styles.weekRow}>
                                    {week.map((dayObj, dayIndex) => {
                                        const inRange = isInRange(dayObj);
                                        const isStart = isStartDate(dayObj);
                                        const isEnd = isEndDate(dayObj);
                                        const isBoth = isStart && isSameDay(startDate, endDate);
                                        const isPrev = dayObj.month === 'prev';
                                        const isNext = dayObj.month === 'next';

                                        return (
                                            <TouchableOpacity
                                                key={dayIndex}
                                                style={[
                                                    styles.dayCell,
                                                    inRange && styles.dayCellInRange,
                                                    isStart && !isBoth && styles.dayCellStart,
                                                    isEnd && !isBoth && styles.dayCellEnd,
                                                    isBoth && isStart && styles.dayCellSingle,
                                                ]}
                                                onPress={() => handleDayPress(dayObj)}
                                                disabled={isPrev || isNext}
                                            >
                                                <Typography
                                                    weight={isStart || isEnd ? '600' : '400'}
                                                    size={14}
                                                    color={
                                                        isPrev || isNext
                                                            ? color.grey_87807C
                                                            : isStart || isEnd
                                                                ? 'white'
                                                                : inRange
                                                                    ? color.btnBrown_AE6F28
                                                                    : color.black_2F251D
                                                    }
                                                >
                                                    {dayObj.day.toString().padStart(2, '0')}
                                                </Typography>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </>
                    )}

                    {startDate && endDate && (
                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <Typography weight="600" size={16} color="white">
                                Apply
                            </Typography>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

export default DateRangePicker;
