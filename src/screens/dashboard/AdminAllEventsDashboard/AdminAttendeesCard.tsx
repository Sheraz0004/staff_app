import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import BottomSheetRadioPicker from '../../../constants/bottomSheetRadioPicker';
import { DASHBOARD_SERVICES } from '../../../services/DashboardService';
import {
  selectEvents,
  selectEventsPage,
  selectEventsTotalPages,
  selectEventsLoadingMore,
  selectSelectedEventFilterValue,
  selectDashboardData,
  setEvents,
  appendEvents,
  setEventsLoading,
  setEventsError,
  setEventsPage,
  setEventsTotalPages,
  setEventsLoadingMore,
  setSelectedEventFilterValue,
  setDashboardDataLoading,
} from '../../../redux/reducers/dashboardReducer';
import {
  styles,
  TOOLTIP_WIDTH,
  TOOLTIP_HEIGHT,
  CHART_PADDING_TOP,
  CHART_HEIGHT,
  POINT_SPACING,
} from './AdminAttendeesCard.styles';

const { width } = Dimensions.get('window');

interface DropdownAttendeesFilterProps {
  value: string;
  onPress: () => void;
}

const DropdownAttendeesFilter: React.FC<DropdownAttendeesFilterProps> = ({ value, onPress }) => (
  <TouchableOpacity style={styles.dropdownFilter} onPress={onPress}>
    <Typography
      numberOfLines={1}
      style={styles.dropdownValue}
      weight="400"
      size={14}
      color={color.brown_766F6A}
    >
      {value ?? ''}
    </Typography>
    <SvgIcons.downArrow />
  </TouchableOpacity>
);

interface AttendeesChartProps {
  chartData: any;
}

