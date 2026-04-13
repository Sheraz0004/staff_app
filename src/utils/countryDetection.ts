import * as Location from 'expo-location';
import { countryCodes, CountryCode } from '../constants/countryCodes';
import { logger } from './logger';

export const detectCountryCode = async (): Promise<string | null> => {
    try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) return null;

        let { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') {
            const permissionResponse = await Location.requestForegroundPermissionsAsync();
            status = permissionResponse.status;
        }

        if (status !== 'granted') return null;

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        if (address && address.length > 0) {
            const countryCode = address[0].isoCountryCode;
            if (countryCode && countryCode.length === 2) return countryCode;
        }

        return null;
    } catch (error) {
        logger.error('Error detecting country code:', error);
        return null;
    }
};

export const detectCountryFromLocale = (): string | null => {
    try {
        const locale = Intl.DateTimeFormat().resolvedOptions().locale;
        const countryCode = locale.split('-')[1] || locale.split('_')[1];
        if (countryCode && countryCode.length === 2) return countryCode.toUpperCase();
        return null;
    } catch (error) {
        logger.error('Error detecting country from locale:', error);
        return null;
    }
};

export const findCountryByIsoCode = (isoCode: string): CountryCode | null => {
    if (!isoCode) return null;
    return countryCodes.find((c) => c.code === isoCode) || null;
};

export const getAutoDetectedCountry = async (): Promise<CountryCode | null> => {
    try {
        const detectedIsoCode = await detectCountryCode();

        if (detectedIsoCode) {
            const country = findCountryByIsoCode(detectedIsoCode);
            if (country) return country;
        }

        const localeIsoCode = detectCountryFromLocale();

        if (localeIsoCode) {
            const country = findCountryByIsoCode(localeIsoCode);
            if (country) return null;
        }

        return null;
    } catch (error) {
        logger.error('Error in getAutoDetectedCountry:', error);
        return null;
    }
};
