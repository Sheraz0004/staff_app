import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    container: {
        position: 'absolute',
        backgroundColor: color.white_FFFFFF,
        borderRadius: 12,
        paddingVertical: 4,
        minWidth: 50,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    scroll: {
        maxHeight: 240,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    optionBorder: {
        borderBottomWidth: 0,
    },
});
