import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(19, 19, 20, 0.95)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: color.borderBrown_CEBCA0,
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 34,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 26, 27, 0.9)',
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: color.borderBrown_CEBCA0,
        height: 46,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: color.grey_DEDCDC,
        fontSize: 16,
        fontWeight: '400',
    },
    clearButton: {
        padding: 5,
    },
    list: {
        flex: 1,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    countryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    flag: {
        fontSize: 24,
        marginRight: 15,
    },
    countryDetails: {
        flex: 1,
    },
    countryName: {
        marginBottom: 2,
    },
    countryCode: {
        textTransform: 'uppercase',
    },
    dialCode: {
        marginLeft: 10,
    },
    separator: {
        height: 1,
        backgroundColor: color.borderBrown_CEBCA0,
        marginLeft: 20,
        marginRight: 20,
    },
    noResults: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    noResultsText: {
        textAlign: 'center',
    },
});
