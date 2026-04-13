import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { color } from '../../../color/color';
import { dashboardattendeestab } from '../../../constants/dashboardattendeestab';
import SvgIcons from '../../../components/SvgIcons';
import { ticketService, BASE_URL } from '../../../api/apiService';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import NoResults from '../../../components/NoResults';
import { logger } from '../../../utils/logger';
import { styles } from './index.styles';

interface ScanListComponentProps {
    eventInfo: any;
    onScanCountUpdate: any;
    staffUuid: any;
}

const ScanListComponent: React.FC<ScanListComponentProps> = ({ eventInfo, onScanCountUpdate, staffUuid }) => {
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [fetchedTickets, setFetchedTickets] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [availableTicketTypes, setAvailableTicketTypes] = useState<string[]>([]);

    useEffect(() => {
        if (eventInfo?.eventUuid) {
            fetchTicketList(eventInfo.eventUuid);
        }
    }, [eventInfo?.eventUuid]);

    const fetchTicketList = async (eventUuid: any) => {
        try {
            setIsLoading(true);
            // If staffUuid is provided, we need to filter tickets for that specific staff
            const res = await ticketService.ticketStatsListing(eventUuid, staffUuid,'PAID');
            const list = res?.data || [];
            const mappedTickets = list.map((ticket: any) => {
                const qrCodeUrl = `${BASE_URL}ticket/scan/${ticket.event}/${ticket.code}/`;
                return {
                    id: ticket.ticket_number || 'No Record',
                    type: ticket.ticket_type || 'No Record',
                    price: ticket.ticket_price || 'No Record',
                    date: ticket.formatted_date || 'No Record',
                    status: ticket.checkin_status,
                    note: ticket.note || 'No Record',
                    imageUrl: null,
                    uuid: ticket.uuid || 'No Record',
                    ticketHolder: ticket.ticket_holder || 'No Record',
                    lastScannedByName: ticket.last_scanned_by_name || 'No Record',
                    scanCount: ticket.scan_count || 'No Record',
                    lastScannedOn: ticket.last_scanned_on || 'No Record',
                    qrCodeUrl: qrCodeUrl,
                    currency: ticket.currency || 'No Record',
                    userfirstname: ticket.user_first_name,
                    name: `${ticket.user_first_name || ''} ${ticket.user_last_name || ''}`.trim() || 'No Record',
                    user_email: ticket.user_email || 'No Record',
                    category: ticket.category || 'No Record',
                    ticketClass: ticket.ticket_class || 'No Record',
                    scannedBy: ticket.scanned_by?.name || 'No Record',
                    staffId: ticket.scanned_by?.staff_id || 'No Record',
                    scannedOn: ticket.scanned_by?.scanned_on || 'No Record',
                };
            });

            setFetchedTickets(mappedTickets);

            // Extract unique ticket types and remove "Pricing" from the end
            const uniqueTypes = [...new Set(mappedTickets.map((ticket: any) => ticket.type))].filter((type: any) => type !== 'No Record');
            const cleanedTypes = (uniqueTypes as string[]).map(type => type.replace(/\s*Pricing$/, ''));
            setAvailableTicketTypes(cleanedTypes);
        } catch (err) {
            logger.error('Error fetching ticket list:', err);
        } finally {
            setIsLoading(false);
        }
    };


    const filterTickets = () => {
        let filteredTickets = fetchedTickets;

        // Filter to show only scanned tickets
        filteredTickets = filteredTickets.filter((ticket) => ticket.status === 'SCANNED');

        if (searchText) {
            filteredTickets = filteredTickets.filter(
                (ticket) =>
                    (ticket.id && ticket.id.toLowerCase().includes(searchText.toLowerCase())) ||
                    (ticket.type && ticket.type.toLowerCase().includes(searchText.toLowerCase())) ||
                    (ticket.ticketHolder && ticket.ticketHolder.toLowerCase().includes(searchText.toLowerCase())) ||
                    (ticket.userfirstname && ticket.userfirstname.toLowerCase().includes(searchText.toLowerCase())) ||
                    (ticket.category && ticket.category.toLowerCase().includes(searchText.toLowerCase())) ||
                    (ticket.ticketClass && ticket.ticketClass.toLowerCase().includes(searchText.toLowerCase()))
            );
        }

        // Apply filter
        if (selectedFilter) {
            // Filter by matching ticket type, adding "Pricing" back for comparison
            filteredTickets = filteredTickets.filter((ticket) => {
                const ticketTypeDisplay = ticket.type.replace(/\s*Pricing$/, '');
                return ticketTypeDisplay === selectedFilter;
            });
        }

        return filteredTickets;
    };

    const handleTicketPress = (ticket: any) => {
        const scanResponse = {
            message: ticket.status === 'SCANNED' ? 'Ticket Scanned' : 'Ticket Scanned',
            ticket_holder: ticket.ticketHolder || 'No Record',
            ticket: ticket.type || 'No Record',
            currency: ticket.currency || 'No Record',
            ticket_price: ticket.price || 'No Record',
            last_scan: ticket.lastScannedOn || 'No Record',
            ticket_number: ticket.id || 'No Record',
            scan_count: ticket.scanCount || 0,
            note: ticket.note || 'No note added',
            qrCodeUrl: ticket.qrCodeUrl,
            name: ticket.name,
            date: ticket.date,
            user_email: ticket.user_email,
            category: ticket.category,
            ticketClass: ticket.ticketClass,
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

    const handleTabPress = (tab: any) => {
        setSearchText('');
    };

    const handleFilterButtonPress = () => {
        setModalVisible(true);
    };

    const clearFilter = () => {
        setSelectedFilter(null);
    };


    const getNoResultsMessage = () => {
        if (searchText) {
            return "No Matching Results";
        }
        return "No Matching Results";
    };

    const filteredTickets = filterTickets();

    return (
        <ScrollView
            style={styles.container}
        >
            <View><Text style={styles.title}>Scans</Text></View>
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
                                <Text style={styles.value}>{item.name || 'No Record'}</Text>
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
                                styles.checkInBadge,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.badgeText,
                                    styles.checkInText,
                                ]}
                            >
                                {item.status === 'SCANNED' ? 'Scanned' : item.status}
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
                    <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
                </View>
            )}

            {isLoading && filteredTickets.length > 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
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
                            {availableTicketTypes.map((ticketType, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.filterOption}
                                    onPress={() =>
                                        setSelectedFilter(
                                            selectedFilter === ticketType ? null : ticketType
                                        )
                                    }
                                >
                                    <View style={styles.checkboxContainer}>
                                        <View
                                            style={[
                                                styles.checkbox,
                                                selectedFilter === ticketType && styles.checkedCheckbox,
                                            ]}
                                        >
                                            {selectedFilter === ticketType && (
                                                <SvgIcons.tickIcon width={15} height={15} />
                                            )}
                                        </View>
                                        <Text style={styles.filterOptionText}>{ticketType}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
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

export default ScanListComponent;
