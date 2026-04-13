import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SvgIcons from '../../../components/SvgIcons';
import { color } from '../../../color/color';
import Typography from '../../../components/Typography';
import PopoverDropdown from '../../../constants/popOverDropdown';
import { DASHBOARD_SERVICES } from '../../../services/DashboardService';
import {
  selectCurrencies,
  selectSelectedCurrencyValue,
  selectDashboardData,
  selectDashboardDataLoading,
  setCurrencies,
  setCurrenciesLoading,
  setCurrenciesError,
  setSelectedCurrencyValue,
} from '../../../redux/reducers/dashboardReducer';

const EARNING_TOOLTIP_WIDTH = 190;
const EARNING_TOOLTIP_HEIGHT = 74;
const E_BAR_WIDTH = 12;
const E_BAR_GAP = 2;
const E_BAR_GROUP_MARGIN = 16;
const E_BAR_GROUP_CONTENT_WIDTH = E_BAR_WIDTH * 2 + E_BAR_GAP; 
const E_BAR_GROUP_STEP = E_BAR_GROUP_CONTENT_WIDTH + E_BAR_GROUP_MARGIN;
const E_CHART_HEIGHT = 150;

const safeFormatAmount = (currency, value) => {
  const num = typeof value === 'number' && isFinite(value) ? value : 0;
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency ?? 'GHS'} ${formatted}`;
};

const EarningsChart = ({ chartData, currency }) => {
  const safeData = Array.isArray(chartData) ? chartData : [];
  const allGross = safeData.map((d) => (typeof d?.gross === 'number' ? d.gross : 0));
  const rawMax = Math.max(...allGross, 1);
  const maxValue = Math.ceil(rawMax / 10) * 10 || 10;

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (safeData.length === 0) return;
    const currentAbbr = new Date().toLocaleString('en-US', { month: 'short' });
    const idx = safeData.findIndex((d) => d?.month === currentAbbr);
    setSelectedIndex(idx !== -1 ? idx : safeData.length - 1);
    setTooltipVisible(false);
  }, [chartData]);

  const step = maxValue / 4;
  const yLabels = [maxValue, step * 3, step * 2, step, 0];

  if (safeData.length === 0) return null;

  const selectedItem = selectedIndex !== null ? safeData[selectedIndex] : null;
  const selectedGross = selectedItem?.gross ?? 0;
  const selectedNet = selectedItem?.net ?? 0;

  // Bias factor: 0 = tooltip fully right of bar center, 1 = fully left of bar center
  const totalChartWidth = safeData.length * E_BAR_GROUP_STEP;
  const barCenterX =
    selectedIndex !== null
      ? selectedIndex * E_BAR_GROUP_STEP + E_BAR_GROUP_CONTENT_WIDTH / 2
      : 0;
  let biasFactor = 0.5; // default: centered
  if (selectedIndex === 0) biasFactor = 0;
  else if (selectedIndex === 1) biasFactor = 0.25;
  else if (selectedIndex === safeData.length - 2) biasFactor = 0.75;
  else if (selectedIndex === safeData.length - 1) biasFactor = 1.0;
  const tooltipLeft = Math.max(
    0,
    Math.min(barCenterX - EARNING_TOOLTIP_WIDTH * biasFactor, totalChartWidth - EARNING_TOOLTIP_WIDTH),
  );

  const grossBarH = Math.max((selectedGross / maxValue) * E_CHART_HEIGHT, 2);
  const tooltipTop = Math.max(0, E_CHART_HEIGHT - grossBarH - EARNING_TOOLTIP_HEIGHT - 6);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
        onScrollBeginDrag={() => setTooltipVisible(false)}
      >
        <View style={styles.chartRow}>
          <View style={styles.yAxisLabels}>
            {yLabels.map((val, idx) => (
              <Typography
                key={`y-${idx}`}
                style={styles.axisLabel}
                weight="400"
                size={10}
                color={color.grey_87807C}
              >
                {val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : String(val)}
              </Typography>
            ))}
          </View>
        {/* position: relative wrapper so tooltip can be absolutely placed */}
        <View style={styles.chartContent}>
          {tooltipVisible && (
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setTooltipVisible(false)}
            />
          )}
          <View style={styles.chartContainer}>
            {safeData.map((item, index) => {
              const gross = typeof item?.gross === 'number' ? item.gross : 0;
              const net = typeof item?.net === 'number' ? item.net : 0;
              const isSelected = selectedIndex === index;
              return (
                <TouchableOpacity
                  key={`bar-${index}`}
                  style={styles.barGroup}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (selectedIndex === index) {
                      setTooltipVisible((v) => !v);
                    } else {
                      setSelectedIndex(index);
                      setTooltipVisible(true);
                    }
                  }}
                >
                  <View style={styles.barsContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max((gross / maxValue) * E_CHART_HEIGHT, 2),
                          backgroundColor: color.brown_F7E4B6,
                          width: E_BAR_WIDTH,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max((net / maxValue) * E_CHART_HEIGHT, 2),
                          backgroundColor: color.btnBrown_AE6F28,
                          width: E_BAR_WIDTH,
                          marginLeft: E_BAR_GAP,
                        },
                      ]}
                    />
                  </View>
                  <Typography
                    style={styles.barLabel}
                    weight={isSelected ? '700' : '400'}
                    size={10}
                    color={isSelected ? color.btnBrown_AE6F28 : color.grey_87807C}
                  >
                    {item?.month ?? ''}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tooltip — visible after tapping a selected bar group */}
          {tooltipVisible && selectedItem && (
            <View
              style={[
                styles.earningTooltip,
                { left: tooltipLeft, top: tooltipTop },
              ]}
            >
              <Typography weight="600" size={11} color={color.grey_87807C}>
                {selectedItem.month ?? ''}
              </Typography>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipDash, { backgroundColor: color.brown_F7E4B6 }]} />
                <Typography
                  weight="400"
                  size={11}
                  color={color.grey_87807C}
                  style={styles.tooltipLabel}
                >
                  Gross
                </Typography>
                <Typography weight="700" size={12} color={color.black_2F251D}>
                  {safeFormatAmount(currency, selectedGross)}
                </Typography>
              </View>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipDash, { backgroundColor: color.btnBrown_AE6F28 }]} />
                <Typography
                  weight="400"
                  size={11}
                  color={color.grey_87807C}
                  style={styles.tooltipLabel}
                >
                  Net
                </Typography>
                <Typography weight="700" size={12} color={color.black_2F251D}>
                  {safeFormatAmount(currency, selectedNet)}
                </Typography>
              </View>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      <View style={styles.divider} />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color.brown_F7E4B6 }]} />
          <Typography weight="500" size={12} color={color.brown_3C200A}>
            Gross
          </Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color.btnBrown_AE6F28 }]} />
          <Typography weight="500" size={12} color={color.brown_3C200A}>
            Net
          </Typography>
        </View>
      </View>
    </View>
  );
};

const DropdownEarningFilter = ({ value, onPress }) => (
  <TouchableOpacity style={styles.dropdownEarningFilter} onPress={onPress}>
    <Typography
      style={styles.dropdownValue}
      weight="400"
      size={14}
      color={color.brown_766F6A}
      numberOfLines={1}
    >
      {value ?? ''}
    </Typography>
    <SvgIcons.downArrow />
  </TouchableOpacity>
);

const AdminEarningCard = () => {
  const dispatch = useDispatch();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyRef = useRef(null);

  const currencies = useSelector(selectCurrencies) ?? [];
  const selectedCurrencyValue = useSelector(selectSelectedCurrencyValue) ?? 'GHS';
  const dashboardData = useSelector(selectDashboardData);
  const dashboardDataLoading = useSelector(selectDashboardDataLoading) ?? false;

  const currencyOptions = (currencies ?? []).map((c) => ({
    label: c?.threeLetter ?? '',
    value: String(c?.id ?? ''),
  }));

  const selectedCurrency =
    currencyOptions.find((o) => o.value === selectedCurrencyValue)?.label ??
    dashboardData?.currency ??
    'GHS';

  const totalEarned = dashboardData?.earned?.totalEarned ?? 0;
  const chartData = dashboardData?.earned?.chartData ?? [];

  const fetchCurrencies = async () => {
    dispatch(setCurrenciesLoading(true));
    dispatch(setCurrenciesError(null));
    try {
      const response = await DASHBOARD_SERVICES.fetchCurrencies();
      dispatch(setCurrencies(response?.data?.data ?? []));
    } catch (error) {
      dispatch(setCurrenciesError(error?.message ?? 'Failed to fetch currencies'));
    } finally {
      dispatch(setCurrenciesLoading(false));
    }
  };

  return (
    <View style={styles.card}>
      <Typography
        style={styles.cardTitle}
        weight="700"
        size={13}
        color={color.placeholderTxt_24282C}
      >
        Earnings
      </Typography>
      <View style={styles.earningsHeader}>
        <View style={styles.earningsInfo}>
          <SvgIcons.earningArrow />
          <View>
            <Typography weight="400" size={10} color={color.brown_3C200A}>
              Earned:
            </Typography>
            <Typography weight="700" size={14} color={color.brown_3C200A}>
              {safeFormatAmount(selectedCurrency, totalEarned)}
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
            Currency:
          </Typography>
          <View ref={currencyRef} collapsable={false}>
            <DropdownEarningFilter
              value={selectedCurrency}
              onPress={() => {
                if ((currencies ?? []).length === 0) fetchCurrencies();
                setShowCurrencyDropdown(true);
              }}
            />
          </View>
        </View>
      </View>

      {/* {dashboardDataLoading ? (
        <View style={styles.chartLoader}>
          <ActivityIndicator size="small" color={color.btnBrown_AE6F28} />
        </View>
      ) : ( */}
        <EarningsChart chartData={chartData} currency={selectedCurrency} />
      {/* )} */}

      <PopoverDropdown
        visible={showCurrencyDropdown}
        onClose={() => setShowCurrencyDropdown(false)}
        options={currencyOptions}
        selectedValue={selectedCurrencyValue}
        onSelect={(option) => {
          dispatch(setSelectedCurrencyValue(option?.value ?? ''));
        }}
        anchorRef={currencyRef}
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

export default AdminEarningCard;
