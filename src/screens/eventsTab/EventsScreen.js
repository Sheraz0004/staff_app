import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../../color/color';
import { logger } from '../../utils/logger';
import SvgIcons from '../../components/SvgIcons';
import Typography from '../../components/Typography';
import { useSelector } from 'react-redux';
import { useApi } from '../../services/useApi';
import { EVENT_SERVICES } from '../../services/EventService';
import { styles } from './EventsScreen.styles';
import Loader from '../../components/Loader/Loader';

const CountdownTimer = ({ days, hours, mins }) => (
  <View style={styles.countdownContainer}>
    <View style={styles.countdownBox}>
      <Typography weight="700" size={16} color={color.brown_3C200A}>
        {days.toString().padStart(2, '0')}
      </Typography>
      <Typography style={styles.countdownLabel} weight="400" size={11} color={color.brown_3C200A}>
        Days
      </Typography>
    </View>
    <View style={styles.countdownBox}>
      <Typography weight="700" size={16} color={color.brown_3C200A}>
        {hours.toString().padStart(2, '0')}
      </Typography>
      <Typography style={styles.countdownLabel} weight="400" size={11} color={color.brown_3C200A}>
        Hours
      </Typography>
    </View>
    <View style={styles.countdownBox}>
      <Typography weight="700" size={16} color={color.brown_3C200A}>
        {mins.toString().padStart(2, '0')}
      </Typography>
      <Typography style={styles.countdownLabel} weight="400" size={11} color={color.brown_3C200A}>
        Min
      </Typography>
    </View>
  </View>
);

const LargeEventCard = ({ event, onPress }) => (
  <TouchableOpacity style={styles.largeCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.largeImageContainer}>
      <Image source={{ uri: event.image }} style={styles.largeImage} />
      <TouchableOpacity style={styles.bookmarkButton}>
        <SvgIcons.bookmarkedIcon />
      </TouchableOpacity>
    </View>
    <View style={styles.cardContent}>
      <Typography style={styles.eventTitle} weight="700" size={13} color={color.brown_3C200A}>
        {event.title || event.event_title}
      </Typography>
      <Typography style={styles.eventDate} weight="400" size={10} color={color.grey_87807C}>
        {event.date}
      </Typography>
      <Typography style={styles.eventTime} weight="400" size={10} color={color.grey_87807C}>
        {event.time}
      </Typography>
      <Typography style={styles.eventLocation} weight="400" size={10} color={color.brown_766F6A} numberOfLines={1}>
        {event.location || event.cityName}
      </Typography>
    </View>
  </TouchableOpacity>
);

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
      <Typography style={styles.smallEventTitle} weight="700" size={13} color={color.brown_3C200A} numberOfLines={1}>
        {event.title || event.event_title}
      </Typography>
      <Typography style={styles.smallEventDate} weight="400" size={10} color={color.grey_87807C}>
        {event.date}
      </Typography>
      <Typography style={styles.smallEventTime} weight="400" size={10} color={color.grey_87807C}>
        {event.time}
      </Typography>
      <Typography style={styles.smallEventLocation} weight="400" size={10} color={color.brown_766F6A} numberOfLines={1}>
        {event.location || event.cityName}
      </Typography>
    </View>
  </TouchableOpacity>
);

