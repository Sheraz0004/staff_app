import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    ActivityIndicator,
    Modal,
    Animated,
    PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../../../color/color';
import { eventService } from '../../../../api/apiService';
import { logger } from '../../../../utils/logger';
import SvgIcons from '../../../../components/SvgIcons';
import Typography from '../../../../components/Typography';
import CircleItemList from '../../../../components/CircleItemList';
import { styles } from './index.styles';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ─────────────────────────────────────────────
// Category tabs — label only, no icons needed
// ─────────────────────────────────────────────
const CATEGORY_ITEMS = [
    { id: 'events',      label: 'Events' },
    { id: 'activities',  label: 'Activities' },
    { id: 'tours',       label: 'Tours' },
    { id: 'movies',      label: 'Movies' },
    { id: 'sports',      label: 'Sports' },
    { id: 'art',         label: 'Art & Culture' },
    { id: 'food',        label: 'Food & Drink' },
    { id: 'music',       label: 'Music' },
];

interface EventItem {
    uuid: string;
    eventUuid: string;
    title: string;
    event_title: string;
    image: string;
    date: string;
    time: string;
    location: string;
    cityName: string;
    rawDate: string | null;
    isBookmarked: boolean;
}

// ─────────────────────────────────────────────
// Large Event Card
// ─────────────────────────────────────────────
interface LargeEventCardProps {
    event: EventItem;
    onPress: () => void;
}

const LargeEventCard: React.FC<LargeEventCardProps> = ({ event, onPress }) => (
    <TouchableOpacity style={styles.largeCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.largeImageContainer}>
            <Image source={{ uri: event.image }} style={styles.largeImage} />
            <TouchableOpacity style={styles.bookmarkButton}>
                <SvgIcons.bookmarkedIcon />
            </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
            <Typography style={styles.eventTitle} weight="700" size={13} color={color.brown_3C200A}>
                {event.title || event.event_title}
            </Typography>
            <Typography style={styles.eventDate} weight="400" size={10} color={color.grey_87807C}>
                {event.date}
            </Typography>
            <Typography style={styles.eventTime} weight="400" size={10} color={color.grey_87807C}>
                {event.time}
            </Typography>
            <Typography style={styles.eventLocation} weight="400" size={10} color={color.brown_766F6A} numberOfLines={1}>
                {event.location || event.cityName}
            </Typography>
        </View>
    </TouchableOpacity>
);

// ─────────────────────────────────────────────
// Month Picker Grid
// ─────────────────────────────────────────────
interface MonthPickerGridProps {
    onMonthSelect: (monthIndex: number, year: number) => void;
    selectedMonth: number;
    selectedYear: number | null;
}

