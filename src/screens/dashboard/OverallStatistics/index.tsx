import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { color } from '../../../color/color';
import SvgIcons from '../../../components/SvgIcons';
import { logger } from '../../../utils/logger';
import { styles } from './index.styles';

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
    const progress = (percentage / 100) * circumference;
    const viewBox = `0 0 ${size} ${size}`;
    const center = size / 2;
    const fontSize = size <= 40 ? 9 : 11;

    return (
        <Svg width={size} height={size} viewBox={viewBox}>
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#E0E0E0"
                strokeWidth={strokeWidth}
                fill="none"
            />
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={color.btnBrown_AE6F28}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference - progress}`}
                strokeLinecap="round"
            />
            <SvgText
                x={center}
                y={center + fontSize / 3}
                textAnchor="middle"
                fontSize={fontSize}
                fill={color.placeholderTxt_24282C}
                fontWeight="500"
            >
                {`${percentage}%`}
            </SvgText>
        </Svg>
    );
};

interface OverallStatisticsProps {
    stats: any;
    onTotalTicketsPress?: () => void;
    onTotalScannedPress?: () => void;
    onTotalUnscannedPress?: () => void;
    onAvailableTicketsPress?: () => void;
    showHeading?: boolean;
}

const OverallStatistics: React.FC<OverallStatisticsProps> = ({
    stats,
    onTotalTicketsPress,
    onTotalScannedPress,
    onTotalUnscannedPress,
    onAvailableTicketsPress,
    showHeading = true
}) => {
    const terminalStatsFromTerminal = stats?.data?.terminal_statistics || {};
    const terminalStatsFromOverall = stats?.data?.overall_statistics || {};
    const terminalStats = Object.keys(terminalStatsFromTerminal).length > 0 ? terminalStatsFromTerminal : terminalStatsFromOverall;

    const totalTicketsRaw = terminalStats?.total_tickets || 0;
    const totalScannedRaw = terminalStats?.total_scanned || 0;
    const totalUnscannedRaw = terminalStats?.total_unscanned || 0;
    const availableTicketsRaw = terminalStats?.available_tickets || 0;

    const totalTickets = typeof totalTicketsRaw === 'object' && totalTicketsRaw !== null ? (totalTicketsRaw.total || totalTicketsRaw.count || 0) : (totalTicketsRaw || 0);
    const totalScanned = typeof totalScannedRaw === 'object' && totalScannedRaw !== null ? (totalScannedRaw.total || totalScannedRaw.count || 0) : (totalScannedRaw || 0);
    const totalUnscanned = typeof totalUnscannedRaw === 'object' && totalUnscannedRaw !== null ? (totalUnscannedRaw.total || totalUnscannedRaw.count || 0) : (totalUnscannedRaw || 0);
    const availableTickets = typeof availableTicketsRaw === 'object' && availableTicketsRaw !== null ? (availableTicketsRaw.total || availableTicketsRaw.count || 0) : (availableTicketsRaw || 0);
    console.log('totalTickets :', totalTickets, 'totalTicketsRaw:', totalTicketsRaw, 'terminalStats:', JSON.stringify(terminalStats));

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                {showHeading && <Text style={styles.heading}>Terminal Statistics</Text>}
                <View style={styles.row}>
                    <View style={styles.statContainer}>
                        <TouchableOpacity style={styles.statContent} onPress={onAvailableTicketsPress}>
                            <CircularProgress value={availableTickets} total={totalTickets} size={40} />
                            <View style={styles.statTextContainer}>
                                <Text style={styles.statTitle} numberOfLines={1} >Available Tickets</Text>
                                <Text style={styles.statValue}>{availableTickets}</Text>
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
            </View>
        </View>
    );
};

export default OverallStatistics;
