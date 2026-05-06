import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { color } from '../../../color/color';
import { styles } from './index.styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NoDataMessage: React.FC<{ message: string; subtext: string }> = ({ message, subtext }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 28 }}>
        <Svg width={44} height={44} viewBox="0 0 44 44" style={{ marginBottom: 12 }}>
            <Circle cx={22} cy={22} r={18} stroke="#CEBCA0" strokeWidth={2} fill="none" strokeDasharray="5 4" />
            <Circle cx={22} cy={22} r={10} stroke="#CEBCA0" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
        </Svg>
        <Text style={{ fontSize: 14, fontWeight: '600', color: color.placeholderTxt_24282C, marginBottom: 6, textAlign: 'center' }}>
            {message}
        </Text>
        <Text style={{ fontSize: 12, color: '#87807C', textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
            {subtext}
        </Text>
    </View>
);

interface CircularProgressProps {
    value: number;
    total: number;
    size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, total, size = 40 }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    const radius = (size / 2) - 3;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    const fontSize = size <= 40 ? 9 : 11;

    const animOffset = useRef(new Animated.Value(circumference)).current;

    useEffect(() => {
        animOffset.setValue(circumference);
        Animated.timing(animOffset, {
            toValue: circumference - (percentage / 100) * circumference,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle
                cx={center} cy={center} r={radius}
                stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none"
            />
            <AnimatedCircle
                cx={center} cy={center} r={radius}
                stroke={color.btnBrown_AE6F28}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={animOffset}
                strokeLinecap="round"
            />
            <SvgText
                x={center} y={center + fontSize / 3}
                textAnchor="middle" fontSize={fontSize}
                fill={color.placeholderTxt_24282C} fontWeight="500"
            >
                {`${percentage}%`}
            </SvgText>
        </Svg>
    );
};

interface AdminOverallStatisticsProps {
    stats: any;
    onTotalTicketsPress: () => void;
    onTotalScannedPress: () => void;
    onTotalUnscannedPress: () => void;
    onAvailableTicketsPress: () => void;
    showOnlyTopRow?: boolean;
    isLoading?: boolean;
}

const AdminOverallStatistics: React.FC<AdminOverallStatisticsProps> = ({
    stats,
    onTotalTicketsPress,
    onTotalScannedPress,
    onTotalUnscannedPress,
    onAvailableTicketsPress,
    showOnlyTopRow = false,
    isLoading = false,
}) => {
    const ticketStats = stats?.tickets || {};
    const totalTickets = ticketStats?.totalTickets || 0;
    const totalScanned = ticketStats?.totalScanned || 0;
    const totalUnscanned = ticketStats?.totalUnScanned || 0;
    const availableTickets = ticketStats?.availableTickets || 0;

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Text style={styles.heading}>Tickets Statistics</Text>

                {!isLoading && totalTickets === 0 ? (
                    <NoDataMessage
                        message="No Ticket Data Available"
                        subtext="Ticket statistics will appear once tickets are configured for this event."
                    />
                ) : (
                    <>
                        <View style={styles.row}>
                            <View style={styles.statContainer}>
                                <TouchableOpacity style={styles.statContent} onPress={onTotalTicketsPress}>
                                    <CircularProgress value={totalScanned + totalUnscanned} total={totalTickets} size={40} />
                                    <View style={styles.statTextContainer}>
                                        <Text style={styles.statTitle} numberOfLines={1}>Total Tickets</Text>
                                        <Text style={styles.statValue}>{totalTickets}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.statContainer}>
                                <TouchableOpacity style={styles.statContent} onPress={onTotalScannedPress}>
                                    <CircularProgress value={totalScanned} total={totalTickets} size={40} />
                                    <View style={styles.statTextContainer}>
                                        <Text style={styles.statTitle} numberOfLines={1}>Total Scanned</Text>
                                        <Text style={styles.statValue}>{totalScanned}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {!showOnlyTopRow && (
                        <View style={styles.row}>
                            <View style={styles.statContainer}>
                                <TouchableOpacity style={styles.statContent} onPress={onTotalUnscannedPress}>
                                    <CircularProgress value={totalUnscanned} total={totalTickets} size={40} />
                                    <View style={styles.statTextContainer}>
                                        <Text style={styles.statTitle} numberOfLines={1}>Total Unscanned</Text>
                                        <Text style={styles.statValue}>{totalUnscanned}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.statContainer}>
                                <TouchableOpacity style={styles.statContent} onPress={onAvailableTicketsPress}>
                                    <CircularProgress value={availableTickets} total={totalTickets} size={40} />
                                    <View style={styles.statTextContainer}>
                                        <Text style={styles.statTitle} numberOfLines={1}>Available Tickets</Text>
                                        <Text style={styles.statValue}>{availableTickets}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

export default AdminOverallStatistics;
