sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "shared/model/formatter",
    "shared/model/ExportHelper",
    "shared/utils/ExportHelper",
    "shared/model/Constants",
    "shared/model/FinancialService",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Spreadsheet, formatter, ExportHelper, ExportUtils, Constants, FinancialService, MessageBox) {
    "use strict";

    return Controller.extend("financialstatementsltmcustom.controller.Main", {
        formatter: formatter,

        /**
         * Controller initialization lifecycle hook.
         * Initializes the FinancialService, sets up the viewSettings model with years/months,
         * loads available years from backend, and loads initial pivot data.
         * @public
         */
        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            
            // Initialize period selection model
            var oSettingsModel = new JSONModel({
                years: [],
                months: Constants.Months,
                startYear: "2024",
                startMonth: "1",
                endYear: "2025",
                endMonth: "12"
            });
            this.getView().setModel(oSettingsModel, "viewSettings");
            
            this._loadAvailableYears();
            this._loadData();
        },

        /**
         * Loads available years from the backend and updates the viewSettings model.
         * Automatically sets the start year to the second-to-last year and end year to the last year.
         * @private
         */
        _loadAvailableYears: function() {
            this._oFinancialService.getAvailableYears().then(function(aYears) {
                var aYearItems = aYears.map(function(sYear) {
                    return { key: sYear, text: sYear };
                });
                
                var oModel = this.getView().getModel("viewSettings");
                oModel.setProperty("/years", aYearItems);
                
                if (aYears.length > 1) {
                    oModel.setProperty("/startYear", aYears[aYears.length - 2]);
                    oModel.setProperty("/endYear", aYears[aYears.length - 1]);
                }
            }.bind(this)).catch(function(err) {
                console.error("Failed to load years", err);
            });
        },

        /**
         * Event handler for period range changes (year or month selection).
         * Triggers a reload of the pivot data with the new period range.
         * @public
         */
        onPeriodChange: function() {
            this._loadData();
        },

        /**
         * Loads pivot tree data from the backend based on the selected period range.
         * Fetches data via getPivotTree service, creates the ltm model, and builds dynamic columns.
         * @private
         */
        _loadData: function() {
            var oModel = this.getView().getModel("viewSettings");
            var sStartYear = oModel.getProperty("/startYear");
            var sStartMonth = oModel.getProperty("/startMonth");
            var sEndYear = oModel.getProperty("/endYear");
            var sEndMonth = oModel.getProperty("/endMonth");

            this._oFinancialService.getPivotTree(
                parseInt(sStartYear),
                parseInt(sStartMonth),
                parseInt(sEndYear),
                parseInt(sEndMonth)
            ).then(function(oRoot) {
                var oLtmModel = new JSONModel(oRoot);
                oLtmModel.setSizeLimit(Constants.ModelConfig.SIZE_LIMIT);
                this.getView().setModel(oLtmModel, "ltm");
                
                // Build dynamic columns
                var aRawColumns = oRoot.root.columns || [];
                var aColumns = aRawColumns.map(function(sKey) {
                    var sLabel = sKey;
                    if (sKey && sKey.length === 7) {
                        sLabel = sKey.substring(0, 4) + "-" + sKey.substring(5, 7);
                    }
                    return {
                        label: sLabel,
                        property: sKey
                    };
                });

                this._buildPivotColumns(aColumns);

            }.bind(this)).catch(function(err) {
                console.error("Failed to load pivot data", err);
                MessageBox.error("Failed to load data: " + (err.message || err));
            }.bind(this));
        },

        /**
         * Dynamically builds table columns based on the pivot data periods.
         * Removes existing dynamic columns (keeping the Account column) and creates new columns
         * for each period with formatted currency values.
         * @param {Array} aColumns - Array of column definitions with label and property
         * @private
         */
        _buildPivotColumns: function(aColumns) {
            var oTable = this.byId("ltmTable");
            if (!oTable) return;
            
            // Clear existing dynamic columns (keep first one "Account")
            var aTableCols = oTable.getColumns();
            if (aTableCols.length > 1) {
                for (var i = aTableCols.length - 1; i > 0; i--) {
                    oTable.removeColumn(i);
                }
            }

            if (aColumns && aColumns.length > 0) {
                aColumns.forEach(function(col) {
                    oTable.addColumn(new sap.ui.table.Column({
                        label: new sap.m.Label({ text: col.label }),
                        hAlign: "End",
                        width: "8rem",
                        template: new sap.m.Text({ 
                            text: { 
                                path: "ltm>" + col.property,
                                formatter: formatter.formatCurrency
                            } 
                        })
                    }));
                });
            }
        },

        /**
         * Exports the LTM financial statements data to an Excel file.
         * Builds column definitions from the ltm model and exports the hierarchical tree data
         * with formatted currency values using the ExportHelper.
         * @public
         */
        onExportPivot: function() {
            try {
                var oTable = this.byId("ltmTable");
                if (!oTable) {
                    MessageBox.error("Table not found. Please refresh the page and try again.");
                    return;
                }

                var oModel = this.getView().getModel("ltm");
                if (!oModel) {
                    MessageBox.error("No data available to export. Please load data first.");
                    return;
                }
                 
                var oRoot = oModel.getData();
                if (!oRoot || !oRoot.root || !oRoot.root.nodes || oRoot.root.nodes.length === 0) {
                    MessageBox.error("No data available to export.");
                    return;
                }

                // Use ExportUtils to extract columns from the table
                var aCols = ExportUtils.createExportColumns(oTable);
                
                if (aCols.length === 0) {
                    MessageBox.error("No columns available to export.");
                    return;
                }

                oTable.setBusy(true);

                var oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: oRoot.root.nodes,
                    fileName: "FinancialStatementsLTM.xlsx",
                    worker: false,
                    format: {
                        locale: "de-DE"
                    }
                };

                ExportHelper.export(oSettings, oTable).catch(function(oError) {
                    MessageBox.error("Export failed: " + (oError.message || "Unknown error"));
                    oTable.setBusy(false);
                });

            } catch (oError) {
                MessageBox.error("Export failed: " + (oError.message || "Unknown error"));
                console.error("Export error:", oError);
                var oTable = this.byId("ltmTable");
                if (oTable) {
                    oTable.setBusy(false);
                }
            }
        }
    });
});
