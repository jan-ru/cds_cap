sap.ui.define([
    "revenueltmcustom/controller/BaseReportController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "revenueltmcustom/model/formatter",
    "revenueltmcustom/model/ExportHelper",
    "sap/m/MessageBox"
], function (BaseReportController, JSONModel, Spreadsheet, formatter, ExportHelper, MessageBox) {
    "use strict";

    return BaseReportController.extend("revenueltmcustom.controller.Main", {
        formatter: formatter,

        // loadData called by BaseReportController.onBeforeRendering
        loadData: function() {
            var oTable = this.byId("idRevenueReportTable");
            
            if (!oTable) {
                 console.error("RevenueLTM: Table not found in onInit?");
                 return;
            }

            // Get selected Periods via Base helper
            var range = this._getPeriodRange();

            this._oFinancialService.getRevenueLTM(range.startYear, range.startMonth, range.endYear, range.endMonth)
            .then(function(oResult) {
                var aRows = oResult.rows;
                var aColumns = oResult.columns;

                // Bind Data
                var oJsonModel = new JSONModel({ rows: aRows });
                oTable.setModel(oJsonModel, "revenueLTM");

                // Rebuild Columns
                oTable.destroyColumns();
                
                // Fixed Columns
                oTable.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Label({ text: "Revenue Type" }),
                    template: new sap.m.Text({ text: "{revenueLTM>RevenueType}" }),
                    width: "10rem"
                }));
                oTable.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Label({ text: "Cost Center" }),
                    template: new sap.m.Text({ text: "{revenueLTM>CostCenterGroup}" }),
                    width: "8rem"
                }));

                // Dynamic Columns
                aColumns.forEach(function(col) {
                     oTable.addColumn(new sap.ui.table.Column({
                        label: new sap.m.Label({ text: col.label }),
                        hAlign: "End",
                        template: new sap.m.Text({ 
                            text: { 
                                path: "revenueLTM>" + col.property,
                                formatter: formatter.formatCurrency
                            } 
                        }),
                        width: "6rem"
                    }));
                });

                oTable.bindRows("revenueLTM>/rows");

            }).catch(function(err) {
                 console.error("Failed to load Revenue Report", err);
                 MessageBox.error("Failed to load Revenue Report: " + (err.message || err));
            });
        },

        /**
         * Export Revenue LTM to Excel.
         */
        onExportRevenue: function(oEvent) {
             MessageBox.information("Export button clicked. Starting export process...");
             console.log("RevenueLTM: onExportRevenue called");

             var oTable = this.byId("idRevenueReportTable");
             if (!oTable) {
                 MessageBox.error("Table not found!");
                 return;
             }
             var aCols = [];
             
             // 1. Define Static Columns
             aCols.push({ label: "Revenue Type", property: "RevenueType", type: "String" });
             aCols.push({ label: "Cost Center", property: "CostCenterGroup", type: "String" });
             
             // 2. Define Dynamic Columns
             var aTableCols = oTable.getColumns();
             // Skip first 2 static columns
             for (var i = 2; i < aTableCols.length; i++) {
                 var oCol = aTableCols[i];
                 var oTemplate = oCol.getTemplate();
                 var oBindingInfo = oTemplate.getBindingInfo("text");
                 var sPath = "";
                 
                 if (oBindingInfo) {
                     if (oBindingInfo.parts && oBindingInfo.parts.length > 0) {
                         sPath = oBindingInfo.parts[0].path;
                     } else if (oBindingInfo.path) {
                         sPath = oBindingInfo.path;
                     }
                 }
                 
                 // Strip model name if present (e.g. "revenueLTM>Property" -> "Property")
                 if (sPath && sPath.indexOf(">") > -1) {
                     sPath = sPath.split(">")[1];
                 }

                 if (sPath) {
                     aCols.push({
                         label: oCol.getLabel().getText(),
                         property: sPath, 
                         type: "Number",
                         scale: 0,
                         delimiter: true
                     });
                 }
             }

             console.log("RevenueLTM Export Columns:", aCols);

             var oRowBinding = oTable.getBinding("rows");
             var oSettings = {
                 workbook: {
                     columns: aCols,
                     hierarchyLevel: "Level"
                 },
                 dataSource: oRowBinding,
                 fileName: "Revenue_LTM_Report.xlsx",
                 worker: false 
             };

             oTable.setBusy(true);
             ExportHelper.export(oSettings, oTable).catch(function(err) {
                 console.error("RevenueLTM Export Failed:", err);
                 MessageBox.error("Export failed: " + (err.message || err));
             }).finally(function() {
                 oTable.setBusy(false);
             });
        }

    });
});
