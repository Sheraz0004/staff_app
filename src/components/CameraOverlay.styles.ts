import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlayContainer: {
        position: 'absolute',
        width: 303,
        height: 301,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frame: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    instructionText: {
        color: '#AE6F28',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        position: 'absolute',
    },
    qrCodeImage: {
        width: '70%',
        height: '70%',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerLine: {
        position: 'absolute',
        width: '70%',
        height: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 60,
    },
});
