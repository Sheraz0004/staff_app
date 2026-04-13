import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: color.white_FFFFFF,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  donutContainer: {
    position: 'relative',
    width: 140,
    height: 140,
  },
  donutCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventLegend: {
    flex: 1,
    gap: 16,
  },
  eventLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  eventLegendLabel: {
    flex: 1,
    fontSize: 16,
  },
});
