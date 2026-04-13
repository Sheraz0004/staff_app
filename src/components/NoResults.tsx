import React from 'react';
import { View, Text } from 'react-native';
import SvgIcons from './SvgIcons';
import { styles } from './NoResults.styles';

interface NoResultsProps {
    message?: string;
}

const NoResults: React.FC<NoResultsProps> = ({ message = 'No Matching Results' }) => {
    return (
        <View style={styles.container}>
            <SvgIcons.noResultsIcon width={29} height={29} />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

export default NoResults;
