import React, { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { styles } from "./index.styles";

function formatNumber(num: number): string {
    if (num >= 1000) {
        const formatted = (num / 1000).toFixed(1);
        return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
    }
    return num.toString();
}

const CHART_HEIGHT = 140;
const BAR_WIDTH = 10;
const BAR_SPACING = 48;
const DOT_SIZE = 2;
const DOT_SPACING = 4;
const TOOLTIP_WIDTH = 140;
const SCROLL_PADDING = 60;

function getYAxisLabels(yAxisMax: number): number[] {
    const steps = yAxisMax >= 150 ? 6 : 5;
    return Array.from({ length: steps }, (_, i) =>
        Math.round((yAxisMax / (steps - 1)) * i)
    );
}

interface AnalyticsChartProps {
    title: string;
    data: { time: string; value: number }[];
    dataType: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, data, dataType }) => {
    const [selectedBar, setSelectedBar] = useState<number | null>(null);
    const scrollX = useRef(0);
    const [tooltipLeft, setTooltipLeft] = useState(0);

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const hasData = totalValue > 0;

    let yAxisMax = Math.max(...data.map(d => d.value), 0);
    if (yAxisMax === 0) {
        yAxisMax = 10;
    } else {
        yAxisMax = Math.ceil(yAxisMax * 1.5 / 120) * 120;
    }

    const yAxisLabels = getYAxisLabels(yAxisMax);

    // Map data index → visual index among non-zero bars (determines X position)
    const visualIndexMap: Record<number, number> = {};
    let visualCount = 0;
    data.forEach((item, idx) => {
        if (item.value > 0) {
            visualIndexMap[idx] = visualCount++;
        }
    });

    const computeTooltipLeft = (dataIndex: number) => {
        const visualIdx = visualIndexMap[dataIndex] ?? 0;
        const barCenterX = SCROLL_PADDING + visualIdx * BAR_SPACING + BAR_SPACING / 2;
        return barCenterX - scrollX.current - TOOLTIP_WIDTH / 2 + 15;
    };

    const selectedItem = selectedBar !== null ? data[selectedBar] : null;

    const renderDottedLine = () => {
        const dots = [];
        const numberOfDots = Math.floor(300 / (DOT_SIZE + DOT_SPACING));
        for (let i = 0; i < numberOfDots; i++) {
            dots.push(<View key={i} style={[styles.dot, { marginRight: DOT_SPACING }]} />);
        }
        return dots;
    };

    if (!hasData) {
        return (
            <View style={styles.wrapper}>
                <Text style={styles.title}>{title} Analytics</Text>
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                    <Svg width={44} height={44} viewBox="0 0 44 44" style={{ marginBottom: 12 }}>
                        <Circle cx={22} cy={22} r={18} stroke="#CEBCA0" strokeWidth={2} fill="none" strokeDasharray="5 4" />
                        <Circle cx={22} cy={22} r={10} stroke="#CEBCA0" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
                    </Svg>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#24282C', marginBottom: 6, textAlign: 'center' }}>
                        No Analytics Data
                    </Text>
                    <Text style={{ fontSize: 12, color: '#87807C', textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
                        {dataType === 'sold'
                            ? 'Sales activity will appear here once tickets have been sold.'
                            : 'Scan activity will appear here once attendees begin checking in.'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <Pressable style={styles.wrapper} onPress={() => setSelectedBar(null)}>
            <Text style={styles.title}>{title} Analytics</Text>
            <View style={styles.chartRow}>
                <View style={styles.chartArea}>
                    {/* Grid Lines and Y-Axis Labels */}
                    {yAxisLabels.map((label, idx) => {
                        const y = CHART_HEIGHT - (CHART_HEIGHT / (yAxisLabels.length - 1)) * idx;
                        return (
                            <React.Fragment key={idx}>
                                <View style={[styles.gridLine, { top: y }]}>
                                    <View style={styles.dottedLineContainer}>
                                        {renderDottedLine()}
                                    </View>
                                </View>
                                <Text
                                    numberOfLines={1}
                                    style={[styles.yAxisLabel, { position: 'absolute', left: -44, top: y - 8, width: 42 }]}
                                >
                                    {formatNumber(label)}
                                </Text>
                            </React.Fragment>
                        );
                    })}

                    {/* Tooltip — outside ScrollView, positioned above the tapped bar */}
                    {selectedItem && selectedItem.value > 0 && (
                        <View style={[styles.tooltipContainer, { left: tooltipLeft }]}>
                            <View style={styles.tooltip}>
                                <Text style={styles.tooltipDate}>
                                    {selectedItem.time.includes(' ') ? selectedItem.time.split(' ')[0] : selectedItem.time}
                                </Text>
                                <Text style={styles.tooltipValue}>
                                    {formatNumber(selectedItem.value)}{' '}
                                    {dataType === 'sold' ? 'sold' : dataType === 'payment' ? 'GHS' : 'checked in'}
                                </Text>
                                <View style={styles.tooltipArrow} />
                            </View>
                        </View>
                    )}

                    {/* Bars and X-Axis Labels */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onScroll={(e) => {
                            scrollX.current = e.nativeEvent.contentOffset.x;
                            // Keep tooltip aligned if a bar is selected
                            if (selectedBar !== null) {
                                setTooltipLeft(computeTooltipLeft(selectedBar));
                            }
                        }}
                        contentContainerStyle={{
                            height: CHART_HEIGHT + 24,
                            alignItems: "flex-end",
                            paddingHorizontal: SCROLL_PADDING,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT }}>
                            {data.map((item, index) => {
                                if (item.value === 0) return null;

                                const calculatedHeight = (item.value / yAxisMax) * CHART_HEIGHT;
                                const barHeight = Math.max(calculatedHeight, 8);
                                const isSelected = selectedBar === index;

                                return (
                                    <View key={index} style={{ alignItems: 'center', width: BAR_SPACING }}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedBar(null);
                                                } else {
                                                    setTooltipLeft(computeTooltipLeft(index));
                                                    setSelectedBar(index);
                                                }
                                            }}
                                            style={{ height: CHART_HEIGHT, justifyContent: 'flex-end', alignItems: 'center' }}
                                        >
                                            <View
                                                style={[
                                                    styles.bar,
                                                    { height: barHeight, width: BAR_WIDTH },
                                                    isSelected && styles.highlightedBar,
                                                ]}
                                            />
                                        </TouchableOpacity>
                                        <Text
                                            style={[
                                                styles.timeLabel,
                                                isSelected && styles.timeLabelHighlight,
                                                { marginTop: 10 },
                                            ]}
                                        >
                                            {item.time.includes(' ') ? item.time.split(' ')[1] : item.time.split('-').slice(-1)[0]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Pressable>
    );
};

export default AnalyticsChart;
