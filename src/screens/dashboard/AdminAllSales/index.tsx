import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, ClipPath, Circle, Path, G, Stop, RadialGradient } from "react-native-svg";
import { color } from '../../../color/color';
import Typography, { Body1, Heading5 } from '../../../components/Typography';
import { formatValue } from '../../../constants/formatValue';
import { styles } from './index.styles';

interface AdminAllSalesProps {
  stats: any;
}

const AdminAllSales: React.FC<AdminAllSalesProps> = ({ stats }) => {
  const allSalesData = stats?.data?.all_sales || {};

  // Transform the data into the required format for pie chart
  const values = [
    {
      label: "Online",
      value: parseFloat(allSalesData.online) || 0,
      color: "#AE6F28"
    },
    {
      label: "Box Office",
      value: parseFloat(allSalesData.box_office) || 0,
      color: "#87807C"
    }
  ];

  const total = values.reduce((sum, item) => sum + item.value, 0);
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 15;
  const totalGap = gapSize * values.length;

  // Calculate segments for the circle with visible gaps and no overlap
  const calculateSegments = () => {
    let currentOffset = 0;
    return values.map((item) => {
      const percentage = total > 0 ? item.value / total : 0;
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
        <Text style={styles.heading}>All Sales</Text>
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
            {values.map((item, index) => (
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

export default AdminAllSales;
