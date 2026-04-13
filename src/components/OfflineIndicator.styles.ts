import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    container: {
        backgroundColor: color.btnBrown_AE6F28,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: color.white_FFFFFF,
        fontSize: 12,
        fontWeight: '500',
    },
    syncing: {
        backgroundColor: '#4BB543',
    },
});
