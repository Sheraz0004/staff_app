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
  // title: {
  //   fontSize: 16,
  //   fontWeight: "500",
  //   color: color.black_2F251D,
  //   marginLeft: 5,
  //   marginBottom: 10,
  // },
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
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: color.brown_3C200A,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueResultContainer: {
    minWidth: 16,
    alignItems: "flex-start",
  },
  separatorLine: {
    width: 1,
    height: 10,
    marginTop: 1,
    backgroundColor: color.black_544B45,
    marginHorizontal: 5,
  },
  dropdownButton: {
    padding: 8,
    marginLeft: 10,
  },
  dropdownIcon: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  subItemsContainer: {
    backgroundColor: '#F7E4B690',
    marginTop: 8,
    marginLeft: -15,
    marginRight: -15,
    marginBottom: 0,
    paddingBottom: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  subItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  subItemLabel: {
    fontSize: 12,
    color: color.black_544B45,
    fontWeight: "400",
  },
  remainingContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 10,
  },
  chevronContainer: {
    padding: 8,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    marginRight: 5,
  },
  analyticsButton: {
    padding: 4,
  },
  analyticsButtonSubItem: {
    padding: 4,
    marginRight: 38
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
});
