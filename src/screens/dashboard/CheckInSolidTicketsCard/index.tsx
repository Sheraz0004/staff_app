import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { color } from "../../../color/color";
import { useNavigation } from "@react-navigation/native";
import SvgIcons from "../../../components/SvgIcons";
import { formatValueWithPad } from "../../../constants/formatValue";
import { styles } from "./index.styles";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const fontSize = progressPercentage >= 50 ? 9 : 11;
  const textY = progressPercentage >= 50 ? 27 : 28;

  const animOffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    animOffset.setValue(circumference);
    Animated.timing(animOffset, {
      toValue: circumference - (progressPercentage / 100) * circumference,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  return (
    <Svg width={60} height={60} viewBox="0 0 50 50">
      <Circle cx="25" cy="25" r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
      <AnimatedCircle
        cx="25" cy="25" r={radius}
        stroke={color.btnBrown_AE6F28}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={animOffset}
        strokeLinecap="round"
      />
      <SvgText x="25" y={textY} textAnchor="middle" fontSize={fontSize} fill={color.placeholderTxt_24282C} fontWeight="500">
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
        const classes = stats?.sales?.tickets?.classes || {};
        for (const [categoryName, categoryData] of Object.entries(classes)) {
          const subClasses = (categoryData as any)?.subClasses || {};
          if (subClasses[subItemLabel] !== undefined ||
            Object.keys(subClasses).some(k => k.toLowerCase() === subItemLabel.toLowerCase())) {
            selectedTab = categoryName;
            break;
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

    let classes: any = null;
    let isCheckIn = false;

    if (title === 'Check-Ins' && stats?.checkIns?.classes) {
      classes = stats.checkIns.classes;
      isCheckIn = true;
    } else if (stats?.sales?.tickets?.classes) {
      classes = stats.sales.tickets.classes;
    }

    if (!classes) return null;

    const categoryData = classes[item.label];
    if (!categoryData) return null;

    const subClasses = categoryData.subClasses || {};
    const availableSubClasses = stats?.availableTickets?.[item.label]?.subClasses || {};

    const subItems: any[] = Object.entries(subClasses).map(([subName, soldCount]) => {
      const sold = typeof soldCount === 'number' ? soldCount : 0;
      const available = isCheckIn ? 0 : (typeof availableSubClasses[subName] === 'number' ? availableSubClasses[subName] : 0);
      const total = sold + available;
      return {
        label: subName,
        checkedIn: sold,
        total,
        percentage: total > 0 ? Math.round((sold / total) * 100) : 0,
        ticketUuid: null,
      };
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
