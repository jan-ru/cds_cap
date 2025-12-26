sap.ui.define([
    "shared/controller/BaseReportController",
    "sap/ui/model/json/JSONModel",
    "shared/model/FinancialService",
    "shared/model/Constants",
    "shared/model/ExportHelper",
    "shared/model/formatter",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseReportController, JSONModel, FinancialService, Constants, ExportHelper, formatter, MessageBox, MessageToast) {
    "use strict";

    return BaseReportController.extend("shared.controller.BaseFinancialController", {

        formatter: formatter,
        _oFinancialService: null,
        _sFSType: null, // Will be set by child controllers

        onInit: function() {
            BaseReportController.prototype.onInit.apply(this, arguments);
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
        },

        /**
         * Override to initialize period settings for financial statements
         */
        _initViewSettings: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) {
                // Initialize the model if it doesn't exist
                oSettingsModel = new JSONModel({
                    years: [],
                    months: Constants.Months
                });
                this.getView().setModel(oSettingsModel, "viewSettings");
            }

            // Set default periods if not already set
            if (!oSettingsModel.getProperty("/periodA")) {
                var dNow = new Date();
                var currentYear = dNow.getFullYear().toString();
                var lastYear = (dNow.getFullYear() - 1).toString();

                oSettingsModel.setProperty("/periodA", {
                    year: lastYear,
                    monthFrom: "1",
                    monthTo: "12"
                });
                oSettingsModel.setProperty("/periodB", {
                    year: currentYear,
                    monthFrom: "1",
                    monthTo: "12"
                });
            }
        },

        loadData: function() {
            var oTable = this.byId("financialTreeTable");
            if (!oTable) {
                console.error("BaseFinancialController: Table 'financialTreeTable' not found for FSType:", this._sFSType);
                return;
            }
            console.log("BaseFinancialController: Table found for FSType:", this._sFSType);

            // Technical Info Update
            var oTechConfig = (this._sFSType === Constants.FSType.PNL) ? Constants.TechInfo.IncomeStatement :
                             (this._sFSType === Constants.FSType.BAS) ? Constants.TechInfo.BalanceSheet : null;

            if (oTechConfig) {
                this._oFinancialService.updateTechInfo(oTechConfig, this.getView().getModel("tech"));
            }

            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) {
                console.error("BaseFinancialController: viewSettings model not found for FSType:", this._sFSType);
                return;
            }
            console.log("BaseFinancialController: viewSettings model found for FSType:", this._sFSType);

            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");

            if (!oPeriodA || !oPeriodB) {
                console.error("BaseFinancialController: Periods not configured. PeriodA:", oPeriodA, "PeriodB:", oPeriodB);
                return;
            }
            console.log("BaseFinancialController: Loading data for FSType:", this._sFSType, "PeriodA:", oPeriodA, "PeriodB:", oPeriodB);

            var fnPromise = this._getDataPromise(oPeriodA, oPeriodB);

            fnPromise.then(function(oRoot) {
                var oTreeModel = new JSONModel(oRoot);
                oTreeModel.setSizeLimit(100000);
                oTable.setModel(oTreeModel);
                oTable.bindRows({
                    path: "/root",
                    parameters: { arrayNames: ['nodes'] }
                });
            }.bind(this)).catch(function(err) {
                console.error("Failed to load financial data for FSType:", this._sFSType, err);
                MessageBox.error("Failed to load data: " + (err.message || err));
            }.bind(this));
        },

        // Abstract method - must be implemented by child controllers
        _getDataPromise: function(oPeriodA, oPeriodB) {
            throw new Error("_getDataPromise must be implemented by child controller");
        },

        onPeriodUpdate: function() {
            this.loadData();
        },

        onExportFinancial: function() {
            var oTable = this.byId("financialTreeTable");
            var oModel = oTable.getModel();
            if (!oModel) {
                console.error("BaseFinancialController: No model found on table");
                return;
            }

            var oRoot = oModel.getData();
            var aRows = (oRoot && oRoot.root) ? oRoot.root.nodes : [];

            if (!aRows || aRows.length === 0) {
                MessageToast.show("No data to export");
                return;
            }

            var oSettingsModel = this.getView().getModel("viewSettings");
            var sYearA = oSettingsModel.getProperty("/periodA/year");
            var sYearB = oSettingsModel.getProperty("/periodB/year");

            // Define Columns
            var aCols = [
                { label: "Account / Group", property: "name", type: "String", width: 25 },
                { label: sYearA, property: "amountA", type: "Number", scale: 2 },
                { label: sYearB, property: "amountB", type: "Number", scale: 2 },
                { label: "Diff Amount", property: "diffAbs", type: "Number", scale: 2 },
                { label: "Diff %", property: "diffPct", type: "Number", scale: 2 }
            ];

            var sSheetName = (this._sFSType === "COMBINED") ? "Combined Statement" :
                             (this._sFSType === Constants.FSType.PNL) ? "Income Statement" : "Balance Sheet";

            var oSettings = {
                workbook: {
                    columns: aCols,
                    context: { sheetName: sSheetName },
                    hierarchyLevel: "Level"
                },
                dataSource: aRows,
                fileName: sSheetName.replace(/ /g, "_") + ".xlsx",
                worker: false,
                format: {
                    locale: "de-DE"
                }
            };

            ExportHelper.export(oSettings, null);
        }
    });
});
