export const truncateString = (str: string, maxLength: number = 10): string => {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
};

export const truncateCityName = (cityName: string): string => truncateString(cityName, 5);

export const truncateEventName = (name: string): string => truncateString(name, 22);

export const truncateStaffName = (name: string): string => truncateString(name, 10);
