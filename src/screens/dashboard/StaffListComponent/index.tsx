import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { color } from "../../../color/color";
import { useNavigation } from "@react-navigation/native";
import SvgIcons from "../../../components/SvgIcons";
import NoResults from "../../../components/NoResults";
import { logger } from "../../../utils/logger";
import { formatValue } from "../../../constants/formatValue";
import { DASHBOARD_SERVICES } from "../../../services/DashboardService";
import { styles } from "./index.styles";

interface StaffMember {
  id: number;
  staffId: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  status: string;
  salesByCurrency: Record<string, number>;
  totalCheckIns: number;
}

interface StaffListComponentProps {
  eventInfo: any;
  onEventChange: any;
  hideCheckIns?: boolean;
}

const StaffListComponent: React.FC<StaffListComponentProps> = ({
  eventInfo,
  onEventChange,
  hideCheckIns = false,
}) => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<any>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMoreRef = useRef(false);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchStaff = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (pageNum === 1) setLoading(true);
      else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      setError(null);

      try {
        const res = await DASHBOARD_SERVICES.fetchOrganizationStaffSalesStats({
          page: pageNum,
          page_size: 10,
          sort_dir: "desc",
        });
        const data = res?.data;
        const members: StaffMember[] = data?.staff || [];
        setStaffList((prev) => (append ? [...prev, ...members] : members));
        setTotalPages(data?.totalPages ?? 1);
        setPage(pageNum);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch staff.",
        );
        logger.error("[StaffListComponent] Error:", err);
      } finally {
        setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchStaff(1, false);
  }, [fetchStaff]);

  const handleLoadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (page >= totalPages) return;
    fetchStaff(page + 1, true);
  }, [fetchStaff, page, totalPages]);

  useEffect(() => {
    setIsSearching(false);
  }, [debouncedSearch]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      setIsSearching(true);
      setDebouncedSearch(text);
    }, 800);
  };

  const getDisplayName = (member: StaffMember): string => {
    const first = member.firstName?.trim();
    const last = member.lastName?.trim();
    if (first || last) return [first, last].filter(Boolean).join(" ");
    return member.email?.trim() || "N/A";
  };

  const hasName = (member: StaffMember): boolean => {
    return !!(member.firstName?.trim() || member.lastName?.trim());
  };

  const getSalesSummary = (salesByCurrency: Record<string, number>): string => {
    if (!salesByCurrency || Object.keys(salesByCurrency).length === 0)
      return "N/A";
    return Object.entries(salesByCurrency)
      .map(([currency, amount]) => `${currency} ${formatValue(amount)}`)
      .join(" | ");
  };

  const filteredStaff = debouncedSearch
    ? staffList.filter((member) => {
        const fullName = getDisplayName(member).toLowerCase();
        const q = debouncedSearch.toLowerCase();
        return (
          fullName.includes(q) ||
          member.email?.toLowerCase().includes(q) ||
          member.staffId?.toLowerCase().includes(q)
        );
      })
    : staffList;

  const renderItem = ({ item }: { item: StaffMember }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() =>
        (navigation as any).navigate("StaffDashboard", {
          eventInfo: eventInfo,
          staffUuid: item.staffId,
          staffName: getDisplayName(item),
          onEventChange: onEventChange,
          salesOnly: hideCheckIns,
        })
      }
    >
      <View style={styles.ticketRow}>
        <View style={styles.column}>
          <Text style={styles.columnHeader}>{hasName(item) ? "Name" : "Email"}</Text>
          <Text style={styles.columnData} numberOfLines={1} ellipsizeMode="tail">{getDisplayName(item)}</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnHeader}>Sales</Text>
          <Text style={styles.columnData}>
                   {/* {getSalesSummary(item.salesByCurrency)} */}
            {formatValue(item?.salesAmount)|| 0}
          </Text>
        </View>

        {!hideCheckIns && (
          <View style={styles.column}>
            <Text style={styles.columnHeader}>Check-Ins</Text>
            <Text style={styles.columnData}>{item.totalCheckIns ?? 0}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
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
          placeholder="John Doe"
          placeholderTextColor={color.brown_766F6A}
          onChangeText={handleSearchChange}
          value={searchText}
          selectionColor={color.selectField_CEBCA0}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <TouchableOpacity>
          <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        innerRef={(ref: any) => {
          scrollViewRef.current = ref;
        }}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        scrollEventThrottle={400}
        onScroll={({ nativeEvent }: { nativeEvent: any }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const nearBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 300;
          if (nearBottom) handleLoadMore();
        }}
      >
        {loading || isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
          </View>
        ) 
        : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredStaff}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString() ?? item.staffId}
            contentContainerStyle={styles.flatListContent}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              <NoResults message="No Matching Results" />
            )}
            ListFooterComponent={
              loadingMore
                ? () => (
                    <ActivityIndicator
                      size="small"
                      color={color.btnBrown_AE6F28}
                      style={{ marginVertical: 12 }}
                    />
                  )
                : null
            }
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  );
};

export default StaffListComponent;
