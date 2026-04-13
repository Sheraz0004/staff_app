import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
    },
    modalView: {
        margin: 15,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        position: 'relative',
    },
    button: {
        backgroundColor: color.btnBrown_AE6F28,
        width: '100%',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: color.btnTxt_FFF6DF,
        fontSize: 16,
        fontWeight: '700',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        color: '#3C200A',
        fontSize: 18,
        fontWeight: '500',
    },
    noteInput: {
        borderWidth: 1,
        borderColor: '#CEBCA0',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        width: '100%',
        color: color.black_544B45,
        minHeight: 100,
        maxHeight: 100,
        lineHeight: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 20,
        zIndex: 1,
    },
});
