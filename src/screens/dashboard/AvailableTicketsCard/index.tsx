import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { color } from "../../../color/color";
import SvgIcons from "../../../components/SvgIcons";
import { useNavigation } from '@react-navigation/native';
import { logger } from '../../../utils/logger';
import { styles } from "./index.styles";

interface CircularProgressProps {
  value: number;
  total: number;
  percentage?: number;
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

interface AvailableTicketsCardProps {
  data: any[];
  stats: any;
}

const AvailableTicketsCard: React.FC<AvailableTicketsCardProps> = ({ data, stats }) => {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const listData = data && data.length > 0 ? data : [];
  const navigation = useNavigation();

  const toggle = (label: string) => {
    setExpanded((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleSubItemPress = (subItemLabel: string, parentLabel: string) => {
    logger.log('AvailableTicketsCard - Subitem clicked:', subItemLabel, 'Parent:', parentLabel);

    // Dynamic tab mapping - use the parent label directly
    // The parent category should be the tab name in BoxOfficeTab
    let selectedTab = parentLabel;

    // Handle special cases where parent label might not match tab name exactly
    if (parentLabel === 'Available Tickets') {
      // For "Available Tickets", we need to find the actual category from the data
      if (stats?.data?.available_tickets) {
        const availableTickets = stats.data.available_tickets;
        // Find the first category that has this sub-item
        for (const [categoryName, categoryData] of Object.entries(availableTickets)) {
          if (categoryData && typeof categoryData === 'object') {
            // Check if this category contains the sub-item
            if ((categoryData as any)[subItemLabel] ||
              Object.keys(categoryData as any).some((key: string) =>
                key.toLowerCase() === subItemLabel.toLowerCase()
              )) {
              selectedTab = categoryName;
              break;
            }
          }
        }
      }
    }

    logger.log('AvailableTicketsCard - Mapped tab:', selectedTab);

    if (selectedTab && selectedTab !== 'Available Tickets') {
      (navigation as any).navigate('Tickets', {
        screen: 'BoxOfficeTab',
        selectedTab: selectedTab
      });
    } else {
      logger.warn('AvailableTicketsCard - No valid tab found for:', subItemLabel, 'Parent:', parentLabel);
    }
  };

  const renderItem = (item: any, index: number, isSubItem: boolean = false) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expanded[item.label];

    return (
      <View key={item.label + index}>
        <TouchableOpacity
          style={[
            styles.row,
            isSubItem && styles.subRow
          ]}
          activeOpacity={hasSubItems ? 0.7 : 1}
          onPress={() => {
            if (isSubItem) {
              // Navigate to BoxOfficeTab for subitems with dynamic mapping
              handleSubItemPress(item.label, item.parentLabel || 'Available Tickets');
            } else if (hasSubItems) {
              toggle(item.label);
            }
          }}
        >
          <CircularProgress value={item.checkedIn} total={item.total} percentage={item.percentage} />
          <View style={styles.textContainer}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>
              {item.total}
            </Text>
          </View>
          {hasSubItems && (
            <View style={styles.chevronContainer}>
              {isExpanded ? (
                <SvgIcons.upArrow width={10} height={7} fill={color.black_544B45} />
              ) : (
                <SvgIcons.downArrow width={10} height={7} fill={color.black_544B45} />
              )}
            </View>
          )}
        </TouchableOpacity>
        {hasSubItems && isExpanded && (
          <View style={styles.subitembg}>
            {item.subItems.map((sub: any, subIdx: number) =>
              <View key={sub.label + subIdx} style={styles.subRowBg}>
                {renderItem({ ...sub, parentLabel: item.label }, subIdx, true)}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // Calculate total available tickets
  const totalAvailableTickets = listData.reduce((sum, item) => sum + (item.checkedIn || 0), 0);

  return (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Total Available Tickets</Text>
        <Text style={styles.headerValue}>{totalAvailableTickets}</Text>
      </View>
      {listData.map((item, idx) => renderItem(item, idx))}
    </View>
  );
};

export default AvailableTicketsCard;
