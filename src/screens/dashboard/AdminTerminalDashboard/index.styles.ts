import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeAreaContainer: {
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: color.btnBrown_AE6F28,
    height: 48,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  eventName: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: '400',
  },
  time: {
    color: color.white_FFFFFF,
    fontSize: 14,
    fontWeight: '400',
  },
  separator: {
    color: color.white_FFFFFF,
    marginHorizontal: 4,
  },
  staffNameContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: color.brown_F7E4B6,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    marginVertical: 8,
  },
  staffName: {
    color: color.black_544B45,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  availableTicketsContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  availableTicketsOuterWrapper: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.white_FFFFFF,
    padding: 16,
  },
  availableTicketsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: color.white_FFFFFF,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.brown_CEBCA04D,
    gap: 12,
  },
  availableTicketsTextContainer: {
    flex: 1,
  },
  availableTicketsTitle: {
    fontSize: 12,
    color: color.placeholderTxt_24282C,
    fontWeight: '400',
  },
  availableTicketsValue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    color: color.brown_3C200A,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    color: color.brown_3C200A,
    fontSize: 14,
    fontWeight: '400',
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: 'red',
    fontSize: 14,
    fontWeight: '400',
  },
});
