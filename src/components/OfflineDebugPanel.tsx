import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { offlineDebug } from '../utils/offlineDebug';
import { color } from '../color/color';
import { logger } from '../utils/logger';
import { styles } from './OfflineDebugPanel.styles';

interface TestResults {
    network: boolean;
    storage: boolean;
    queue: boolean;
    sync: boolean;
    errors: string[];
    allPassed?: boolean;
}

interface OfflineStatus {
    network?: { status: string };
    queue?: { size: number; breakdown: Record<string, number> };
    storage?: { cachedEvents: number; events: Array<{ eventUuid: string; ticketCount: number; storageSize: string; lastSync: string }> };
    sync?: { status: string };
}

interface OfflineDebugPanelProps {
    visible: boolean;
    onClose: () => void;
}

const OfflineDebugPanel: React.FC<OfflineDebugPanelProps> = ({ visible, onClose }) => {
    const [status, setStatus] = useState<OfflineStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [testResults, setTestResults] = useState<TestResults | null>(null);

    useEffect(() => {
        if (visible) {
            loadStatus();
        }
    }, [visible]);

    const loadStatus = async (): Promise<void> => {
        setLoading(true);
        try {
            const offlineStatus = await offlineDebug.getOfflineStatus();
            setStatus(offlineStatus);
        } catch (error) {
            logger.error('Error loading status:', error);
        } finally {
            setLoading(false);
        }
    };

    const runTests = async (): Promise<void> => {
        setLoading(true);
        try {
            const results = await offlineDebug.testOfflineFunctionality();
            setTestResults(results);
        } catch (error) {
            logger.error('Error running tests:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.panel}>
                <View style={styles.header}>
                    <Text style={styles.title}>Offline Sync Status</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {loading && !status ? (
                        <ActivityIndicator size="large" color={color.btnBrown_AE6F28} />
                    ) : (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Network</Text>
                                <Text style={styles.text}>
                                    Status: {status?.network?.status || 'Unknown'}
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Queue</Text>
                                <Text style={styles.text}>
                                    Size: {status?.queue?.size || 0} items
                                </Text>
                                {status?.queue?.breakdown && (
                                    <View style={styles.breakdown}>
                                        {Object.entries(status.queue.breakdown).map(([type, count]) => (
                                            <Text key={type} style={styles.breakdownItem}>
                                                {type}: {count}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Storage</Text>
                                <Text style={styles.text}>
                                    Cached Events: {status?.storage?.cachedEvents || 0}
                                </Text>
                                {status?.storage?.events?.map((event, idx) => (
                                    <View key={idx} style={styles.eventItem}>
                                        <Text style={styles.eventText}>
                                            Event: {event.eventUuid.substring(0, 8)}...
                                        </Text>
                                        <Text style={styles.eventText}>
                                            Tickets: {event.ticketCount}
                                        </Text>
                                        <Text style={styles.eventText}>
                                            Size: {event.storageSize}
                                        </Text>
                                        <Text style={styles.eventText}>
                                            Last Sync: {event.lastSync}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Sync</Text>
                                <Text style={styles.text}>
                                    Status: {status?.sync?.status || 'Unknown'}
                                </Text>
                            </View>

                            {testResults && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Test Results</Text>
                                    <Text style={styles.text}>
                                        Network: {testResults.network ? '✅' : '❌'}
                                    </Text>
                                    <Text style={styles.text}>
                                        Storage: {testResults.storage ? '✅' : '❌'}
                                    </Text>
                                    <Text style={styles.text}>
                                        Queue: {testResults.queue ? '✅' : '❌'}
                                    </Text>
                                    <Text style={styles.text}>
                                        Sync: {testResults.sync ? '✅' : '❌'}
                                    </Text>
                                    {testResults.errors?.length > 0 && (
                                        <View style={styles.errors}>
                                            {testResults.errors.map((error, idx) => (
                                                <Text key={idx} style={styles.errorText}>
                                                    {error}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>

                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={loadStatus}
                        style={[styles.button, styles.refreshButton]}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Refresh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={runTests}
                        style={[styles.button, styles.testButton]}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Run Tests</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default OfflineDebugPanel;
