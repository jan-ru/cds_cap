sap.ui.define([
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/ObjectStatus"
], function (Text, Label, ObjectStatus) {
    "use strict";

    /**
     * Shared utility for export operations
     * @namespace shared.utils.ExportHelper
     */
    return {
        /**
         * Creates export column definitions from a UI5 table's columns
         * @param {sap.ui.table.Table|sap.m.Table} oTable - The table to extract columns from
         * @returns {Array} Array of column definitions with label, property, type, and scale
         * @public
         */
        createExportColumns: function(oTable) {
            var aCols = [];
            var aTableCols = oTable.getColumns();

            aTableCols.forEach(function(oColumn) {
                var sLabel = "";
                var oLabel = oColumn.getLabel();

                if (oLabel) {
                    sLabel = oLabel.getText();
                } else {
                    // Handle columns with multiLabels
                    var aMultiLabels = oColumn.getMultiLabels();
                    if (aMultiLabels && aMultiLabels.length > 0) {
                        // Combine labels: e.g. "2025" and "WAT" -> "2025 - WAT"
                        sLabel = aMultiLabels.map(function(label) {
                            return label.getText();
                        }).join(" - ");
                    }
                }

                var oTemplate = oColumn.getTemplate();
                var sProperty = "";

                // Extract property path from different template types
                if (oTemplate instanceof Text || oTemplate instanceof Label) {
                    var oBinding = oTemplate.getBindingInfo("text");
                    if (oBinding) {
                        if (oBinding.parts && oBinding.parts.length > 0) {
                            sProperty = oBinding.parts[0].path;
                        } else if (oBinding.path) {
                            sProperty = oBinding.path;
                        }
                    }
                } else if (oTemplate instanceof ObjectStatus) {
                    var oBinding = oTemplate.getBindingInfo("text");
                    if (oBinding && oBinding.path) {
                        sProperty = oBinding.path;
                    }
                }

                // Strip model name prefix (e.g., "sales>" or "tree>")
                if (sProperty && sProperty.indexOf(">") > -1) {
                    sProperty = sProperty.split(">")[1];
                }

                // Determine column type based on property name patterns
                var sType = "String";
                var nScale = 0;
                
                // Check if this is a numeric/currency field
                if (sProperty && (
                    sProperty.match(/^(wat|noi|wn|total|diff|amount|revenue|sales|cost|price|value|balance|asset|liability|equity|income|expense)/i) ||
                    sProperty.match(/(pct|percentage|rate)$/i) ||
                    sProperty.match(/^\d{6,7}$/) // Period columns like 202401, 2024012, etc.
                )) {
                    sType = "Number";
                    // Use 2 decimal places for most financial data
                    nScale = 2;
                }

                // Only add columns with valid property paths
                if (sProperty) {
                    aCols.push({
                        label: sLabel,
                        property: sProperty,
                        type: sType,
                        scale: nScale
                    });
                }
            });

            return aCols;
        }
    };
});
