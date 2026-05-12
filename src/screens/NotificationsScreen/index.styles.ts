import { Platform, StyleSheet } from 'react-native';
import { color } from '../../color/color';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F5',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: Platform.OS === 'android' ? 44 : 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: color.grey_E4E4E4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: color.brown_3C200A,
  },
  headerBadge: {
    backgroundColor: color.btnBrown_AE6F28,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  markAllText: {
    fontSize: 13,
    color: color.btnBrown_AE6F28,
    fontWeight: '600',
  },

  listContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },

  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationItemUnread: {
    backgroundColor: color.lightBrown_FFF6DF,
  },

  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: color.brown_FFE8BB,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconWrapperRead: {
    backgroundColor: color.grey_F5F5F5,
  },

  textWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: color.btnBrown_AE6F28,
    marginRight: 6,
    marginTop: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: color.brown_3C200A,
    flex: 1,
  },
  notificationTitleRead: {
    fontWeight: '500',
    color: color.brown_766F6A,
  },
  notificationBody: {
    fontSize: 13,
    color: color.grey_6B7785,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: color.grey_AFAFAF,
  },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: color.grey_87807C,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  loadMoreIndicator: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: color.brown_FFE8BB,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: color.brown_3C200A,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: color.grey_87807C,
    textAlign: 'center',
    lineHeight: 19,
  },

  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
