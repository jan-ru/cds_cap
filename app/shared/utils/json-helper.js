sap.ui.define([], function() {
    "use strict";

    /**
     * JSON Helper Utilities
     * Provides safe JSON parsing with error handling
     */
    return {
        /**
         * Safely parse JSON string with fallback
         * @param {string} jsonString - JSON string to parse
         * @param {*} defaultValue - Default value to return on error (optional)
         * @returns {*} Parsed object or default value
         */
        safeParse: function(jsonString, defaultValue) {
            if (!jsonString) {
                return defaultValue !== undefined ? defaultValue : null;
            }

            if (typeof jsonString !== 'string') {
                console.warn("json-helper: Expected string but got " + typeof jsonString);
                return defaultValue !== undefined ? defaultValue : null;
            }

            try {
                return JSON.parse(jsonString);
            } catch (error) {
                console.warn("json-helper: Failed to parse JSON", {
                    error: error.message,
                    input: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : '')
                });
                return defaultValue !== undefined ? defaultValue : null;
            }
        },

        /**
         * Safely stringify object to JSON
         * @param {*} obj - Object to stringify
         * @param {string} defaultValue - Default value to return on error (optional)
         * @returns {string} JSON string or default value
         */
        safeStringify: function(obj, defaultValue) {
            try {
                return JSON.stringify(obj);
            } catch (error) {
                console.warn("json-helper: Failed to stringify object", error);
                return defaultValue !== undefined ? defaultValue : '{}';
            }
        }
    };
});
