import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: color.white_FFFFFF,
    padding: 15,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 6
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 4,
    color: color.black_544B45,
  },
  headerValue: {
    fontSize: 14,
    fontWeight: "500",
    color: color.brown_3C200A,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  textContainer: {
    marginBottom: 2,
    marginLeft: 16,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: color.black_544B45,
    fontWeight: "400",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueResultContainer: {
    minWidth: 24,
    alignItems: "flex-end",
  },
  separatorLine: {
    width: 1,
    height: 10,
    marginTop: 1,
    backgroundColor: color.black_544B45,
  },
  valueTotalContainer: {
    width: 120,
    alignItems: "flex-start",
  },
  dropdownButton: {
    paddingRight: 8,
  },
  valueResult: {
    fontSize: 14,
    fontWeight: "700",
    color: color.placeholderTxt_24282C,
  },
  valueTotal: {
    fontSize: 14,
    fontWeight: "400",
    color: color.black_544B45,
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
