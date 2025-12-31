/**
 * Common tree building utilities shared across all tree builders
 * Uses composition pattern for maximum flexibility
 *
 * @module srv/utils/tree-builder-common
 */

/**
 * Creates a new tree node with initialized values
 *
 * @param {string} name - Display name
 * @param {number} level - Hierarchy level (1, 2, 3)
 * @param {Object} additionalProps - Additional properties to merge
 * @returns {Object} Tree node with base properties
 */
const createNode = (name, level, additionalProps = {}) => {
    return {
        name,
        level,
        isBold: false,
        ...additionalProps
    };
};

/**
 * Creates a spacer node (empty row for visual separation)
 * All numeric fields are set to null for display purposes
 *
 * @returns {Object} Spacer node
 */
const createSpacer = () => {
    const spacer = {
        name: "",
        level: 1,
        isBold: false
    };
    return spacer;
};

/**
 * Rounds numeric values to specified precision
 * Handles null/undefined by returning 0
 *
 * @param {number} value - Value to round
 * @param {number} precision - Decimal places (default: 2)
 * @returns {number} Rounded value
 */
const roundValue = (value, precision = 2) => {
    return parseFloat((value || 0).toFixed(precision));
};

/**
 * Sorts object keys by custom sort configuration
 * Supports array-based custom ordering or ASC/DESC
 *
 * @param {Array<string>} keys - Keys to sort
 * @param {Array|string} sortConfig - Sort configuration
 *   - Array: Custom order (e.g., ['8-Recurring', '8-OneOff', '7', '4', '9'])
 *   - 'ASC': Alphabetical ascending
 *   - 'DESC': Alphabetical descending
 * @returns {Array<string>} Sorted keys
 */
const sortKeys = (keys, sortConfig) => {
    if (Array.isArray(sortConfig)) {
        // Custom ordering with fallback to alphabetical
        return keys.sort((a, b) => {
            const idxA = sortConfig.indexOf(a);
            const idxB = sortConfig.indexOf(b);
            const valA = idxA === -1 ? 999 : idxA;
            const valB = idxB === -1 ? 999 : idxB;

            // Both not in config - sort alphabetically
            if (valA === 999 && valB === 999) {
                return a.localeCompare(b);
            }
            return valA - valB;
        });
    } else if (sortConfig === 'DESC') {
        return keys.sort().reverse();
    }
    // Default: ASC
    return keys.sort();
};

module.exports = {
    createNode,
    createSpacer,
    roundValue,
    sortKeys
};
