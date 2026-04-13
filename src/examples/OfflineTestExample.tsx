/**
 * Example: How to check offline sync status
 *
 * You can add this to any screen to test offline functionality
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { offlineDebug } from '../utils/offlineDebug';
import { offlineStorage } from '../utils/offlineStorage';
import { offlineQueue } from '../utils/offlineQueue';
import { networkService } from '../utils/network';
import OfflineDebugPanel from '../components/OfflineDebugPanel';
import { styles } from './OfflineTestExample.styles';

interface OfflineTestExampleProps {
  eventUuid?: any;
}

const OfflineTestExample: React.FC<OfflineTestExampleProps> = ({ eventUuid }) => {
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [status, setStatus] = useState<any>(null);

  // Quick status check
  const checkStatus = async (): Promise<void> => {
    const isOnline = networkService.isConnected();
    const queueSize = await offlineQueue.getQueueSize();
    const ticketCount = eventUuid ? await offlineStorage.getTicketCount(eventUuid) : 0;

    Alert.alert(
      'Offline Status',
      `Online: ${isOnline ? 'Yes' : 'No'}\n` +
      `Queue: ${queueSize} items\n` +
      `Tickets: ${ticketCount}`
    );
  };

  // Get detailed status
  const getDetailedStatus = async (): Promise<void> => {
    const detailed = await offlineDebug.getOfflineStatus();
    setStatus(detailed);
    setShowDebug(true);
  };

  // Run tests
  const runTests = async (): Promise<void> => {
    const results = await offlineDebug.testOfflineFunctionality();

    const message = results.allPassed
      ? 'All tests passed! ✅'
      : `Some tests failed:\n${results.errors.join('\n')}`;

    Alert.alert('Test Results', message);
  };

  // Print status to console
  const printStatus = async (): Promise<void> => {
    await offlineDebug.printStatus();
    Alert.alert('Status', 'Check console for detailed status');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Sync Testing</Text>

      <TouchableOpacity style={styles.button} onPress={checkStatus}>
        <Text style={styles.buttonText}>Quick Status</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={getDetailedStatus}>
        <Text style={styles.buttonText}>Detailed Status</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={runTests}>
        <Text style={styles.buttonText}>Run Tests</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={printStatus}>
        <Text style={styles.buttonText}>Print to Console</Text>
      </TouchableOpacity>

      <OfflineDebugPanel
        visible={showDebug}
        onClose={() => setShowDebug(false)}
      />
    </View>
  );
};

export default OfflineTestExample;

/**
 * USAGE IN YOUR APP:
 *
 * 1. Import in any screen:
 *    import OfflineTestExample from '../examples/OfflineTestExample';
 *
 * 2. Add to your component:
 *    <OfflineTestExample eventUuid={eventInfo?.eventUuid} />
 *
 * 3. Or use individual functions:
 *    import { offlineDebug } from '../utils/offlineDebug';
 *    const status = await offlineDebug.getOfflineStatus();
 */
