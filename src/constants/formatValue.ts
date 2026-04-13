export const formatValue = (value: number): string => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
};

export const formatValueWithPad = (value: number | string | null | undefined): string => {
    const numericValue = Number(value ?? 0);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

    if (safeValue >= 0 && safeValue < 10) {
        return String(Math.trunc(safeValue)).padStart(2, "0");
    }

    return formatValue(safeValue);
};
