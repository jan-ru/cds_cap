/**
 * Period validation utilities
 * Used by tree builder functions for period filtering
 *
 * @module srv/utils/period-utils
 */

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

module.exports = {
    isInPeriod
};
