sap.ui.define([], function () {
    "use strict";

    return {
        formatCurrency: function (sValue) {
            if (sValue === null || sValue === undefined) {
                return "";
            }
            
            var fValue;
            if (typeof sValue === "number") {
                fValue = sValue;
            } else {
                // Remove commas if present (e.g. if binding already formatted it)
                // parseFloat stops at the first comma ("2,300" -> 2), leading to data truncation.
                fValue = parseFloat(sValue.toString().replace(/,/g, ""));
            }

            if (isNaN(fValue)) {
                return sValue;
            }
            
            return fValue.toLocaleString('de-DE', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },

        formatPercentage: function(sValue) {
             if (sValue === null || sValue === undefined) {
                return "";
            }
            
            var fValue;
            if (typeof sValue === "number") {
                 fValue = sValue;
            } else {
                 fValue = parseFloat(sValue.toString().replace(/,/g, ""));
            }

            if (isNaN(fValue)) {
                return sValue;
            }
            return fValue.toFixed(1) + " %";
        }
    };
});
