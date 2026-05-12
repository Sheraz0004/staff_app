import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NOTIFICATION_SERVICES, notifDefaultRange, notifDateTimeFrom, notifDateTimeTill } from '../../services/NotificationService';
import { color } from '../../color/color';
import SvgIcons from '../../components/SvgIcons';
import { styles } from './index.styles';
import DateRangePicker from '../dashboard/AdminAllEventsDashboard/components/DateRangePicker';

interface PushNotification {
  id: number;
  title: string;
  body: string;
  topic: string;
  read: boolean;
  createdAt: string;
}

interface PagedResponse {
  content: PushNotification[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  first: boolean;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
}


function formatDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

const PAGE_SIZE = 20;

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [tillDate, setTillDate] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isLoadingMoreRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isFiltered = !!(fromDate || tillDate);

  // page is 1-indexed to match the API's pageable.pageNumber / number field
  const loadPage = useCallback(async (
    page: number,
    replace: boolean,
    from?: string,
    till?: string,
  ) => {
    const defaults = notifDefaultRange(90);
    try {
      const res = await NOTIFICATION_SERVICES.fetchPushInbox({
        page,
        pageSize: PAGE_SIZE,
        from: from ?? defaults.from,
        till: till ?? defaults.till,
      });
      // console.log("Res--->", res?.data);
      const data: PagedResponse = res?.data;
      if (!data?.content) return;

      setFetchError(false);
      setNotifications((prev) =>
        replace ? data.content : [...prev, ...data.content],
      );
      setCurrentPage(data.number);
      setIsLastPage(data.last);
    } catch (err: any) {
      console.warn(
        '[NotificationsScreen]',
        err?.response?.data?.message || err?.response?.data?.error || err?.message,
      );
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPage(1, true);
      setLoading(false);
    })();
  }, [loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPage(1, true, fromDate, tillDate);
    setRefreshing(false);
  }, [loadPage, fromDate, tillDate]);

  const onLoadMore = useCallback(async () => {
    if (isLastPage || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    await loadPage(currentPage + 1, false, fromDate, tillDate);
    setLoadingMore(false);
    isLoadingMoreRef.current = false;
  }, [isLastPage, currentPage, loadPage, fromDate, tillDate]);

  const handleDateRangeSelect = useCallback(async (range: { startDate: Date; endDate: Date }) => {
    const from = notifDateTimeFrom(range.startDate);
    const till = notifDateTimeTill(range.endDate);
    setFromDate(from);
    setTillDate(till);
    setLoading(true);
    await loadPage(1, true, from, till);
    setLoading(false);
  }, [loadPage]);

  const clearFilter = useCallback(async () => {
    setFromDate(undefined);
    setTillDate(undefined);
    setLoading(true);
    await loadPage(1, true, undefined, undefined);
    setLoading(false);
  }, [loadPage]);

  const markRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await NOTIFICATION_SERVICES.markAsRead(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(unread.map((n) => NOTIFICATION_SERVICES.markAsRead(n.id)));
    } catch {
      // silent — UI already optimistically updated
    }
  }, [notifications]);

  const todayItems = notifications.filter((n) => isToday(n.createdAt));
  const earlierItems = notifications.filter((n) => !isToday(n.createdAt));

  const renderItem = useCallback(
    ({ item }: { item: PushNotification }) => {
      const BellIcon = SvgIcons.bellIcon as any;
      return (
        <TouchableOpacity
          activeOpacity={item.read ? 0.7 : 0.85}
          style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
          onPress={() => !item.read && markRead(item.id)}
        >
          <View style={[styles.iconWrapper, item.read && styles.iconWrapperRead]}>
            <BellIcon width={20} height={20} fill={item.read ? color.grey_87807C : color.btnBrown_AE6F28} />
          </View>
          <View style={styles.textWrapper}>
            <View style={styles.titleRow}>
              {!item.read && <View style={styles.unreadDot} />}
              <Text
                style={[styles.notificationTitle, item.read && styles.notificationTitleRead]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
            <Text style={styles.notificationBody} numberOfLines={3}>
              {item.body}
            </Text>
            <Text style={styles.notificationTime}>{timeAgo(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [markRead],
  );

  const renderSectionedList = () => {
    const sections: Array<{ type: 'header'; label: string } | { type: 'item'; item: PushNotification }> = [];

    if (todayItems.length > 0) {
      sections.push({ type: 'header', label: 'Today' });
      todayItems.forEach((item) => sections.push({ type: 'item', item }));
    }
    if (earlierItems.length > 0) {
      sections.push({ type: 'header', label: 'Earlier' });
      earlierItems.forEach((item) => sections.push({ type: 'item', item }));
    }

    return sections;
  };

  const Header = () => (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <SvgIcons.backArrow width={20} height={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {unreadCount > 0 && (
          <>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
            <TouchableOpacity style={styles.markAllButton} onPress={markAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[filterChipStyle.calendarBtn, isFiltered && filterChipStyle.calendarBtnActive]}
        >
          <SvgIcons.calendarIcon
            width={20}
            height={20}
            fill={isFiltered ? '#FFFFFF' : color.btnBrown_AE6F28}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
        </View>
      </View>
    );
  }

  const BellIcon = SvgIcons.bellIcon as any;
  const sectioned = renderSectionedList();

  return (
    <View style={styles.container}>
      <Header />

      {isFiltered && (
        <View style={filterChipStyle.chipRow}>
          <View style={filterChipStyle.chip}>
            <SvgIcons.calendarIcon width={13} height={13} fill={color.btnBrown_AE6F28} />
            <Text style={filterChipStyle.chipText}>
              {fromDate ? formatDisplay(fromDate) : '—'} → {tillDate ? formatDisplay(tillDate) : '—'}
            </Text>
          </View>
          <TouchableOpacity onPress={clearFilter} style={filterChipStyle.clearBtn}>
            <SvgIcons.crossIconRed width={14} height={14} />
            <Text style={filterChipStyle.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <DateRangePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateRangeSelect={handleDateRangeSelect}
      />

      {fetchError ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrapper, { backgroundColor: '#FDECEA' }]}>
            <SvgIcons.errorRedCircleIcon width={32} height={32} />
          </View>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't load your notifications. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => { setFetchError(false); onRefresh(); }}
            style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: color.btnBrown_AE6F28, borderRadius: 20 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <BellIcon width={32} height={32} fill={color.btnBrown_AE6F28} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! Check back later for updates.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sectioned}
          keyExtractor={(row, i) =>
            row.type === 'header' ? `header-${row.label}` : `notif-${row.item.id}-${i}`
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={color.btnBrown_AE6F28}
              colors={[color.btnBrown_AE6F28]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{row.label}</Text>
                </View>
              );
            }
            return renderItem({ item: row.item });
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color={color.btnBrown_AE6F28} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const filterChipStyle = StyleSheet.create({
  calendarBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: color.btnBrown_AE6F28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnActive: {
    backgroundColor: color.btnBrown_AE6F28,
    borderColor: color.btnBrown_AE6F28,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: color.lightBrown_FFF6DF,
    borderBottomWidth: 1,
    borderBottomColor: color.brown_F7E4B6,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: color.borderBrown_CEBCA0,
  },
  chipText: {
    fontSize: 13,
    color: color.brown_3C200A,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearText: {
    fontSize: 13,
    color: color.red_EF3E32,
    fontWeight: '600',
  },
});
