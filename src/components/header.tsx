import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    StatusBar,
    Image,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../color/color';
import SvgIcons from './SvgIcons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { truncateCityName, truncateEventName } from '../utils/stringUtils';
import { formatDateWithMonthName } from '../constants/dateAndTime';
import { formatValue } from '../constants/formatValue';
import { userService } from '../api/apiService';
import { styles } from './header.styles';

const { width } = Dimensions.get('window');

interface EventInfo {
    event_title?: string;
    date?: string;
    time?: string;
    staff_name?: string;
    scanCount?: number | string;
    cityName?: string;
    [key: string]: any;
}

interface HeaderProps {
    eventInfo?: EventInfo;
    onScanCountUpdate?: () => void;
    onTabChange?: (tab: string) => void;
    showBackButton?: boolean;
    onBackPress?: () => void;
    activeTab?: string;
    userRole?: string;
}

const Header: React.FC<HeaderProps> = ({
    eventInfo,
    onScanCountUpdate,
    onTabChange,
    showBackButton,
    onBackPress,
    activeTab: activeTabProp,
    userRole,
}) => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const [localActiveTab, setLocalActiveTab] = useState<string>('Manual');
    const activeTab = activeTabProp !== undefined ? activeTabProp : localActiveTab;
    const [userData, setUserData] = useState<any>(null);
    const [profileImage, setProfileImage] = useState<any>(null);
    const [currentScanCount, setCurrentScanCount] = useState<number | string>(
        eventInfo?.scanCount || '0',
    );

    const tabs: string[] = ['Auto', 'Manual', 'Sell'];

    const topPadding =
        Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

    useFocusEffect(
        React.useCallback(() => {
            fetchProfile();
        }, [route.params?.refreshProfile]),
    );

    const fetchProfile = async (): Promise<void> => {
        try {
            const response = await userService.getProfile();
            if (response.success) {
                setUserData(response.data);
            } else {
                // Alert.alert('Error', 'Failed to fetch profile data');
            }
        } catch (error) {
            // Alert.alert('Error', 'Failed to fetch profile data');
        }
    };

    useEffect(() => {
        if (eventInfo?.scanCount !== undefined) {
            setCurrentScanCount(eventInfo.scanCount);
        }
    }, [eventInfo?.scanCount]);

    const handleTabPress = (tab: string): void => {
        if (tab === activeTab) return;
        setLocalActiveTab(tab);
        onTabChange?.(tab);

        const currentRouteName = route.name;

        const detailScreens = [
            'TicketsDetail',
            'DashboardDetail',
            'ManualCheckInAllTickets',
            'CheckInAllTickets',
            'TicketScanned',
            'ManualScanDetail',
            'ExploreDetailScreenTicketsTab',
            'ExploreEventScreen',
            'Profile',
        ];
        const isInDetailScreen = detailScreens.includes(currentRouteName);

        if (isInDetailScreen) {
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

    const handleCountPress = (): void => {
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

    const handleBackPress = (): void => {
        if (onBackPress) {
            onBackPress();
        } else if (navigation && navigation.goBack) {
            navigation.goBack();
        }
    };

    const shouldShowBackButton = (): boolean => {
        if (showBackButton) return true;
        const currentRouteName = route.name;
        const detailScreens = ['ManualCheckInAllTickets', 'CheckInAllTickets', 'TicketScanned', 'Profile'];
        return detailScreens.includes(currentRouteName);
    };

    return (
        <View style={styles.mainContainer}>
            <SafeAreaView style={[styles.safeAreaContainer, { paddingTop: topPadding }]}>
                <View style={styles.headerColumn}>
                    <View style={styles.header}>
                        {shouldShowBackButton() && (
                            <TouchableOpacity onPress={handleBackPress} style={styles.headerBackButton}>
                                <SvgIcons.whiteArrow />
                            </TouchableOpacity>
                        )}
                        <View
                            style={[
                                styles.headerContent,
                                shouldShowBackButton() && styles.headerContentWithBack,
                            ]}
                        >
                            <Text style={styles.eventName} numberOfLines={1} ellipsizeMode="tail">
                                {truncateEventName(eventInfo?.event_title) || 'OUTMOSPHERE'}
                            </Text>
                            <View style={styles.headerSpacer} />
                            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
                                {formatDateWithMonthName(eventInfo?.date) || '30 Oct 2025'}
                            </Text>
                            <Text style={styles.separator}>at</Text>
                            <Text style={styles.time} numberOfLines={1} ellipsizeMode="tail">
                                {eventInfo?.time || '7:00 PM'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.profileRow}>
                        <View style={styles.leftSection}>
                            <TouchableOpacity
                                style={styles.avatarContainer}
                                onPress={() => navigation.navigate('Profile', { userRole, eventInfo })}
                            >
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

                        <View style={styles.tabContainer}>
                            {tabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tab, activeTab === tab && styles.activeTab]}
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

export default Header;
