import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Svg, Circle, Text as SvgText } from "react-native-svg";
import { color } from '../../../color/color';
import { formatValue } from '../../../constants/formatValue';
import SvgIcons from '../../../components/SvgIcons';
import { formatValueWithPad } from '../../../constants/formatValue';
import { logger } from '../../../utils/logger';
import { styles } from './index.styles';

interface CircularProgressProps {
  value: any;
  total: any;
  percentage: any;
  color?: any;
}

// CircularProgress component matching the exact design from CheckInSolidTicketsCard
const CircularProgress: React.FC<CircularProgressProps> = ({ value, total, percentage, color = color.btnBrown_AE6F28 }) => {
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
        stroke={color}
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

interface TotalPaymentChannelCardProps {
  stats: any;
  onPaymentChannelPress: any;
  activePaymentChannel: any;
}

const TotalPaymentChannelCard: React.FC<TotalPaymentChannelCardProps> = ({ stats, onPaymentChannelPress, activePaymentChannel }) => {
  // Comprehensive logging for debugging
  logger.log('💳 TotalPaymentChannelCard - Full stats:', JSON.stringify(stats, null, 2));
  logger.log('💳 TotalPaymentChannelCard - stats.data keys:', Object.keys(stats?.data || {}));
  logger.log('💳 TotalPaymentChannelCard - box_office_sales:', stats?.data?.box_office_sales);
  logger.log('💳 TotalPaymentChannelCard - payment_channels (root):', stats?.data?.payment_channels);
  logger.log('💳 TotalPaymentChannelCard - payment_channel (root):', stats?.data?.payment_channel);

  // Get payment channel data from various possible locations
  const boxOfficeSalesData = stats?.data?.box_office_sales || {};
  const paymentChannel = boxOfficeSalesData?.payment_channels ||
    boxOfficeSalesData?.payment_channel ||
    stats?.data?.payment_channels ||
    stats?.data?.payment_channel ||
    {};

  // Get total amount from various possible locations
  const totalAmount = boxOfficeSalesData?.total_amount ||
    boxOfficeSalesData?.total ||
    stats?.data?.total_amount ||
    stats?.data?.total ||
    paymentChannel?.total ||
    0;

  logger.log('💳 TotalPaymentChannelCard - Resolved Payment Channel Data:', paymentChannel);
  logger.log('💳 TotalPaymentChannelCard - Resolved Total Amount:', totalAmount);
  logger.log('💳 TotalPaymentChannelCard - Total Amount Sources:');
  logger.log('  - boxOfficeSalesData?.total_amount:', boxOfficeSalesData?.total_amount);
  logger.log('  - boxOfficeSalesData?.total:', boxOfficeSalesData?.total);
  logger.log('  - stats?.data?.total_amount:', stats?.data?.total_amount);
  logger.log('  - stats?.data?.total:', stats?.data?.total);
  logger.log('  - paymentChannel?.total:', paymentChannel?.total);

  // Map payment methods to colors (matching the main payment channel component)
  const paymentMethodColors: Record<string, string> = {
    "Cash": "#AE6F28",
    "Card": "#87807C",
    "MoMo": "#EDB58A",
    "Mobile Money": "#EDB58A",
    "P.O.S.": "#945F22",
    "POS": "#945F22",
    "Wallet": "#F4A261",
    "Bank Transfer": "#CEBCA0",
    "Free": "#2A9D8F"
  };

  // Transform the data into the required format
  let paymentChannels: any[] = [];

  if (Object.keys(paymentChannel).length > 0) {
    paymentChannels = Object.entries(paymentChannel)
      .filter(([key, value]) => {
        const lowerKey = key.toLowerCase();
        const shouldExclude = ['wallet', 'bank_transfer', 'free', 'total'].includes(lowerKey);
        const hasValue = parseFloat(value as string) > 0;
        return !shouldExclude && hasValue;
      })
      .map(([key, value]) => {
        const label = key === 'mobile_money' ? 'MoMo' :
          key === 'pos' ? 'P.O.S.' :
            key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');

        return {
          label: label,
          value: parseFloat(value as string) || 0,
          color: paymentMethodColors[label] || "#87807C",
          percentage: totalAmount > 0 ? Math.round((parseFloat(value as string) / totalAmount) * 100) : 0
        };
      });
  }

  // Sort in desired order
  const paymentOrder = ["Cash", "P.O.S.", "Card", "MoMo"];
  const sortedChannels = paymentOrder
    .map(type => paymentChannels.find(v => v.label === type))
    .filter(Boolean);

  const remainingChannels = paymentChannels.filter(v => !paymentOrder.includes(v.label));
  const allChannels = [...sortedChannels, ...remainingChannels];

  logger.log('💳 TotalPaymentChannelCard - Final allChannels:', allChannels);
  logger.log('💳 TotalPaymentChannelCard - allChannels length:', allChannels.length);


  return (
    <View>
      <View style={styles.card}>
        {/* Header with Total Amount and Bar Chart Icon */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>Total Amount</Text>
            <Text style={styles.headerValue}>GHS {formatValue(totalAmount)}</Text>
          </View>

        </View>

        {/* Payment Channels List - matching CheckInSolidTicketsCard structure */}
        {allChannels.length > 0 ? (
          allChannels.map((channel, index) => (
            <TouchableOpacity
              key={index}
              style={styles.row}
              onPress={() => onPaymentChannelPress && onPaymentChannelPress(channel.label)}
              activeOpacity={0.7}
            >
              <CircularProgress
                value={channel.value}
                total={totalAmount}
                percentage={channel.percentage}
                color={channel.color}
              />
              <View style={styles.textContainer}>
                <Text style={styles.label}>{channel.label}</Text>
                <View style={styles.valueContainer}>
                  <View style={styles.valueResultContainer}>
                    <Text style={styles.valueResult}>GHS {formatValueWithPad(channel.value)}</Text>
                  </View>
                  <View style={styles.separatorLine} />
                  <View style={styles.valueTotalContainer}>
                    <Text style={styles.valueTotal}>GHS {formatValueWithPad(totalAmount)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.dropdownButton}>
                {activePaymentChannel === channel.label ? (
                  <SvgIcons.iconBarsActive width={24} height={24} fill={color.btnBrown_AE6F28} />
                ) : (
                  <SvgIcons.iconBarsInactive width={24} height={24} fill={color.black_544B45} />
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No payment channel data available</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TotalPaymentChannelCard;
