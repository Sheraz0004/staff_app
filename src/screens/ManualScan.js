import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import Header from '../components/header';
import { color } from '../color/color';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import SvgIcons from '../components/SvgIcons';
import { ticketService } from '../api/apiService';
import NoResults from '../components/NoResults';
import { logger } from '../utils/logger';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { syncService } from '../utils/syncService';
import { offlineStorage } from '../utils/offlineStorage';

const ManualScan = ({ eventInfo: propEventInfo, onScanCountUpdate, activeHeaderTab, onHeaderTabChange, userRole: propUserRole }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const routeHook = useRoute();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [ticketOrders, setTicketOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const { isOnline, queueSize } = useOfflineSync();

  const eventInfo = propEventInfo || routeHook?.params?.eventInfo;
  const userRole = propUserRole || routeHook?.params?.userRole;
  const finalActiveTab = activeHeaderTab || routeHook?.params?.activeHeaderTab;
  const isFromRootStack = !propEventInfo && !!routeHook?.params?.eventInfo;
  // Function to fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!eventInfo) {
        setError("Event UUID is not available.");
        setLoading(false);
        return; // Important: Exit if eventUuid is missing
      }

      const response = await ticketService.fetchUserTicketOrders(eventInfo.eventUuid);
      logger.log('manual scan response', response);

      // Check if data is from offline cache
      if (response?.offline) {
        setIsOffline(true);
        logger.log('Using offline cached manual orders');
      } else {
        setIsOffline(false);
      }

      if (response?.data) {
        setTicketOrders(response.data);
      } else {
        setTicketOrders([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch ticket orders.');
      console.error('Error fetching ticket orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventInfo) {
      setLoading(false); // Immediately stop loading if eventInfo is missing
      return;
    }
    fetchOrders();
  }, [eventInfo]);

  // Refresh when screen comes into focus (user navigates back)
  useEffect(() => {
    if (isFocused && eventInfo) {
      logger.log('ManualScan screen focused - refreshing orders');
      fetchOrders();
    }
  }, [isFocused, eventInfo]);

  // Listen for sync completion to refresh data
  useEffect(() => {
    const unsubscribe = syncService.addListener(async (syncResult) => {
      if (syncResult.success && syncResult.synced > 0 && isFocused && eventInfo) {
        logger.log('Sync completed - refreshing manual orders');
        // Refresh orders after successful sync (will fetch fresh data)
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isFocused, eventInfo]);

  const filterTickets = () => {
    if (!searchText) return ticketOrders;
    return ticketOrders.filter(
      (order) =>
        order.order_number?.toString().includes(searchText) ||
        order.user_full_name?.toLowerCase().includes(searchText.toLowerCase())
      // You might want to add more fields to search by if your API returns them
    );
  };

  const getNoResultsMessage = () => {
    if (searchText) {
      return "No Matching Results";
    }
    return "No Matching Results";
  };

  const filteredTickets = filterTickets();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => navigation.navigate('ManualCheckInAllTickets', {
        ticket: item,
        total: item.ticket_count,
        orderNumber: item.order_number, // Pass order number
        eventUuid: eventInfo?.eventUuid, // Pass event UUID
        eventInfo: eventInfo,
        onScanCountUpdate: onScanCountUpdate, // Pass the callback
        category: item.category || 'N/A',
        ticketClass: item.ticketClass || 'N/A',
      })}
    >
      <View style={styles.ticketRow}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          <Text style={styles.name}>{item.user_full_name || 'N/A'}</Text>
          <Text style={styles.id}>{`${item.order_number || 'N/A'}`}</Text>
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
          <Text style={styles.type}>Tickets</Text>
          <Text style={styles.total}>{item.ticket_count?.toString() || 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
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
        showBackButton={isFromRootStack} />
      <View style={styles.contentContainer}>
        <View style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused
        ]}>
          <TextInput
            style={[
              styles.searchBar,
              searchText ? styles.searchInputWithText : styles.searchInputPlaceholder
            ]}
            placeholder="Order Number or User Name"
            placeholderTextColor={color.brown_766F6A}
            onChangeText={(text) => setSearchText(text)}
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
          keyExtractor={(item) => item.order_number?.toString() || Math.random().toString()} // Use order_number as key
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() => (
            <NoResults message={getNoResultsMessage()} />
          )}
        />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    //backgroundColor: color.btnBrown_AE6F28,
  },
  contentContainer: {
    flex: 1,
    //backgroundColor: color.white_FFFFFF,
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
    marginRight: 50
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
    top: 4
  },
  flatListContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default ManualScan;
