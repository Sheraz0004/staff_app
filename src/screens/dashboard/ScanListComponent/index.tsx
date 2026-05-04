import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import { ticketService, BASE_URL } from "../../../api/apiService";
import QRCode from "react-native-qrcode-svg";
import { useNavigation } from "@react-navigation/native";
import NoResults from "../../../components/NoResults";
import { useApi } from "../../../services/useApi";
import { styles } from "./index.styles";

const PAGE_SIZE = 10;

interface FilterState {
  checkinStatus: "SCANNED" | "UNSCANNED" | null;
  ticketTypes: string[];
  status: "PAID" | "CANCELLED" | null;
}

const DEFAULT_FILTERS: FilterState = {
  checkinStatus: "SCANNED",
  ticketTypes: [],
  status: "PAID",
};

export interface ScanListHandle {
  loadMore: () => void;
}

interface ScanListComponentProps {
  eventInfo: any;
  onScanCountUpdate: any;
  staffUuid: any;
  isActive: boolean;
}

const ScanListComponent = forwardRef<ScanListHandle, ScanListComponentProps>(
  ({ eventInfo, onScanCountUpdate, staffUuid, isActive }, ref) => {
    const navigation = useNavigation();
    const { loading: isLoading, requestCall: callFetch } = useApi(
      ticketService.fetchUserTickets,
      false,
      false,
    );
    const { loading: isLoadingMore, requestCall: callFetchMore } = useApi(
      ticketService.fetchUserTickets,
      false,
      false,
    );

    const [searchInput, setSearchInput] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [pendingFilters, setPendingFilters] =
      useState<FilterState>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] =
      useState<FilterState>(DEFAULT_FILTERS);
    const [availableTicketTypes, setAvailableTicketTypes] = useState<string[]>(
      [],
    );

    const pageRef = useRef(1);
    const totalPagesRef = useRef(1);
    const isFetchingRef = useRef(false);
    const hasFetchedRef = useRef(false);

    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const appliedFiltersRef = useRef<FilterState>(DEFAULT_FILTERS);
    const searchTextRef = useRef("");
    const eventUuidRef = useRef<string | undefined>(undefined);
    eventUuidRef.current = eventInfo?.eventUuid;

    const mapTicket = (ticket: any) => ({
      id: ticket.ticketNumber || "No Record",
      type: ticket.ticketType || "No Record",
      price: ticket.ticketPrice || "No Record",
      date: ticket.formattedDate || ticket.eventDate || "No Record",
      status: ticket.checkinStatus,
      note: ticket.note || "No Note",
      uuid: String(ticket.id || "No Record"),
      ticketHolder: ticket.ticketHolder || "No Record",
      lastScannedByName:
        ticket.scannedBy?.name ||
        ticket.scannedBy?.email ||
        ticket.scannedBy?.staffId ||
        "No Record",
      scanCount: ticket.scanCount ?? 0,
      lastScannedOn: ticket.scannedBy?.scannedOn || "No Record",
      qrCodeUrl: `${BASE_URL}/api/ticket/scan/${ticket.eventId}/${ticket.code}/`,
      currency: ticket.currency || "No Record",
      userfirstname: ticket.userFirstName,
      name:
        `${ticket.userFirstName || ""} ${ticket.userLastName || ""}`.trim() ||
        ticket.ticketHolder ||
        "No Record",
      user_email: ticket.userEmail || "No Record",
      category: ticket.category || "No Record",
      ticketClass: ticket.ticketClass || "No Record",
      scannedBy:
        ticket.scannedBy?.name || ticket.scannedBy?.email || "No Record",
      staffId: ticket.scannedBy?.staffId || "No Record",
      scannedOn: ticket.scannedBy?.scannedOn || "No Record",
      orderNumber: ticket.orderNumber || "No Record",
      eventName: ticket.eventName || "No Record",
      eventDate: ticket.eventDate || "No Record",
      eventTime: ticket.eventTime || "No Record",
      location: ticket.location || "No Record",
      vat: ticket.vat ?? 0,
    });

    const buildParams = (
      eventUuid: string,
      currentPage: number,
      search: string,
      filters: FilterState,
    ) => ({
      eventId: eventUuid,
      page: currentPage,
      pageSize: PAGE_SIZE,
      status: filters.status || undefined,
      checkinStatus: filters.checkinStatus || undefined,
      search: search.trim() || undefined,
      ticketTypes:
        filters.ticketTypes.length > 0
          ? filters.ticketTypes.join(",")
          : undefined,
      scannedBy: staffUuid || undefined,
    });

    const fetchTickets = useCallback(
      async (
        eventUuid: string,
        currentPage: number,
        search: string,
        filters: FilterState,
        append: boolean,
      ) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
          const caller = append ? callFetchMore : callFetch;
          const res = await caller(buildParams(eventUuid, currentPage, search, filters));
          const body = res || {};
          const list: any[] = body.data || [];
          const resolvedPage: number = body.currentPage || currentPage;
          const totalPages: number = body.totalPages || 1;
          const totalElements: number = body.totalElements ?? list.length;
          const mapped = list.map(mapTicket);

          pageRef.current = resolvedPage;
          totalPagesRef.current = totalPages;

          if (append) {
            setTickets((prev) => [...prev, ...mapped]);
          } else {
            setTickets(mapped);

            const types = [
              ...new Set(
                mapped
                  .map((t: any) => (t.type as string).replace(/\s*Pricing$/, ""))
                  .filter((t: any) => t !== "No Record"),
              ),
            ] as string[];
            setAvailableTicketTypes(types);

            if (onScanCountUpdate) onScanCountUpdate(totalElements);
          }
        } catch (err) {
          console.log("[ScanListComponent] fetchTickets error:", err);
        } finally {
          isFetchingRef.current = false;
        }
      },
      [callFetch, callFetchMore, staffUuid, onScanCountUpdate],
    );

    // Reset pagination refs when event changes
    useEffect(() => {
      hasFetchedRef.current = false;
      pageRef.current = 1;
      totalPagesRef.current = 1;
    }, [eventInfo?.eventUuid]);

    // Fetch only the first time the Scans tab becomes active
    useEffect(() => {
      if (!isActive || !eventInfo?.eventUuid || hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      fetchTickets(eventInfo.eventUuid, 1, "", DEFAULT_FILTERS, false);
    }, [isActive, eventInfo?.eventUuid]);

    const triggerSearch = useCallback(
      (text: string, filters: FilterState) => {
        if (!eventUuidRef.current) return;
        pageRef.current = 1;
        totalPagesRef.current = 1;
        fetchTickets(eventUuidRef.current, 1, text, filters, false);
      },
      [fetchTickets],
    );

    const handleSearchChange = (text: string) => {
      setSearchInput(text);
      searchTextRef.current = text;

      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

      if (!text.trim()) {
        triggerSearch("", appliedFiltersRef.current);
        return;
      }

      searchDebounceRef.current = setTimeout(() => {
        triggerSearch(searchTextRef.current, appliedFiltersRef.current);
      }, 800);
    };

    const handleSearchSubmit = () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      triggerSearch(searchTextRef.current, appliedFiltersRef.current);
    };

    const handleLoadMore = useCallback(() => {

      if (isFetchingRef.current) return;
      if (pageRef.current >= totalPagesRef.current) return;
      if (!eventUuidRef.current) return;

      fetchTickets(
        eventUuidRef.current,
        pageRef.current + 1,
        searchTextRef.current,
        appliedFiltersRef.current,
        true,
      );
    }, [fetchTickets]);

    const handleApplyFilters = () => {
      appliedFiltersRef.current = pendingFilters;
      setAppliedFilters(pendingFilters);
      setModalVisible(false);
      if (!eventUuidRef.current) return;
      pageRef.current = 1;
      totalPagesRef.current = 1;
      fetchTickets(
        eventUuidRef.current,
        1,
        searchTextRef.current,
        pendingFilters,
        false,
      );
    };

    const handleClearFilters = () => {
      setPendingFilters(DEFAULT_FILTERS);
    };

    const handleTicketPress = (ticket: any) => {
      (navigation as any).navigate("TicketScanned", {
        scanResponse: {
          ticketNumber: ticket.id,
          ticketHolder: ticket.ticketHolder,
          ticketHolderEmail: ticket.user_email,
          ticket: ticket.type,
          ticketClass: ticket.ticketClass,
          ticketPrice: ticket.price,
          currency: ticket.currency,
          scanCount: ticket.scanCount,
          note: ticket.note,
          status: ticket.status,
          message:
            ticket.status === "SCANNED" ? "Ticket Scanned" : "Ticket Unscanned",
          scannedBy: {
            name: ticket.lastScannedByName,
            staffId: ticket.staffId,
            scannedOn: ticket.scannedOn,
          },
        },
        eventInfo,
      });
    };

    const toggleTicketType = (type: string) => {
      setPendingFilters((prev) => ({
        ...prev,
        ticketTypes: prev.ticketTypes.includes(type)
          ? prev.ticketTypes.filter((t) => t !== type)
          : [...prev.ticketTypes, type],
      }));
    };

    const hasActiveFilters =
      appliedFilters.checkinStatus !== DEFAULT_FILTERS.checkinStatus ||
      appliedFilters.ticketTypes.length > 0 ||
      appliedFilters.status !== DEFAULT_FILTERS.status;

    useImperativeHandle(ref, () => ({
      loadMore: handleLoadMore,
    }), [handleLoadMore]);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scans</Text>

        <View style={styles.searchFilterContainer}>
          <View
            style={[
              styles.searchBar,
              isSearchFocused && styles.searchBarFocused,
            ]}
          >
            <TextInput
              style={[
                styles.searchInput,
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
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearchSubmit}>
              <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              hasActiveFilters && { borderColor: color.btnBrown_AE6F28 },
            ]}
            onPress={() => {
              setPendingFilters(appliedFilters);
              setModalVisible(true);
            }}
          >
            <SvgIcons.filterIcon width={20} height={20} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={color.btnBrown_AE6F28} />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item, index) => `${item.uuid}-${index}`}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleTicketPress(item)}
              >
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{item.name}</Text>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{item.category}</Text>
                    <Text style={styles.label}>Class</Text>
                    <Text style={styles.value}>{item.ticketClass}</Text>
                  </View>
                  <View style={styles.qrCode}>
                    {item.qrCodeUrl ? (
                      <QRCode
                        value={item.qrCodeUrl}
                        size={100}
                        logoSize={30}
                        logoBackgroundColor="transparent"
                        quietZone={5}
                      />
                    ) : null}
                  </View>
                </View>
                <View style={[styles.badge, styles.checkInBadge]}>
                  <Text style={[styles.badgeText, styles.checkInText]}>
                    {item.status === "SCANNED" ? "Scanned" : item.status}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text style={styles.valueID}>Tix ID: {item.id}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<NoResults message="No Matching Results" />}
            ListFooterComponent={
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
        )}

        <Modal visible={isModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterOptionsContainer}>
                <View style={styles.lineView} />
                <Text style={styles.tickettype}>Check-in Status</Text>
                {(["SCANNED", "UNSCANNED"] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.filterOption}
                    onPress={() =>
                      setPendingFilters((prev) => ({
                        ...prev,
                        checkinStatus:
                          prev.checkinStatus === status ? null : status,
                      }))
                    }
                  >
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          pendingFilters.checkinStatus === status &&
                            styles.checkedCheckbox,
                        ]}
                      >
                        {pendingFilters.checkinStatus === status && (
                          <SvgIcons.tickIcon width={15} height={15} />
                        )}
                      </View>
                      <Text style={styles.filterOptionText}>
                        {status === "SCANNED" ? "Scanned" : "Unscanned"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {availableTicketTypes.length > 0 && (
                  <>
                    <View style={styles.lineView} />
                    <Text style={styles.tickettype}>Ticket Type</Text>
                    {availableTicketTypes.map((ticketType, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.filterOption}
                        onPress={() => toggleTicketType(ticketType)}
                      >
                        <View style={styles.checkboxContainer}>
                          <View
                            style={[
                              styles.checkbox,
                              pendingFilters.ticketTypes.includes(ticketType) &&
                                styles.checkedCheckbox,
                            ]}
                          >
                            {pendingFilters.ticketTypes.includes(
                              ticketType,
                            ) && <SvgIcons.tickIcon width={15} height={15} />}
                          </View>
                          <Text style={styles.filterOptionText}>
                            {ticketType}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  },
);

export default ScanListComponent;