const MonthPickerGrid: React.FC<MonthPickerGridProps> = ({ onMonthSelect, selectedMonth, selectedYear }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const [displayYear, setDisplayYear] = useState(selectedYear || currentYear);

    useEffect(() => {
        if (selectedYear !== null && selectedYear !== undefined) {
            setDisplayYear(selectedYear);
        }
    }, [selectedYear]);

    const isCurrentMonth = (idx: number) => idx === currentMonth && displayYear === currentYear;
    const isSelectedMonth = (idx: number) => idx === selectedMonth && displayYear === selectedYear;

    return (
        <View style={styles.monthPickerGridContainer}>
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
                {MONTHS_SHORT.map((month, index) => (
                    <TouchableOpacity
                        key={month}
                        style={[
                            styles.monthCell,
                            isSelectedMonth(index) && styles.monthCellSelected,
                            isCurrentMonth(index) && !isSelectedMonth(index) && styles.monthCellCurrent,
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

// ─────────────────────────────────────────────
// When Filter Bottom Sheet
// ─────────────────────────────────────────────
interface WhenFilterBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    selectedFilter: string | null;
    onFilterChange: (filter: string) => void;
    selectedMonthIndex: number;
    selectedMonthYear: number;
    onMonthSelect: (monthIndex: number, year: number) => void;
}

const WhenFilterBottomSheet: React.FC<WhenFilterBottomSheetProps> = ({
    visible,
    onClose,
    selectedFilter,
    onFilterChange,
    selectedMonthIndex,
    selectedMonthYear,
    onMonthSelect,
}) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const [showMonthPicker, setShowMonthPicker] = useState(false);

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
                        handleClose();
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
            setShowMonthPicker(false);
        }
    }, [visible]);

    const handleClose = () => {
        setShowMonthPicker(false);
        onClose();
    };

    const handleFilterSelect = (filter: string) => {
        onFilterChange(filter);
        if (filter !== 'Month') {
            handleClose();
        }
    };

    const handleMonthFieldPress = () => {
        setShowMonthPicker(true);
    };

    const handleMonthGridSelect = (monthIndex: number, year: number) => {
        onMonthSelect(monthIndex, year);
        setShowMonthPicker(false);
        handleClose();
    };

    const filterOptions = ['All', 'Today', 'Tomorrow', 'This Week', 'Month'];

    if (!visible) return null;

    if (showMonthPicker) {
        return (
            <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
                    <Animated.View
                        style={[styles.bottomSheetModal, { transform: [{ translateY }] }]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.modalHandle} />
                        <MonthPickerGrid
                            onMonthSelect={handleMonthGridSelect}
                            selectedMonth={selectedMonthIndex}
                            selectedYear={selectedMonthYear}
                        />
                    </Animated.View>
                </TouchableOpacity>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
                <Animated.View
                    style={[styles.bottomSheetModal, { transform: [{ translateY }] }]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.modalHandle} />

                    <Typography weight="700" size={18} color={color.brown_3C200A} style={styles.filterTitle}>
                        When
                    </Typography>

                    {filterOptions.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.filterOption}
                            onPress={() => handleFilterSelect(option)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.radioOuter,
                                selectedFilter === option && styles.radioOuterSelected,
                            ]}>
                                {selectedFilter === option && <View style={styles.radioInner} />}
                            </View>
                            <Typography weight="400" size={16} color={color.brown_3C200A}>
                                {option}
                            </Typography>
                        </TouchableOpacity>
                    ))}

                    {selectedFilter === 'Month' && (
                        <TouchableOpacity
                            style={styles.monthDropdownField}
                            onPress={handleMonthFieldPress}
                            activeOpacity={0.7}
                        >
                            <SvgIcons.calendarIcon width={18} height={18} />
                            <Typography
                                weight="400"
                                size={14}
                                color={color.brown_3C200A}
                                style={styles.monthDropdownText}
                            >
                                {MONTHS_FULL[selectedMonthIndex]}
                            </Typography>
                            <SvgIcons.downArrow width={14} height={14} />
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 40 }} />
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
interface TerminalEventsTabProps {
    eventInfo?: any;
    onEventChange?: (event: any) => void;
}

const TerminalEventsTab: React.FC<TerminalEventsTabProps> = ({ eventInfo, onEventChange }) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const authUser = useSelector((state: any) => state.entities.user.user);
    console.log("authUser--->",authUser)
    const topPadding = Platform.OS === 'android'
        ? (StatusBar.currentHeight || 0)
        : insets.top;

    const [loading, setLoading] = useState(true);
    const [allEvents, setAllEvents] = useState<EventItem[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);

    // Category selection state
    const [activeCategory, setActiveCategory] = useState('events');

    // Filter state
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
    const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear());

    // Fetch events from API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const staffEventsData = await eventService.fetchStaffEvents(authUser?.id);
                const eventsList = staffEventsData?.data || [];

                let events: any[] = [];
                eventsList.forEach((item: any) => {
                    if (item.events && Array.isArray(item.events)) {
                        events = [...events, ...item.events];
                    } else if (item.uuid) {
                        events.push(item);
                    }
                });

                const transformedEvents: EventItem[] = events
                    .filter((event) => event.uuid || event.eventUuid)
                    .map((event) => {
                        const eventUuid = event.uuid || event.eventUuid;
                        return {
                            uuid: eventUuid,
                            eventUuid: eventUuid,
                            title: event.title || event.event_title,
                            event_title: event.title || event.event_title,
                            image: event.image || event.banner_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
                            date: event.start_date || event.date || 'TBD',
                            time: event.start_time || event.time || 'TBD',
                            location: event.location?.city || event.cityName || event.venue || 'TBD',
                            cityName: event.location?.city || event.cityName,
                            rawDate: event.start_date || event.date || null,
                            isBookmarked: false,
                        };
                    });

                setAllEvents(transformedEvents);
                setFilteredEvents(transformedEvents);
            } catch (error) {
                logger.error('Error fetching events for Tickets tab:', error);
                setAllEvents([]);
                setFilteredEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Parse date helper
    const parseDate = (dateStr: string | null): Date | null => {
        if (!dateStr || dateStr === 'TBD' || dateStr === 'N/A') return null;
        const now = new Date();
        let parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) return parsed;
        const withYear = dateStr + ', ' + now.getFullYear();
        parsed = new Date(withYear);
        if (!isNaN(parsed.getTime())) return parsed;
        const dashParts = dateStr.split(' - ');
        if (dashParts.length > 0) {
            const first = dashParts[0].trim() + ', ' + now.getFullYear();
            parsed = new Date(first);
            if (!isNaN(parsed.getTime())) return parsed;
        }
        return null;
    };

    // Apply filter
    useEffect(() => {
        if (!selectedFilter) {
            setFilteredEvents(allEvents);
            return;
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const filtered = allEvents.filter((event) => {
            const eventDate = parseDate(event.rawDate || event.date);
            if (!eventDate) return true;

            const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

            switch (selectedFilter) {
                case 'Today':
                    return eventDay.getTime() === todayStart.getTime();
                case 'Tomorrow': {
                    const tomorrow = new Date(todayStart);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return eventDay.getTime() === tomorrow.getTime();
                }
                case 'This Week': {
                    const weekEnd = new Date(todayStart);
                    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
                    return eventDay >= todayStart && eventDay < weekEnd;
                }
                case 'Month':
                    return (
                        eventDate.getMonth() === selectedMonthIndex &&
                        eventDate.getFullYear() === selectedMonthYear
                    );
                default:
                    return true;
            }
        });

        setFilteredEvents(filtered);
    }, [selectedFilter, selectedMonthIndex, selectedMonthYear, allEvents]);

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
    };

    const handleMonthSelect = (monthIndex: number, year: number) => {
        setSelectedMonthIndex(monthIndex);
        setSelectedMonthYear(year);
        setSelectedFilter('Month');
    };

    const handleClearFilter = () => {
        setSelectedFilter(null);
    };

    // ─── Navigate to DashboardDetail on event press ───
    const handleEventPress = (event: EventItem) => {
        const eventUuid = event.uuid || event.eventUuid;
        if (!eventUuid || eventUuid.length < 10) {
            logger.error('Invalid event UUID:', eventUuid);
            return;
        }

        const eventForChange = {
            uuid: eventUuid,
            eventUuid: eventUuid,
            title: event.title || event.event_title,
            event_title: event.title || event.event_title,
            cityName: event.cityName || event.location,
            date: event.date,
            time: event.time,
        };

        if (onEventChange) onEventChange(eventForChange);

        navigation.navigate('DashboardDetail', {
            eventInfo: eventForChange,
            showEventDashboard: true,
        });
    };

    const handleCategoryPress = (item: any) => {
        setActiveCategory(item.id);
    };

    // Active filter display text
    const getFilterText = (): string | null => {
        if (!selectedFilter) return null;
        if (selectedFilter === 'Month') {
            return `${MONTHS_SHORT[selectedMonthIndex]} ${selectedMonthYear}`;
        }
        return selectedFilter;
    };

    const activeFilterText = getFilterText();

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
                <Typography style={styles.loadingText} weight="400" size={14} color={color.grey_87807C}>
                    Loading events...
                </Typography>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                    {/* back button placeholder */}
                </TouchableOpacity>
                <Typography style={styles.headerTitle} weight="700" size={18} color={color.brown_3C200A}>
                    Events
                </Typography>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => setFilterVisible(true)}>
                        <SvgIcons.filterMenuIcon />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <SvgIcons.searchIconDark />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Category tab bar ── */}
            <CircleItemList
                items={CATEGORY_ITEMS}
                activeId={activeCategory}
                onItemPress={handleCategoryPress}
                activeRingColor={color.btnBrown_AE6F28}
                labelColor={color.brown_3C200A}
                horizontalPadding={16}
                itemSpacing={24}
                labelSize={14}
            />

            {/* Active filter chip */}
            {activeFilterText && (
                <View style={styles.activeFilterRow}>
                    <TouchableOpacity style={styles.activeFilterChip} onPress={() => setFilterVisible(true)}>
                        <Typography weight="500" size={12} color={color.btnBrown_AE6F28}>
                            {activeFilterText}
                        </Typography>
                        <TouchableOpacity onPress={handleClearFilter} style={styles.clearFilterButton}>
                            <Typography weight="700" size={12} color={color.btnBrown_AE6F28}>
                                ✕
                            </Typography>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.eventsContainer}>
                    {filteredEvents.map((event, index) => (
                        <LargeEventCard
                            key={`${event.uuid || event.eventUuid}-${index}`}
                            event={event}
                            onPress={() => handleEventPress(event)}
                        />
                    ))}
                </View>

                {filteredEvents.length === 0 && (
                    <View style={styles.emptyState}>
                        <Typography weight="400" size={16} color={color.brown_766F6A}>
                            {activeFilterText ? 'No events found for this filter' : 'No events available'}
                        </Typography>
                        {activeFilterText && (
                            <TouchableOpacity onPress={handleClearFilter} style={styles.clearAllButton}>
                                <Typography weight="600" size={14} color={color.btnBrown_AE6F28}>
                                    Clear Filter
                                </Typography>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* When Filter Bottom Sheet */}
            <WhenFilterBottomSheet
                visible={filterVisible}
                onClose={() => setFilterVisible(false)}
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
                selectedMonthIndex={selectedMonthIndex}
                selectedMonthYear={selectedMonthYear}
                onMonthSelect={handleMonthSelect}
            />
        </View>
    );
};

export default TerminalEventsTab;
