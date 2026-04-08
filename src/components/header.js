import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, SafeAreaView, Platform, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../color/color';
import SvgIcons from './SvgIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { truncateCityName } from '../utils/stringUtils';
import { truncateEventName } from '../utils/stringUtils';
import { formatDateWithMonthName } from '../constants/dateAndTime';
import { formatValue } from '../constants/formatValue';
import { userService } from '../api/apiService';

const { width } = Dimensions.get('window');

const Header = ({ eventInfo, onScanCountUpdate, onTabChange, showBackButton, onBackPress, activeTab: activeTabProp, userRole }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [localActiveTab, setLocalActiveTab] = useState('Manual');
  const activeTab = activeTabProp !== undefined ? activeTabProp : localActiveTab;
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [currentScanCount, setCurrentScanCount] = useState(eventInfo?.scanCount || '0');

  const tabs = ['Auto', 'Manual', 'Sell'];

  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [route.params?.refreshProfile])
  );


  const fetchProfile = async () => {
    try {
      const response = await userService.getProfile();
      if (response.success) {
        setUserData(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch profile data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (eventInfo?.scanCount !== undefined) {
      setCurrentScanCount(eventInfo.scanCount);
    }
  }, [eventInfo?.scanCount]);

  const handleTabPress = (tab) => {
    if (tab === activeTab) return;
    setLocalActiveTab(tab);
    onTabChange?.(tab);

    const currentRouteName = route.name;

    const detailScreens = [
      'TicketsDetail', 'DashboardDetail', 'ManualCheckInAllTickets',
      'CheckInAllTickets', 'TicketScanned', 'ManualScanDetail',
      'ExploreDetailScreenTicketsTab', 'ExploreEventScreen','Profile',
    ];
    const isInDetailScreen = detailScreens.includes(currentRouteName);

    if (isInDetailScreen) {
      // ── From a detail screen ──
      if (tab === 'Auto') {
        navigation.navigate('Home', { screen: 'Check In', params: { eventInfo } });
      } else if (tab === 'Manual') {
        if (userRole === 'ADMIN') {
          if (currentRouteName === 'ManualScanDetail') return;
          navigation.navigate('ManualScanDetail', { eventInfo, userRole, activeHeaderTab: 'Manual' });
        } else {
          navigation.navigate('ManualScanDetail', { eventInfo, userRole, activeHeaderTab: 'Manual' });
        }
      } else if (tab === 'Sell') {
        if (userRole === 'ADMIN') {
          if (currentRouteName === 'TicketsDetail') return;
          navigation.navigate('Home', { screen: 'Tickets', params: { eventInfo } });
        } else {
          navigation.navigate('Home', { screen: 'Tickets', params: { eventInfo } });
        }
      }
    } else {
      // ── Inside bottom tabs ──
      if (tab === 'Auto') {
        navigation.navigate('Check In');
      } else if (tab === 'Manual') {
        if (userRole === 'ADMIN') {
          navigation.navigate('ManualScanDetail', { eventInfo, userRole, activeHeaderTab: 'Manual' });
        } else {
          navigation.navigate('Manual');
        }
      } else if (tab === 'Sell') {
        if (userRole === 'ADMIN') {
          navigation.navigate('Tickets', { eventInfo });
        } else {
          navigation.navigate('Tickets', { screen: 'BoxOfficeTab' });
        }
      }
    }
  };

  const handleCountPress = () => {
    if (userRole === 'ADMIN') {
      const currentRouteName = route.name;
      if (currentRouteName === 'TicketsDetail') {
        navigation.setParams({
          initialTab: 'Scanned',
          openBoxOffice: false,
        });
      } else {
        navigation.navigate('TicketsDetail', {
          eventInfo: eventInfo,
          activeHeaderTab: 'Sell',
          initialTab: 'Scanned',
          openBoxOffice: false,
        });
      }
    } else {
      navigation.navigate('Home', {
        screen: 'Tickets',
        params: {
          initialTab: 'Scanned',
          fromHeader: true,
          eventInfo,
        },
      });
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const shouldShowBackButton = () => {
    if (showBackButton) return true;
    const currentRouteName = route.name;
    const detailScreens = ['ManualCheckInAllTickets', 'CheckInAllTickets', 'TicketScanned','Profile'];
    return detailScreens.includes(currentRouteName);
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={[styles.safeAreaContainer, { paddingTop: topPadding }]}>
        <View style={styles.headerColumn}>
          {/* Brown event info bar with back button inside */}
          <View style={styles.header}>
            {shouldShowBackButton() && (
              <TouchableOpacity onPress={handleBackPress} style={styles.headerBackButton}>
                <SvgIcons.whiteArrow />
              </TouchableOpacity>
            )}
            <View style={[
              styles.headerContent,
              shouldShowBackButton() && styles.headerContentWithBack,
            ]}>
              <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">{truncateEventName(eventInfo?.event_title) || 'OUTMOSPHERE'}</Text>
              <View style={styles.headerSpacer} />
              <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">{formatDateWithMonthName(eventInfo?.date) || '30 Oct 2025'}</Text>
              <Text style={styles.separator}>at</Text>
              <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">{eventInfo?.time || '7:00 PM'}</Text>
            </View>
          </View>

          {/* Profile / Tab / Scan Section */}
          <View style={styles.profileRow}>
            {/* Left: Avatar + Name */}
            <View style={styles.leftSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('Profile', { userRole, eventInfo })}>
                {profileImage ? (
                  <Image source={profileImage} style={styles.avatar} resizeMode="cover" />
                ) : userData?.profile_image ? (
                  <Image
                    source={{ uri: userData.profile_image }}
                    style={styles.avatar}
                    resizeMode="contain"
                  />
                ) : (
                  <SvgIcons.placeholderImage width={22} height={22} />
                )}
              </TouchableOpacity>
              <Text style={styles.staffName} numberOfLines={1}>
                {eventInfo?.staff_name || 'John Doe'}
              </Text>
            </View>

            {/* Center: Segmented Tab Control */}
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.activeTab,
                  ]}
                  onPress={() => handleTabPress(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Right: Scans count */}
            <TouchableOpacity onPress={handleCountPress} style={styles.rightSection}>
              <Text style={styles.scansLabel}>Scans: </Text>
              <Text style={styles.scansCount}>{formatValue(currentScanCount)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'transparent',
  },
  safeAreaContainer: {
  },
  headerColumn: {
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: color.btnBrown_AE6F28,
    height: 48,
  },
  headerBackButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  headerContentWithBack: {
    justifyContent: 'space-between',
  },
  headerSpacer: {
    flex: 1,
  },
  separator: {
    fontSize: 12,
    fontWeight: '400',
    color: color.white_FFFFFF,
    marginHorizontal: 6,
  },
  eventName: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: '500',
  },
  cityName: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: '400',
  },
  date: {
    color: color.white_FFFFFF,
    fontSize: 12,
    fontWeight: '400',
  },
  time: {
    color: color.white_FFFFFF,
    fontSize: 12,
    fontWeight: '400',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  staffName: {
    fontSize: 12,
    fontWeight: '400',
    color: color.drak_black_000000,
    marginLeft: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#00000030',
    borderRadius: 20,
    padding: 3,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: color.white_FFFFFF,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '500',
    color: color.white_FFFFFF,
  },
  activeTabText: {
    color: '241F21',
    fontWeight: '400',
    fontSize: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  scansLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999999',
  },
  scansCount: {
    fontSize: 14,
    fontWeight: '700',
    color: color.brown_3C200A,
  },
  avatarContainer: {
    width: 22,
    height: 22,
    borderRadius: 22,
    borderColor: color.btnBrown_AE6F28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 22,
    height: 22,
    borderRadius: 22,
  },
});

export default Header;