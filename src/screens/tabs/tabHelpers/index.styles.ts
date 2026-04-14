import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  tabBarButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
  },
  iconLabelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  focusedTabWrapper: {
    marginHorizontal: 6,
    marginVertical: -10,
    backgroundColor: color.white_FFFFFF,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