const AttendeesChart: React.FC<AttendeesChartProps> = ({ chartData }) => {
  const safeData = Array.isArray(chartData) ? chartData : [];
  const counts = safeData.map((d: any) => (typeof d?.count === 'number' ? d.count : 0));
  const months = safeData.map((d: any) => d?.month ?? '');

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (months.length === 0) return;
    const currentAbbr = new Date().toLocaleString('en-US', { month: 'short' });
    const idx = months.findIndex((m: string) => m === currentAbbr);
    setSelectedIndex(idx !== -1 ? idx : months.length - 1);
    setTooltipVisible(false);
  }, [chartData]);

  if (safeData.length === 0) return null;

  const dataLen = counts.length;
  const maxDataValue = Math.max(...counts, 1);
  const maxValue = Math.ceil(maxDataValue / 10) * 10 || 10;

  const yAxisSteps = 5;
  const stepValue = maxValue / yAxisSteps;
  const yAxisLabels: string[] = [];
  for (let i = yAxisSteps; i >= 0; i--) {
    const val = stepValue * i;
    yAxisLabels.push(val >= 1000 ? `${Math.round(val / 1000)}k` : String(val));
  }

  // Chart is scrollable — use at least POINT_SPACING per month, min screen width
  const minChartWidth = width - 90;
  const chartWidth = Math.max(dataLen * POINT_SPACING, minChartWidth);

  // Distribute points evenly so each aligns with its x-axis label slot
  const actualSpacing = chartWidth / dataLen;
  const points = counts.map((val: number, i: number) => ({
    x: i * actualSpacing + actualSpacing / 2,
    y: CHART_HEIGHT - (val / maxValue) * CHART_HEIGHT + CHART_PADDING_TOP,
  }));

  const pathD = points.reduce((acc: string, point: { x: number; y: number }, i: number) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const gridLines = yAxisLabels.map((_: string, i: number) => {
    return CHART_PADDING_TOP + (i * CHART_HEIGHT) / Math.max(yAxisLabels.length - 1, 1);
  });

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;
  const selectedData = selectedIndex !== null ? safeData[selectedIndex] : null;

  // Clamp tooltip so it stays within chart bounds
  const tooltipLeft = selectedPoint
    ? Math.max(0, Math.min(selectedPoint.x - TOOLTIP_WIDTH / 2, chartWidth - TOOLTIP_WIDTH - 4))
    : 0;

  return (
    <View style={styles.chartOuterContainer}>
      <View style={styles.chartWrapper}>
        {/* Fixed y-axis — each label absolutely centered on its grid line */}
        <View style={styles.yAxisLabels}>
          {yAxisLabels.map((val: string, index: number) => {
            const lineY =
              CHART_PADDING_TOP +
              (index * CHART_HEIGHT) / (yAxisLabels.length - 1);
            return (
              <Typography
                key={`y-${index}`}
                style={[styles.axisLabel, { position: 'absolute', top: lineY - 8, right: 15 }]}
                weight="400"
                size={12}
                color={color.grey_87807C}
              >
                {val}
              </Typography>
            );
          })}
        </View>

        {/* Scrollable chart area */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          <View style={styles.chartContent}>
            <Svg width={chartWidth} height={CHART_HEIGHT + CHART_PADDING_TOP + 30}>
              <Defs>
                <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={color.brown_D58E00} stopOpacity={0.15} />
                  <Stop offset="100%" stopColor={color.brown_D58E00} stopOpacity={0.02} />
                </LinearGradient>
                <LinearGradient id="indicatorLine" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={color.btnBrown_AE6F28} stopOpacity={0.8} />
                  <Stop offset="100%" stopColor={color.btnBrown_AE6F28} stopOpacity={0.1} />
                </LinearGradient>
              </Defs>

              {gridLines.map((y: number, i: number) => (
                <Path
                  key={`grid-${i}`}
                  d={`M 0 ${y} L ${chartWidth} ${y}`}
                  stroke={color.grey_E5E7EB}
                  strokeWidth={1}
                />
              ))}

              {lastPoint && firstPoint && (
                <Path
                  d={`${pathD} L ${lastPoint.x} ${CHART_HEIGHT + CHART_PADDING_TOP} L ${firstPoint.x} ${CHART_HEIGHT + CHART_PADDING_TOP} Z`}
                  fill="url(#areaGradient)"
                />
              )}

              <Path d={pathD} stroke={color.btnBrown_AE6F28} strokeWidth={2.5} fill="none" />

              {/* Invisible column tap areas — one per month, full SVG height */}
              {points.map((_: any, i: number) => (
                <Rect
                  key={`tap-${i}`}
                  x={i * actualSpacing}
                  y={0}
                  width={actualSpacing}
                  height={CHART_HEIGHT + CHART_PADDING_TOP + 30}
                  fill="transparent"
                  onPress={() => {
                    setSelectedIndex(i);
                    setTooltipVisible(false);
                  }}
                />
              ))}

              {selectedPoint && (
                <>
                  {/* Vertical indicator line from data point down to x-axis */}
                  <Path
                    d={`M ${selectedPoint.x} ${selectedPoint.y} L ${selectedPoint.x} ${CHART_HEIGHT + CHART_PADDING_TOP}`}
                    stroke="url(#indicatorLine)"
                    strokeWidth={1.5}
                  />
                  {/* Outer glow circle — tappable to show/hide tooltip */}
                  <Circle
                    cx={selectedPoint.x}
                    cy={selectedPoint.y}
                    r={8}
                    fill="#F3F3F3"
                    onPress={() => setTooltipVisible((v: boolean) => !v)}
                  />
                  {/* Inner filled circle */}
                  <Circle
                    cx={selectedPoint.x}
                    cy={selectedPoint.y}
                    r={5}
                    fill={color.btnBrown_AE6F28}
                    onPress={() => setTooltipVisible((v: boolean) => !v)}
                  />
                </>
              )}
            </Svg>

            {/* Tooltip — visible only after tapping the circle */}
            {tooltipVisible && selectedPoint && selectedData && (
              <View style={[styles.tooltip, { left: tooltipLeft, top: Math.max(4, selectedPoint.y - TOOLTIP_HEIGHT - 14) }]}>
                <Typography weight="600" size={11} color={color.grey_87807C}>
                  {selectedData.month ?? ''}
                </Typography>
                <View style={styles.tooltipRow}>
                  <View style={styles.tooltipDot} />
                  <Typography weight="400" size={11} color={color.grey_87807C} style={styles.tooltipLabel}>
                    attendees
                  </Typography>
                  <Typography weight="700" size={12} color={color.black_2F251D}>
                    {(selectedData.count ?? 0).toLocaleString()}
                  </Typography>
                </View>
              </View>
            )}

            {/* X-axis labels aligned with each data point — display only, taps handled by SVG Rects */}
            <View style={styles.xAxisLabels}>
              {months.map((month: string, index: number) => (
                <View key={`m-${index}`} style={[styles.xAxisLabelTouch, { width: actualSpacing }]}>
                  <Typography weight="400" size={12} color={color.grey_87807C}>
                    {month}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const AdminAttendeesCard: React.FC = () => {
  const dispatch = useDispatch();
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const events = useSelector(selectEvents) ?? [];
  const eventsPage = useSelector(selectEventsPage) ?? 0;
  const eventsTotalPages = useSelector(selectEventsTotalPages) ?? 1;
  const eventsLoadingMore = useSelector(selectEventsLoadingMore) ?? false;
  const selectedEventFilterValue = useSelector(selectSelectedEventFilterValue) ?? 'all';
  const dashboardData = useSelector(selectDashboardData);

  const totalAttendees = dashboardData?.attendees?.total ?? 0;
  const chartData = dashboardData?.attendees?.chartData ?? [];

  const filterOptions = [
    { label: 'All', value: 'all' },
    ...(events ?? []).map((e: any) => ({
      label: e?.title ?? '',
      value: String(e?.id ?? ''),
    })),
  ];

  const selectedFilter =
    filterOptions.find((o) => o.value === selectedEventFilterValue)?.label ?? 'All';

  const fetchEvents = async (page = 0) => {
    if (page === 0) {
      dispatch(setEventsLoading(true));
      dispatch(setEventsError(null));
    } else {
      dispatch(setEventsLoadingMore(true));
    }
    try {
      const response = await DASHBOARD_SERVICES.fetchEvents(page);
      const data = response?.data?.data ?? [];
      const totalPages = response?.data?.totalPages ?? 1;
      const currentPage = response?.data?.currentPage ?? page;
      if (page === 0) {
        dispatch(setEvents(data));
      } else {
        dispatch(appendEvents(data));
      }
      dispatch(setEventsPage(currentPage));
      dispatch(setEventsTotalPages(totalPages));
    } catch (error: any) {
      dispatch(setEventsError(error?.message ?? 'Failed to fetch events'));
    } finally {
      if (page === 0) {
        dispatch(setEventsLoading(false));
      } else {
        dispatch(setEventsLoadingMore(false));
      }
    }
  };

  const loadMoreEvents = () => {
    const nextPage = (eventsPage ?? 0) + 1;
    if (nextPage < (eventsTotalPages ?? 1) && !eventsLoadingMore) {
      fetchEvents(nextPage);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.attendeesHeader}>
        <Typography
          style={styles.cardTitle}
          weight="700"
          size={13}
          color={color.placeholderTxt_24282C}
        >
          Attendees
        </Typography>
      </View>
      <View style={styles.attendeesInfo}>
        <View style={styles.attendeesLeftSection}>
          <SvgIcons.attendeesPerson />
          <View>
            <Typography weight="400" size={12} color={color.grey_87807C}>
              Attendees:
            </Typography>
            <Typography weight="700" size={18} color={color.black_2F251D}>
              {(totalAttendees ?? 0).toLocaleString()}
            </Typography>
          </View>
        </View>
        <View style={styles.filterContainer}>
          <Typography
            style={styles.filterLabel}
            weight="400"
            size={10}
            color={color.brown_3C200A}
          >
            Filter by Event:
          </Typography>
          <DropdownAttendeesFilter
            value={selectedFilter}
            onPress={() => {
              if ((events ?? []).length === 0) fetchEvents(0);
              setShowFilterPicker(true);
            }}
          />
        </View>
      </View>

      <AttendeesChart chartData={chartData} />

      <BottomSheetRadioPicker
        visible={showFilterPicker}
        onClose={() => setShowFilterPicker(false)}
        title="Filter by Event"
        options={filterOptions}
        selectedValue={selectedEventFilterValue}
        onSelect={(option: any) => {
          const newValue = option?.value ?? 'all';
          if (newValue !== selectedEventFilterValue) {
            dispatch(setDashboardDataLoading(true));
          }
          dispatch(setSelectedEventFilterValue(newValue));
        }}
        hasMore={(eventsPage ?? 0) + 1 < (eventsTotalPages ?? 1)}
        isLoadingMore={eventsLoadingMore}
        onLoadMore={loadMoreEvents}
      />
    </View>
  );
};

export default AdminAttendeesCard;
