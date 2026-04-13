import { StyleSheet, Dimensions } from 'react-native';
import { color } from '../../../color/color';

const { width } = Dimensions.get('window');

export const TOOLTIP_WIDTH = 140;
export const TOOLTIP_HEIGHT = 62;
export const CHART_PADDING_TOP = 16;
export const CHART_HEIGHT = 180;
export const POINT_SPACING = 52;

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

  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    maxWidth: 190,
  },
  filterLabel: {
    marginBottom: 7,
  },
  dropdownFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: color.grey_DADADA,
    alignSelf: 'flex-start',
  },
  dropdownValue: {
    fontSize: 12.5,
    color: color.brown_766F6A,
    flexShrink: 1,
  },
  chartOuterContainer: {
    marginTop: 15,
  },
  chartWrapper: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 40,
    height: CHART_HEIGHT + CHART_PADDING_TOP + 30,
    position: 'relative',
  },
  axisLabel: {
    fontSize: 12,
    color: color.grey_87807C,
  },
  chartScroll: {
    flex: 1,
  },
  chartContent: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    backgroundColor: color.white_FFFFFF,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.btnBrown_AE6F28,
  },
  tooltipLabel: {
    flex: 1,
  },
  xAxisLabels: {
    flexDirection: 'row',
    marginTop: -22,
  },
  xAxisLabelTouch: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
