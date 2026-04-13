const ENABLE_DEBUG_LOGS = __DEV__;

const formatMessage = (args: any[]): any[] => args;

export const logger = {
    log: (...args: any[]): void => {
        if (!ENABLE_DEBUG_LOGS) return;
        console.log(...formatMessage(args));
    },
    debug: (...args: any[]): void => {
        if (!ENABLE_DEBUG_LOGS) return;
        if (console.debug) {
            console.debug(...formatMessage(args));
        } else {
            console.log(...formatMessage(args));
        }
    },
    warn: (...args: any[]): void => {
        if (!ENABLE_DEBUG_LOGS) return;
        console.warn(...formatMessage(args));
    },
    error: (...args: any[]): void => {
        console.error(...formatMessage(args));
    },
};
