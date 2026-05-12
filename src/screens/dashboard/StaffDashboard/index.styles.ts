import { StyleSheet } from "react-native";
import { color } from "../../../color/color";

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeAreaContainer: {
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 40,
  },
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: "100%",
    backgroundColor: color.btnBrown_AE6F28,
    height: 48,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  dropdownButton: {
    marginLeft: 8,
    padding: 4,
  },
  eventName: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: "500",
  },
  cityName: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: "400",
  },
  date: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: "400",
  },
  time: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: "400",
  },
  separator: {
    color: color.white_FFFFFF,
    marginHorizontal: 4,
  },
  staffNameContainer: {
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: color.brown_F7E4B6,
    position: "relative",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 10,
    zIndex: 1,
    // marginVertical: 8
  },
  staffName: {
    color: color.black_544B45,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
  },
  saleScanTabButtonText: {
    color: color.black_544B45,
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
  },
  selectedSaleScanTabButtonText: {
    color: color.placeholderTxt_24282C,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    padding: 20,
    color: color.brown_3C200A,
    fontSize: 14,
    fontWeight: "400",
  },
  errorText: {
    textAlign: "center",
    padding: 20,
    color: "red",
    fontSize: 14,
    fontWeight: "400",
  },
  saleScanTabContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 13,
  },
  saleScanTabRow: {
    flexDirection: "row",
    backgroundColor: "#EBEBEB",
    borderRadius: 10,
    padding: 4,
    width: "100%",
  },
  saleScanTabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 36,
    borderRadius: 8,
  },
  selectedSaleScanTabButton: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: color.white_FFFFFF,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  overallStatisticsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyStateIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: color.brown_F7E4B6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: color.placeholderTxt_24282C,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#87807C",
    textAlign: "center",
    lineHeight: 20,
  },
});
