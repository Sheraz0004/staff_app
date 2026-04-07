import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../color/color';
import { eventService } from '../../api/apiService';
import { logger } from '../../utils/logger';
import SvgIcons from '../../components/SvgIcons';
import Typography from '../../components/Typography';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

// Countdown Timer Component
const CountdownTimer = ({ days, hours, mins }) => (
  <View style={styles.countdownContainer}>
    <View style={styles.countdownBox}>
      <Typography
        style={styles.countdownNumber}
        weight="700"
        size={16}
        color={color.brown_3C200A}
      >
        {days.toString().padStart(2, '0')}
      </Typography>
      <Typography
        style={styles.countdownLabel}
        weight="400"
        size={11}
        color={color.brown_3C200A}
      >
        Days
      </Typography>
    </View>
    <View style={styles.countdownBox}>
      <Typography
        style={styles.countdownNumber}
        weight="700"
        size={16}
        color={color.brown_3C200A}
      >
        {hours.toString().padStart(2, '0')}
      </Typography>
      <Typography
        style={styles.countdownLabel}
        weight="400"
        size={11}
        color={color.brown_3C200A}
      >
        Hours
      </Typography>
    </View>
    <View style={styles.countdownBox}>
      <Typography
        style={styles.countdownNumber}
        weight="700"
        size={16}
        color={color.brown_3C200A}
      >
        {mins.toString().padStart(2, '0')}
      </Typography>
      <Typography
        style={styles.countdownLabel}
        weight="400"
        size={11}
        color={color.brown_3C200A}
      >
        Min
      </Typography>
    </View>
  </View>
);

