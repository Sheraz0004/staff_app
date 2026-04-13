import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  setEvents,
  appendEvents,
  setEventsLoading,
  setEventsError,
  setEventsPage,
  setEventsTotalPages,
  setEventsLoadingMore,
  setSelectedEventFilterValue,
} from '../../../redux/reducers/dashboardReducer';

const { width } = Dimensions.get('window');

const DropdownAttendeesFilter = ({ value, onPress }) => (
  <TouchableOpacity style={styles.dropdownFilter} onPress={onPress}>
    <Typography
      style={styles.dropdownValue}
      weight="400"
      size={14}
      color={color.brown_766F6A}
      numberOfLines={1}
    >
      {value}
    </Typography>
    <SvgIcons.downArrow />
  </TouchableOpacity>
);

const AttendeesChart = () => {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const displayData = [23000, 25000, 45000, 27000, 29000, 30000, 35000];
  const months = ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Oct', 'Dec'];

  const maxDataValue = Math.max(...displayData);
  const maxValue = Math.ceil(maxDataValue / 10000) * 10000;

  const yAxisSteps = 5;
  const stepValue = maxValue / yAxisSteps;
  const yAxisLabels = [];
  for (let i = yAxisSteps; i >= 0; i--) {
    const value = stepValue * i;
    yAxisLabels.push(value >= 1000 ? `${value / 1000}k` : value.toString());
  }

  const chartWidth = width - 100;
  const chartHeight = 200;
  const chartPaddingTop = 25;
  const chartPaddingLeft = 2;

  const points = displayData.map((val, i) => ({
    x: (i / (displayData.length - 1)) * (chartWidth - 20) + chartPaddingLeft,
    y: chartHeight - (val / maxValue) * chartHeight + chartPaddingTop,
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const gridLines = yAxisLabels.map((_, i) => {
    return chartPaddingTop + (i * chartHeight) / (yAxisLabels.length - 1);
  });

  return (
    <View style={styles.chartOuterContainer}>
      <View style={styles.chartWrapper}>
        <View style={styles.yAxisLabels}>
          {yAxisLabels.map((val, index) => (
            <Typography
              key={`${val}-${index}`}
              style={styles.axisLabel}
              weight="400"
              size={12}
              color={color.grey_87807C}
            >
              {val}
            </Typography>
          ))}
        </View>

        <View style={styles.chartArea}>
          <Svg width={chartWidth} height={chartHeight + chartPaddingTop + 30}>
            <Defs>
              <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={color.brown_D58E00} stopOpacity={0.15} />
                <Stop offset="100%" stopColor={color.brown_D58E00} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {gridLines.map((y, i) => (
              <Path
                key={i}
                d={`M ${chartPaddingLeft} ${y} L ${chartWidth - 10} ${y}`}
                stroke={color.grey_E5E7EB}
                strokeWidth={1}
                strokeDasharray="0"
              />
            ))}

            <Path
              d={`${pathD} L ${points[points.length - 1].x} ${chartHeight + chartPaddingTop} L ${points[0].x} ${chartHeight + chartPaddingTop} Z`}
              fill="url(#areaGradient)"
            />

            <Path d={pathD} stroke={color.btnBrown_AE6F28} strokeWidth={2.5} fill="none" />

            {selectedIndex !== null && (
              <>
                <Defs>
                  <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={color.btnBrown_AE6F28} stopOpacity={1} />
                    <Stop offset="85%" stopColor={color.btnBrown_AE6F28} stopOpacity={0.3} />
                    <Stop offset="100%" stopColor={color.btnBrown_AE6F28} stopOpacity={0.05} />
                  </LinearGradient>
                </Defs>
                <Path
                  d={`M ${points[selectedIndex].x} ${chartPaddingTop - 15} L ${points[selectedIndex].x} ${points[selectedIndex].y + 5}`}
                  stroke="url(#lineGradient)"
                  strokeWidth={2}
                />
                <Circle
                  cx={points[selectedIndex].x}
                  cy={chartPaddingTop - 15}
                  r={8}
                  fill="#F3F3F3"
                />
                <Circle
                  cx={points[selectedIndex].x}
                  cy={chartPaddingTop - 15}
                  r={5}
                  fill={color.btnBrown_AE6F28}
                />
              </>
            )}
          </Svg>

          <View style={styles.xAxisLabels}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                onPress={() => setSelectedIndex(index)}
                style={styles.xAxisLabelTouch}
              >
                <Typography weight="400" size={12} color={color.grey_87807C}>
                  {month}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const AdminAttendeesCard = () => {
  const dispatch = useDispatch();
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const events = useSelector(selectEvents);
  const eventsPage = useSelector(selectEventsPage);
  const eventsTotalPages = useSelector(selectEventsTotalPages);
  const eventsLoadingMore = useSelector(selectEventsLoadingMore);
  const selectedEventFilterValue = useSelector(selectSelectedEventFilterValue);

  const filterOptions = [
    { label: 'All', value: 'all' },
    ...events.map((e) => ({ label: e.title, value: String(e.id) })),
  ];

  const selectedFilter =
    filterOptions.find((o) => o.value === selectedEventFilterValue)?.label ?? 'All';

  useEffect(() => {
    if (events.length === 0) fetchEvents(0);
  }, []);

  const fetchEvents = async (page = 0) => {
    if (page === 0) {
      dispatch(setEventsLoading(true));
      dispatch(setEventsError(null));
    } else {
      dispatch(setEventsLoadingMore(true));
    }
    try {
      const response = await DASHBOARD_SERVICES.fetchEvents(page);
      const { data, totalPages, currentPage } = response.data;
      if (page === 0) {
        dispatch(setEvents(data));
      } else {
        dispatch(appendEvents(data));
      }
      dispatch(setEventsPage(currentPage));
      dispatch(setEventsTotalPages(totalPages));
    } catch (error) {
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
    const nextPage = eventsPage + 1;
    if (nextPage < eventsTotalPages && !eventsLoadingMore) {
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
              25,000
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
            onPress={() => setShowFilterPicker(true)}
          />
        </View>
      </View>
      <AttendeesChart />

      <BottomSheetRadioPicker
        visible={showFilterPicker}
        onClose={() => setShowFilterPicker(false)}
        title="Filter by Event"
        options={filterOptions}
        selectedValue={selectedEventFilterValue}
        onSelect={(option) => dispatch(setSelectedEventFilterValue(option.value))}
        hasMore={eventsPage + 1 < eventsTotalPages}
        isLoadingMore={eventsLoadingMore}
        onLoadMore={loadMoreEvents}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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

export default AdminAttendeesCard;