import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Defs, Circle, Stop, RadialGradient } from "react-native-svg";
import { color } from '../../../color/color';
import { formatValue } from '../../../constants/formatValue';
import { styles } from './index.styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NoDataMessage: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 28 }}>
        <Svg width={44} height={44} viewBox="0 0 44 44" style={{ marginBottom: 12 }}>
            <Circle cx={22} cy={22} r={18} stroke="#CEBCA0" strokeWidth={2} fill="none" strokeDasharray="5 4" />
            <Circle cx={22} cy={22} r={10} stroke="#CEBCA0" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
        </Svg>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#24282C', marginBottom: 6, textAlign: 'center' }}>
            {message}
        </Text>
        <Text style={{ fontSize: 12, color: '#87807C', textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
            {subtext}
        </Text>
    </View>
);

interface AdminBoxOfficePaymentChannelProps {
    stats: any;
}

const AdminBoxOfficePaymentChannel: React.FC<AdminBoxOfficePaymentChannelProps> = ({ stats }) => {
    const PAYMENT_METHOD_KEYS = ['CARD', 'MOBILE_MONEY', 'CASH', 'BANK_TRANSFER', 'WALLET', 'POS'];
    const salesData = stats?.sales || {};
    const paymentChannel: Record<string, number> = {};
    PAYMENT_METHOD_KEYS.forEach(key => {
        if (salesData[key] !== undefined) {
            paymentChannel[key.toLowerCase()] = salesData[key];
        }
    });

    const paymentMethodColors: Record<string, string> = {
        "Cash": "#AE6F28",
        "Card": "#87807C",
        "MoMo": "#EDB58A",
        "Mobile Money": "#EDB58A",
        "P.O.S.": "#945F22",
        "POS": "#945F22",
        "Wallet": "#F4A261",
        "Bank Transfer": "#CEBCA0",
        "Free": "#2A9D8F",
    };

    let values: Array<{ label: string; value: number; color: string }> = Object.entries(paymentChannel)
        .filter(([key]) => !['wallet', 'bank_transfer', 'free', 'total'].includes(key.toLowerCase()))
        .map(([key, value]) => {
            const label = key === 'mobile_money' ? 'MoMo'
                : key === 'pos' ? 'P.O.S.'
                : key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            return { label, value: value || 0, color: paymentMethodColors[label] || "#87807C" };
        });

    const total = values.reduce((sum, item) => sum + item.value, 0);
    const hasData = total > 0;

    if (!hasData) {
        values = [{ label: "No Data", value: 1, color: "#E0E0E0" }];
    }

    const paymentOrder = ["Cash", "P.O.S.", "Card", "MoMo"];
    const sortedValues = [
        ...paymentOrder.map(type => values.find(v => v.label === type)).filter(Boolean),
        ...values.filter(v => !paymentOrder.includes(v.label)),
    ] as Array<{ label: string; value: number; color: string }>;

    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const gapSize = 15;
    const totalGap = gapSize * sortedValues.length;
    const totalValue = sortedValues.reduce((sum, item) => sum + item.value, 0);

    const calculateSegments = () => {
        let currentOffset = 0;
        return sortedValues.map((item) => {
            const percentage = totalValue > 0 ? item.value / totalValue : 0;
            const dashLength = (circumference - totalGap) * percentage;
            const segment = { ...item, dashLength: dashLength > 0 ? dashLength : 0, dashOffset: currentOffset };
            currentOffset += dashLength + gapSize;
            return segment;
        });
    };

    const segments = calculateSegments();

    const animProgress = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        animProgress.setValue(0);
        Animated.timing(animProgress, {
            toValue: segments.length,
            duration: Math.max(700, segments.length * 280),
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [segments.length, hasData]);

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Text style={styles.heading}>Payment Channels</Text>

                {!hasData ? (
                    <NoDataMessage
                        message="No Payment Data"
                        subtext="Payment channel breakdown will appear once transactions have been processed."
                    />
                ) : (
                    <View style={styles.row}>
                        <View style={styles.chartContainer}>
                            <Svg height="140" width="140" viewBox="0 0 120 120">
                                <Defs>
                                    <RadialGradient id="paymentGlow" cx="50%" cy="50%" r="70%">
                                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                                    </RadialGradient>
                                </Defs>
                                <Circle cx="60" cy="60" r={radius} fill="url(#paymentGlow)" />
                                {segments.map((segment, index) => {
                                    const startOff = -segment.dashOffset + segment.dashLength;
                                    const endOff = -segment.dashOffset;
                                    const animOffset = animProgress.interpolate({
                                        inputRange: [index, Math.min(index + 1, segments.length)],
                                        outputRange: [startOff, endOff],
                                        extrapolate: 'clamp',
                                    });
                                    return (
                                        <AnimatedCircle
                                            key={index}
                                            cx="60" cy="60" r={radius}
                                            stroke={segment.color}
                                            strokeWidth={strokeWidth}
                                            fill="none"
                                            strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
                                            strokeDashoffset={animOffset}
                                            strokeLinecap="round"
                                        />
                                    );
                                })}
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
                )}
            </View>
        </View>
    );
};

export default AdminBoxOfficePaymentChannel;