const UpcomingEventItem = ({ event, onPress }) => (
  <TouchableOpacity style={styles.upcomingItem} onPress={onPress} activeOpacity={0.8}>
    <Image source={{ uri: event.image }} style={styles.upcomingImage} />
    <View style={styles.upcomingContent}>
      <Typography style={styles.upcomingTitle} weight="600" size={13} color={color.brown_3C200A}>
        {event.title || event.event_title}
      </Typography>
      <View style={styles.upcomingMeta}>
        <Typography style={styles.upcomingDate} weight="400" size={10} color={color.grey_87807C}>
          {event.date}
        </Typography>
        {event.time ? (
          <>
            <View style={styles.upcomingDot} />
            <Typography style={styles.upcomingTime} weight="400" size={10} color={color.grey_87807C}>
              {event.time}
            </Typography>
          </>
        ) : null}
      </View>
      <Typography style={styles.upcomingLocation} weight="400" size={10} color={color.brown_766F6A}>
        {event.location || event.cityName}
      </Typography>
    </View>
    <TouchableOpacity style={styles.upcomingBookmark}>
      <SvgIcons.bookmarkedIcon />
    </TouchableOpacity>
  </TouchableOpacity>
);

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
            <Typography style={styles.sectionTitle} weight="700" size={14} color={color.placeholderTxt_24282C}>
              {section.title}
            </Typography>
            <SvgIcons.rightArrow width={10} height={10} />
          </TouchableOpacity>
          {section.subtitle && (
            <Typography style={styles.sectionSubtitle} weight="400" size={12} color={color.red_BA1C11}>
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

const EventsScreen = ({ eventInfo, onEventChange }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const authUser = useSelector((state) => state.entities.user.user);

  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 0)
    : insets.top;

  const [eventSections, setEventSections] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const { loading, requestCall } = useApi(EVENT_SERVICES.fetchStaffEvents, false, false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const staffResponse = await requestCall(authUser?.id);
      const accessList = staffResponse?.data?.staffEventAccess || [];
      const eventIds = accessList.flatMap(entry => entry.eventIds || []);

      const allEvents = eventIds.map(id => ({ eventUuid: id }));

      const transformedEvents = allEvents
        .filter(event => event.uuid || event.eventUuid)
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

      logger.log('Fetched events for EventsScreen:', transformedEvents);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(todayStart);
      weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

      const parseEventDate = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return null;
        let parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) return parsed;
        const withYear = dateStr + ', ' + now.getFullYear();
        parsed = new Date(withYear);
        if (!isNaN(parsed.getTime())) return parsed;
        const dashParts = dateStr.split(' - ');
        if (dashParts.length > 0) {
          const firstPart = dashParts[0].trim();
          parsed = new Date(firstPart + ', ' + now.getFullYear());
          if (!isNaN(parsed.getTime())) return parsed;
          parsed = new Date(firstPart);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) return parsed;
        }
        return null;
      };

      const dateBuckets = { today: [], thisWeek: [], upcoming: [] };
      let dateParseSuccessCount = 0;

      transformedEvents.forEach((event) => {
        const eventDate = parseEventDate(event.date);
        if (!eventDate) { dateBuckets.upcoming.push(event); return; }
        dateParseSuccessCount++;
        const eventDayStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        if (eventDayStart.getTime() === todayStart.getTime()) {
          dateBuckets.today.push(event);
        } else if (eventDayStart > todayStart && eventDayStart < weekEnd) {
          dateBuckets.thisWeek.push(event);
        } else {
          dateBuckets.upcoming.push(event);
        }
      });

      const nonEmptyBuckets = [dateBuckets.today, dateBuckets.thisWeek, dateBuckets.upcoming]
        .filter(b => b.length > 0).length;
      const useDateBased = dateParseSuccessCount > 0 && (nonEmptyBuckets > 1 || transformedEvents.length <= 1);

      const happeningToday = [];
      const comingUpThisWeek = [];
      const upcoming = [];

      if (useDateBased) {
        happeningToday.push(...dateBuckets.today);
        comingUpThisWeek.push(...dateBuckets.thisWeek);
        upcoming.push(...dateBuckets.upcoming);
      } else {
        transformedEvents.forEach((event, index) => {
          if (index === 0) happeningToday.push(event);
          else if (index === 1) comingUpThisWeek.push(event);
          else upcoming.push(event);
        });
      }

      const showToday = happeningToday.length > 0;
      const showThisWeek = comingUpThisWeek.length > 0;
      const showUpcoming = upcoming.length > 0;

      const sections = [];

      if (showToday) {
        sections.push({
          title: 'Happening Today',
          subtitle: happeningToday.length > 1 ? 'Ending in:' : 'Starting in:',
          countdown: { days: 0, hours: 12, mins: 5 },
          events: happeningToday,
        });
      }

      if (showThisWeek) {
        sections.push({
          title: 'Coming Up This Week',
          events: comingUpThisWeek,
          forceVertical: !showToday && !showUpcoming,
        });
      }

      if (!showToday && !showThisWeek && showUpcoming) {
        sections.push({
          title: 'Upcoming',
          events: upcoming,
          forceVertical: true,
        });
        setUpcomingEvents([]);
      } else {
        setUpcomingEvents(upcoming);
      }

      setEventSections(sections);
    } catch (error) {
      logger.error('Error fetching events for EventsScreen:', error?.response?.data || error?.message);
      setEventSections([]);
      setUpcomingEvents([]);
    }
  };

  const handleEventPress = (event) => {
    const eventUuid = event._originalUuid || event.uuid || event.eventUuid;
    if (!eventUuid || eventUuid.length < 10) {
      logger.error('Invalid event UUID, cannot navigate:', eventUuid);
      return;
    }

    const eventForChange = {
      uuid: eventUuid,
      eventUuid: eventUuid,
      title: event.title || event.event_title,
      event_title: event.title || event.event_title,
      cityName: event.cityName || event.location,
      date: event.date,
      time: event.time,
    };

    if (onEventChange) onEventChange(eventForChange);

    navigation.navigate('DashboardDetail', {
      eventInfo: eventForChange,
      showEventDashboard: true,
    });
  };

  const handleSectionPress = (section) => {
    navigation.navigate('ExploreEventScreen', {
      sectionTitle: section.title === 'Happening Today' ? 'Explore Events' : section.title,
      events: section.events,
      onEventChange,
    });
  };

  const handleUpcomingSectionPress = () => {
    if (upcomingEvents.length > 0) {
      navigation.navigate('ExploreEventScreen', {
        sectionTitle: 'Upcoming Events',
        events: upcomingEvents,
        onEventChange,
      });
    }
  };

 

  return (
    <View style={styles.container}>
      <Loader isLoading={loading}/>
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerButton} />
        <Typography style={styles.headerTitle} weight="700" size={18} color={color.brown_3C200A}>
          Events
        </Typography>
        <TouchableOpacity style={styles.headerButton}>
          <SvgIcons.searchIconDark />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {eventSections.map((section, index) => (
          <EventSection
            key={index}
            section={section}
            onEventPress={handleEventPress}
            onSectionPress={handleSectionPress}
          />
        ))}

        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingSection}>
            <TouchableOpacity
              style={styles.sectionTitleContainer}
              onPress={handleUpcomingSectionPress}
            >
              <Typography style={styles.sectionTitle} weight="700" size={14} color={color.placeholderTxt_24282C}>
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

        {eventSections.length === 0 && upcomingEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyStateText} weight="400" size={16} color={color.brown_766F6A}>
              No events available
            </Typography>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default EventsScreen;
