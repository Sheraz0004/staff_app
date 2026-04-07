import { Platform, StyleSheet } from 'react-native';
import { mvs } from '../../../constants/responsive';


export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: mvs(20),
    right: mvs(20),
    zIndex: 9999,
    alignItems: 'center',
  },
  backgroundLayer2: {
    position: 'absolute',
    bottom: mvs(-12),
    left: mvs(16),
    right: mvs(16),
    height: mvs(80),
    backgroundColor: '#C8D0DA',
    borderRadius: mvs(20),
  },
  backgroundLayer1: {
    position: 'absolute',
    bottom: mvs(-6),
    left: mvs(8),
    right: mvs(8),
    height: mvs(80),
    backgroundColor: '#E0E5EB',
    borderRadius: mvs(20),
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    shadowColor: '#D0D0D0',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity:Platform.OS == 'ios' ? 0.2 : 0.6,
    shadowRadius: 12,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: mvs(20),
    paddingVertical: mvs(16),
    paddingHorizontal: mvs(16),
    width: '100%',
  },
  iconContainer: {
    width: mvs(48),
    height: mvs(48),
    borderRadius: mvs(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: mvs(12),
  },
  iconImage: {
    width: mvs(33),
    height: mvs(33),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: mvs(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
    marginBottom: mvs(2),
  },
  message: {
    fontSize: mvs(13),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    lineHeight: mvs(18),
  },
  closeButton: {
    padding: mvs(4),
  },
});
