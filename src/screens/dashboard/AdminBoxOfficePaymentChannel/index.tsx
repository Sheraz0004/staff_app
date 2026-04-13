import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, ClipPath, Circle, Path, G, Stop, RadialGradient } from "react-native-svg";
import { color } from '../../../color/color';
import Typography, { Body1, Heading5 } from '../../../components/Typography';
import { formatValue } from '../../../constants/formatValue';
import { logger } from '../../../utils/logger';
import { styles } from './index.styles';

interface AdminBoxOfficePaymentChannelProps {
  stats: any;
}

const AdminBoxOfficePaymentChannel: React.FC<AdminBoxOfficePaymentChannelProps> = ({ stats }) => {
    // Comprehensive logging for backend response structure
    logger.log('================================================');
    logger.log('💰 AdminBoxOfficePaymentChannel - COMPLETE BACKEND RESPONSE:');
    logger.log('💰 Full stats object:', JSON.stringify(stats, null, 2));
    logger.log('💰 stats.data keys:', Object.keys(stats?.data || {}));
    logger.log('💰 Box Office Sales Data:', JSON.stringify(stats?.data?.box_office_sales, null, 2));
    logger.log('💰 Payment Channels (plural):', JSON.stringify(stats?.data?.box_office_sales?.payment_channels, null, 2));
    logger.log('💰 Payment Channel (singular):', JSON.stringify(stats?.data?.box_office_sales?.payment_channel, null, 2));
    logger.log('💰 Payment Channels at root level:', JSON.stringify(stats?.data?.payment_channels, null, 2));
    logger.log('💰 Payment Channel at root level:', JSON.stringify(stats?.data?.payment_channel, null, 2));

    // Check for analytics data
    logger.log('💰 Payment Analytics Data:', JSON.stringify(stats?.data?.payment_analytics, null, 2));
    logger.log('💰 Payment Channel Analytics:', JSON.stringify(stats?.data?.payment_channel_analytics, null, 2));
    logger.log('💰 Box Office Payment Analytics:', JSON.stringify(stats?.data?.box_office_sales?.payment_analytics, null, 2));
    logger.log('💰 Box Office Payment Channel Analytics:', JSON.stringify(stats?.data?.box_office_sales?.payment_channel_analytics, null, 2));

    // Check for total amount data
    logger.log('💰 Total Amount Data:', JSON.stringify(stats?.data?.total_amount, null, 2));
    logger.log('💰 Box Office Total Amount:', JSON.stringify(stats?.data?.box_office_sales?.total_amount, null, 2));
    logger.log('💰 Box Office Sales Total:', JSON.stringify(stats?.data?.box_office_sales?.total, null, 2));
    logger.log('================================================');

    const boxOfficeSalesData = stats?.data?.box_office_sales || {};
    // Try both payment_channels (plural) and payment_channel (singular) for backward compatibility
    const paymentChannel = boxOfficeSalesData?.payment_channels || boxOfficeSalesData?.payment_channel || {};

    logger.log('💰 AdminBoxOfficePaymentChannel - Payment Channel Keys:', Object.keys(paymentChannel));
    logger.log('💰 AdminBoxOfficePaymentChannel - Payment Channel Values:', paymentChannel);

    // Map payment methods to colors
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

    // Transform the data into the required format for pie chart
    let values: Array<{ label: string; value: number; color: string }> = [];

    if (Object.keys(paymentChannel).length >= 0) {
        values = Object.entries(paymentChannel)
            .filter(([key, value]) => {
                // Filter out unwanted payment methods or zero values
                const lowerKey = key.toLowerCase();
                const shouldExclude = ['wallet', 'bank_transfer', 'free', 'total'].includes(lowerKey);
                const hasValue = parseFloat(value as string) >= 0;
                logger.log(`💰 Checking ${key}: value=${value}, exclude=${shouldExclude}, hasValue=${hasValue}`);
                return !shouldExclude && hasValue;
            })
            .map(([key, value], index) => {
                const label = key === 'mobile_money' ? 'MoMo' :
                    key === 'pos' ? 'P.O.S.' :
                        key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '); // Capitalize and replace underscore

                return {
                    label: label,
                    value: parseFloat(value as string) || 0,
                    color: paymentMethodColors[label] || "#87807C" // Fallback color
                };
            });
    }

    // If no values after filtering, show "No Data"
    if (values.length === 0) {
        logger.log(' No payment channel data found, showing No Data');
        values = [{
            label: "No Data",
            value: 0,
            color: "#87807C"
        }];
    }

    logger.log('💰 Final values array:', values);

    // Sort values in desired order
    const paymentOrder = ["Cash", "P.O.S.", "Card", "MoMo"];
    const sortedValues = paymentOrder
        .map(type => values.find(v => v.label === type))
        .filter(Boolean) as Array<{ label: string; value: number; color: string }>;

    // Add any remaining values not in the order list
    const remainingValues = values.filter(v => !paymentOrder.includes(v.label));
    const allValues = [...sortedValues, ...remainingValues];

    const total = allValues.reduce((sum, item) => sum + item.value, 0);

    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const gapSize = 15;
    const totalGap = gapSize * allValues.length;

    // Calculate segments for the circle with visible gaps and no overlap
    const calculateSegments = () => {
        let currentOffset = 0;
        return allValues.map((item) => {
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
                <Text style={styles.heading}>Payment Channels</Text>
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
                        {allValues.map((item, index) => (
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

export default AdminBoxOfficePaymentChannel;
