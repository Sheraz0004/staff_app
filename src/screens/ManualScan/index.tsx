import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ListRenderItemInfo } from 'react-native';
import Header from '../components/header';
import { color } from '../color/color';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import SvgIcons from '../components/SvgIcons';
import NoResults from '../components/NoResults';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useApi } from '../services/useApi';
import Loader from '../components/Loader/Loader';
import { CHECK_IN_SERVICES } from '../services/CheckInService';
import { styles } from './ManualScan.styles';

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
  const isFocused = useIsFocused();
  const routeHook = useRoute<any>();
  const [searchText, setSearchText] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [ticketOrders, setTicketOrders] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  useOfflineSync();

  const eventInfo = propEventInfo || routeHook?.params?.eventInfo;
  const userRole = propUserRole || routeHook?.params?.userRole;
  const finalActiveTab = activeHeaderTab || routeHook?.params?.activeHeaderTab;
  const isFromRootStack = !propEventInfo && !!routeHook?.params?.eventInfo;

  const { loading, requestCall: loadOrders } = useApi(CHECK_IN_SERVICES.fetchTicketOrders, false, true);

  const fetchOrders = async (): Promise<void> => {
    if (!eventInfo?.eventUuid) return;
    try {
      const res = await loadOrders(eventInfo.eventUuid);
      const result = res?.data;
      setIsOffline(!!result?.offline);
      setTicketOrders(result?.data || []);
    } catch (_) {
      // error toast already shown by useApi
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [eventInfo]);

  useEffect(() => {
    if (isFocused && eventInfo) fetchOrders();
  }, [isFocused]);

  const filterTickets = (): any[] => {
    if (!searchText) return ticketOrders;
    return ticketOrders.filter(
      (order) =>
        order.order_number?.toString().includes(searchText) ||
        order.user_full_name?.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredTickets = filterTickets();

  const renderItem = ({ item }: ListRenderItemInfo<any>) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() =>
        navigation.navigate('ManualCheckInAllTickets', {
          ticket: item,
          total: item.ticket_count,
          orderNumber: item.order_number,
          eventUuid: eventInfo?.eventUuid,
          eventInfo,
          onScanCountUpdate,
          category: item.category || 'N/A',
          ticketClass: item.ticketClass || 'N/A',
        })
      }
    >
      <View style={styles.ticketRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.name}>{item.user_full_name || 'N/A'}</Text>
          <Text style={styles.id}>{item.order_number || 'N/A'}</Text>
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.type}>Tickets</Text>
          <Text style={styles.total}>{item.ticket_count?.toString() || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <Loader isLoading={loading} />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode - Using cached data</Text>
        </View>
      )}
      <Header
        eventInfo={eventInfo}
        activeTab={finalActiveTab}
        onTabChange={onHeaderTabChange}
        userRole={userRole}
        showBackButton={isFromRootStack}
      />
      <View style={styles.contentContainer}>
        <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
          <TextInput
            style={[styles.searchBar, searchText ? styles.searchInputWithText : styles.searchInputPlaceholder]}
            placeholder="Order Number or User Name"
            placeholderTextColor={color.brown_766F6A}
            onChangeText={setSearchText}
            value={searchText}
            selectionColor={color.selectField_CEBCA0}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <TouchableOpacity>
            <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTickets}
          renderItem={renderItem}
          keyExtractor={(item) => item.order_number?.toString() || Math.random().toString()}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() => <NoResults message="No Matching Results" />}
        />
      </View>
    </View>
  );
};

export default ManualScan;
