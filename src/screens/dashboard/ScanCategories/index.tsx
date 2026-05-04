import React, { useRef, useEffect } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Defs, Circle, Stop, RadialGradient } from "react-native-svg";
import { color } from "../../../color/color";
import { formatValue } from "../../../constants/formatValue";
import { styles } from "./index.styles";

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

interface ScanCategoriesProps {
    stats: any;
}

const ScanCategories: React.FC<ScanCategoriesProps> = ({ stats }) => {
    const scanData = stats?.scans || {};
    const total = scanData?.total || 0;
    const byCategory = scanData?.classes || {};

    const defaultCategoryColors: Record<string, string> = {
        "VIP": "#87807C",
        "General": "#CEBCA0",
        "Early Bird": "#945F22",
        "Early Bird Pricing": "#945F22",
        "VIP Ticket": "#87807C",
        "Members": "#EDB58A",
        "Standard": "#AE6F28",
        "Standard Pricing": "#AE6F28",
        "Premium": "#F4A261",
        "Complementary": "#CEBCA0",
        "Packages": "#87807C",
    };
    const fallbackColors = ["#CEBCA0", "#D4A574", "#B8860B", "#CD853F", "#D2691E", "#8B4513"];

    const generateColor = (name: string, index: number) =>
        defaultCategoryColors[name] || fallbackColors[index % fallbackColors.length];

    const hasData = total > 0 || Object.keys(byCategory).length > 0;

    const rawValues = Object.entries(byCategory).map(([label, value], index) => {
        const numericValue = typeof value === 'object'
            ? ((value as any).total || (value as any).scanned || 0)
            : ((value as any) || 0);
        return { label, value: numericValue, color: generateColor(label, index) };
    });

    const values = rawValues.length > 0
        ? rawValues
        : [{ label: "No Data", value: 1, color: "#E0E0E0" }];

    const knownOrder = ["Early Bird", "Early Bird Pricing", "Standard", "Standard Pricing", "VIP Ticket", "Members"];
    const sortedValues = [
        ...knownOrder.map(t => values.find(v => v.label === t)).filter(Boolean),
        ...values.filter(v => !knownOrder.includes(v.label)).sort((a, b) => a.label.localeCompare(b.label)),
    ] as typeof values;

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
    }, [segments.length, total]);

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Text style={styles.title}>Scan Categories</Text>

                {!hasData ? (
                    <NoDataMessage
                        message="No Scans Recorded"
                        subtext="Scan category breakdown will appear once attendees have been scanned at entry."
                    />
                ) : (
                    <View style={styles.row}>
                        <View style={styles.chartContainer}>
                            <Svg height="140" width="140" viewBox="0 0 120 120">
                                <Defs>
                                    <RadialGradient id="scanGlow" cx="50%" cy="50%" r="70%">
                                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                                        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                                    </RadialGradient>
                                </Defs>
                                <Circle cx="60" cy="60" r={radius} fill="url(#scanGlow)" />
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
                                <Text style={styles.amountText}>{formatValue(total)}</Text>
                                <Text style={styles.totalText}>Total</Text>
                            </View>
                        </View>
                        <View style={styles.paymentMethod}>
                            {sortedValues.filter(item => item.label !== 'No Data').map((item, index) => (
                                <View style={styles.paymentItem} key={index}>
                                    <View style={styles.leftContent}>
                                        <View style={styles.colorBoxWrapper}>
                                            <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                                        </View>
                                        <View style={styles.paymentLabel}>
                                            <Text style={styles.paymentText}>{item.label}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.paymentValueWrapper}>
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

export default ScanCategories;
