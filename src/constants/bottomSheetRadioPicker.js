import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Animated,
    PanResponder,
    ActivityIndicator,
} from 'react-native';
import { color } from '../color/color';
import Typography from '../components/Typography';

const BottomSheetRadioPicker = ({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
    onLoadMore,
    hasMore,
    isLoadingMore,
}) => {
    const translateY = useRef(new Animated.Value(600)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            translateY.setValue(600);
            overlayOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 150,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (modalVisible) {
            closeWithAnimation();
        }
    }, [visible]);

    const closeWithAnimation = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 600,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setModalVisible(false);
        });
    };

    const handleClose = () => {
        closeWithAnimation();
        setTimeout(() => onClose(), 260);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    handleClose();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleSelect = (option) => {
        onSelect(option);
        handleClose();
    };

    const renderItem = ({ item: option }) => {
        const isSelected = option.value === selectedValue;
        return (
            <TouchableOpacity
                style={styles.radioOptionRow}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
            >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                </View>
                <Typography
                    weight="400"
                    size={16}
                    color={color.black_544B45}
                    style={styles.radioLabel}
                >
                    {option.label}
                </Typography>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={color.btnBrown_AE6F28} />
            </View>
        );
    };

    const handleEndReached = () => {
        if (hasMore && !isLoadingMore && onLoadMore) {
            onLoadMore();
        }
    };

    return (
        <Modal visible={modalVisible} animationType="none" transparent>
            <View style={styles.overlayWrapper}>
                <Animated.View style={[styles.overlayBg, { opacity: overlayOpacity }]}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
                </Animated.View>
                <Animated.View
                    style={[styles.pickerModal, { transform: [{ translateY }] }]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.modalHandle} />
                    <Typography
                        style={styles.pickerTitle}
                        weight="700"
                        size={18}
                        color={color.brown_3C200A}
                    >
                        {title}
                    </Typography>

                    <FlatList
                        data={options}
                        keyExtractor={(item, index) => String(item.value ?? index)}
                        renderItem={renderItem}
                        style={styles.optionsList}
                        showsVerticalScrollIndicator={false}
                        onEndReached={handleEndReached}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={renderFooter}
                        nestedScrollEnabled
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    pickerModal: {
        backgroundColor: color.white_FFFFFF,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: color.grey_AFAFAF,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    pickerTitle: {
        marginBottom: 20,
    },
    optionsList: {
        maxHeight: 400,
    },
    radioOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: color.borderBrown_CEBCA0,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    radioOuterSelected: {
        borderColor: color.btnBrown_AE6F28,
        borderWidth: 2.5,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color.btnBrown_AE6F28,
    },
    radioLabel: {
        flex: 1,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});

export default BottomSheetRadioPicker;
