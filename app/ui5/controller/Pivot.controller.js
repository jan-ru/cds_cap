sap.ui.define([
    "demo/ui5/controller/BaseReportController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "demo/ui5/model/formatter",
    "demo/ui5/model/ExportHelper",
    "demo/ui5/model/Constants",
    "sap/m/MessageBox"
], function (BaseReportController, JSONModel, Spreadsheet, formatter, ExportHelper, Constants, MessageBox) {
    "use strict";

    return BaseReportController.extend("demo.ui5.controller.Pivot", {
        formatter: formatter,

        // loadData called by BaseReportController.onBeforeRendering
        loadData: function() {
             // Technical Info
            if (Constants.TechInfo && Constants.TechInfo.Pivot) {
                 this._oFinancialService.updateTechInfo(Constants.TechInfo.Pivot, this.getView().getModel("tech"));
            }

            // Get selected Periods via Base helper
            var range = this._getPeriodRange();

            // Call Service with Explicit Date Range
            this._oFinancialService.getPivotTree(range.startYear, range.startMonth, range.endYear, range.endMonth)
            .then(function(oRoot) {
                var oModel = new JSONModel(oRoot);
                oModel.setSizeLimit(100000);
                this.getView().setModel(oModel, "pivot");
                
                // Fix: Columns are in oRoot.root.columns and are just Strings (Keys).
                // We need to map them to { label, property }.
                var aRawColumns = oRoot.root.columns || [];
                var aColumns = aRawColumns.map(function(sKey) {
                    // Format Label: "2024001" -> "2024-01"
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

            }.bind(this)).catch(this._handleError.bind(this));
        },

        _buildPivotColumns: function(aColumns) {
            var oTable = this.byId("pivotTable");
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
                                path: "pivot>" + col.property,
                                formatter: formatter.formatCurrency
                            } 
                        })
                    }));
                 });
            }
        },

        onExportPivot: function() {
             var oTable = this.byId("pivotTable");
             var oModel = this.getView().getModel("pivot");
             if (!oModel) return;
             
             // ... simplify export using helper ...
             // Actually, Pivot has complex dynamic columns.
             // Let's implement basic export logic similar to others.
             
             var aCols = [];
             aCols.push({ label: "Account", property: "name", type: "String" });
             
             var oRoot = oModel.getData();
             if (oRoot && oRoot.columns) {
                 oRoot.columns.forEach(function(col) {
                     aCols.push({ 
                         label: col.label, 
                         property: col.property, 
                         type: "Number",
                         scale: 0,
                         delimiter: true
                     });
                 });
             }
             
             var oSettings = {
                workbook: { 
                    columns: aCols,
                    hierarchyLevel: "Level" 
                },
                dataSource: oRoot.root.nodes,
                fileName: "Pivot_Analysis.xlsx",
                worker: false
            };

            ExportHelper.export(oSettings, oTable);
        }

    });
});