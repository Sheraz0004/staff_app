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
  attendeesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  attendeesLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  filterContainer: {
    alignItems: 'flex-end',
    flex: 0,
    minWidth: 100,
    maxWidth: 150,
  },
  filterLabel: {
    marginBottom: 4,
  },
  dropdownFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 0.1,
    borderColor: color.grey_DADADA,
    justifyContent: 'space-between',
    minWidth: 75,
    maxWidth: 120,
  },
  dropdownValue: {
    fontSize: 14,
    color: color.brown_766F6A,
    flex: 1,
  },
  chartOuterContainer: {
    marginTop: 8,
  },
  chartWrapper: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    height: 200,
    paddingTop: 15,
  },
  axisLabel: {
    fontSize: 12,
    color: color.grey_87807C,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 30,
    paddingRight: 10,
    marginTop: -22,
  },
  xAxisLabelTouch: {
    padding: 4,
  },
});
