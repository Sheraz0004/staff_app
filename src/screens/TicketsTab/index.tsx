import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { color } from "../../color/color";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import SvgIcons from "../../components/SvgIcons";
import { ticketService, BASE_URL } from "../../api/apiService";
import QRCode from "react-native-qrcode-svg";
import NoResults from "../../components/NoResults";
import { logger } from "../../utils/logger";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { syncService } from "../../utils/syncService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OfflineIndicator from "../../components/OfflineIndicator";
import { styles } from "./index.styles";

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

const TicketsTab: React.FC<TicketsTabProps> = ({ eventInfo, initialTab }) => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>(initialTab || "All");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    scanned: 0,
    unscanned: 0,
  });
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const isFocused = useIsFocused();
  const [fetchedTickets, setFetchedTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const { isOnline, triggerSync, queueSize } = useOfflineSync();

  useEffect(() => {
    if (isFocused && eventInfo?.eventUuid) {
      fetchTicketStats(eventInfo.eventUuid);
      fetchTicketList(eventInfo.eventUuid);

      // Auto-sync when online and there are queued actions
      if (isOnline && queueSize > 0) {
        triggerSync();
      }
    }
  }, [isFocused, eventInfo?.eventUuid, isOnline, queueSize]);

  // Listen for sync completion to refresh ticket list
  useEffect(() => {
    const unsubscribe = syncService.addListener(async (syncResult: any) => {
      if (
        syncResult.success &&
        syncResult.synced > 0 &&
        isFocused &&
        eventInfo?.eventUuid
      ) {
        logger.log("Sync completed - refreshing tickets list");
        // Clear tickets cache to force fresh fetch after sync
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
        // Refresh tickets after successful sync
        setTimeout(() => {
          fetchTicketStats(eventInfo.eventUuid);
          fetchTicketList(eventInfo.eventUuid);
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isFocused, eventInfo?.eventUuid]);

  // Handle initialTab changes
  useEffect(() => {
    if (initialTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  // Scroll to top on tab change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedTab]);

  const fetchTicketList = async (eventUuid: string): Promise<void> => {
    try {
      setIsLoading(true);
      const res = await ticketService.ticketStatsListing(eventUuid, "PAID");
      const list = res?.data || [];

      if (res?.offline) {
        logger.log("Using offline cached tickets");
      }

      const mappedTickets: TicketItem[] = list.map((ticket: any) => {
        const qrCodeUrl = `${BASE_URL}ticket/scan/${ticket.event}/${ticket.code}/`;
        return {
          id: ticket.ticket_number || "No Record",
          type: ticket.ticket_type || "No Record",
          price: ticket.ticket_price || "No Record",
          date: ticket.formatted_date || "No Record",
          status: ticket.checkin_status === "SCANNED" ? "Scanned" : "Unscanned",
          note: ticket.note || "No note added",
          imageUrl: null,
          uuid: ticket.uuid || "No Record",
          ticketHolder: ticket.ticket_holder || "No Record",
          lastScannedByName: ticket.last_scanned_by_name || "No Record",
          scanCount: ticket.scan_count || "No Record",
          lastScannedOn: ticket.last_scanned_on || "No Record",
          qrCodeUrl: qrCodeUrl,
          currency: ticket.currency || "No Record",
          email: ticket.user_email || "No Record",
          name:
            `${ticket.user_first_name || ""} ${ticket.user_last_name || ""}`.trim() ||
            "No Record",
          category: ticket.category || "No Record",
          ticketClass: ticket.ticket_class || "No Record",
          scannedBy: ticket.scanned_by?.name || "No Record",
          staffId: ticket.scanned_by?.staff_id || "No Record",
          scannedOn: ticket.scanned_by?.scanned_on || "No Record",
        };
      });

      setFetchedTickets(mappedTickets);
    } catch (err: any) {
      logger.error("Error fetching ticket list:", {
        message: err?.message,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
        headers: err?.config?.headers,
        params: err?.config?.params,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketStats = async (eventUuid: string): Promise<void> => {
    try {
      const res = await ticketService.ticketStatsInfo(eventUuid);
      const statsData = res?.data?.data || {};

      if (res?.offline) {
        logger.log("Using offline cached stats");
      }

      setStats({
        total: statsData.total || 0,
        scanned: statsData.scanned || 0,
        unscanned: statsData.unscanned || 0,
      });
    } catch (err: any) {
      logger.error("Error fetching ticket stats:", {
        message: err?.message,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
        headers: err?.config?.headers,
        params: err?.config?.params,
      });
    }
  };

  const filterTickets = (): TicketItem[] => {
    let filteredTickets = fetchedTickets;

    if (searchText) {
      const query = searchText.toLowerCase();
      filteredTickets = filteredTickets.filter(
        (ticket) =>
          ticket.id.toLowerCase().includes(query) ||
          ticket.type.toLowerCase().includes(query) ||
          ticket.date.toLowerCase().includes(query) ||
          ticket.category.toLowerCase().includes(query) ||
          ticket.ticketClass.toLowerCase().includes(query),
      );
    }

    if (selectedTab !== "All") {
      filteredTickets = filteredTickets.filter(
        (ticket) => ticket.status === selectedTab,
      );
    }

    return filteredTickets;
  };

  const handleSearchChange = (text: string): void => {
    setSearchText(text);
  };

  const handleTicketPress = (ticket: TicketItem): void => {
    const scanResponse = {
      message:
        ticket.status === "Scanned" ? "Ticket Scanned" : "Ticket Unscanned",
      ticket_holder: ticket.ticketHolder || "No Record",
      ticket: ticket.type || "No Record",
      currency: ticket.currency || "No Record",
      ticket_price: ticket.price || "No Record",
      last_scan: ticket.lastScannedOn || "No Record",
      ticket_number: ticket.id || "No Record",
      scan_count: ticket.scanCount || 0,
      note: ticket.note || "No note added",
      qrCodeUrl: ticket.qrCodeUrl,
      name: ticket.name || "No Record",
      date: ticket.date || "No Record",
      user_email: ticket.email || "No Record",
      ticketClass: ticket.ticketClass || "No Record",
      category: ticket.category || "No Record",
      scanned_by: ticket.scannedBy || "No Record",
      staff_id: ticket.staffId || "No Record",
      scanned_on: ticket.scannedOn || "No Record",
    };

    navigation.navigate(
      "TicketScanned" as never,
      {
        scanResponse: scanResponse,
        eventInfo: eventInfo,
      } as never,
    );
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

  const filteredTickets = filterTickets();

  return (
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

        <TouchableOpacity onPress={() => handleSearchChange(searchText)}>
          <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "All" && styles.activeTab]}
          onPress={() => setSelectedTab("All")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "All" && styles.activeTabText,
            ]}
          >
            All
          </Text>
          <View
            style={[
              styles.countBadge,
              selectedTab === "All" ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.countText,
                selectedTab === "All"
                  ? styles.activeCountText
                  : styles.inactiveCountText,
              ]}
            >
              {stats.total}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "Scanned" && styles.activeTab,
          ]}
          onPress={() => setSelectedTab("Scanned")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "Scanned" && styles.activeTabText,
            ]}
          >
            Scanned
          </Text>
          <View
            style={[
              styles.countBadge,
              selectedTab === "Scanned"
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.countText,
                selectedTab === "Scanned"
                  ? styles.activeCountText
                  : styles.inactiveCountText,
              ]}
            >
              {stats.scanned}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "Unscanned" && styles.activeTab,
          ]}
          onPress={() => setSelectedTab("Unscanned")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "Unscanned" && styles.activeTabText,
            ]}
          >
            Unscanned
          </Text>
          <View
            style={[
              styles.countBadge,
              selectedTab === "Unscanned"
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.countText,
                selectedTab === "Unscanned"
                  ? styles.activeCountText
                  : styles.inactiveCountText,
              ]}
            >
              {stats.unscanned}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.flatListContainer}>
        <FlatList
          ref={flatListRef}
          data={filteredTickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() =>
            !isLoading ? (
              <NoResults message="No Matching Results" />
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
              </View>
            )
          }
          ListFooterComponent={() =>
            isLoading && filteredTickets.length > 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
};

export default TicketsTab;
