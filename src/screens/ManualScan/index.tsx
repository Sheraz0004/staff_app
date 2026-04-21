import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import Header from '../../components/header';
import { color } from '../../color/color';
import { useNavigation, useRoute } from '@react-navigation/native';
import SvgIcons from '../../components/SvgIcons';
import NoResults from '../../components/NoResults';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { useApi } from '../../services/useApi';
import Loader from '../../components/Loader/Loader';
import { CHECK_IN_SERVICES } from '../../services/CheckInService';
import { EVENT_SERVICES } from '../../services/EventService';
import { styles } from './index.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScannedBy {
  email: string;
  name: string;
  scannedAt: string;
  staffId: number;
}

interface OrderTicket {
  id: number;
  ticketNumber: string;
  code: string;
  checkinStatus: 'UNSCANNED' | 'SCANNED';
  scanCount: number;
  ticketPrice: number;
  vat: number;
  ticketType: string;
  ticketClass: string;
  category: string;
  orderNumber: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  ticketHolder: string;
  eventId: number;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventBanner: string | null;
  currency: string;
  organizationName: string;
  location: string;
  createdAt: string;
  formattedDate: string;
  message: string | null;
  note: string | null;
  scannedBy: ScannedBy | null;
}

interface OrderResult {
  orderId: number;
  orderNumber: string;
  status: string;
  boughtBy: string;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventBanner: string | null;
  total: number;
  subtotal: number;
  totalVat: number;
  discountedValue: number | null;
  currency: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
  buyerFirstName: string | null;
  buyerLastName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  tickets: OrderTicket[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManualScanProps {
  eventInfo?: any;
  onScanCountUpdate?: () => void;
  activeHeaderTab?: string;
  onHeaderTabChange?: (tab: string) => void;
  userRole?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ManualScan = ({
  eventInfo: propEventInfo,
  onScanCountUpdate,
  activeHeaderTab,
  onHeaderTabChange,
  userRole: propUserRole,
}: ManualScanProps) => {
  const navigation = useNavigation<any>();
  const routeHook = useRoute<any>();
  useOfflineSync();

  const eventInfo = propEventInfo || routeHook?.params?.eventInfo;
  const userRole = propUserRole || routeHook?.params?.userRole;
  const finalActiveTab = activeHeaderTab || routeHook?.params?.activeHeaderTab;
  const isFromRootStack = !propEventInfo && !!routeHook?.params?.eventInfo;

  const [searchText, setSearchText] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const { loading, requestCall: doLookup } = useApi(CHECK_IN_SERVICES.lookupOrders, false, true);
  const { requestCall: requestEventInfo } = useApi(EVENT_SERVICES.fetchEventInfo, false, false);
  const [dynamicEventInfo, setDynamicEventInfo] = useState<any>(null);

  const eventUuid = eventInfo?.eventUuid || eventInfo?.uuid;
  useEffect(() => {
    if (!eventUuid) return;
    requestEventInfo(String(eventUuid))
      .then((infoRes: any) => {
        const info = infoRes?.data;
        if (info) {
          setDynamicEventInfo({
            ...(eventInfo || {}),
            event_title: info?.eventTitle || info?.event_title,
            date: info?.startDate || info?.start_date,
            time: info?.startTime || info?.start_time,
            staff_name: info?.staff_name,
            scanCount: info?.scanCount ?? info?.scan_count,
            event_uuid: info?.location?.uuid,
            eventUuid: String(eventUuid),
            cityName: info?.location?.city,
          });
        }
      })
      .catch(() => {});
  }, [eventUuid]);

  const handleSearch = async (): Promise<void> => {
    const query = searchText.trim();
    if (!query) return;
    try {
      const res = await doLookup(query);
      const results: OrderResult[] = res?.data ?? [];
      setOrders(results);
      console.log("Api response---->", res);
      setHasSearched(true);

      const eventId = results[0]?.eventId;
      if (eventId) {
        requestEventInfo(String(eventId))
          .then((infoRes: any) => {
            const info = infoRes?.data;
            if (info) {
              setDynamicEventInfo({
                ...(eventInfo || {}),
                event_title: info?.eventTitle || info?.event_title,
                date: info?.startDate || info?.start_date,
                time: info?.startTime || info?.start_time,
                staff_name: info?.staff_name,
                scanCount: info?.scanCount ?? info?.scan_count,
                event_uuid: info?.location?.uuid,
                eventUuid: String(eventId),
                cityName: info?.location?.city,
              });
            }
          })
          .catch(() => {});
      }
    } catch (error) {
      // console.log("error--->",error.response)
    }
  };

  const getBuyerName = (order: OrderResult): string => {
    const first = order.buyerFirstName ?? '';
    const last = order.buyerLastName ?? '';
    return [first, last].filter(Boolean).join(' ') || 'N/A';
  };

  // Transform camelCase tickets from the lookup API into the snake_case shape
  // that ManualCheckInAllTickets already knows how to render.
  const toLegacyTickets = (tickets: OrderTicket[]) =>
    tickets.map((t) => ({
      code: t.code,
      uuid: String(t.id),
      ticket_number: t.ticketNumber,
      ticket_type: t.ticketType,
      ticket_class: t.ticketClass,
      ticket_price: t.ticketPrice,
      checkin_status: t.checkinStatus,
      scan_count: t.scanCount,
      note: t.note,
      message: t.message,
      category: t.category,
      currency: t.currency,
      formatted_date: t.formattedDate,
      user_first_name: t.userFirstName,
      user_last_name: t.userLastName,
      user_email: t.userEmail,
      user_phone: t.userPhone,
      ticket_holder: t.ticketHolder,
      scanned_by: t.scannedBy
        ? {
            name: t.scannedBy.name,
            staff_id: t.scannedBy.staffId,
            scanned_on: t.scannedBy.scannedAt,
          }
        : null,
      last_scanned_on: t.scannedBy?.scannedAt ?? null,
      last_scanned_by_name: t.scannedBy?.name ?? null,
    }));

  const renderItem = ({ item }: ListRenderItemInfo<OrderResult>) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() =>
        navigation.navigate('ManualCheckInAllTickets', {
          ticket: item,
          total: item.tickets.length,
          orderNumber: item.orderNumber,
          eventUuid: item?.eventId,
          eventInfo,
          onScanCountUpdate,
          category: item.tickets[0]?.category ?? 'N/A',
          ticketClass: item.tickets[0]?.ticketClass ?? 'N/A',
          preloadedTickets: toLegacyTickets(item.tickets),
        })
      }
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

  const emptyMessage = hasSearched ? 'No Matching Results' : 'Search by order number, email, or phone';

  return (
    <View style={styles.mainContainer}>
      <Loader isLoading={loading} />
      <Header
        eventInfo={dynamicEventInfo || eventInfo}
        activeTab={finalActiveTab}
        onTabChange={onHeaderTabChange}
        userRole={userRole}
        showBackButton={isFromRootStack}
      />
      <View style={styles.contentContainer}>
        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
          <TextInput
            style={[styles.searchBar, searchText ? styles.searchInputWithText : styles.searchInputPlaceholder]}
            placeholder="Order number, email, or phone"
            placeholderTextColor={color.brown_766F6A}
            value={searchText}
            onChangeText={setSearchText}
            selectionColor={color.selectField_CEBCA0}
            returnKeyType="search"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={handleSearch}>
            <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={orders}
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
