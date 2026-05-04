import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { color } from '../../../color/color';
import { useNavigation } from '@react-navigation/native';
import SvgIcons from '../../../components/SvgIcons';
import NoResults from '../../../components/NoResults';
import { logger } from '../../../utils/logger';
import { formatValue } from '../../../constants/formatValue';
import { DASHBOARD_SERVICES } from '../../../services/DashboardService';
import { styles } from './index.styles';

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
}

const StaffListComponent: React.FC<StaffListComponentProps> = ({ eventInfo, onEventChange }) => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchStaff = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await DASHBOARD_SERVICES.fetchOrganizationStaffSalesStats({
        page: pageNum,
        page_size: 10,
        sort_dir: 'desc',
      });
      const data = res?.data;
      logger.log('[StaffListComponent] sales-stats response:', JSON.stringify(data, null, 2));

      const members: StaffMember[] = data?.staff || [];
      setStaffList(prev => append ? [...prev, ...members] : members);
      setTotalPages(data?.totalPages ?? 1);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch staff.');
      logger.error('[StaffListComponent] Error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff(1, false);
  }, [fetchStaff]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchStaff(page + 1, true);
    }
  };

  const getDisplayName = (member: StaffMember): string => {
    const first = member.firstName?.trim();
    const last = member.lastName?.trim();
    if (first || last) return [first, last].filter(Boolean).join(' ');
    return 'N/A';
  };

  const getSalesSummary = (salesByCurrency: Record<string, number>): string => {
    if (!salesByCurrency || Object.keys(salesByCurrency).length === 0) return 'N/A';
    return Object.entries(salesByCurrency)
      .map(([currency, amount]) => `${currency} ${formatValue(amount)}`)
      .join(' | ');
  };

  const filteredStaff = searchText
    ? staffList.filter(member => {
        const fullName = getDisplayName(member).toLowerCase();
        return (
          fullName.includes(searchText.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          member.staffId?.toLowerCase().includes(searchText.toLowerCase())
        );
      })
    : staffList;

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

  const renderItem = ({ item }: { item: StaffMember }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => (navigation as any).navigate('StaffDashboard', {
        eventInfo: eventInfo,
        staffUuid: item.staffId,
        staffName: getDisplayName(item),
        onEventChange: onEventChange,
      })}
    >
      <View style={styles.ticketRow}>
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Name</Text>
          <Text style={styles.columnData}>{getDisplayName(item)}</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnHeader}>Sales</Text>
          <Text style={styles.columnData}>{getSalesSummary(item.salesByCurrency)}</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnHeader}>Check-Ins</Text>
          <Text style={styles.columnData}>{item.totalCheckIns ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentContainer}>
        <View style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused,
        ]}>
          <TextInput
            style={[
              styles.searchBar,
              searchText ? styles.searchInputWithText : styles.searchInputPlaceholder,
            ]}
            placeholder="John Doe"
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
          data={filteredStaff}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() ?? item.staffId}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() => <NoResults message="No Matching Results" />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? () => <ActivityIndicator size="small" color={color.btnBrown_AE6F28} style={{ marginVertical: 12 }} />
              : null
          }
        />
      </View>
    </View>
  );
};

export default StaffListComponent;
