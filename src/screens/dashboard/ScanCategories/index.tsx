import React from "react";
import { View, Text } from "react-native";
import Svg, { Defs, ClipPath, Circle, Path, G, Stop, RadialGradient } from "react-native-svg";
import { color } from "../../../color/color";
import { formatValue } from "../../../constants/formatValue";
import { styles } from "./index.styles";

interface ScanCategoriesProps {
    stats: any;
}

const ScanCategories: React.FC<ScanCategoriesProps> = ({ stats }) => {
    // Extract scan categories data with default values
    const scanCategoriesData = stats?.data?.scan_categories || {};
    const total = scanCategoriesData?.total_scanned || 0;
    const byCategory = scanCategoriesData?.by_category || {};

    // Default colors for known categories
    const defaultCategoryColors: Record<string, string> = {
        "VIP": "#87807C",
        "General": "#CEBCA0",
        "Early Bird": "#945F22",
        "VIP Ticket": "#87807C",
        "Members": "#EDB58A",
        "Standard": "#AE6F28",
        "Premium": "#F4A261",
        "Packages": "#87807C"
    };

    // Generate colors for any new categories
    const generateColorForCategory = (categoryName: string, index: number): string => {
        if (defaultCategoryColors[categoryName]) {
            return defaultCategoryColors[categoryName];
        }

        // Generate a color for new categories
        const colors = ["#CEBCA0", "#D4A574", "#B8860B", "#CD853F", "#D2691E", "#8B4513"];
        return colors[index % colors.length];
    };

    // Transform the data into the required format
    const values = Object.entries(byCategory).map(([label, value], index) => {
        // Handle cases where value might be an object
        const numericValue = typeof value === 'object' ? ((value as any).total || (value as any).amount || 0) : ((value as any) || 0);

        return {
            label: label,
            value: numericValue,
            color: generateColorForCategory(label, index)
        };
    });

    // Sort values: known categories first, then any new categories alphabetically
    const knownCategories = ["Early Bird", "VIP Ticket", "Members"];
    const sortedValues = [
        // First, include known categories in their preferred order
        ...knownCategories
            .map(type => values.find(v => v.label === type))
            .filter(Boolean),
        // Then, include any new categories alphabetically
        ...values
            .filter(v => !knownCategories.includes(v.label))
            .sort((a, b) => a.label.localeCompare(b.label))
    ] as typeof values;

    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const gapSize = 15;
    const totalGap = gapSize * sortedValues.length;

    // Calculate segments for the circle with visible gaps and no overlap
    const calculateSegments = () => {
        let currentOffset = 0;
        return sortedValues.map((item) => {
            const percentage = item.value / total;
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
                <Text style={styles.title}>Scan Categories</Text>
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
                            <Text style={styles.amountText}>{formatValue(total)}</Text>
                            <Text style={styles.totalText}>Total</Text>
                        </View>
                    </View>
                    <View style={styles.paymentMethod}>
                        {sortedValues.map((item, index) => (
                            <View style={styles.paymentItem} key={index}>
                                <View style={styles.leftContent}>
                                    <View style={styles.colorBoxWrapper}>
                                        <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                                    </View>
                                    <View style={styles.paymentLabel}>
                                        {item.label === "Mobile Money" ? (
                                            <View>
                                                <Text style={styles.paymentText}>Mobile</Text>
                                                <Text style={styles.paymentText}>Money</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.paymentText}>{item.label}</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.paymentValueWrapper}>
                                    {/* <Text style={styles.labelGHS}>GHS</Text> */}
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

export default ScanCategories;
