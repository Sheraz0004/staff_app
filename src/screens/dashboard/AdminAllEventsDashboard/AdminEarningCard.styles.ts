import { StyleSheet } from 'react-native';
import { color } from '../../../color/color';

export const EARNING_TOOLTIP_WIDTH = 190;
export const EARNING_TOOLTIP_HEIGHT = 74;
export const E_BAR_WIDTH = 12;
export const E_BAR_GAP = 2;
export const E_BAR_GROUP_MARGIN = 16;
export const E_BAR_GROUP_CONTENT_WIDTH = E_BAR_WIDTH * 2 + E_BAR_GAP;
export const E_BAR_GROUP_STEP = E_BAR_GROUP_CONTENT_WIDTH + E_BAR_GROUP_MARGIN;
export const E_CHART_HEIGHT = 150;

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
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  earningsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  filterContainer: {
    alignItems: 'flex-end',
    flex: 0,
    minWidth: 100,
    maxWidth: 150,
  },
  filterLabel: {
    marginBottom: 7,
  },
  dropdownEarningFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white_FFFFFF,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
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
  chartLoader: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartRow: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 30,
    height: 180,
    paddingTop: 20,
    paddingBottom: 21,
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 10,
    color: color.grey_87807C,
  },
  chartScroll: {},
  chartContent: {
    position: 'relative',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barGroup: {
    alignItems: 'center',
    marginRight: E_BAR_GROUP_MARGIN,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: color.grey_87807C,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: color.grey_E5E7EB,
    marginTop: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
  earningTooltip: {
    position: 'absolute',
    width: EARNING_TOOLTIP_WIDTH,
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
    gap: 6,
  },
  tooltipDash: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  tooltipLabel: {
    flex: 1,
  },
});
