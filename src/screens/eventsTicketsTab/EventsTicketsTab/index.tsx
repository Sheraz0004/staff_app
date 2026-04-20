import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../../color/color';
import { EVENT_SERVICES } from '../../../services/EventService';
import { logger } from '../../../utils/logger';
import SvgIcons from '../../../components/SvgIcons';
import Typography from '../../../components/Typography';
import { styles } from './index.styles';

const PAGE_SIZE = 10;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface EventItem {
  uuid?: string;
  id?: number;
  title?: string;
  banner?: string | null;
  formattedStartDate?: string;
  timeDuration?: string;
  location?: string | null;
  globalLocation?: string | null;
  description?: string;
  eventNumber?: string;
  priceFrom?: number | null;
  [key: string]: any;
}

interface LargeEventCardProps {
  event: EventItem;
  onPress: () => void;
}

interface MonthPickerGridProps {
  onMonthSelect: (monthIndex: number, year: number) => void;
  selectedMonth: number;
  selectedYear: number | null;
}

interface WhenFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string | null;
  onFilterChange: (filter: string) => void;
  selectedMonthIndex: number;
  selectedMonthYear: number;
  onMonthSelect: (monthIndex: number, year: number) => void;
}

interface EventsTicketsTabProps {
  eventInfo?: any;
  onEventChange?: (event: any) => void;
}

// ─────────────────────────────────────────────
// Large Event Card
// ─────────────────────────────────────────────
const LargeEventCard: React.FC<LargeEventCardProps> = ({ event, onPress }) => (
  <TouchableOpacity style={styles.largeCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.largeImageContainer}>
      <Image
        source={{
          uri: event.banner || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        }}
        style={styles.largeImage}
      />
      <TouchableOpacity style={styles.bookmarkButton}>
        <SvgIcons.bookmarkedIcon />
      </TouchableOpacity>
    </View>
    <View style={styles.cardContent}>
      <Typography style={styles.eventTitle} weight="700" size={13} color={color.brown_3C200A}>
        {event.title}
      </Typography>
      <Typography style={styles.eventDate} weight="400" size={10} color={color.grey_87807C}>
        {event.formattedStartDate}
      </Typography>
      <Typography style={styles.eventTime} weight="400" size={10} color={color.grey_87807C}>
        {event.timeDuration}
      </Typography>
      <Typography style={styles.eventLocation} weight="400" size={10} color={color.brown_766F6A} numberOfLines={1}>
        {event.location || event.globalLocation || 'TBD'}
      </Typography>
    </View>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// Month Picker Grid
// ─────────────────────────────────────────────
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
              onPress={() => setShowMonthPicker(true)}
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
const EventsTicketsTab: React.FC<EventsTicketsTabProps> = ({ eventInfo, onEventChange }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear());

  const transformEvents = (events: any[]): EventItem[] =>
    events
      .filter((event: any) => event.id)
      .map((event: any) => ({ ...event, uuid: String(event.id) }));

  const loadEvents = async (pageNum: number, reset = false) => {
    try {
      // console.log('[EventsTicketsTab] fetchMyEvents request →', { page: pageNum, page_size: PAGE_SIZE });
      const res = await EVENT_SERVICES.fetchMyEvents({ page: pageNum, page_size: PAGE_SIZE });
      const responseData = res?.data;
      // console.log('[EventsTicketsTab] fetchMyEvents response ←', responseData);

      const results: any[] = responseData?.events || [];

      const transformed = transformEvents(results);

      setAllEvents(prev => reset ? transformed : [...prev, ...transformed]);
      setPage(pageNum);
      setHasMore(responseData?.hasMore ?? false);
    } catch (error: any) {
      console.log('[EventsTicketsTab] fetchMyEvents error ←', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      logger.error('Error fetching my events:', error?.response);
      if (reset) {
        setAllEvents([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadEvents(1, true);
  }, []);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    loadEvents(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore || loading || isRefreshing) return;
    setIsFetchingMore(true);
    loadEvents(page + 1, false);
  };

  // Parse date helper
  const parseDate = (dateStr: string) => {
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
    if (!selectedFilter || selectedFilter === 'All') {
      setFilteredEvents(allEvents);
      return;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = allEvents.filter((event) => {
      const eventDate = parseDate(event.formattedStartDate ?? '');
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
    setSelectedFilter(filter === 'All' ? null : filter);
  };

  const handleMonthSelect = (monthIndex: number, year: number) => {
    setSelectedMonthIndex(monthIndex);
    setSelectedMonthYear(year);
    setSelectedFilter('Month');
  };

  const handleClearFilter = () => {
    setSelectedFilter(null);
  };

  const handleEventPress = (event: EventItem) => {


    const eventUuid = event.uuid || event.eventUuid;

    // if (!eventUuid || eventUuid.length < 10)
    //    {
    //   logger.error('Invalid event UUID:', eventUuid);
    //   return;
    // }

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

  };
  const getFilterText = () => {
    if (!selectedFilter) return null;
    if (selectedFilter === 'Month') {
      return `${MONTHS_SHORT[selectedMonthIndex]} ${selectedMonthYear}`;
    }
    return selectedFilter;
  };

  const activeFilterText = getFilterText();

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={color.btnBrown_AE6F28} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
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
    );
  };

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
          {/* <SvgIcons.backArrow /> */}
        </TouchableOpacity>
        <Typography style={styles.headerTitle} weight="700" size={18} color={color.brown_3C200A}>
          Tickets
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

      {/* Header divider line */}
      <View style={styles.headerDivider} />

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

      <FlatList
        data={filteredEvents}
        keyExtractor={(item, index) => `${item.uuid || item.eventUuid}-${index}`}
        renderItem={({ item }) => (
          <LargeEventCard
            event={item}
            onPress={() => handleEventPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

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

export default EventsTicketsTab;
