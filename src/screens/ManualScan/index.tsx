import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Header from "../../components/header";
import { color } from "../../color/color";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import SvgIcons from "../../components/SvgIcons";
import NoResults from "../../components/NoResults";
import Loader from "../../components/Loader/Loader";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/reducers/rootReducer";
import { AppDispatch } from "../../redux/store";
import {
  lookupOrdersThunk,
  fetchEventInfoThunk,
  fetchAllOrdersThunk,
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

  const {
    lookupResults,
    lookupLoading,
    eventInfoCache,
    checkinSuccessCount,
    allOrders,
    allOrdersLoading,
    allOrdersLoadingMore,
    allOrdersRefreshing,
    allOrdersPage,
    allOrdersHasMore,
  } = useSelector((state: RootState) => state.manualCheckin);

  const prevCheckinCount = useRef(checkinSuccessCount);
  const isLoadingMoreRef = useRef(false);
  const eventUuid = eventInfo?.eventUuid || eventInfo?.uuid;

  useFocusEffect(
    useCallback(() => {
      dispatch(clearLookupResults());
      setSearchText("");
      setHasSearched(false);
      setSearchedEventId(null);
      if (eventUuid) {
        dispatch(fetchAllOrdersThunk({ eventId: eventUuid, page: 1 }));
      }
    }, [eventUuid]),
  );

  useEffect(() => {
    if (checkinSuccessCount > prevCheckinCount.current && onScanCountUpdate) {
      onScanCountUpdate();
    }
    prevCheckinCount.current = checkinSuccessCount;
  }, [checkinSuccessCount]);

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

  const isSearchActive = hasSearched && searchText.trim().length > 0;
  const displayData = isSearchActive ? lookupResults : allOrders;

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
    if (!text.trim()) {
      dispatch(clearLookupResults());
      setHasSearched(false);
      setSearchedEventId(null);
      if (eventUuid) {
        dispatch(fetchAllOrdersThunk({ eventId: eventUuid, page: 1 }));
      }
    }
  };

  const handleClearSearch = () => {
    setSearchText("");
    dispatch(clearLookupResults());
    setHasSearched(false);
    setSearchedEventId(null);
    if (eventUuid) {
      dispatch(fetchAllOrdersThunk({ eventId: eventUuid, page: 1 }));
    }
  };

  const handleRefresh = () => {
    if (eventUuid) {
      dispatch(fetchAllOrdersThunk({ eventId: eventUuid, page: 1, isRefresh: true }));
    }
  };

  const handleLoadMore = () => {
    if (
      !allOrdersHasMore ||
      allOrdersLoadingMore ||
      allOrdersLoading ||
      allOrdersRefreshing ||
      isSearchActive ||
      isLoadingMoreRef.current
    ) return;
    if (eventUuid) {
      isLoadingMoreRef.current = true;
      dispatch(fetchAllOrdersThunk({ eventId: eventUuid, page: allOrdersPage + 1 })).finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
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

  const emptyMessage =
    lookupLoading || allOrdersLoading
      ? "Loading..."
      : isSearchActive
        ? "No Matching Results"
        : "No orders found";

  return (
    <View style={styles.mainContainer}>
      <Loader isLoading={lookupLoading || allOrdersLoading} />
      <Header
        eventInfo={headerEventInfo}
        activeTab={finalActiveTab}
        onTabChange={onHeaderTabChange}
        userRole={userRole}
        showBackButton={isFromRootStack}
      />
              <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <TouchableOpacity onPress={() => handleSearch(searchText)}>
            <SvgIcons.searchIcon width={18} height={18} fill="transparent" />
          </TouchableOpacity>
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
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      <KeyboardAwareScrollView
        style={styles.contentContainer}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        enableResetScrollToCoords={false}
        automaticallyAdjustContentInsets={false}
        refreshControl={
          !isSearchActive ? (
            <RefreshControl
              refreshing={allOrdersRefreshing}
              onRefresh={handleRefresh}
              tintColor={color.btnBrown_AE6F28}
            />
          ) : undefined
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
          data={displayData}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.orderId ? item.orderId.toString() : index.toString()
          }
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() => <NoResults message={emptyMessage} />}
          scrollEnabled={false}
          ListFooterComponent={
            !isSearchActive && allOrdersLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={color.btnBrown_AE6F28}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default ManualScan;
