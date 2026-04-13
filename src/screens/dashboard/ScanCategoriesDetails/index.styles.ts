import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: color.black_2F251D,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingVertical: 8,
    padding: 15,
  },
  subRow: {
    marginLeft: 0,
    backgroundColor: "transparent",
  },
  subRowBg: {
    backgroundColor: '#F7E4B660',
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  textContainer: {
    marginBottom: 2,
    marginLeft: 16,
    flex: 1,
  },
  label: {
    fontSize: 15,
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
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingVertical: 8,
    padding: 15,
    borderBottomColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 15,
    color: color.black_544B45,
    fontWeight: "500",
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 4,
  },
  chevronContainer: {
    padding: 8,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subitembg: {
    backgroundColor: '#F7E4B660',
  },
  analyticsButton: {
    padding: 4,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsButtonSubItem: {
    padding: 4,
    marginRight: 38,
    justifyContent: 'center',
    alignItems: 'center',
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
