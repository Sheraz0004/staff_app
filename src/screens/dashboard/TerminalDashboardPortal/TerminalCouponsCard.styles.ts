import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
    card: {
        backgroundColor: color.white_FFFFFF,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 40,
        overflow: 'visible',
    },
    cardTitle: {
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        gap: 12,
    },
});
