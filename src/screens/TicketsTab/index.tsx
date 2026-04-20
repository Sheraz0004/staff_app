import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { color } from "../../color/color";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import SvgIcons from "../../components/SvgIcons";
import QRCode from "react-native-qrcode-svg";
import NoResults from "../../components/NoResults";
import { logger } from "../../utils/logger";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { syncService } from "../../utils/syncService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OfflineIndicator from "../../components/OfflineIndicator";
import { styles } from "./index.styles";
import { useApi } from "../../services/useApi";
import { TICKET_SERVICES } from "../../services/TicketService";
import { API_BASE_URL } from "../../config/env";
import Loader from "@/src/components/Loader/Loader";

const PAGE_SIZE = 10;

interface TicketsTabProps {
  eventInfo: any;
  initialTab?: string;
}

interface Stats {
  total: number;
  scanned: number;
  unscanned: number;
}

interface TicketItem {
  id: string;
  type: string;
  price: string;
  date: string;
  status: string;
  note: string;
  imageUrl: null;
  uuid: string;
  ticketHolder: string;
  lastScannedByName: string;
  scanCount: string | number;
  lastScannedOn: string;
  qrCodeUrl: string;
  currency: string;
  email: string;
  name: string;
  category: string;
  ticketClass: string;
  scannedBy: string;
  staffId: string;
  scannedOn: string;
}

const mapTicket = (ticket: any): TicketItem => ({
  id: ticket.ticketNumber || "No Record",
  type: ticket.ticketType || "No Record",
  price: ticket.ticketPrice?.toString() || "No Record",
  date: ticket.formattedDate || "No Record",
  status: ticket.checkinStatus === "SCANNED" ? "Scanned" : "Unscanned",
  note: ticket.note || "No note added",
  imageUrl: null,
  uuid: ticket.id?.toString() || ticket.ticketNumber || "No Record",
  ticketHolder: ticket.ticketHolder || "No Record",
  lastScannedByName: ticket.scannedBy?.name || "No Record",
  scanCount: ticket.scanCount ?? "No Record",
  lastScannedOn: ticket.scannedBy?.scannedOn || "No Record",
  qrCodeUrl: `${API_BASE_URL}ticket/scan/${ticket.eventId}/${ticket.code}/`,
  currency: ticket.currency || "No Record",
  email: ticket.userEmail || "No Record",
  name:
    `${ticket.userFirstName || ""} ${ticket.userLastName || ""}`.trim() ||
    "No Record",
  category: ticket.category || "No Record",
  ticketClass: ticket.ticketClass || "No Record",
  scannedBy: ticket.scannedBy?.name || "No Record",
  staffId: ticket.scannedBy?.staffId || "No Record",
  scannedOn: ticket.scannedBy?.scannedOn || "No Record",
});

