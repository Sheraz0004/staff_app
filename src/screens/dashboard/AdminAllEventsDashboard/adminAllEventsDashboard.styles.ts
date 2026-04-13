import { StyleSheet } from "react-native";
import { color } from "../../../color/color";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellButton: { position: "relative" },
  headerDivider: { width: 2, height: 40, backgroundColor: color.grey_E5E7EB },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.btnBrown_AE6F28,
    justifyContent: "center",
    alignItems: "center",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
    width: "100%",
  },
  dropdownWrapper: { flex: 1 },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.white_FFFFFF,
    marginHorizontal: 20,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 0.1,
    borderColor: color.grey_DADADA,
    marginBottom: 16,
  },
  dateSelectorText: { flex: 1, fontSize: 14, color: color.brown_766F6A },
});
