import React, { useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  selectEventsActiveCount,
  selectEventsCancelledCount,
  selectEventsLocations,
  EventStat,
} from "../../../redux/reducers/eventsReducer";
import { fetchEventStatsThunk } from "../../../redux/thunks/eventThunks";
import { styles } from "./index.styles";

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
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const events = useSelector(selectEvents);
  const loading = useSelector(selectEventsLoading);
  const loadingMore = useSelector(selectEventsLoadingMore);
  const currentPage = useSelector(selectEventsPage);
  const totalPages = useSelector(selectEventsTotalPages);
  const totalCount = useSelector(selectEventsTotalCount);
  const activeCount = useSelector(selectEventsActiveCount);
  const cancelledCount = useSelector(selectEventsCancelledCount);
  const locations = useSelector(selectEventsLocations);

  const topPadding = Platform.OS === "android" ? 10 : insets.top;

  useEffect(() => {
    dispatch(fetchEventStatsThunk(1, "", false));
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(fetchEventStatsThunk(1, "", false));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || currentPage >= totalPages) return;
    dispatch(fetchEventStatsThunk(currentPage + 1, "", true));
  }, [dispatch, loadingMore, loading, currentPage, totalPages]);

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
    <View>
      {/* <View style={styles.statsRow}>
        <StatCard label="Total Events" value={totalCount} />
        <StatCard label="Active" value={activeCount} accent="#22c55e" />
        <StatCard label="Cancelled" value={cancelledCount} accent="#ef4444" />
        <StatCard label="Locations" value={locations} />
      </View> */}
      <View style={styles.listHeader}>
        <Typography weight="700" size={14} color={color.placeholderTxt_24282C}>
          All Events
        </Typography>
        <Typography weight="400" size={12} color={color.grey_87807C}>
          {totalCount} total
        </Typography>
      </View>
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
        No events available
      </Typography>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerButton} />
        <Typography
          style={styles.headerTitle}
          weight="700"
          size={18}
          color={color.brown_3C200A}
        >
          Events
        </Typography>
        <TouchableOpacity style={styles.headerButton}>
          <SvgIcons.searchIconDark />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EventCard item={item} onPress={() => handleEventPress(item)} />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading && events.length === 0}
            onRefresh={handleRefresh}
            tintColor={color.brown_3C200A}
          />
        }
      />
    </View>
  );
};

export default EventsScreen;