// Single Large Event Card (for single event in section)
const LargeEventCard = ({ event, onPress }) => (
  <TouchableOpacity style={styles.largeCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.largeImageContainer}>
      <Image source={{ uri: event.image }} style={styles.largeImage} />
      <TouchableOpacity style={styles.bookmarkButton}>
        <SvgIcons.bookmarkedIcon />
      </TouchableOpacity>
    </View>
    <View style={styles.cardContent}>
      <Typography
        style={styles.eventTitle}
        weight="700"
        size={13}
        color={color.brown_3C200A}
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

// Small Event Card (for multiple events - horizontal scroll)
const SmallEventCard = ({ event, isFirst, onPress }) => (
  <TouchableOpacity
    style={[styles.smallCard, isFirst && { marginLeft: 20 }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.smallImageContainer}>
      <Image source={{ uri: event.image }} style={styles.smallImage} />
      <TouchableOpacity style={styles.bookmarkButtonSmall}>
        <SvgIcons.bookmarkedIcon />
      </TouchableOpacity>
    </View>
    <View style={styles.smallCardContent}>
      <Typography
        style={styles.smallEventTitle}
        weight="700"
        size={13}
        color={color.brown_3C200A}
        numberOfLines={1}
      >
        {event.title || event.event_title}
      </Typography>
      <Typography
        style={styles.smallEventDate}
        weight="400"
        size={10}
        color={color.grey_87807C}
      >
        {event.date}
      </Typography>
      <Typography
        style={styles.smallEventTime}
        weight="400"
        size={10}
        color={color.grey_87807C}
      >
        {event.time}
      </Typography>
      <Typography
        style={styles.smallEventLocation}
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

// Upcoming Event List Item
const UpcomingEventItem = ({ event, onPress }) => (
  <TouchableOpacity style={styles.upcomingItem} onPress={onPress} activeOpacity={0.8}>
    <Image source={{ uri: event.image }} style={styles.upcomingImage} />
    <View style={styles.upcomingContent}>
      <Typography
        style={styles.upcomingTitle}
        weight="600"
        size={13}
        color={color.brown_3C200A}
      >
        {event.title || event.event_title}
      </Typography>
      <View style={styles.upcomingMeta}>
        <Typography
          style={styles.upcomingDate}
          weight="400"
          size={10}
          color={color.grey_87807C}
        >
          {event.date}
        </Typography>
        {event.time ? (
          <>
            <View style={styles.upcomingDot} />
            <Typography
              style={styles.upcomingTime}
              weight="400"
              size={10}
              color={color.grey_87807C}
            >
              {event.time}
            </Typography>
          </>
        ) : null}
      </View>
      <Typography
        style={styles.upcomingLocation}
        weight="400"
        size={10}
        color={color.brown_766F6A}
      >
        {event.location || event.cityName}
      </Typography>
    </View>
    <TouchableOpacity style={styles.upcomingBookmark}>
      <SvgIcons.bookmarkedIcon />
    </TouchableOpacity>
  </TouchableOpacity>
);

// Event Section Component - handles single vs multiple events
const EventSection = ({ section, onEventPress, onSectionPress }) => {
  const isSingleEvent = section.events.length === 1;
  const isHappeningToday = section.title === 'Happening Today';

  const forceVertical = section.forceVertical === true;

  return (
    <View style={[styles.section, isHappeningToday && styles.happeningTodaySection]}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <TouchableOpacity
            style={styles.sectionTitleContainer}
            onPress={() => onSectionPress && onSectionPress(section)}
          >
            <Typography
              style={styles.sectionTitle}
              weight="700"
              size={14}
              color={color.placeholderTxt_24282C}
            >
              {section.title}
            </Typography>
            <SvgIcons.rightArrow width={10} height={10} />
          </TouchableOpacity>
          {section.subtitle && (
            <Typography
              style={styles.sectionSubtitle}
              weight="400"
              size={12}
              color={color.red_BA1C11}
            >
              {section.subtitle}
            </Typography>
          )}
        </View>
        {section.countdown && <CountdownTimer {...section.countdown} />}
      </View>

      {isSingleEvent || forceVertical ? (
        <View style={styles.singleEventContainer}>
          {section.events.map((event, index) => (
            <LargeEventCard
              key={`${event.uuid || event.eventUuid}-${index}`}
              event={event}
              onPress={() => onEventPress && onEventPress(event)}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={section.events}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.uuid || item.eventUuid}-${index}`}
          renderItem={({ item, index }) => (
            <SmallEventCard
              event={item}
              isFirst={index === 0}
              onPress={() => onEventPress && onEventPress(item)}
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      )}
    </View>
  );
};

// Main Events Screen Component
const EventsScreen = ({ eventInfo, onEventChange }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const authUser = useSelector((state) => state.entities.user.user);
  // Calculate top padding for safe area
  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  const [loading, setLoading] = useState(true);
  const [eventSections, setEventSections] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Toggle between single and multiple events display mode (for demo)
  const [isMultipleMode, setIsMultipleMode] = useState(false);

  // -----------------------------------------------------------
  // TEST MODE: Controls which sections are visible for testing
  // 0 = All sections (normal flow)
  // 1 = Only "Happening Today" (no Coming Up, no Upcoming)
  // 2 = Only "Coming Up This Week" + "Upcoming" (no Happening Today)
  // 3 = Only "Upcoming" shown as card UI (no Happening Today, no Coming Up)
  // Remove testMode in production!
  // -----------------------------------------------------------
  const [testMode, setTestMode] = useState(0);
  const testModeLabels = [
    'All Sections',
    'Only Happening Today',
    'No Happening Today',
    'Only Upcoming',
    'Only Coming Up This Week',
  ];

  // Fetch real events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const staffEventsData = await eventService.fetchStaffEvents(authUser?.identityId);
        const eventsList = staffEventsData?.data || [];

        logger.log('Fetched events for EventsScreen:', eventsList);

        // Process events - handle both direct events array and nested structure
        let allEvents = [];
        eventsList.forEach(item => {
          if (item.events && Array.isArray(item.events)) {
            allEvents = [...allEvents, ...item.events];
          } else if (item.uuid) {
            allEvents.push(item);
          }
        });

        // Transform all events with proper UUIDs
        const transformedEvents = allEvents
          .filter(event => event.uuid || event.eventUuid) // Only include events with valid UUIDs
          .map(event => {
            const eventUuid = event.uuid || event.eventUuid;
            return {
              uuid: eventUuid,
              eventUuid: eventUuid,
              title: event.title || event.event_title,
              event_title: event.title || event.event_title,
              image: event.image || event.banner_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
              date: event.start_date || event.date || 'N/A',
              time: event.start_time || event.time || '',
              location: event.location?.city || event.cityName || event.venue || 'N/A',
              cityName: event.location?.city || event.cityName,
              isBookmarked: false,
            };
          });

        // Organize events into sections based on mode
        const happeningToday = [];
        const comingUpThisWeek = [];
        const upcoming = [];

        // -------------------------------------------------------
        // Categorize events into sections
        // Strategy: Try date-based first, fall back to index-based
        // if date parsing fails or all events end up in one bucket
        // -------------------------------------------------------
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // End of current week (Sunday)
        const weekEnd = new Date(todayStart);
        weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

        // Helper: try to parse event date string into a Date object
        const parseEventDate = (dateStr) => {
          if (!dateStr || dateStr === 'N/A') return null;

          // Try ISO format first: "2025-06-13"
          let parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
            return parsed;
          }

          // Try adding current year for formats like "Wed, June 13" or "June 10"
          const withYear = dateStr + ', ' + now.getFullYear();
          parsed = new Date(withYear);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }

          // Try extracting date from formats like "Sun, June 10 - Wed, June 13"
          const dashParts = dateStr.split(' - ');
          if (dashParts.length > 0) {
            const firstPart = dashParts[0].trim();
            const withYear2 = firstPart + ', ' + now.getFullYear();
            parsed = new Date(withYear2);
            if (!isNaN(parsed.getTime())) {
              return parsed;
            }
            parsed = new Date(firstPart);
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
              return parsed;
            }
          }

          return null;
        };

        // Attempt date-based categorization
        const dateBuckets = { today: [], thisWeek: [], upcoming: [] };
        let dateParseSuccessCount = 0;

        transformedEvents.forEach((event) => {
          const eventDate = parseEventDate(event.date);

          if (!eventDate) {
            dateBuckets.upcoming.push(event);
            return;
          }

          dateParseSuccessCount++;

          const eventDayStart = new Date(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            eventDate.getDate()
          );

          if (eventDayStart.getTime() === todayStart.getTime()) {
            dateBuckets.today.push(event);
          } else if (eventDayStart > todayStart && eventDayStart < weekEnd) {
            dateBuckets.thisWeek.push(event);
          } else if (eventDayStart >= weekEnd) {
            dateBuckets.upcoming.push(event);
          } else {
            // Past events — still show in upcoming
            dateBuckets.upcoming.push(event);
          }
        });

        // Decide whether to use date-based or index-based categorization
        // Use index-based fallback if:
        // - Most dates failed to parse
        // - OR all events ended up in a single bucket despite having multiple events
        const totalEvents = transformedEvents.length;
        const nonEmptyBuckets = [dateBuckets.today, dateBuckets.thisWeek, dateBuckets.upcoming]
          .filter(b => b.length > 0).length;
        const useDateBased = dateParseSuccessCount > 0 && (nonEmptyBuckets > 1 || totalEvents <= 1);

        if (useDateBased) {
          // Date-based categorization worked well
          happeningToday.push(...dateBuckets.today);
          comingUpThisWeek.push(...dateBuckets.thisWeek);
          upcoming.push(...dateBuckets.upcoming);
        } else {
          // Fallback: index-based distribution
          logger.log('Using index-based fallback for event categorization');
          transformedEvents.forEach((event, index) => {
            if (index === 0) {
              happeningToday.push(event);
            } else if (index === 1) {
              comingUpThisWeek.push(event);
            } else {
              upcoming.push(event);
            }
          });
        }

        // -----------------------------------------------------------
        // MULTIPLE MODE OVERRIDE (for demo/testing)
        // When isMultipleMode is ON, ensure sections that have events
        // get at least 2-3 events so horizontal scroll UI is visible.
        // Remove in production — real API will naturally have
        // multiple events per date bucket.
        // -----------------------------------------------------------
        if (isMultipleMode && transformedEvents.length > 1) {
          const allAvailable = [...transformedEvents];

          // Helper: ensure a bucket has multiple events by borrowing from all available
          // Adds unique suffix to borrowed event UUIDs to avoid duplicate key warnings
          const ensureMultiple = (bucket) => {
            if (bucket.length > 0 && bucket.length < 2) {
              const extras = allAvailable.filter(e => !bucket.some(b => b.uuid === e.uuid));
              extras.slice(0, 2).forEach((event, idx) => {
                const dupSuffix = `_dup_${Date.now()}_${idx}`;
                bucket.push({
                  ...event,
                  uuid: `${event.uuid}${dupSuffix}`,
                  eventUuid: `${event.eventUuid}${dupSuffix}`,
                  _originalUuid: event.uuid,  // Store original UUID for navigation
                  _originalEventUuid: event.eventUuid,
                });
              });
            }
          };

          ensureMultiple(happeningToday);
          ensureMultiple(comingUpThisWeek);
        }

        // -----------------------------------------------------------
        // Conditional section display logic:
        //
        // Case 1: No "Happening Today" events
        //   → Only show "Coming Up This Week" + "Upcoming" sections
        //
        // Case 2: No "Happening Today" AND no "Coming Up This Week"
        //   → Only show "Upcoming" section, but render it with
        //     card-based UI (like "Coming Up This Week" style)
        //     using EventSection component instead of list-style
        //
        // Case 3: No "Coming Up This Week" AND no "Upcoming"
        //   → Only show "Happening Today" section
        // -----------------------------------------------------------

        const hasToday = happeningToday.length > 0;
        const hasThisWeek = comingUpThisWeek.length > 0;
        const hasUpcoming = upcoming.length > 0;

        // -----------------------------------------------------------
        // TEST MODE OVERRIDES (remove in production)
        // Force-clear sections based on testMode to simulate scenarios
        // -----------------------------------------------------------
        let filteredHappeningToday = happeningToday;
        let filteredComingUpThisWeek = comingUpThisWeek;
        let filteredUpcoming = upcoming;

        if (testMode === 1) {
          // Only Happening Today — clear others
          filteredComingUpThisWeek = [];
          filteredUpcoming = [];
        } else if (testMode === 2) {
          // No Happening Today — clear today, keep rest
          filteredHappeningToday = [];
        } else if (testMode === 3) {
          // Only Upcoming (card UI) — clear today and this week
          // Consolidate ALL events into upcoming for proper testing
          filteredHappeningToday = [];
          filteredComingUpThisWeek = [];
          filteredUpcoming = [...happeningToday, ...comingUpThisWeek, ...upcoming];
        } else if (testMode === 4) {
          // Only Coming Up This Week — clear today and upcoming
          filteredHappeningToday = [];
          filteredUpcoming = [];
          // If no coming up events exist, move some from other buckets for testing
          if (filteredComingUpThisWeek.length === 0) {
            filteredComingUpThisWeek = [...happeningToday, ...upcoming];
          }
        }

        const showToday = filteredHappeningToday.length > 0;
        const showThisWeek = filteredComingUpThisWeek.length > 0;
        const showUpcoming = filteredUpcoming.length > 0;

        const sections = [];

        if (showToday) {
          sections.push({
            title: 'Happening Today',
            subtitle: filteredHappeningToday.length > 1 ? 'Ending in:' : 'Starting in:',
            countdown: { days: 0, hours: 12, mins: 5 },
            events: filteredHappeningToday,
          });
        }

        if (showThisWeek) {
          sections.push({
            title: 'Coming Up This Week',
            events: filteredComingUpThisWeek,
            // Force vertical large cards when it's the only section
            forceVertical: !showToday && !showUpcoming,
          });
        }

        // When there's no "Happening Today" AND no "Coming Up This Week",
        // promote Upcoming into an EventSection with vertical large card UI
        if (!showToday && !showThisWeek && showUpcoming) {
          sections.push({
            title: 'Upcoming',
            events: filteredUpcoming,
            forceVertical: true, // Always vertical large cards when it's the only section
          });
          // Clear upcomingEvents so the list-style UI won't render
          setUpcomingEvents([]);
        } else {
          // Normal case: Upcoming shown in list style below sections
          setUpcomingEvents(filteredUpcoming);
        }

        setEventSections(sections);

      } catch (error) {
        logger.error('Error fetching events for EventsScreen:', error.response.data);
        // Show empty state instead of sample data
        setEventSections([]);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isMultipleMode, testMode]); // Re-fetch when mode or testMode changes

  // Handle event press - ONLY use real UUIDs from API
  const handleEventPress = (event) => {
    // Use original UUID if this is a duplicated event from multiple mode
    const eventUuid = event._originalUuid || event.uuid || event.eventUuid;

    if (!eventUuid || eventUuid.length < 10) {
      logger.error('Invalid event UUID, cannot navigate:', eventUuid);
      return;
    }

    logger.log('Event pressed with UUID:', eventUuid);

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
    navigation.navigate('DashboardDetail', {
      eventInfo: eventForChange,
      showEventDashboard: true,
    });
  };

  // Handle section title press - navigate to ExploreEventsScreen
  const handleSectionPress = (section) => {
    navigation.navigate('ExploreEventScreen', {
      sectionTitle: section.title === 'Happening Today' ? 'Explore Events' : section.title,
      events: section.events,
      onEventChange: onEventChange,
    });
  };

  // Handle upcoming section press
  const handleUpcomingSectionPress = () => {
    if (upcomingEvents.length > 0) {
      navigation.navigate('ExploreEventScreen', {
        sectionTitle: 'Upcoming Events',
        events: upcomingEvents,
        onEventChange: onEventChange,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
        <Typography
          style={styles.loadingText}
          weight="400"
          size={14}
          color={color.grey_87807C}
        >
          Loading events...
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <View style={styles.headerButton}>
        </View>
        <Typography
          style={styles.headerTitle}
          weight="700"
          size={18}
          color={color.brown_3C200A}
        >
          Events
        </Typography>
        <TouchableOpacity style={styles.headerButton}>
          <SvgIcons.searchIconDark />
        </TouchableOpacity>
      </View>

      {/* Header divider line */}
      <View style={styles.headerDivider} />

      {/* Test Mode Selector - Remove in production */}
      <View style={styles.testModeContainer}>
        <Typography
          weight="600"
          size={12}
          color={color.brown_3C200A}
          style={styles.testModeLabel}
        >
          Test Scenario:
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {testModeLabels.map((label, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.testModeButton,
                testMode === index && styles.testModeButtonActive,
              ]}
              onPress={() => setTestMode(index)}
            >
              <Typography
                weight={testMode === index ? '700' : '400'}
                size={11}
                color={testMode === index ? color.white_FFFFFF : color.btnBrown_AE6F28}
              >
                {label}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Demo Toggle - Remove in production */}
      <TouchableOpacity
        style={styles.demoToggle}
        onPress={() => setIsMultipleMode(!isMultipleMode)}
      >
        <Typography
          style={styles.demoToggleText}
          weight="500"
          size={12}
          color={color.btnBrown_AE6F28}
        >
          Mode: {isMultipleMode ? 'Multiple Events' : 'Single Event'} (Tap to switch)
        </Typography>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Sections (Happening Today, Coming Up This Week, or promoted Upcoming as cards) */}
        {eventSections.map((section, index) => (
          <EventSection
            key={index}
            section={section}
            onEventPress={handleEventPress}
            onSectionPress={handleSectionPress}
          />
        ))}

        {/* Upcoming Section (list style) - only renders when other sections exist above */}
        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingSection}>
            <TouchableOpacity
              style={styles.sectionTitleContainer}
              onPress={handleUpcomingSectionPress}
            >
              <Typography
                style={styles.sectionTitle}
                weight="700"
                size={14}
                color={color.placeholderTxt_24282C}
              >
                Upcoming
              </Typography>
              <SvgIcons.rightArrow width={10} height={10} />
            </TouchableOpacity>

            {upcomingEvents.map((event) => (
              <UpcomingEventItem
                key={event.uuid}
                event={event}
                onPress={() => handleEventPress(event)}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {eventSections.length === 0 && upcomingEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Typography
              style={styles.emptyStateText}
              weight="400"
              size={16}
              color={color.brown_766F6A}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.white_FFFFFF },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', },
  loadingText: { marginTop: 12, },
  demoToggle: { backgroundColor: color.btnTxt_FFF6DF, marginHorizontal: 20, padding: 12, borderRadius: 8, marginBottom: 16 },
  demoToggleText: { textAlign: 'center', },
  testModeContainer: { paddingHorizontal: 20, marginBottom: 8 },
  testModeLabel: { marginBottom: 8, },
  testModeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: color.btnBrown_AE6F28, marginRight: 8, },
  testModeButtonActive: { backgroundColor: color.btnBrown_AE6F28, borderColor: color.btnBrown_AE6F28, },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 2, },
  headerDivider: { height: 1.5, backgroundColor: '#E8E8E8', width: '100%', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 2, },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', },
  headerTitle: {},
  section: { marginBottom: 24, },
  happeningTodaySection: { backgroundColor: '#FFF6DF', paddingTop: 16, paddingBottom: 20, marginBottom: 24, },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16, },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 16, },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, },
  sectionTitle: {},
  sectionSubtitle: { marginTop: 2, },
  countdownContainer: { flexDirection: 'row', gap: 8, },
  countdownBox: { backgroundColor: color.white_FFFFFF, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 55, },
  countdownNumber: {},
  countdownLabel: { marginTop: 2, },
  singleEventContainer: { paddingHorizontal: 20, },
  largeCard: { marginBottom: 16, },
  largeImageContainer: { height: 200, },
  largeImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 8, },
  bookmarkButton: { position: 'absolute', top: 12, right: 12, padding: 8, },
  cardContent: { paddingTop: 10, },
  eventTitle: { marginBottom: 8, },
  eventDate: { marginBottom: 2, },
  eventTime: { marginBottom: 8, },
  eventLocation: {},
  horizontalList: { paddingRight: 20, },
  smallCard: { width: width * 0.55, marginRight: 12, },
  smallImageContainer: { height: 140, },
  smallImage: { width: '100%', height: '100%', borderRadius: 16, },
  bookmarkButtonSmall: { position: 'absolute', top: 10, right: 10, padding: 6, },
  smallCardContent: { paddingTop: 10, },
  smallEventTitle: { marginBottom: 6, },
  smallEventDate: { marginBottom: 2, },
  smallEventTime: { marginBottom: 6, },
  smallEventLocation: {},
  upcomingSection: { paddingHorizontal: 20, },
  upcomingItem: { flexDirection: 'row', borderRadius: 18, padding: 12, marginTop: 12, alignItems: 'center', backgroundColor: color.white_FFFFFF, shadowOffset: { width: 0, height: 8, }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 1, },
  upcomingImage: { width: 70, height: 70, borderRadius: 12, resizeMode: 'cover', },
  upcomingContent: { flex: 1, marginLeft: 12, },
  upcomingTitle: { marginBottom: 4, },
  upcomingMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  upcomingDate: {},
  upcomingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: color.brown_766F6A, marginHorizontal: 8, },
  upcomingTime: {},
  upcomingLocation: {},
  upcomingBookmark: { padding: 8, paddingBottom: 65, },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, },
  emptyStateText: {},
  bottomSpacer: { height: 40, },
});

export default EventsScreen;