import Loader from "@/src/components/Loader/Loader";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import Typography from "../../../components/Typography";
import {
  clearFilter,
  fetchSellEventsThunk,
  SelectedSellEvent,
  selectSellEvents,
  selectSellHasMore,
  selectSellLoading,
  selectSellLoadingMore,
  selectSellMonthIndex,
  selectSellMonthYear,
  selectSellPage,
  selectSellRefreshing,
  selectSellSearchQuery,
  selectSellSelectedFilter,
  SellEventItem,
  setFilter,
  setMonthFilter,
  setSearchQuery,
  setSelectedEvent,
} from "../../../redux/reducers/sellCheckinSlice";
import { AppDispatch } from "../../../redux/store";
import { styles } from "./index.styles";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface LargeEventCardProps {
  event: SellEventItem;
  onPress: (event: SellEventItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "#22c55e",
  DRAFT: "#f59e0b",
  PAID: "#3b82f6",
  CANCELLED: "#ef4444",
};

const LargeEventCard = React.memo<LargeEventCardProps>(({ event, onPress }) => {
  const handlePress = useCallback(() => onPress(event), [event, onPress]);
  const statusColor = event.status
    ? (STATUS_COLORS[event.status] ?? color.grey_87807C)
    : null;

  return (
    <TouchableOpacity
      style={styles.largeCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri:
            event?.banner ||
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        }}
        style={styles.largeImage}
        contentFit="cover"
      />
      {statusColor && (
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Typography weight="600" size={10} color={color.white_FFFFFF}>
            {event.status}
          </Typography>
        </View>
      )}
      <View style={styles.cardContent}>
        <Typography
          style={styles.eventTitle}
          weight="700"
          size={14}
          color={color.brown_3C200A}
          numberOfLines={2}
        >
          {event.title}
        </Typography>
        <View style={styles.eventCardMeta}>
          <Typography weight="400" size={11} color={color.grey_87807C}>
            {event.formattedStartDate}
          </Typography>
          {event.timeDuration ? (
            <>
              <View style={styles.metaDot} />
              <Typography weight="400" size={11} color={color.grey_87807C}>
                {event.timeDuration}
              </Typography>
            </>
          ) : null}
        </View>
        <View style={styles.eventCardFooter}>
          <Typography
            weight="400"
            size={11}
            color={color.brown_766F6A}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {event.location || event.globalLocation || "TBD"}
          </Typography>
          {event.priceFrom != null && (
            <Typography weight="400" size={11} color={color.brown_766F6A}>
              From ${event.priceFrom}
            </Typography>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface MonthPickerGridProps {
  onMonthSelect: (monthIndex: number, year: number) => void;
  selectedMonth: number;
  selectedYear: number | null;
}

const MonthPickerGrid: React.FC<MonthPickerGridProps> = ({
  onMonthSelect,
  selectedMonth,
  selectedYear,
}) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [displayYear, setDisplayYear] = useState(selectedYear || currentYear);

  useEffect(() => {
    if (selectedYear !== null && selectedYear !== undefined) {
      setDisplayYear(selectedYear);
    }
  }, [selectedYear]);

  const isCurrentMonth = (idx: number) =>
    idx === currentMonth && displayYear === currentYear;
  const isSelectedMonth = (idx: number) =>
    idx === selectedMonth && displayYear === selectedYear;

  return (
    <View style={styles.monthPickerGridContainer}>
      <View style={styles.pickerNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setDisplayYear(displayYear - 1)}
        >
          <SvgIcons.leftArrowGreyBg />
        </TouchableOpacity>
        <Typography weight="700" size={14} color={color.brown_3C200A}>
          {displayYear}
        </Typography>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setDisplayYear(displayYear + 1)}
        >
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
              isCurrentMonth(index) &&
                !isSelectedMonth(index) &&
                styles.monthCellCurrent,
            ]}
            onPress={() => onMonthSelect(index, displayYear)}
          >
            <Typography
              weight={
                isSelectedMonth(index) || isCurrentMonth(index) ? "600" : "400"
              }
              size={14}
              color={
                isSelectedMonth(index)
                  ? color.btnBrown_AE6F28
                  : color.black_2F251D
              }
            >
              {month}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface WhenFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string | null;
  onFilterChange: (filter: string) => void;
  selectedMonthIndex: number;
  selectedMonthYear: number;
  onMonthSelect: (monthIndex: number, year: number) => void;
}

const filterOptions = ["All", "Today", "Tomorrow", "This Week", "Month"];

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
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            handleClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
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
    if (filter !== "Month") handleClose();
  };

  const handleMonthGridSelect = (monthIndex: number, year: number) => {
    onMonthSelect(monthIndex, year);
    setShowMonthPicker(false);
    handleClose();
  };

  if (!visible) return null;

  if (showMonthPicker) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[styles.bottomSheetModal, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.modalHandle} />

          <Typography
            weight="700"
            size={18}
            color={color.brown_3C200A}
            style={styles.filterTitle}
          >
            When
          </Typography>

          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.filterOption}
              onPress={() => handleFilterSelect(option)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedFilter === option && styles.radioOuterSelected,
                ]}
              >
                {selectedFilter === option && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Typography weight="400" size={16} color={color.brown_3C200A}>
                {option}
              </Typography>
            </TouchableOpacity>
          ))}

          {selectedFilter === "Month" && (
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
interface EventsTicketsTabProps {
  onEventChange?: (event: any) => void;
}

const EventsTicketsTab: React.FC<EventsTicketsTabProps> = ({
  onEventChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const topPadding =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : insets.top;

  const events = useSelector(selectSellEvents);
  const loading = useSelector(selectSellLoading);
  const loadingMore = useSelector(selectSellLoadingMore);
  const refreshing = useSelector(selectSellRefreshing);
  const hasMore = useSelector(selectSellHasMore);
  const page = useSelector(selectSellPage);
  const searchQuery = useSelector(selectSellSearchQuery);
  const selectedFilter = useSelector(selectSellSelectedFilter);
  const selectedMonthIndex = useSelector(selectSellMonthIndex);
  const selectedMonthYear = useSelector(selectSellMonthYear);

  // useFocusEffect(
  //   useCallback(() => {
  //     if (Platform.OS === "android") {
  //       StatusBar.setTranslucent(true);
  //       StatusBar.setBackgroundColor("#FFF");
  //       StatusBar.setBarStyle("dark-content");
  //     } else {
  //       StatusBar.setBarStyle("dark-content");
  //     }
  //   }, []),
  // );

  const [filterVisible, setFilterVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(!!searchQuery);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (events.length === 0) {
      dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!text.trim()) {
      dispatch(setSearchQuery(""));
      dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
      return;
    }
    debounceTimer.current = setTimeout(() => {
      dispatch(setSearchQuery(text));
      dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
    }, 1200);
  };

  const handleSearchSubmit = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    dispatch(setSearchQuery(searchInput));
    dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchVisible(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    dispatch(setSearchQuery(""));
    dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
  };

  const handleFilterChange = (filter: string) => {
    dispatch(setFilter(filter));
    dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
  };

  const handleMonthSelect = (monthIndex: number, year: number) => {
    dispatch(setMonthFilter({ monthIndex, year }));
    dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
  };

  const handleClearFilter = () => {
    dispatch(clearFilter());
    dispatch(fetchSellEventsThunk({ page: 1, reset: true }));
  };

  const handleRefresh = () => {
    dispatch(fetchSellEventsThunk({ page: 1, reset: true, isRefresh: true }));
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading || refreshing) return;
    dispatch(fetchSellEventsThunk({ page: page + 1, reset: false }));
  };

  const handleEventPress = useCallback(
    (event: SellEventItem) => {
      const uuid = event.uuid || event.eventUuid;
      const selected: SelectedSellEvent = {
        uuid,
        eventUuid: uuid,
        title: event.title || event.event_title || "",
        event_title: event.title || event.event_title || "",
        cityName: event.cityName || event.location || undefined,
        date: event.date,
        time: event.time,
      };
      dispatch(setSelectedEvent(selected));
      if (onEventChange) onEventChange(selected);
    },
    [dispatch, onEventChange],
  );

  const activeFilterText = useMemo(() => {
    if (!selectedFilter) return null;
    if (selectedFilter === "Month")
      return `${MONTHS_SHORT[selectedMonthIndex]} ${selectedMonthYear}`;
    return selectedFilter;
  }, [selectedFilter, selectedMonthIndex, selectedMonthYear]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={color.btnBrown_AE6F28} />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Typography weight="400" size={16} color={color.brown_766F6A}>
          {activeFilterText || searchQuery
            ? "No events found"
            : "No events available"}
        </Typography>
        {(activeFilterText || searchQuery) && (
          <TouchableOpacity
            onPress={() => {
              handleClearFilter();
              handleClearSearch();
            }}
            style={styles.clearAllButton}
          >
            <Typography weight="600" size={14} color={color.btnBrown_AE6F28}>
              Clear All
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [
    loading,
    activeFilterText,
    searchQuery,
    handleClearFilter,
    handleClearSearch,
  ]);

  const keyExtractor = useCallback(
    (item: SellEventItem, index: number) => `${item.uuid}-${index}`,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: SellEventItem }) => (
      <LargeEventCard event={item} onPress={handleEventPress} />
    ),
    [handleEventPress],
  );

  // if (loading && events.length === 0) {
  //   return (
  //     <View style={[styles.container, styles.loadingContainer]}>
  //       <Loader isLoading={loading} />
  //       {/* <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
  //       <Typography
  //         style={styles.loadingText}
  //         weight="400"
  //         size={14}
  //         color={color.grey_87807C}
  //       >
  //         Loading events...
  //       </Typography> */}
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity style={styles.headerButton} />
        <Loader isLoading={loading} />
        <Typography
          style={styles.headerTitle}
          weight="700"
          size={18}
          color={color.brown_3C200A}
        >
          Tickets
        </Typography>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFilterVisible(true)}
          >
            <SvgIcons.filterMenuIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSearchVisible((v) => !v)}
          >
            <SvgIcons.searchIconDark />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerDivider} />
      {searchVisible && (
        <View style={styles.searchBar}>
          <SvgIcons.searchIconDark width={16} height={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={color.grey_87807C}
            value={searchInput}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.searchClearButton}
            >
              <Typography weight="700" size={14} color={color.grey_87807C}>
                ✕
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      )}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        enableResetScrollToCoords={false}
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={color.btnBrown_AE6F28}
          />
        }
        onMomentumScrollEnd={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 200
          ) {
            handleLoadMore();
          }
        }}
        onScrollEndDrag={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 200
          ) {
            handleLoadMore();
          }
        }}
      >
        <FlatList
          data={events}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          ListHeaderComponent={
            <>
              {activeFilterText && (
                <View style={styles.activeFilterRow}>
                  <TouchableOpacity
                    style={styles.activeFilterChip}
                    onPress={() => setFilterVisible(true)}
                  >
                    <Typography
                      weight="500"
                      size={12}
                      color={color.btnBrown_AE6F28}
                    >
                      {activeFilterText}
                    </Typography>
                    <TouchableOpacity
                      onPress={handleClearFilter}
                      style={styles.clearFilterButton}
                    >
                      <Typography
                        weight="700"
                        size={12}
                        color={color.btnBrown_AE6F28}
                      >
                        ✕
                      </Typography>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              )}
            </>
          }
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
        />
        <WhenFilterBottomSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          selectedMonthIndex={selectedMonthIndex}
          selectedMonthYear={selectedMonthYear}
          onMonthSelect={handleMonthSelect}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default EventsTicketsTab;
