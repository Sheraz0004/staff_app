import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        marginTop: 100,
    },
    message: {
        fontSize: 16,
        color: color.brown_766F6A,
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '450',
    },
});
