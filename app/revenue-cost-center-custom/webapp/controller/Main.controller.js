sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "shared/model/formatter",
    "shared/model/ExportHelper",
    "shared/utils/ExportHelper",
    "shared/model/FinancialService",
    "shared/model/Constants",
    "sap/m/MessageBox"
], function (Controller, JSONModel, formatter, ExportHelper, ExportUtils, FinancialService, Constants, MessageBox) {
    "use strict";

    return Controller.extend("revenuecostcentercustom.controller.Main", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            
            // Initialize period selection model
            var oSettingsModel = new JSONModel({
                months: Constants.Months,
                periodA: { 
                    year: "2025",
                    monthFrom: "1",
                    monthTo: "12"
                },
                periodB: { 
                    year: "2024",
                    monthFrom: "1",
                    monthTo: "12"
                }
            });
            this.getView().setModel(oSettingsModel, "viewSettings");
            
            this._fetchSalesData();
        },

        onPeriodChange: function() {
            this._fetchSalesData();
        },

        _fetchSalesData: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) return;
            
            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");
            
            if (!oPeriodA || !oPeriodB) return;

            this._oFinancialService.getSalesTree(oPeriodA, oPeriodB).then(function(oRoot) {
                var oSalesModel = new JSONModel(oRoot);
                this.getView().setModel(oSalesModel, "sales");
            }.bind(this)).catch(function(err) {
                console.error("Failed to load sales data", err);
                MessageBox.error("Failed to load sales data: " + (err.message || err));
            });
        },

        onExportSales: function() {
            var oTable = this.byId("salesTreeTable");
            if (!oTable) {
                MessageBox.error("Sales Table not found");
                return;
            }

            var oModel = oTable.getModel("sales");
            if (!oModel) return;

            var oRoot = oModel.getData();
            var aRows = (oRoot && oRoot.root) ? oRoot.root.nodes : [];

            if (!aRows || aRows.length === 0) {
                MessageBox.information("No data to export");
                return;
            }

            var oSettings = {
                workbook: { columns: ExportUtils.createExportColumns(oTable), hierarchyLevel: "Level" },
                dataSource: aRows,
                fileName: "Revenue_By_Cost_Center.xlsx",
                worker: false,
                format: {
                    locale: "de-DE"
                }
            };

            oTable.setBusy(true);
            ExportHelper.export(oSettings, oTable).catch(function(err) {
                console.error("Sales Export Failed:", err);
                MessageBox.error("Export failed: " + (err.message || err));
            }).finally(function() {
                oTable.setBusy(false);
            });
        },

    });
});
