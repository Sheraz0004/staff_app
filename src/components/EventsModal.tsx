import React, { useState, useEffect } from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { color } from '../color/color';
import { eventService } from '../api/apiService';
import { Body1 } from './Typography';
import { logger } from '../utils/logger';
import { styles } from './EventsModal.styles';

interface EventItem {
    uuid: string;
    title: string;
}

interface EventsModalProps {
    visible: boolean;
    onClose: () => void;
    onEventSelect: (event: EventItem) => void;
    currentEventUuid?: string;
}

const EventsModal: React.FC<EventsModalProps> = ({
    visible,
    onClose,
    onEventSelect,
    currentEventUuid,
}) => {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            fetchEvents();
        }
    }, [visible]);

    const fetchEvents = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventService.fetchStaffEvents();

            if (response?.data && response.data.length > 0) {
                const eventsData = response.data;

                const transformedEvents: EventItem[] = eventsData.map((event: any) => ({
                    uuid: event.uuid || event.id,
                    title: event.event_title || event.title,
                }));

                setEvents(transformedEvents);
            } else {
                setEvents([]);
            }
        } catch (err) {
            logger.error('Error fetching events:', err);
            setError('Failed to load events');
            Alert.alert('Error', 'Failed to load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEventPress = (event: EventItem): void => {
        onEventSelect(event);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.modalContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
                            <Body1 style={styles.loadingText}>Loading events...</Body1>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Body1 style={styles.errorText}>{error}</Body1>
                            <TouchableOpacity onPress={fetchEvents} style={styles.retryButton}>
                                <Body1 style={styles.retryButtonText}>Retry</Body1>
                            </TouchableOpacity>
                        </View>
                    ) : events.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Body1 style={styles.emptyText}>No events available</Body1>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.eventsList}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                        >
                            {events.map((item, index) => (
                                <TouchableOpacity
                                    key={item.uuid || index}
                                    style={[
                                        styles.eventItem,
                                        index === 0 && styles.firstEventItem,
                                        index === events.length - 1 && styles.lastEventItem,
                                    ]}
                                    onPress={() => handleEventPress(item)}
                                >
                                    <Body1
                                        style={[
                                            styles.eventTitle,
                                            currentEventUuid === item.uuid && styles.selectedEventTitle,
                                        ]}
                                    >
                                        {item.title || 'No title'}
                                    </Body1>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default EventsModal;
