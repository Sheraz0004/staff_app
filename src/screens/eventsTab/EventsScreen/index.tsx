import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import Typography from "../../../components/Typography";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import {
  selectEvents,
  selectEventsLoading,
  selectEventsLoadingMore,
  selectEventsPage,
  selectEventsTotalPages,
  selectEventsTotalCount,
  selectEventsSearchQuery,
  setSearchQuery,
  EventStat,
} from "../../../redux/reducers/eventsReducer";
import { fetchEventStatsThunk } from "../../../redux/thunks/eventThunks";
import { styles } from "./index.styles";
import Loader from "@/src/components/Loader/Loader";

interface EventsScreenProps {
  eventInfo?: any;
  onEventChange?: (event: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "#22c55e",
  DRAFT: "#f59e0b",
  PAID: "#3b82f6",
  CANCELLED: "#ef4444",
};

const parseDateTime = (dateTimeStr: string): { date: string; time: string } => {
  if (!dateTimeStr) return { date: "N/A", time: "" };
  const parts = dateTimeStr.split(" ");
  const date = parts[0] ?? "N/A";
  const time = parts.slice(1).join(" ");
  return { date, time };
};

const EventCard: React.FC<{ item: EventStat; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const { date, time } = parseDateTime(item.startDateTime);
  const statusColor = STATUS_COLORS[item.status] ?? color.grey_87807C;

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.banner }}
        style={styles.eventCardImage}
        contentFit="cover"
      />
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Typography weight="600" size={10} color={color.white_FFFFFF}>
          {item.status}
        </Typography>
      </View>
      <View style={styles.eventCardContent}>
        <Typography
          style={styles.eventCardTitle}
          weight="700"
          size={14}
          color={color.brown_3C200A}
          numberOfLines={2}
        >
          {item.title}
        </Typography>
        <View style={styles.eventCardMeta}>
          <Typography weight="400" size={11} color={color.grey_87807C}>
            {date}
          </Typography>
          {time ? (
            <>
              <View style={styles.metaDot} />
              <Typography weight="400" size={11} color={color.grey_87807C}>
                {time}
              </Typography>
            </>
          ) : null}
        </View>
        <View style={styles.eventCardFooter}>
          <Typography weight="400" size={11} color={color.brown_766F6A}>
            {item.attendanceType}
          </Typography>
          <Typography weight="400" size={11} color={color.brown_766F6A}>
            {item.eventType}
          </Typography>
        </View>
        <Typography
          weight="400"
          size={11}
          color={color.grey_87807C}
          numberOfLines={1}
        >
          By {item.createdBy}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number | string;
  accent?: string;
}> = ({ label, value, accent }) => (
  <View style={styles.statCard}>
    <Typography weight="700" size={20} color={accent ?? color.brown_3C200A}>
      {value}
    </Typography>
    <Typography weight="400" size={11} color={color.grey_87807C}>
      {label}
    </Typography>
  </View>
);

const EventsScreen: React.FC<EventsScreenProps> = ({ onEventChange }) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();

  const events = useSelector(selectEvents);
  const loading = useSelector(selectEventsLoading);
  const loadingMore = useSelector(selectEventsLoadingMore);
  const currentPage = useSelector(selectEventsPage);
  const totalPages = useSelector(selectEventsTotalPages);
  const totalCount = useSelector(selectEventsTotalCount);
  const searchQuery = useSelector(selectEventsSearchQuery);

  const [searchVisible, setSearchVisible] = useState(!!searchQuery);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch(fetchEventStatsThunk(1, "", false, ""));
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!text.trim()) {
      dispatch(setSearchQuery(""));
      dispatch(fetchEventStatsThunk(1, "", false, ""));
      return;
    }
    debounceTimer.current = setTimeout(() => {
      dispatch(setSearchQuery(text));
      dispatch(fetchEventStatsThunk(1, "", false, text));
    }, 1200);
  };

  const handleSearchSubmit = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    dispatch(setSearchQuery(searchInput));
    dispatch(fetchEventStatsThunk(1, "", false, searchInput));
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchVisible(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    dispatch(setSearchQuery(""));
    dispatch(fetchEventStatsThunk(1, "", false, ""));
  };

  const handleRefresh = useCallback(() => {
    dispatch(fetchEventStatsThunk(1, "", false, searchQuery));
  }, [dispatch, searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || currentPage >= totalPages) return;
    dispatch(fetchEventStatsThunk(currentPage + 1, "", true, searchQuery));
  }, [dispatch, loadingMore, loading, currentPage, totalPages, searchQuery]);

  const handleEventPress = useCallback(
    (item: EventStat) => {
      const eventForChange = {
        uuid: String(item.id),
        eventUuid: String(item.id),
        title: item.title,
        event_title: item.title,
      };
      if (onEventChange) onEventChange(eventForChange);
      // navigation.navigate("ExploreEventScreen", { eventInfo: eventForChange });
    },
    [navigation, onEventChange],
  );

  const ListHeader = (
    <View style={styles.listHeader}>
      <Typography weight="700" size={14} color={color.placeholderTxt_24282C}>
        All Events
      </Typography>
      <Typography weight="400" size={12} color={color.grey_87807C}>
        {totalCount} total
      </Typography>
    </View>
  );

  const ListFooter = loadingMore ? (
    <ActivityIndicator
      style={styles.loadMoreIndicator}
      color={color.brown_3C200A}
      size="small"
    />
  ) : null;

  const ListEmpty = !loading ? (
    <View style={styles.emptyState}>
      <Typography weight="400" size={16} color={color.brown_766F6A}>
        {searchQuery ? "No events found" : "No events available"}
      </Typography>
      {searchQuery ? (
        <TouchableOpacity
          onPress={handleClearSearch}
          style={styles.clearAllButton}
        >
          <Typography weight="600" size={14} color={color.btnBrown_AE6F28}>
            Clear Search
          </Typography>
        </TouchableOpacity>
      ) : null}
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header]}>
        <View style={styles.headerButton} />
        <Loader isLoading={loading} />
        <Typography
          style={styles.headerTitle}
          weight="700"
          size={18}
          color={color.brown_3C200A}
        >
          Events
        </Typography>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setSearchVisible((v) => !v)}
        >
          <SvgIcons.searchIconDark />
        </TouchableOpacity>
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
            refreshing={loading && events.length === 0}
            onRefresh={handleRefresh}
            tintColor={color.brown_3C200A}
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
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EventCard item={item} onPress={() => handleEventPress(item)} />
          )}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default EventsScreen;
