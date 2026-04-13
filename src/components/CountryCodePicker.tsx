import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    SafeAreaView,
    ListRenderItemInfo,
} from 'react-native';
import { color } from '../color/color';
import Typography from './Typography';
import SvgIcons from './SvgIcons';
import { countryCodes } from '../constants/countryCodes';
import { CountryCode } from '../constants/countryCodes';
import { styles } from './CountryCodePicker.styles';

interface CountryCodePickerProps {
    selectedCountry: CountryCode | null;
    onSelectCountry: (country: CountryCode) => void;
    visible: boolean;
    onClose: () => void;
}

const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
    selectedCountry,
    onSelectCountry,
    visible,
    onClose,
}) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredCountries, setFilteredCountries] = useState<CountryCode[]>(countryCodes);

    const handleSearch = (query: string): void => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredCountries(countryCodes);
        } else {
            const filtered = countryCodes.filter(
                (country) =>
                    country.name.toLowerCase().includes(query.toLowerCase()) ||
                    country.dialCode.includes(query) ||
                    country.code.toLowerCase().includes(query.toLowerCase()),
            );
            setFilteredCountries(filtered);
        }
    };

    const handleSelectCountry = (country: CountryCode): void => {
        onSelectCountry(country);
        onClose();
        setSearchQuery('');
        setFilteredCountries(countryCodes);
    };

    const renderCountryItem = ({ item }: ListRenderItemInfo<CountryCode>) => (
        <TouchableOpacity
            style={styles.countryItem}
            onPress={() => handleSelectCountry(item)}
        >
            <View style={styles.countryInfo}>
                <Typography weight="400" size={24} color={color.grey_DEDCDC} style={styles.flag as any}>
                    {item.flag}
                </Typography>
                <View style={styles.countryDetails}>
                    <Typography
                        weight="500"
                        size={16}
                        color={color.grey_DEDCDC}
                        style={styles.countryName}
                    >
                        {item.name}
                    </Typography>
                    <Typography
                        weight="400"
                        size={14}
                        color={color.grey_87807C}
                        style={styles.countryCode}
                    >
                        {item.code}
                    </Typography>
                </View>
            </View>
            <Typography
                weight="600"
                size={16}
                color={color.grey_DEDCDC}
                style={styles.dialCode}
            >
                {item.dialCode}
            </Typography>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <SvgIcons.CrossIconBrownbg width={24} height={24} />
                    </TouchableOpacity>
                    <Typography
                        weight="600"
                        size={18}
                        color={color.grey_DEDCDC}
                        style={styles.headerTitle}
                    >
                        Select Country
                    </Typography>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <SvgIcons.searchIcon width={20} height={20} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search country or code..."
                            placeholderTextColor={color.grey_87807C}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => handleSearch('')}
                                style={styles.clearButton}
                            >
                                <SvgIcons.crossIconRed width={24} height={24} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <FlatList
                    data={filteredCountries}
                    renderItem={renderCountryItem}
                    keyExtractor={(item) => item.code}
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />

                {filteredCountries.length === 0 && (
                    <View style={styles.noResults}>
                        <Typography
                            weight="400"
                            size={16}
                            color={color.grey_87807C}
                            style={styles.noResultsText}
                        >
                            No countries found
                        </Typography>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

export default CountryCodePicker;
