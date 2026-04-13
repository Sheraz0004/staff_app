import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import Typography from '../components/Typography';
import { color } from '../color/color';
import { styles } from './CircleItemList.styles';

interface CircleItem {
    id: string;
    label: string;
    icon?: any;
}

interface CircleItemListProps {
    items: CircleItem[];
    onItemPress: (item: CircleItem) => void;
    activeId?: string | null;
    activeRingColor?: string;
    labelColor?: string;
    horizontalPadding?: number;
    itemSpacing?: number;
    labelSize?: number;
    // Legacy props accepted but not used
    circleSize?: number;
    iconSize?: number;
    activeRingWidth?: number;
    circleBackgroundColor?: string;
}

const CircleItemList: React.FC<CircleItemListProps> = ({
    items,
    onItemPress,
    activeId = null,
    activeRingColor = color.btnBrown_AE6F28,
    labelColor = color.brown_3C200A,
    horizontalPadding = 16,
    itemSpacing = 24,
    labelSize = 14,
}) => {
    const isActive = (id: string): boolean => activeId === id;

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingHorizontal: horizontalPadding },
                ]}
            >
                {items.map((item, index) => {
                    const active = isActive(item.id);

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.tabItem,
                                { marginRight: index < items.length - 1 ? itemSpacing : 0 },
                            ]}
                            onPress={() => onItemPress?.(item)}
                            activeOpacity={0.7}
                        >
                            <Typography
                                weight={active ? '700' : '400'}
                                size={labelSize}
                                color={labelColor}
                                numberOfLines={1}
                            >
                                {item.label}
                            </Typography>

                            <View
                                style={[
                                    styles.underline,
                                    active
                                        ? { backgroundColor: activeRingColor }
                                        : { backgroundColor: 'transparent' },
                                ]}
                            />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={[styles.bottomBorder]} />
        </View>
    );
};

export default CircleItemList;
