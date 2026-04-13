import { StyleSheet } from 'react-native';
import { color } from '../color/color';

export const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  contentContainer: { flex: 1 },
  tabContainer: { flexDirection: 'row', justifyContent: 'flex-start', paddingTop: 6, paddingHorizontal: 10, paddingBottom: 14 },
  button: { width: '50%', height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  activeButton: { width: '50%', height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: color.white_FFFFFF, borderRadius: 7, backgroundColor: color.white_FFFFFF },
  buttonText: { color: color.brown_766F6A, fontWeight: '400', fontSize: 14 },
  activeButtonText: { color: color.brown_3C200A, fontWeight: '500', fontSize: 14 },
});
