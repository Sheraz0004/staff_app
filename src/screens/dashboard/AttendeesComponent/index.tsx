import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { color } from '../../../color/color';
import { dashboardattendeestab } from '../../../constants/dashboardattendeestab';
import SvgIcons from '../../../components/SvgIcons';
import { TICKET_SERVICES } from '../../../services/TicketService';
import API_CONFIG from '../../../../config';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import NoResults from '../../../components/NoResults';
import { logger } from '../../../utils/logger';
import { styles } from './index.styles';

interface AttendeesComponentProps {
  eventInfo: any;
  onScanCountUpdate?: any;
}

const AttendeesComponent: React.FC<AttendeesComponentProps> = ({ eventInfo, onScanCountUpdate }) => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('Total');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [fetchedTickets, setFetchedTickets] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    current_page: 1,
    next: null,
    page_size: 10,
    previous: null
  });
  const [stats, setStats] = useState({ total: 0, scanned: 0, unscanned: 0 });

  useEffect(() => {
    if (eventInfo?.eventUuid) {
      fetchTicketList(eventInfo.eventUuid);
      fetchTicketStats(eventInfo.eventUuid);
    }
  }, [eventInfo?.eventUuid]);

  const fetchTicketList = async (eventUuid: any) => {
    try {
      setIsLoading(true);
      const res = await TICKET_SERVICES.fetchUserTickets({ eventId: eventUuid, pageSize: -1, status: 'PAID' });
      const list = res?.data || [];
      const mappedTickets = list.map((ticket: any) => {
        const qrCodeUrl = `${API_CONFIG.BASE_URL}/api/ticket/scan/${ticket.event}/${ticket.code}/`;
        return {
          id: ticket.ticket_number || 'No Record',
          type: ticket.ticket_type || 'No Record',
          price: ticket.ticket_price || 'No Record',
          date: ticket.formatted_date || 'No Record',
          status: ticket.checkin_status === 'SCANNED' ? 'Checked In' : 'No Show',
          note: ticket.note || 'No Record',
          imageUrl: null,
          uuid: ticket.uuid || 'No Record',
          ticketHolder: ticket.ticket_holder || 'No Record',
          lastScannedByName: ticket.last_scanned_by_name || 'No Record',
          scanCount: ticket.scan_count || 'No Record',
          lastScannedOn: ticket.last_scanned_on || 'No Record',
          qrCodeUrl: qrCodeUrl,
          currency: ticket.currency || 'No Record',
          category: ticket.category || 'No Record',
          email: ticket.user_email || 'No Record',
          ticketClass: ticket.ticket_class || 'No Record',
          name: `${ticket.user_first_name || ''} ${ticket.user_last_name || ''}`.trim() || 'No Record',
          scannedBy: ticket.scanned_by?.name || 'No Record',
          staffId: ticket.scanned_by?.staff_id || 'No Record',
          scannedOn: ticket.scanned_by?.scanned_on || 'No Record',
        };
      });

      setFetchedTickets(mappedTickets);
    } catch (err: any) {
      logger.error('Error fetching ticket list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTicketStats = async (eventUuid: any) => {
    try {
      const res = await TICKET_SERVICES.fetchStats(eventUuid);
      const statsData = res?.data?.data || {};

      setStats({
        total: statsData.total || 0,
        scanned: statsData.scanned || 0,
        unscanned: statsData.unscanned || 0,
      });
    } catch (err: any) {
      logger.error('Error fetching ticket stats:', err);
    }
  };

  const loadMoreTickets = () => {
    if (!isLoading && hasMore && eventInfo?.eventUuid) {
      fetchTicketList(eventInfo.eventUuid, currentPage + 1, true);
    }
  };

  const filterTickets = () => {
    let filteredTickets = fetchedTickets;

    if (searchText) {
      filteredTickets = filteredTickets.filter(
        (ticket) =>
          ticket.id.toLowerCase().includes(searchText.toLowerCase()) ||
          ticket.type.toLowerCase().includes(searchText.toLowerCase()) ||
          ticket.ticketHolder.toLowerCase().includes(searchText.toLowerCase()) ||
          ticket.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (ticket.userfirstname && ticket.userfirstname.toLowerCase().includes(searchText.toLowerCase())) ||
          (ticket.userlastname && ticket.userlastname.toLowerCase().includes(searchText.toLowerCase())) ||
          ticket.category.toLowerCase().includes(searchText.toLowerCase()) ||
          ticket.ticketClass.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (activeTab !== 'Total') {
      filteredTickets = filteredTickets.filter((ticket) => {
        if (activeTab === 'Checked In') {
          return ticket.status === 'Checked In';
        } else if (activeTab === 'No Show') {
          return ticket.status === 'No Show';
        }
        return true;
      });
    }

    if (selectedFilter) {
      filteredTickets = filteredTickets.filter((ticket) =>
        ticket.type === selectedFilter || ticket.status === selectedFilter
      );
    }

    return filteredTickets;
  };

  const handleTicketPress = (ticket: any) => {
    const scanResponse = {
      message: ticket.status === 'Checked In' ? 'Ticket Scanned' : 'Ticket Unscanned',
      ticket_holder: ticket.ticketHolder || 'No Record',
      ticket: ticket.type || 'No Record',
      currency: ticket.currency || 'No Record',
      ticket_price: ticket.price || 'No Record',
      last_scan: ticket.lastScannedOn || 'No Record',
      ticket_number: ticket.id || 'No Record',
      scan_count: ticket.scanCount || 0,
      note: ticket.note || 'No note added',
      qrCodeUrl: ticket.qrCodeUrl,
      category: ticket.category || 'No Record',
      ticketClass: ticket.ticketClass || 'No Record',
      user_email: ticket.email || 'No Record',
      date: ticket.date || 'No Record',
      name: ticket.name || 'No Record',
      scanned_by: ticket.scannedBy || 'No Record',
      staff_id: ticket.staffId || 'No Record',
      scanned_on: ticket.scannedOn || 'No Record',
    };

    (navigation as any).navigate('TicketScanned', {
      scanResponse: scanResponse,
      eventInfo: eventInfo,
    });
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    setSelectedFilter(null);
    setSearchText('');
  };

  const handleFilterButtonPress = () => {
    setModalVisible(true);
  };

  const applyFilter = (filter: string) => {
    setSelectedFilter(filter);
    setModalVisible(false);
  };

  const clearFilter = () => {
    setSelectedFilter(null);
  };

  const getNoResultsMessage = () => {
    if (searchText) {
      return "No Matching Results";
    }

    switch (activeTab) {
      case 'Total':
        return "No Matching Results";
      case 'Checked In':
        return "No Matching Results";
      case 'No Show':
        return "No Matching Results";
      default:
        return "No Matching Results";
    }
  };

  const filteredTickets = filterTickets();

  const totalTickets = stats.total;
  const checkedInCount = stats.scanned;
  const noShowCount = stats.unscanned;

  const getTabValue = (tab: string) => {
    switch (tab) {
      case 'Total':
        return totalTickets;
      case 'Checked In':
        return checkedInCount;
      case 'No Show':
        return noShowCount;
      default:
        return 0;
    }
  };

  const getDisplayTabName = (tab: string) => {
    return tab; // Display as is from the constants
  };

  return (
    <ScrollView
      style={styles.container}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const paddingToBottom = 20;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
          loadMoreTickets();
        }
      }}
      scrollEventThrottle={400}
    >

      <View style={styles.searchFilterContainer}>
        <View style={[
          styles.searchBar,
          isSearchFocused && styles.searchBarFocused
        ]}>
          <TextInput
            style={[
              styles.searchInput,
              searchText ? styles.searchInputWithText : styles.searchInputPlaceholder
            ]}
            placeholder="John Doe"
            placeholderTextColor={color.brown_766F6A}
            onChangeText={handleSearchChange}
            value={searchText}
            selectionColor={color.selectField_CEBCA0}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <TouchableOpacity onPress={() => handleSearchChange(searchText)}>
            <SvgIcons.searchIcon width={20} height={20} fill="transparent" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={handleFilterButtonPress}>
          <SvgIcons.filterIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          {dashboardattendeestab.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleTabPress(tab)}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive
              ]}>
                {getDisplayTabName(tab)}
              </Text>
              <View style={[
                styles.countBadge,
                activeTab === tab ? styles.activeBadge : styles.inactiveBadge
              ]}>
                <Text style={[
                  styles.countText,
                  activeTab === tab ? styles.activeCountText : styles.inactiveCountText
                ]}>
                  {getTabValue(tab)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredTickets.length > 0 ? (
        filteredTickets.map((item, index) => (
          <TouchableOpacity
            key={index}
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
                {item.qrCodeUrl && (
                  <QRCode
                    value={item.qrCodeUrl}
                    size={100}
                    style={{ width: '100%', height: '100%' }}
                    logoSize={30}
                    logoBackgroundColor="transparent"
                    quietZone={5}
                  />
                )}
              </View>
            </View>

            <View
              style={[
                styles.badge,
                item.status === 'Checked In' ? styles.checkInBadge : styles.noShowBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  item.status === 'Checked In' ? styles.checkInText : styles.noShowText,
                ]}
              >
                {item.status}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.valueID}>Tix ID: {item.id}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : !isLoading ? (
        <NoResults message={getNoResultsMessage()} />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color.brown_5A2F0E} />
        </View>
      )}

      {isLoading && filteredTickets.length > 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={color.brown_5A2F0E} />
        </View>
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
              <TouchableOpacity onPress={clearFilter}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptionsContainer}>
              <View style={styles.lineView} />
              <Text style={styles.tickettype}>Ticket Type</Text>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setSelectedFilter(
                    selectedFilter === 'Standard Pricing' ? null : 'Standard Pricing'
                  )
                }
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilter === 'Standard Pricing' && styles.checkedCheckbox,
                    ]}
                  >
                    {selectedFilter === 'Standard Pricing' && (
                      <SvgIcons.tickIcon width={15} height={15} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>Standard</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setSelectedFilter(
                    selectedFilter === 'Early Bird Pricing' ? null : 'Early Bird Pricing'
                  )
                }
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilter === 'Early Bird Pricing' && styles.checkedCheckbox,
                    ]}
                  >
                    {selectedFilter === 'Early Bird Pricing' && (
                      <SvgIcons.tickIcon width={15} height={15} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>Early Bird</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setSelectedFilter(
                    selectedFilter === 'Members Only Pricing' ? null : 'Members Only Pricing'
                  )
                }
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilter === 'Members Only Pricing' && styles.checkedCheckbox,
                    ]}
                  >
                    {selectedFilter === 'Members Only Pricing' && (
                      <SvgIcons.tickIcon width={15} height={15} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>Members Only</Text>
                </View>
              </TouchableOpacity>

              <View>
                <Text style={styles.tickettype}>Attendees</Text>
              </View>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setSelectedFilter(
                    selectedFilter === 'Checked In' ? null : 'Checked In'
                  )
                }
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilter === 'Checked In' && styles.checkedCheckbox,
                    ]}
                  >
                    {selectedFilter === 'Checked In' && (
                      <SvgIcons.tickIcon width={15} height={15} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>Checked In</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setSelectedFilter(
                    selectedFilter === 'No Show' ? null : 'No Show'
                  )
                }
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedFilter === 'No Show' && styles.checkedCheckbox,
                    ]}
                  >
                    {selectedFilter === 'No Show' && (
                      <SvgIcons.tickIcon width={15} height={15} />
                    )}
                  </View>
                  <Text style={styles.filterOptionText}>No Show</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.applyButton,
                !selectedFilter && styles.applyButtonDisabled
              ]}
              onPress={() => setModalVisible(false)}
              disabled={!selectedFilter}
            >
              <Text style={[
                styles.applyButtonText,
                !selectedFilter && styles.applyButtonTextDisabled
              ]}>Apply</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default AttendeesComponent;
