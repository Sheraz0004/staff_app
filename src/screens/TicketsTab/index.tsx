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
import { useDispatch, useSelector } from "react-redux";
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
import Loader from "@/src/components/Loader/Loader";
import { AppDispatch } from "../../redux/store";
import {
  fetchTicketsThunk,
  fetchTicketStatsThunk,
  setTicketsSelectedTab,
  setTicketsSearchText,
  selectTickets,
  selectTicketStats,
  selectTicketsLoading,
  selectTicketsLoadingMore,
  selectTicketsRefreshing,
  selectTicketsPage,
  selectTicketsHasMore,
  selectTicketsSelectedTab,
  TicketItem,
} from "../../redux/reducers/ticketsTabSlice";

interface TicketsTabProps {
  eventInfo: any;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ eventInfo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList<any>>(null);
  const { isOnline, triggerSync, queueSize } = useOfflineSync();

  const tickets = useSelector(selectTickets);
  const stats = useSelector(selectTicketStats);
  const loading = useSelector(selectTicketsLoading);
  const loadingMore = useSelector(selectTicketsLoadingMore);
  const refreshing = useSelector(selectTicketsRefreshing);
  const page = useSelector(selectTicketsPage);
  const hasMore = useSelector(selectTicketsHasMore);
  const selectedTab = useSelector(selectTicketsSelectedTab);

  const [searchInput, setSearchInput] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventUuidRef = useRef<string | undefined>(eventInfo?.eventUuid);
  eventUuidRef.current = eventInfo?.eventUuid;

  const load = useCallback(
    (opts: { page: number; reset: boolean; isRefresh?: boolean }) => {
      const uuid = eventUuidRef.current;
      if (!uuid) return;
      dispatch(fetchTicketStatsThunk(uuid));
      dispatch(fetchTicketsThunk({ eventUuid: uuid, ...opts }));
    },
    [dispatch],
  );

  useEffect(() => {
    if (isFocused && eventInfo?.eventUuid) {
      load({ page: 1, reset: true });
      if (isOnline && queueSize > 0) triggerSync();
    }
  }, [isFocused, eventInfo?.eventUuid]);

  useEffect(() => {
    const unsubscribe = syncService.addListener(async (syncResult: any) => {
      if (!syncResult.success || syncResult.synced === 0) return;
      if (!isFocused || !eventUuidRef.current) return;
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const ticketKeys = allKeys.filter((k) =>
          k.includes(`offline_tickets_${eventUuidRef.current}`),
        );
        if (ticketKeys.length > 0) await AsyncStorage.multiRemove(ticketKeys);
      } catch (err) {
        logger.error("Error clearing tickets cache:", err);
      }
      setTimeout(() => load({ page: 1, reset: true }), 1000);
    });
    return () => unsubscribe();
  }, [isFocused]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedTab]);

  const handleTabChange = (tab: string) => {
    dispatch(setTicketsSelectedTab(tab));
    if (eventInfo?.eventUuid) {
      dispatch(
        fetchTicketsThunk({
          eventUuid: eventInfo.eventUuid,
          page: 1,
          reset: true,
        }),
      );
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!text.trim()) {
      dispatch(setTicketsSearchText(""));
      if (eventInfo?.eventUuid) {
        dispatch(
          fetchTicketsThunk({
            eventUuid: eventInfo.eventUuid,
            page: 1,
            reset: true,
          }),
        );
      }
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      dispatch(setTicketsSearchText(text));
      if (eventInfo?.eventUuid) {
        dispatch(
          fetchTicketsThunk({
            eventUuid: eventInfo.eventUuid,
            page: 1,
            reset: true,
          }),
        );
      }
    }, 400);
  };

  const handleSearchSubmit = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    dispatch(setTicketsSearchText(searchInput));
    if (eventInfo?.eventUuid) {
      dispatch(
        fetchTicketsThunk({
          eventUuid: eventInfo.eventUuid,
          page: 1,
          reset: true,
        }),
      );
    }
  };

  const handleRefresh = useCallback(() => {
    if (!eventInfo?.eventUuid) return;
    dispatch(fetchTicketStatsThunk(eventInfo.eventUuid));
    dispatch(
      fetchTicketsThunk({
        eventUuid: eventInfo.eventUuid,
        page: 1,
        reset: true,
        isRefresh: true,
      }),
    );
  }, [dispatch, eventInfo?.eventUuid]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || !eventInfo?.eventUuid) return;
    dispatch(
      fetchTicketsThunk({
        eventUuid: eventInfo.eventUuid,
        page: page + 1,
        reset: false,
      }),
    );
  }, [dispatch, hasMore, loadingMore, loading, page, eventInfo?.eventUuid]);

  const handleTicketPress = useCallback(
    (ticket: TicketItem) => {
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
    },
    [navigation, eventInfo],
  );

  const renderItem = useCallback(
    ({ item }: { item: TicketItem }) => (
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
    ),
    [handleTicketPress],
  );

  const keyExtractor = useCallback((item: TicketItem) => item.uuid, []);

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
                searchInput
                  ? styles.searchInputWithText
                  : styles.searchInputPlaceholder,
              ]}
              placeholder="John Doe"
              placeholderTextColor={color.brown_766F6A}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              value={searchInput}
              selectionColor={color.selectField_CEBCA0}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity onPress={handleSearchSubmit}>
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
        <Loader isLoading={loading} />
        <View style={styles.flatListContainer}>
          <FlatList
            ref={flatListRef}
            data={tickets}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            removeClippedSubviews
            windowSize={5}
            maxToRenderPerBatch={10}
            ListEmptyComponent={() =>
              !loading ? <NoResults message="No Matching Results" /> : null
            }
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={color.btnBrown_AE6F28}
                  />
                </View>
              ) : null
            }
          />
          {/* {loading && tickets.length === 0 && <Loader isLoading={loading} />} */}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default TicketsTab;
