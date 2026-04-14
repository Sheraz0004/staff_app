import { Dimensions, StyleSheet } from 'react-native';
import { color } from '../../../color/color';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white_FFFFFF,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: color.white_FFFFFF,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  eventCard: {
    marginBottom: 24,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  cardContent: {
    paddingTop: 12,
  },
  eventTitle: {
    marginBottom: 6,
  },
  eventDate: {
    marginBottom: 2,
  },
  eventTime: {
    marginBottom: 6,
  },
  eventLocation: {
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
  },
  bottomSpacer: {
    height: 40,
  },
});
