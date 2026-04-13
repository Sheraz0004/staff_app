import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8
  },
  wrapper: {
    backgroundColor: color.white_FFFFFF,
    borderColor: color.white_FFFFFF,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  heading: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
    color: color.placeholderTxt_24282C,
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginLeft: -8
  },
  centerText: {
    position: "absolute",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  amountText: {
    fontSize: 13,
    fontWeight: "500",
    color: color.placeholderTxt_24282C,
  },
  totalText: {
    fontSize: 13,
    fontWeight: "450",
    color: color.black_544B45,
    marginTop: 3
  },
  paymentMethod: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "50%",
    gap: 5,
    marginRight: 5
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: 40,
  },
  colorBoxWrapper: {
    width: 5,
    alignItems: "center",
  },
  colorBox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 20
  },
  paymentLabel: {
    paddingLeft: 0,
    minWidth: 70,
  },
  paymentValueWrapper: {
    gap: 5,
    flexDirection: "row",
    paddingLeft: 20
  },
  paymentText: {
    fontSize: 14,
    fontWeight: "500",
    color: color.placeholderTxt_24282C,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "400",
    color: color.black_544B45,
  },
  labelGHS: {
    fontSize: 14,
    fontWeight: "400",
    color: color.black_544B45,
  }
});
