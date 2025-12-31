/**
 * Period parsing and validation utilities
 * Eliminates 5x duplication of period object creation across handlers
 *
 * @module srv/utils/period-utils
 */

/**
 * Parses period parameters into standardized object
 * Handles various parameter naming conventions
 *
 * @param {Object} params - Raw period parameters
 * @param {number} params.year - Year value
 * @param {number} params.monthFrom - Starting month
 * @param {number} params.monthTo - Ending month
 * @returns {Object} Normalized period object {year, monthFrom, monthTo}
 */
const parsePeriod = (params) => {
    if (!params) return null;

    return {
        year: parseInt(params.year || params.PeriodYear, 10),
        monthFrom: parseInt(params.monthFrom || params.PeriodMonthFrom, 10),
        monthTo: parseInt(params.monthTo || params.PeriodMonthTo, 10)
    };
};

/**
 * Checks if a given year/month falls within a period
 *
 * @param {number} year - Year to check
 * @param {number} month - Month to check (1-12)
 * @param {Object} period - Period object {year, monthFrom, monthTo}
 * @returns {boolean} True if within period
 */
const isInPeriod = (year, month, period) => {
    if (!period) return false;
    if (String(year) !== String(period.year)) return false;

    const monthInt = parseInt(month, 10);
    return monthInt >= period.monthFrom && monthInt <= period.monthTo;
};

/**
 * Generates period label for display
 *
 * @param {Object} period - Period object
 * @returns {string} Display label (e.g., "2024-01 to 2024-12")
 */
const formatPeriod = (period) => {
    if (!period) return '';

    const pad = (n) => String(n).padStart(2, '0');
    return `${period.year}-${pad(period.monthFrom)} to ${period.year}-${pad(period.monthTo)}`;
};

/**
 * Creates period object from individual parameters
 * Convenience method for handlers
 *
 * @param {number} year - Year
 * @param {number} monthFrom - Starting month
 * @param {number} monthTo - Ending month
 * @returns {Object} Period object
 */
const createPeriod = (year, monthFrom, monthTo) => {
    return {
        year: parseInt(year, 10),
        monthFrom: parseInt(monthFrom, 10),
        monthTo: parseInt(monthTo, 10)
    };
};

module.exports = {
    parsePeriod,
    isInPeriod,
    formatPeriod,
    createPeriod
};