const TicketsTab: React.FC<TicketsTabProps> = ({ eventInfo, initialTab }) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList<any>>(null);
  const { isOnline, triggerSync, queueSize } = useOfflineSync();

  const [searchText, setSearchText] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>(initialTab || "All");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    scanned: 0,
    unscanned: 0,
  });
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isListLoading, setIsListLoading] = useState<boolean>(true);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedTabRef = useRef(selectedTab);
  const searchTextRef = useRef(searchText);
  selectedTabRef.current = selectedTab;
  searchTextRef.current = searchText;

  const { requestCall: requestStats } = useApi(
    TICKET_SERVICES.fetchStats,
    false,
    false,
  );
  const { requestCall: requestList } = useApi(
    TICKET_SERVICES.fetchList,
    false,
    false,
  );

  const loadStats = useCallback(
    async (eventUuid: string) => {
      try {
        const statsRes = await requestStats(eventUuid);
        const statsData = statsRes?.data?.data || {};
        setStats({
          total: statsData.total || 0,
          scanned: statsData.scanned || 0,
          unscanned: statsData.unscanned || 0,
        });
      } catch (err) {
        logger.error("Error loading stats:", err);
      }
    },
    [requestStats],
  );

  const loadTickets = useCallback(
    async (
      eventUuid: string,
      pageNum: number,
      tab: string,
      search: string,
      append: boolean,
    ) => {
      if (!append) setIsListLoading(true);
      const checkinStatus =
        tab === "Scanned"
          ? "SCANNED"
          : tab === "Unscanned"
            ? "UNSCANNED"
            : undefined;
      try {
        const res = await requestList(
          eventUuid,
          pageNum,
          PAGE_SIZE,
          "PAID",
          checkinStatus,
          search.trim() || undefined,
        );
        const listBody = res?.data || {};
        const rawList: any[] = listBody.data || [];
        const mapped = rawList.map(mapTicket);
        setTickets(append ? (prev) => [...prev, ...mapped] : mapped);
        setPage(listBody.currentPage || pageNum);
        setHasMore(
          (listBody.currentPage || pageNum) < (listBody.totalPages || pageNum),
        );
      } catch (err) {
        logger.error("Error loading tickets:", err);
      } finally {
        if (!append) setIsListLoading(false);
      }
    },
    [requestList],
  );

  const onRefresh = useCallback(async () => {
    if (!eventInfo?.eventUuid) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadStats(eventInfo.eventUuid),
        loadTickets(eventInfo.eventUuid, 1, selectedTab, searchText, false),
      ]);
    } catch (err) {
      logger.error("Error refreshing ticket data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventInfo?.eventUuid, selectedTab, searchText, loadStats, loadTickets]);

  const loadMoreTickets = useCallback(async () => {
    if (!hasMore || isLoadingMore || isListLoading || !eventInfo?.eventUuid)
      return;
    setIsLoadingMore(true);
    try {
      await loadTickets(
        eventInfo.eventUuid,
        page + 1,
        selectedTab,
        searchText,
        true,
      );
    } catch (err) {
      logger.error("Error loading more tickets:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasMore,
    isLoadingMore,
    isListLoading,
    page,
    eventInfo?.eventUuid,
    selectedTab,
    searchText,
    loadTickets,
  ]);

  useEffect(() => {
    if (isFocused && eventInfo?.eventUuid) {
      loadStats(eventInfo.eventUuid);
      loadTickets(
        eventInfo.eventUuid,
        1,
        selectedTabRef.current,
        searchTextRef.current,
        false,
      );
      if (isOnline && queueSize > 0) {
        triggerSync();
      }
    }
  }, [isFocused, eventInfo?.eventUuid, isOnline, queueSize]);

  useEffect(() => {
    const unsubscribe = syncService.addListener(async (syncResult: any) => {
      if (
        syncResult.success &&
        syncResult.synced > 0 &&
        isFocused &&
        eventInfo?.eventUuid
      ) {
        logger.log("Sync completed - refreshing tickets list");
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          const ticketKeys = allKeys.filter((key) =>
            key.includes(`offline_tickets_${eventInfo.eventUuid}`),
          );
          if (ticketKeys.length > 0) {
            await AsyncStorage.multiRemove(ticketKeys);
            logger.log("Cleared tickets cache after sync");
          }
        } catch (error) {
          logger.error("Error clearing tickets cache:", error);
        }
        setTimeout(() => {
          loadStats(eventInfo.eventUuid);
          loadTickets(
            eventInfo.eventUuid,
            1,
            selectedTabRef.current,
            searchTextRef.current,
            false,
          );
        }, 1000);
      }
    });
    return () => unsubscribe();
  }, [isFocused, eventInfo?.eventUuid]);

  useEffect(() => {
    if (initialTab) setSelectedTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedTab]);

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    setTickets([]);
    setPage(1);
    setHasMore(true);
    if (eventInfo?.eventUuid) {
      loadTickets(eventInfo.eventUuid, 1, tab, searchTextRef.current, false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setTickets([]);
      setPage(1);
      setHasMore(true);
      if (eventInfo?.eventUuid) {
        loadTickets(
          eventInfo.eventUuid,
          1,
          selectedTabRef.current,
          text,
          false,
        );
      }
    }, 400);
  };

  const handleSearchIconPress = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setTickets([]);
    setPage(1);
    setHasMore(true);
    if (eventInfo?.eventUuid) {
      loadTickets(
        eventInfo.eventUuid,
        1,
        selectedTabRef.current,
        searchTextRef.current,
        false,
      );
    }
  };

  const handleTicketPress = (ticket: TicketItem): void => {
    navigation.navigate("TicketScanned", {
      scanResponse: {
        message:
          ticket.status === "Scanned" ? "Ticket Scanned" : "Ticket Unscanned",
        ticketHolder: ticket.name || ticket.ticketHolder || "No Record",
        ticketHolderEmail: ticket.email || "No Record",
        formattedCreatedAt: ticket.date || "No Record",
        ticketNumber: ticket.id || "No Record",
        ticketPrice: ticket.price || "No Record",
        currency: ticket.currency || "No Record",
        scanCount: ticket.scanCount ?? 0,
        note: ticket.note || "No note added",
        qrCodeUrl: ticket.qrCodeUrl,
        ticketCategory: ticket.category || "No Record",
        ticketClass: ticket.ticketClass || "No Record",
        scannedBy: {
          name: ticket.scannedBy || "No Record",
          staffId: ticket.staffId || "No Record",
          scannedOn: ticket.scannedOn || "No Record",
        },
      },
      eventInfo,
    });
  };

  const renderItem = ({ item }: { item: TicketItem }): React.ReactElement => (
    <TouchableOpacity
      onPress={() => handleTicketPress(item)}
      style={styles.ticketContainer}
    >
      <View>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{item.name}</Text>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{item.category}</Text>
        <Text style={styles.label}>Class</Text>
        <Text style={styles.value}>{item.ticketClass}</Text>
      </View>
      <View style={styles.statusBtn}>
        <View
          style={[
            styles.statusButton,
            item.status === "Scanned" && styles.scannedButton,
            item.status === "Unscanned" && styles.unscannedButton,
          ]}
        >
          <Text
            style={[
              styles.statusButtonText,
              item.status === "Scanned" && styles.scannedButtonText,
              item.status === "Unscanned" && styles.unscannedButtonText,
            ]}
          >
            {item.status}
          </Text>
        </View>
        <Text style={styles.valueID}>Tix ID: {item.id}</Text>
      </View>
      <View style={styles.imageContainer}>
        {item.qrCodeUrl && (
          <QRCode
            value={item.qrCodeUrl}
            size={100}
            logoSize={30}
            logoBackgroundColor="transparent"
            quietZone={5}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <OfflineIndicator />

        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <View style={styles.searchBarContainer}>
            <TextInput
              style={[
                styles.searchBar,
                searchText
                  ? styles.searchInputWithText
                  : styles.searchInputPlaceholder,
              ]}
              placeholder="John Doe"
              placeholderTextColor={color.brown_766F6A}
              onChangeText={handleSearchChange}
              value={searchText}
              selectionColor={color.selectField_CEBCA0}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </View>
          <TouchableOpacity onPress={handleSearchIconPress}>
            <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {(["All", "Scanned", "Unscanned"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.activeTab,
              ]}
              onPress={() => handleTabChange(tab)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  selectedTab === tab
                    ? styles.activeBadge
                    : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selectedTab === tab
                      ? styles.activeCountText
                      : styles.inactiveCountText,
                  ]}
                >
                  {tab === "All"
                    ? stats.total
                    : tab === "Scanned"
                      ? stats.scanned
                      : stats.unscanned}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.flatListContainer}>
          <FlatList
            ref={flatListRef}
            data={tickets}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.uuid}
            contentContainerStyle={styles.flatListContent}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            onEndReached={loadMoreTickets}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={() =>
              !isListLoading ? (
                <NoResults message="No Matching Results" />
              ) : null
            }
            ListFooterComponent={() =>
              isLoadingMore ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={color.btnBrown_AE6F28}
                  />
                </View>
              ) : null
            }
          />
          {isListLoading && tickets.length === 0 && (
            <Loader isLoading={isListLoading} />
            // <View style={styles.centeredLoader}>
            //   <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
            // </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default TicketsTab;
