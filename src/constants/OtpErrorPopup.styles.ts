import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    conatiner: {
        width: '100%',
        paddingHorizontal: 30,
        marginBottom: 150,
    },
    modalContainer: {
        backgroundColor: '#131314',
        borderRadius: 20,
        padding: 10,
        alignItems: 'center',
        width: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    iconContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    errorIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: color.red_FF0000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        textAlign: 'center',
        lineHeight: 20,
    },
    resendButton: {
        backgroundColor: '#131314',
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignSelf: 'center',
        width: '100%',
        alignItems: 'center',
    },
});
