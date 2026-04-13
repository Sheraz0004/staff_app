import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { color } from "../../../color/color";
import { useNavigation } from "@react-navigation/native";
import SvgIcons from "../../../components/SvgIcons";
import { formatValueWithPad } from "../../../constants/formatValue";
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
  const fontSize = progressPercentage >= 50 ? 9 : 11;
  const textY = progressPercentage >= 50 ? 27 : 28;

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

interface CheckInSoldTicketsCardProps {
  title: string;
  data: any[];
  showRemaining: boolean;
  remainingTicketsData: any[];
  userRole: string;
  stats: any;
  onAnalyticsPress?: (ticketType: any, title: any, ticketUuid?: any, subitemLabel?: any) => void;
  activeAnalytics: string | null;
}

const CheckInSoldTicketsCard: React.FC<CheckInSoldTicketsCardProps> = ({ title, data, showRemaining, remainingTicketsData, userRole, stats, onAnalyticsPress, activeAnalytics }) => {
  const navigation = useNavigation();
  const [expandedItems, setExpandedItems] = useState<{ [key: number]: boolean }>({});

  const handleRemainingPress = () => {
    (navigation as any).navigate('Tickets', { screen: 'BoxOfficeTab' });
  };

  const toggleExpanded = (itemIndex: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemIndex]: !prev[itemIndex]
    }));
  };

  const handleSubItemPress = (subItemLabel: string, parentLabel: string, ticketUuid: any = null) => {

    // Only navigate for Available, for other titles we show analytics
    if (title === 'Available') {
      // Dynamic tab mapping - use the parent label directly
      // The parent category should be the tab name in BoxOfficeTab
      let selectedTab = parentLabel;

      // Handle special cases where parent label might not match tab name exactly
      if (parentLabel === 'Total Sold') {
        // For "Total Sold", we need to find the actual category from the data
        if (stats?.data?.sold_tickets?.by_category) {
          const byCategory = stats.data.sold_tickets.by_category;
          // Find the first category that has this sub-item
          for (const [categoryName, categoryData] of Object.entries(byCategory)) {
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

      if (selectedTab && selectedTab !== 'Total Sold') {
        (navigation as any).navigate('Tickets', {
          screen: 'BoxOfficeTab',
          selectedTab: selectedTab,
          ticketUuid: ticketUuid
        });
      }
    }
    // For other titles (Sold Tickets, Check-Ins), analytics are handled by the analytics button
  };

  // Get sub-items for ADMIN and STAFF users from the appropriate data source
  const getSubItems = (item: any, itemIndex: number) => {
    if (userRole !== 'ADMIN' && userRole !== 'STAFF' && userRole !== 'ORGANIZER') {
      return null;
    }

    let byCategory: any = null;
    let dataSource: string | null = null;

    // Determine the correct data source based on title
    if (title === 'Check-Ins' && stats?.data?.check_ins?.by_category) {
      byCategory = stats.data.check_ins.by_category;
      dataSource = 'check_ins';
    } else if (stats?.data?.sold_tickets?.by_category) {
      byCategory = stats.data.sold_tickets.by_category;
      dataSource = 'sold_tickets';
    }

    if (!byCategory) {
      return null;
    }

    const categoryData = byCategory[item.label];

    if (!categoryData || Object.keys(categoryData).length === 0) {
      return null;
    }

    // Extract sub-items (like "Standard" from VIP Ticket category)
    const subItems: any[] = [];
    Object.keys(categoryData).forEach(key => {
      if (key !== 'total_tickets' && key !== 'sold_tickets' && key !== 'scanned_tickets' && categoryData[key]) {
        const subData = categoryData[key];

        // Use the correct field based on data source
        let checkedInValue = 0;
        let totalValue = 0;

        if (dataSource === 'check_ins') {
          checkedInValue = subData.scanned || 0;
          totalValue = subData.total || 0;
        } else if (dataSource === 'sold_tickets') {
          checkedInValue = subData.sold || 0;
          totalValue = subData.total || 0;
        }

        if (totalValue !== undefined && checkedInValue !== undefined) {
          subItems.push({
            label: key,
            checkedIn: checkedInValue,
            total: totalValue,
            percentage: totalValue > 0 ? Math.round((checkedInValue / totalValue) * 100) : 0,
            ticketUuid: subData.ticket_uuid
          });
        }
      }
    });

    return subItems.length > 0 ? subItems : null;
  };

  return (
    <View>
      <View style={styles.card}>
        {/* <Text style={styles.title}>{title}</Text> */}
        {data.map((item, index) => {
          const subItems = getSubItems(item, index);
          const isExpanded = expandedItems[index];
          const hasSubItems = subItems && subItems.length > 0;

          return (
            <View key={index}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => hasSubItems && toggleExpanded(index)}
                activeOpacity={hasSubItems ? 0.7 : 1}
              >
                <CircularProgress value={item.checkedIn} total={item.total} percentage={item.percentage} />
                <View style={styles.textContainer}>
                  <Text style={styles.label}>{item.label}</Text>
                  <View style={styles.valueContainer}>
                    <View style={styles.valueResultContainer}>
                      <Text style={styles.valueResult}>{formatValueWithPad(item.checkedIn)}</Text>
                    </View>
                    <View style={styles.separatorLine} />
                    <Text style={styles.valueTotal}>{formatValueWithPad(item.total)}</Text>
                  </View>
                </View>
                {hasSubItems && (
                  <View style={styles.dropdownButton}>
                    <View style={styles.iconsContainer}>
                      {(userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'ORGANIZER') && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation(); // Prevent row press
                            onAnalyticsPress && onAnalyticsPress(item.label, title);
                          }}
                          style={styles.analyticsButton}
                        >
                          {activeAnalytics === `${title}-${item.label}` ? (
                            <SvgIcons.iconBarsActive width={24} height={24} fill={color.btnBrown_AE6F28} />
                          ) : (
                            <SvgIcons.iconBarsInactive width={24} height={24} fill={color.black_544B45} />
                          )}
                        </TouchableOpacity>
                      )}
                      {isExpanded ? (
                        <SvgIcons.upArrow width={10} height={7} fill={color.black_544B45} />
                      ) : (
                        <SvgIcons.downArrow width={10} height={7} fill={color.black_544B45} />
                      )}
                    </View>
                  </View>
                )}

              </TouchableOpacity>

              {/* Sub-items for ADMIN users */}
              {hasSubItems && isExpanded && (
                <View style={styles.subItemsContainer}>
                  {subItems.map((subItem: any, subIndex: number) => (
                    <TouchableOpacity
                      key={subIndex}
                      style={styles.subItemRow}
                      onPress={() => {
                        if (title === 'Available') {
                          handleSubItemPress(subItem.label, item.label, subItem.ticketUuid);
                        } else if ((userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'ORGANIZER') && (title === 'Sold Tickets' || title === 'Check-Ins') && onAnalyticsPress) {
                          // Trigger analytics when subitem is clicked
                          onAnalyticsPress(item.label, title, subItem.ticketUuid, subItem.label);
                        }
                      }}
                      activeOpacity={(title === 'Available' || ((userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'ORGANIZER') && (title === 'Sold Tickets' || title === 'Check-Ins'))) ? 0.7 : 1}
                    >
                      <CircularProgress
                        value={subItem.checkedIn}
                        total={subItem.total}
                        percentage={subItem.percentage}
                      />
                      <View style={styles.textContainer}>
                        <Text style={styles.subItemLabel}>{subItem.label}</Text>
                        <View style={styles.valueContainer}>
                          <View style={styles.valueResultContainer}>
                            <Text style={styles.valueResult}>{formatValueWithPad(subItem.checkedIn)}</Text>
                          </View>
                          <View style={styles.separatorLine} />
                          <Text style={styles.valueTotal}>{formatValueWithPad(subItem.total)}</Text>
                        </View>
                      </View>
                      {(userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'ORGANIZER') && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            onAnalyticsPress && onAnalyticsPress(item.label, title, subItem.ticketUuid, subItem.label);
                          }}
                          style={styles.analyticsButtonSubItem}
                        >
                          {activeAnalytics === `${title}-${subItem.ticketUuid || subItem.label}` ? (
                            <SvgIcons.iconBarsActive width={24} height={24} fill={color.btnBrown_AE6F28} />
                          ) : (
                            <SvgIcons.iconBarsInactive width={24} height={24} fill={color.black_544B45} />
                          )}
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* {showRemaining && remainingTicketsData && remainingTicketsData.length > 0 && (
        <TouchableOpacity
          style={styles.remainingContainer}
          onPress={handleRemainingPress}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>Available</Text>
          {remainingTicketsData.map((item, index) => {
            const remaining = item.total - item.checkedIn;
            return (
              <View key={index} style={styles.row}>
                <CircularProgress value={remaining} total={item.total} />
                <View style={styles.textContainer}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{remaining}</Text>
                </View>
              </View>
            );
          })}
        </TouchableOpacity>
      )} */}
    </View>
  );
};

export default CheckInSoldTicketsCard;
