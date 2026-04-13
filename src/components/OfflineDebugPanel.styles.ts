import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    panel: {
        backgroundColor: color.white_FFFFFF,
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: color.borderBrown_CEBCA0,
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: color.black_544B45,
    },
    closeButton: {
        padding: 5,
    },
    closeText: {
        fontSize: 20,
        color: color.black_544B45,
    },
    content: {
        maxHeight: 400,
    },
    section: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: color.white_FFFFFF,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: color.borderBrown_CEBCA0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: color.btnBrown_AE6F28,
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: color.black_544B45,
        marginBottom: 5,
    },
    breakdown: {
        marginTop: 10,
    },
    breakdownItem: {
        fontSize: 12,
        color: color.black_544B45,
        marginLeft: 10,
    },
    eventItem: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
    },
    eventText: {
        fontSize: 12,
        color: color.black_544B45,
        marginBottom: 3,
    },
    errors: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#ffebee',
        borderRadius: 5,
    },
    errorText: {
        fontSize: 12,
        color: '#c62828',
        marginBottom: 5,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: color.borderBrown_CEBCA0,
        paddingTop: 15,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        minWidth: 100,
        alignItems: 'center',
    },
    refreshButton: {
        backgroundColor: color.btnBrown_AE6F28,
    },
    testButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: color.white_FFFFFF,
        fontWeight: 'bold',
    },
});
