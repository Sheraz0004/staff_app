import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import { useNavigation } from '@react-navigation/native';
import { formatValueWithPad } from "../../../constants/formatValue";
import { styles } from "./index.styles";

interface CircularProgressProps {
  value: any;
  total: any;
  percentage: any;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, total, percentage }) => {
  const radius = 20;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = percentage !== undefined ? percentage : (total > 0 ? (value / total) * 100 : 0);
  const progress = (progressPercentage / 100) * circumference;

  // Adjust font size and position based on percentage value
  const fontSize = progressPercentage >= 100 ? 9 : 11;
  const textY = progressPercentage >= 100 ? 27 : 28;

  return (
    <Svg width={60} height={60} viewBox="0 0 50 50">
      <Circle
        cx="25"
        cy="25"
        r={radius}
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx="25"
        cy="25"
        r={radius}
        stroke={color.btnBrown_AE6F28}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${circumference - progress}`}
        strokeLinecap="round"
      />
      <SvgText
        x="25"
        y={textY}
        textAnchor="middle"
        fontSize={fontSize}
        fill={color.placeholderTxt_24282C}
        fontWeight="500"
      >
        {`${Math.round(progressPercentage)}%`}
      </SvgText>
    </Svg>
  );
};

interface ScanCategoriesDetailsProps {
  stats: any;
  onScanAnalyticsPress: any;
  activeScanAnalytics: any;
}

const ScanCategoriesDetails: React.FC<ScanCategoriesDetailsProps> = ({ stats, onScanAnalyticsPress, activeScanAnalytics }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const scanCategoriesData = stats?.data?.scan_categories?.ticket_wise || {};
  const navigation = useNavigation();

  const toggle = (label: string) => {
    setExpanded((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };



  const renderItem = (item: any, index: number, isSubItem: boolean = false, parentCategory: any = null) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expanded[item.label];

    return (
      <View key={item.label + index}>
        <TouchableOpacity
          style={[
            styles.row,
            isSubItem && styles.subRow
          ]}
          activeOpacity={hasSubItems ? 0.7 : (isSubItem ? 0.7 : 1)}
          onPress={() => {
            if (isSubItem) {
              // Trigger analytics when subitem is clicked
              if (onScanAnalyticsPress) {
                onScanAnalyticsPress(item.label, parentCategory, item.ticketUuid);
              }
            } else if (hasSubItems) {
              toggle(item.label);
            }
          }}
        >
          <CircularProgress value={item.scanned} total={item.total} percentage={item.percentage} />
          <View style={styles.textContainer}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.valueContainer}>
              <View style={styles.valueResultContainer}>
                <Text style={styles.valueResult}>{formatValueWithPad(item.scanned)}</Text>
              </View>
              <View style={styles.separatorLine} />
              <Text style={styles.valueTotal}>{formatValueWithPad(item.total)}</Text>
            </View>
          </View>
          {hasSubItems && (
            <View style={styles.iconsContainer}>
              {onScanAnalyticsPress && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onScanAnalyticsPress(item.label, item.label, null);
                  }}
                  style={styles.analyticsButton}
                >
                  {activeScanAnalytics === `Scan-${item.label}-${item.label}` ? (
                    <SvgIcons.iconBarsActive width={24} height={24} fill={color.btnBrown_AE6F28} />
                  ) : (
                    <SvgIcons.iconBarsInactive width={24} height={24} fill={color.black_544B45} />
                  )}
                </TouchableOpacity>
              )}
              <View style={styles.chevronContainer}>
                {isExpanded ? (
                  <SvgIcons.upArrow width={10} height={7} fill={color.black_544B45} />
                ) : (
                  <SvgIcons.downArrow width={10} height={7} fill={color.black_544B45} />
                )}
              </View>
            </View>
          )}
          {isSubItem && onScanAnalyticsPress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onScanAnalyticsPress(item.label, parentCategory, item.ticketUuid);
              }}
              style={styles.analyticsButtonSubItem}
            >
              {activeScanAnalytics === `Scan-${parentCategory}-${item.ticketUuid || item.label}` ? (
                <SvgIcons.iconBarsActive width={24} height={24} fill={color.btnBrown_AE6F28} />
              ) : (
                <SvgIcons.iconBarsInactive width={24} height={24} fill={color.black_544B45} />
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {hasSubItems && isExpanded && (
          <View style={styles.subitembg}>
            {item.subItems.map((sub: any, subIdx: number) =>
              <View key={sub.label + subIdx} style={styles.subRowBg}>
                {renderItem(sub, subIdx, true, item.label)}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Transform the data into the required format
  const transformData = () => {
    const categories = Object.keys(scanCategoriesData);
    return categories.map(category => {
      const categoryData = scanCategoriesData[category];
      const totalTickets = categoryData.total_tickets || 0;
      const scannedTickets = categoryData.scanned_tickets || 0;

      // Create subItems from the ticket types
      const subItems: any[] = [];
      Object.keys(categoryData).forEach(key => {
        if (key !== 'total_tickets' && key !== 'scanned_tickets') {
          const ticketData = categoryData[key];
          const total = ticketData.total || 0;
          const scanned = ticketData.scanned || 0;

          subItems.push({
            label: key,
            scanned: scanned,
            total: total,
            percentage: total > 0 ? Math.round((scanned / total) * 100) : 0,
            ticketUuid: ticketData.ticket_uuid,
            subItems: []
          });
        }
      });

      return {
        label: category,
        scanned: scannedTickets,
        total: totalTickets,
        percentage: totalTickets > 0 ? Math.round((scannedTickets / totalTickets) * 100) : 0,
        subItems: subItems
      };
    });
  };

  const listData = transformData();

  // Calculate total scanned tickets
  const totalScanned = listData.reduce((sum, item) => sum + item.scanned, 0);
  const totalTickets = listData.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.card}>
      {/* Total Scanned Tickets Row */}
      <TouchableOpacity style={styles.totalRow}>
        <CircularProgress value={totalScanned} total={totalTickets} percentage={totalTickets > 0 ? Math.round((totalScanned / totalTickets) * 100) : 0} />
        <View style={styles.textContainer}>
          <Text style={styles.totalLabel}>Total Scanned Tickets</Text>
          <View style={styles.valueContainer}>
            <View style={styles.valueResultContainer}>
              <Text style={styles.valueResult}>{formatValueWithPad(totalScanned)}</Text>
            </View>
            <View style={styles.separatorLine} />
            <Text style={styles.valueTotal}>{formatValueWithPad(totalTickets)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {listData.map((item, idx) => renderItem(item, idx))}
    </View>
  );
};

export default ScanCategoriesDetails;
