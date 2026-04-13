import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, ClipPath, Circle, Path, G, Stop, RadialGradient } from "react-native-svg";
import { color } from '../../../color/color';
import Typography, { Body1, Heading5 } from '../../../components/Typography';
import { formatValue } from '../../../constants/formatValue';
import { logger } from '../../../utils/logger';
import { styles } from './index.styles';

interface AdminBoxOfficeSalesProps {
  stats: any;
}

const AdminBoxOfficeSales: React.FC<AdminBoxOfficeSalesProps> = ({ stats }) => {
  // Log the raw stats data received from backend
  logger.log('================================================');
  logger.log('📊 AdminBoxOfficeSales - Raw Stats Data:', JSON.stringify(stats, null, 2));
  logger.log('📊 AdminBoxOfficeSales - Box Office Sales Data:', JSON.stringify(stats?.data?.box_office_sales, null, 2));
  logger.log('📊 AdminBoxOfficeSales - By Payment Methods:', JSON.stringify(stats?.data?.box_office_sales?.by_payment_methods, null, 2));
  logger.log('================================================');

  const boxOfficeSalesData = stats?.data?.box_office_sales || {};
  const byPaymentMethods = boxOfficeSalesData?.by_payment_methods || {};
  const total = boxOfficeSalesData?.total || 0;

  // Map ticket types to colors (by_payment_methods contains ticket types)
  const ticketTypeColors: Record<string, string> = {
    "VIP": "#87807C",
    "General": "#CEBCA0",
    "Early Bird": "#945F22",
    "VIP Ticket": "#87807C",
    "Members": "#EDB58A",
    "Standard": "#AE6F28",
    "Premium": "#F4A261",
    "Packages": "#87807C"
  };

  // Transform the data into the required format for pie chart
  // by_payment_methods actually contains ticket types and their sales amounts
  const values: Array<{ label: string; value: number; color: string }> = Object.keys(byPaymentMethods).length > 0
    ? Object.entries(byPaymentMethods)
      .filter(([key, value]) => parseFloat(value as string) >= 0) // Only show non-zero values
      .map(([key, value], index) => {
        return {
          label: key,
          value: parseFloat(value as string) || 0,
          color: ticketTypeColors[key] || "#87807C" // Fallback color
        };
      })
    : [
      {
        label: "No Data",
        value: 0,
        color: "#87807C"
      }
    ];

  // Sort by value (highest first) or keep original order
  const sortedValues = values.sort((a, b) => b.value - a.value);

  const totalValue = values.reduce((sum, item) => sum + item.value, 0);
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 15;
  const totalGap = gapSize * sortedValues.length;

  // Calculate segments for the circle with visible gaps and no overlap
  const calculateSegments = () => {
    let currentOffset = 0;
    return sortedValues.map((item) => {
      const percentage = totalValue > 0 ? item.value / totalValue : 0;
      // Distribute the circumference minus total gap among the arcs
      const dashLength = (circumference - totalGap) * percentage;
      const segment = {
        ...item,
        dashLength: dashLength > 0 ? dashLength : 0,
        dashOffset: currentOffset
      };
      currentOffset += dashLength + gapSize;
      return segment;
    });
  };

  const segments = calculateSegments();

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.heading}>Box Office Sales</Text>
        <View style={styles.row}>
          <View style={styles.chartContainer}>
            <Svg height="140" width="140" viewBox="0 0 120 120">
              <Defs>
                {/* 1. Define a single, light radial gradient for the entire inner area */}
                <RadialGradient
                  id="lightInnerGlow"
                  cx="50%"
                  cy="50%"
                  r="70%"
                >
                  {/* Using a light, slightly warm color for the center glow */}
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                  {/* Fading to white/off-white towards the edge */}
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                </RadialGradient>

                {/* 2. ClipPath logic removed (was for multi-colored inner glows) */}
              </Defs>

              {/* 3. Single inner circle using the new light gradient */}
              <Circle
                cx="60"
                cy="60"
                r={radius} // Use full radius to fill the space
                fill="url(#lightInnerGlow)"
              />

              {/* Base circle outline (might be removed or changed to a background disc) */}
              {/* Based on the image, the outer edge of the inner fill is not a distinct line.
                                We'll keep the full circle fill above and remove the base circle outline to
                                match the desired look where the arcs sit directly on top of the gradient.
                                However, if you want a light grey line, uncomment the next block. */}

              {/* Optional: Add a subtle light stroke underneath the arcs if needed. */}
              {/* <Circle
                                cx="60"
                                cy="60"
                                r={radius}
                                stroke="#EFEFEF" // Very light gray stroke
                                strokeWidth={strokeWidth}
                                fill="none"
                            />
                            */}

              {/* Colored arcs - remains the same */}
              {segments.map((segment, index) => (
                <Circle
                  key={index}
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
                  strokeDashoffset={-segment.dashOffset}
                  strokeLinecap="round"
                />
              ))}
            </Svg>
            <View style={styles.centerText}>
              <Text style={styles.amountText}>GHS {formatValue(total)}</Text>
              <Text style={styles.totalText}>Total</Text>
            </View>
          </View>
          <View style={styles.paymentMethod}>
            {sortedValues.map((item, index) => (
              <View style={styles.paymentItem} key={index}>
                <View style={styles.colorBoxWrapper}>
                  <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                </View>
                <View style={styles.paymentLabel}>
                  <Text style={styles.paymentText}>{item.label}</Text>
                </View>
                <View style={styles.paymentValueWrapper}>
                  <Text style={styles.labelGHS}>GHS</Text>
                  <Text style={styles.paymentValue}>{formatValue(item.value)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default AdminBoxOfficeSales;
