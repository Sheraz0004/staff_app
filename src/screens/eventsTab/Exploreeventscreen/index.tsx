import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../color/color';
import { logger } from '../../utils/logger';
import SvgIcons from '../../components/SvgIcons';
import Typography from '../../components/Typography';
import { styles } from './Exploreeventscreen.styles';

const { width } = Dimensions.get('window');

interface EventItem {
  uuid?: string;
  eventUuid?: string;
  title?: string;
  event_title?: string;
  image?: string;
  date?: string;
  time?: string;
  location?: string;
  cityName?: string;
  isBookmarked?: boolean;
  [key: string]: any;
}

interface EventCardProps {
  event: EventItem;
  onPress: () => void;
  onBookmarkPress?: (uuid: string) => void;
}

// Event Card Component
const EventCard: React.FC<EventCardProps> = ({ event, onPress, onBookmarkPress }) => (
  <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.imageContainer}>
      <Image source={{ uri: event.image }} style={styles.eventImage} />
      <TouchableOpacity
        style={styles.bookmarkButton}
        onPress={() => onBookmarkPress && onBookmarkPress(event.uuid || event.eventUuid)}
      >
        <SvgIcons.bookmarkedIcon />
      </TouchableOpacity>
    </View>
    <View style={styles.cardContent}>
      <Typography
        style={styles.eventTitle}
        weight="700"
        size={13}
        color={color.placeholderTxt_24282C}
      >
        {event.title || event.event_title}
      </Typography>
      <Typography
        style={styles.eventDate}
        weight="400"
        size={10}
        color={color.grey_87807C}
      >
        {event.date}
      </Typography>
      <Typography
        style={styles.eventTime}
        weight="400"
        size={10}
        color={color.grey_87807C}
      >
        {event.time}
      </Typography>
      <Typography
        style={styles.eventLocation}
        weight="400"
        size={10}
        color={color.brown_766F6A}
        numberOfLines={1}
      >
        {event.location || event.cityName}
      </Typography>
    </View>
  </TouchableOpacity>
);

// Main Explore Events Screen Component
const ExploreEventsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Calculate top padding for safe area
  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  // Get section title, events, and onEventChange callback from route params
  const {
    sectionTitle = 'Explore Events',
    events: initialEvents = [],
    onEventChange
  } = route.params || {};

  const [events, setEvents] = useState<EventItem[]>(initialEvents);

  // Handle bookmark toggle
  const handleBookmarkPress = (eventUuid: string) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        (event.uuid || event.eventUuid) === eventUuid
          ? { ...event, isBookmarked: !event.isBookmarked }
          : event
      )
    );
  };

  // Handle event press - use onEventChange callback if available
  const handleEventPress = (event: EventItem) => {
    const eventUuid = event.uuid || event.eventUuid;

    if (!eventUuid || eventUuid.length < 10) {
      logger.error('Invalid event UUID in ExploreEventsScreen:', eventUuid);
      return;
    }

    logger.log('Event pressed in ExploreEventsScreen with UUID:', eventUuid);

    const eventForChange = {
      uuid: eventUuid,
      eventUuid: eventUuid,
      title: event.title || event.event_title,
      event_title: event.title || event.event_title,
      cityName: event.cityName || event.location,
      date: event.date,
      time: event.time,
    };

    if (onEventChange) {
      onEventChange(eventForChange);
    }

    // Navigate to DashboardDetail in root stack
    // Don't call goBack - keep ExploreEventsScreen in stack
    navigation.navigate('DashboardDetail', {
      eventInfo: eventForChange,
      showEventDashboard: true,
    });
  };

  // Handle back press
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
          <SvgIcons.backArrow />
        </TouchableOpacity>
        <Typography
          style={styles.headerTitle}
          weight="700"
          size={18}
          color={color.brown_3C200A}
        >
          {sectionTitle}
        </Typography>
        <TouchableOpacity style={styles.headerButton}>
          <SvgIcons.searchIconDark />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard
              key={event.uuid || event.eventUuid}
              event={event}
              onPress={() => handleEventPress(event)}
              onBookmarkPress={handleBookmarkPress}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Typography
              style={styles.emptyStateText}
              weight="400"
              size={16}
              color={color.grey_87807C}
            >
              No events available
            </Typography>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default ExploreEventsScreen;
