sap.ui.define([], function() {
    "use strict";

    /**
     * Application Default Configuration
     * Central location for configurable defaults
     */
    return {
        /**
         * Get the current year
         * @returns {number} Current year
         */
        getCurrentYear: function() {
            return new Date().getFullYear();
        },

        /**
         * Get default period configuration
         * @returns {object} Period configuration with startYear, startMonth, endYear, endMonth
         */
        getDefaultPeriod: function() {
            var currentYear = this.getCurrentYear();
            return {
                startYear: currentYear,
                startMonth: 1,
                endYear: currentYear,
                endMonth: 12
            };
        },

        /**
         * Application locale for formatting
         */
        locale: "de-DE",

        /**
         * JSONModel size limit for large datasets
         */
        modelSizeLimit: 100000,

        /**
         * Date format pattern
         */
        dateFormat: "dd.MM.yyyy",

        /**
         * Currency formatting options
         */
        currencyFormat: {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        },

        /**
         * Number formatting options
         */
        numberFormat: {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    };
});
