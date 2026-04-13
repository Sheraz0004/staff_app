const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (dateString: string): string => {
    const d = parseDate(dateString);
    if (!d) return '';

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    const hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const isPM = hours >= 12;
    const formattedHours = hours % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';

    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
};

export const formatDateOnly = (dateString: string): string => {
    const d = parseDate(dateString);
    if (!d) return '';

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    return `${day}-${month}-${year}`;
};

export const formatISODate = (dateString: string): string => {
    const d = parseDate(dateString);
    if (!d) return '';

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    return `${year}-${month}-${day}`;
};

export const formatTimeOnly = (dateString: string): string => {
    const d = parseDate(dateString);
    if (!d) return '';

    const hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const isPM = hours >= 12;
    const formattedHours = hours % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';

    return `${formattedHours}:${minutes} ${ampm}`;
};

const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDateWithMonthName = (dateString: string): string => {
    if (!dateString) return '';

    let d: Date;

    if (dateString.includes('T')) {
        d = new Date(dateString);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-').map(Number);
        d = new Date(year, month - 1, day);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        d = new Date(year, month - 1, day);
    } else {
        d = new Date(dateString);
    }

    if (!isNaN(d.getTime())) {
        let day: number, month: string, year: number;
        if (dateString.includes('T')) {
            day = d.getUTCDate();
            month = monthAbbreviations[d.getUTCMonth()];
            year = d.getUTCFullYear();
        } else {
            day = d.getDate();
            month = monthAbbreviations[d.getMonth()];
            year = d.getFullYear();
        }

        return `${day} ${month} ${year}`;
    }

    const parts = dateString.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            return dateString;
        }

        const parsed = new Date(year, month, day);

        if (isNaN(parsed.getTime())) {
            return dateString;
        }

        const formattedDay = parsed.getDate();
        const formattedMonth = monthAbbreviations[parsed.getMonth()];
        const formattedYear = parsed.getFullYear();

        return `${formattedDay} ${formattedMonth} ${formattedYear}`;
    }

    return dateString;
};
