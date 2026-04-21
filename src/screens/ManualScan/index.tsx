import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
} from "react-native";
import Header from "../../components/header";
import { color } from "../../color/color";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import SvgIcons from "../../components/SvgIcons";
import NoResults from "../../components/NoResults";
import Loader from "../../components/Loader/Loader";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { AppDispatch } from "../../redux/store";
import {
  lookupOrdersThunk,
  fetchEventInfoThunk,
  preloadFromLookup,
  clearLookupResults,
  OrderResult,
} from "../../redux/reducers/manualCheckinSlice";
import { styles } from "./index.styles";

interface ManualScanProps {
  eventInfo?: any;
  onScanCountUpdate?: () => void;
  activeHeaderTab?: string;
  onHeaderTabChange?: (tab: string) => void;
  userRole?: string;
}

const ManualScan = ({
  eventInfo: propEventInfo,
  onScanCountUpdate,
  activeHeaderTab,
  onHeaderTabChange,
  userRole: propUserRole,
}: ManualScanProps) => {
  const navigation = useNavigation<any>();
  const routeHook = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();

  const eventInfo = propEventInfo || routeHook?.params?.eventInfo;
  const userRole = propUserRole || routeHook?.params?.userRole;
  const finalActiveTab = activeHeaderTab || routeHook?.params?.activeHeaderTab;
  const isFromRootStack = !propEventInfo && !!routeHook?.params?.eventInfo;
  const [searchText, setSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedEventId, setSearchedEventId] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lookupResults, lookupLoading, eventInfoCache, checkinSuccessCount } =
    useSelector((state: RootState) => state.manualCheckin);
  const prevCheckinCount = useRef(checkinSuccessCount);

  useFocusEffect(
    useCallback(() => {
      dispatch(clearLookupResults());
      setSearchText("");
      setHasSearched(false);
      setSearchedEventId(null);
    }, []),
  );

  useEffect(() => {
    if (checkinSuccessCount > prevCheckinCount.current && onScanCountUpdate) {
      onScanCountUpdate();
    }
    prevCheckinCount.current = checkinSuccessCount;
  }, [checkinSuccessCount]);

  const eventUuid = eventInfo?.eventUuid || eventInfo?.uuid;

  useEffect(() => {
    if (eventUuid) {
      dispatch(fetchEventInfoThunk(String(eventUuid)));
    }
  }, [eventUuid]);

  const activeEventId = searchedEventId ?? (eventUuid ? String(eventUuid) : null);
  const cachedEventInfo = activeEventId ? eventInfoCache[activeEventId] : null;

  const headerEventInfo = cachedEventInfo
    ? {
        ...(eventInfo || {}),
        event_title: cachedEventInfo.event_title,
        date: cachedEventInfo.date,
        time: cachedEventInfo.time,
        cityName: cachedEventInfo.cityName,
        eventUuid: cachedEventInfo.eventUuid,
      }
    : eventInfo;

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const results = await dispatch(lookupOrdersThunk(trimmed)).unwrap();
      setHasSearched(true);
      const eventId = results[0]?.eventId;
      if (eventId) {
        const idStr = String(eventId);
        setSearchedEventId(idStr);
        dispatch(fetchEventInfoThunk(idStr));
      }
    } catch {
      setHasSearched(true);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!text.trim()) {
      dispatch(clearLookupResults());
      setHasSearched(false);
      setSearchedEventId(null);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      handleSearch(text);
    }, 1200);
  };

  const getBuyerName = (order: OrderResult): string => {
    const first = order.buyerFirstName ?? "";
    const last = order.buyerLastName ?? "";
    return [first, last].filter(Boolean).join(" ") || "N/A";
  };

  const renderItem = ({ item }: ListRenderItemInfo<OrderResult>) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => {
        dispatch(
          preloadFromLookup({
            tickets: item.tickets,
            orderNumber: item.orderNumber,
            eventUuid: String(item.eventId),
          }),
        );
        navigation.navigate("ManualCheckInAllTickets", {
          orderNumber: item.orderNumber,
          eventUuid: item.eventId,
        });
      }}
    >
      <View style={styles.ticketRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.name}>{getBuyerName(item)}</Text>
          <Text style={styles.id}>{item.orderNumber}</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.type}>Tickets</Text>
          <Text style={styles.total}>{item.tickets.length}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const emptyMessage = lookupLoading
    ? "Searching..."
    : hasSearched
      ? "No Matching Results"
      : "Search by order number, email, or phone";

  return (
    <View style={styles.mainContainer}>
      <Loader isLoading={lookupLoading} />
      <Header
        eventInfo={headerEventInfo}
        activeTab={finalActiveTab}
        onTabChange={onHeaderTabChange}
        userRole={userRole}
        showBackButton={isFromRootStack}
      />
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <TextInput
            style={[
              styles.searchBar,
              searchText
                ? styles.searchInputWithText
                : styles.searchInputPlaceholder,
            ]}
            placeholder="Order number, email, or phone"
            placeholderTextColor={color.brown_766F6A}
            value={searchText}
            onChangeText={handleTextChange}
            selectionColor={color.selectField_CEBCA0}
            returnKeyType="search"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={() => handleSearch(searchText)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => handleSearch(searchText)}>
            <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={lookupResults}
          renderItem={renderItem}
          keyExtractor={(item) => item.orderId.toString()}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() => <NoResults message={emptyMessage} />}
        />
      </View>
    </View>
  );
};

export default ManualScan;
