import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  // ── Main Layout ──
  container: { flex: 1, backgroundColor: color.white_FFFFFF },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerDivider: {
    height: 1.5,
    backgroundColor: '#E8E8E8',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },

  // ── Active Filter Chip ──
  activeFilterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6DF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  clearFilterButton: { padding: 2 },

  // ── Event Cards ──
  eventsContainer: { paddingHorizontal: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  largeCard: { marginBottom: 24 },
  largeImageContainer: { height: 200 },
  largeImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 12 },
  bookmarkButton: { position: 'absolute', top: 12, right: 12, padding: 8 },
  cardContent: { paddingTop: 10 },
  eventTitle: { marginBottom: 4 },
  eventDate: { marginBottom: 2 },
  eventTime: { marginBottom: 4 },
  eventLocation: {},
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  clearAllButton: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 },
  bottomSpacer: { height: 40 },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },

  // ── Search Bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2F251D',
    paddingVertical: 0,
  },
  searchClearButton: { padding: 4 },

  // ── Bottom Sheet Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  bottomSheetModal: {
    backgroundColor: color.white_FFFFFF,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: color.grey_AFAFAF,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // ── When Filter Options ──
  filterTitle: { marginBottom: 20 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioOuterSelected: { borderColor: color.btnBrown_AE6F28 },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: color.btnBrown_AE6F28 },

  // ── Month Dropdown Field (inside When sheet) ──
  monthDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    gap: 10,
  },
  monthDropdownText: { flex: 1 },

  // ── Month Picker Grid ──
  monthPickerGridContainer: { paddingVertical: 10 },
  pickerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: { padding: 10 },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  monthCell: {
    width: '23%',
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthCellSelected: {
    backgroundColor: color.white_FFFFFF,
    borderWidth: 2,
    borderColor: color.btnBrown_AE6F28,
  },
  monthCellCurrent: {
    backgroundColor: '#FFF6DF',
  },
});
