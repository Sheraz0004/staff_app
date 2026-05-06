import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
//import Header from '../../../../components/header';
import { color } from '../../../color/color';
import { useNavigation } from '@react-navigation/native';
import SvgIcons from '../../../components/SvgIcons';
import { DASHBOARD_SERVICES } from '../../../services/DashboardService';
import NoResults from '../../../components/NoResults';
import { logger } from '../../../utils/logger';
import { formatValue } from '../../../constants/formatValue';
import { styles } from './index.styles';

interface TerminalsComponentProps {
  eventInfo: any;
  onEventChange: any;
}

const TerminalsComponent: React.FC<TerminalsComponentProps> = ({ eventInfo, onEventChange }) => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [ticketOrders, setTicketOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!eventInfo?.eventUuid) {
          setError("Event UUID is not available.");
          setLoading(false);
          return; // Important: Exit if eventUuid is missing
        }

        const response = await DASHBOARD_SERVICES.fetchAdminTerminals(eventInfo.eventUuid);
        logger.log('admin terminals response', response);
        if (response?.data) {
          setTicketOrders(response.data);
        } else {
          setTicketOrders([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch admin terminals.');
        logger.error('Error fetching admin terminals:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!eventInfo?.eventUuid) {
      setLoading(false); // Immediately stop loading if eventInfo is missing
      return;
    }
    fetchOrders();
  }, [eventInfo?.eventUuid]);

  const filterTickets = () => {
    if (!searchText) return ticketOrders;
    return ticketOrders.filter(
      (order) =>
        order.name?.toLowerCase().includes(searchText.toLowerCase())
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => (navigation as any).navigate('AdminTerminalDashboard', {
        eventInfo: eventInfo,
        staffUuid: item.uuid,
        staffName: item.name,
        onEventChange: onEventChange
      })}
    >
      <View style={styles.ticketRow}>
        {/* Name Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Name</Text>
          <Text style={styles.columnData}>{item.name || 'N/A'}</Text>
        </View>

        {/* Sales Column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Sales</Text>
          <Text style={styles.columnData}>{item.currency} {formatValue(item.sales)}</Text>
        </View>

        {/* Check-Ins Column */}
        {/* <View style={styles.column}>
          <Text style={styles.columnHeader}>Check-Ins</Text>
          <Text style={styles.columnData}>{item.checkins}</Text>
        </View> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      {/* <Header eventInfo={eventInfo} /> */}
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
            placeholder="John Doe"
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

export default TerminalsComponent;
