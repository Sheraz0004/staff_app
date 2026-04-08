import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Header from '../components/header';
import { color } from '../color/color';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import SvgIcons from '../components/SvgIcons';
import NoResults from '../components/NoResults';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useApi } from '../services/useApi';
import Loader from '../components/Loader/Loader';
import { CHECK_IN_SERVICES } from '../services/CheckInService';

const ManualScan = ({ eventInfo: propEventInfo, onScanCountUpdate, activeHeaderTab, onHeaderTabChange, userRole: propUserRole }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const routeHook = useRoute();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [ticketOrders, setTicketOrders] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  useOfflineSync();

  const eventInfo = propEventInfo || routeHook?.params?.eventInfo;
  const userRole = propUserRole || routeHook?.params?.userRole;
  const finalActiveTab = activeHeaderTab || routeHook?.params?.activeHeaderTab;
  const isFromRootStack = !propEventInfo && !!routeHook?.params?.eventInfo;

  const { loading, requestCall: loadOrders } = useApi(CHECK_IN_SERVICES.fetchTicketOrders, false, true);

  const fetchOrders = async () => {
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

  const filterTickets = () => {
    if (!searchText) return ticketOrders;
    return ticketOrders.filter(
      (order) =>
        order.order_number?.toString().includes(searchText) ||
        order.user_full_name?.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const filteredTickets = filterTickets();

  const renderItem = ({ item }) => (
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

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 15,
    borderColor: color.borderBrown_CEBCA0,
    borderWidth: 1,
    height: 45,
    marginHorizontal: 16,
  },
  searchContainerFocused: {
    borderColor: color.placeholderTxt_24282C,
  },
  searchInputPlaceholder: {
    color: color.brown_766F6A,
    fontWeight: '200',
    fontSize: 13,
  },
  searchInputWithText: {
    color: color.black_544B45,
    fontWeight: '400',
    fontSize: 13,
  },
  searchBar: {
    flex: 1,
    paddingVertical: 10,
  },
  ticketCard: {
    borderWidth: 1,
    backgroundColor: color.white_FFFFFF,
    borderColor: color.white_FFFFFF,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 16,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
  },
  rightColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: 50,
  },
  name: {
    marginBottom: 5,
    fontSize: 14,
    color: '#000000',
  },
  id: {
    fontSize: 14,
    color: '#000000',
    marginTop: 5,
  },
  type: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 5,
  },
  total: {
    fontSize: 14,
    color: '#000000',
    top: 4,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  offlineBanner: {
    backgroundColor: '#FFA500',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ManualScan;
