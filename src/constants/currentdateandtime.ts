export const getFormatDate = (): string => {
    const currentDate = new Date();

    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();

    const hours = currentDate.getHours();
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const isPM = hours >= 12;
    const formattedHours = hours % 12 || 12;
    const ampm = isPM ? 'PM' : 'AM';

    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
};
