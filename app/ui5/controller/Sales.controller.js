sap.ui.define([
    "shared/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "demo/ui5/model/formatter",
    "shared/utils/ExportHelper",
    "shared/model/FinancialService",
    "shared/model/Constants",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, ExportHelper, FinancialService, Constants, MessageBox) {
    "use strict";

    return BaseController.extend("demo.ui5.controller.Sales", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            // _fetchSalesData moved to onBeforeRendering to await model propagation
        },

        onBeforeRendering: function() {
              if (!this._bInitialized) {
                  this._fetchSalesData();
                  this._bInitialized = true;
              }
        },

        onPeriodUpdate: function() {
            this._fetchSalesData();
        },

        _fetchSalesData: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) return;
            
            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");
            
            if (!oPeriodA || !oPeriodB) return;


            // Note: charts update is removed from here. Charts component handles its own data.
            this._fetchData("Sales", "sales", function() {
                return this._oFinancialService.getSalesTree(oPeriodA, oPeriodB);
            }.bind(this));
        },

        onExportSales: function() {
            var oTable = this.byId("salesTreeTable");
            // If the fragment is used inside the view, ID might be prefixed. 
            // Since Sales.view.xml likely wraps SalesTab.fragment.xml, check fragments ID.
            // If not found, try to find by checking dependent controls or View ID.
            if (!oTable) {
                 // Try getting by stable ID if possible or inspect View
                 // Assuming ID "salesTable" is defined in the fragment
                 console.error("Sales Table not found");
                 MessageBox.error("Sales Table not found");
                 return;
            }

            var oModel = oTable.getModel("sales"); // Model name is "sales"
            if (!oModel) return;

            var oRoot = oModel.getData();
            var aRows = (oRoot && oRoot.root) ? oRoot.root.nodes : [];

            if (!aRows || aRows.length === 0) {
                sap.m.MessageToast.show("No data to export");
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
