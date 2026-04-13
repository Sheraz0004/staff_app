import React from 'react';
import { View, Text } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { styles } from './OfflineIndicator.styles';

const OfflineIndicator: React.FC = () => {
    const { isOnline, queueSize, isSyncing } = useOfflineSync();

    if (isOnline && queueSize === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {!isOnline ? (
                <Text style={styles.text}>
                    ⚠️ Offline Mode - {queueSize} action{queueSize !== 1 ? 's' : ''} queued
                </Text>
            ) : isSyncing ? (
                <Text style={[styles.text, styles.syncing]}>
                    🔄 Syncing...
                </Text>
            ) : queueSize > 0 ? (
                <Text style={[styles.text, styles.syncing]}>
                    ✅ Online - {queueSize} action{queueSize !== 1 ? 's' : ''} syncing
                </Text>
            ) : null}
        </View>
    );
};

export default OfflineIndicator;
