import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
    container: {
        marginHorizontal: 2,
        marginVertical: 2
    },
    wrapper: {
        backgroundColor: color.white_FFFFFF,
        borderColor: color.white_FFFFFF,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
    },
    heading: {
        fontSize: 15,
        fontWeight: "500",
        marginBottom: 16,
        color: color.placeholderTxt_24282C,
        alignSelf: "flex-start",
    },
    noDataContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    noDataText: {
        fontSize: 14,
        color: color.brown_766F6A,
        textAlign: "center",
    },
});
