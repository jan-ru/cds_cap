sap.ui.define([
    "shared/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "demo/ui5/model/formatter",
    "shared/utils/ExportHelper",
    "shared/model/Constants",
    "shared/model/FinancialService",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, Spreadsheet, formatter, ExportHelper, Constants, FinancialService, MessageBox) {
    "use strict";

    return BaseController.extend("demo.ui5.controller.Financials", {
        formatter: formatter,
        _oFinancialService: null,
        _sFSType: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());

            // Read Custom Data - the XMLView has customData, but we need to access the parent page's custom data
            // In the Table.view.xml, the XMLView has customData with key "fsType"
            // We need to get the parent view control and read from it
            var oView = this.getView();
            
            // Try getting from view's custom data first
            this._sFSType = oView.data("fsType");
            
            // If not found, try getting from view's parent (the page that contains this XMLView)
            if (!this._sFSType) {
                var oParent = oView.getParent();
                while (oParent && !this._sFSType) {
                    var aCustomData = oParent.getCustomData ? oParent.getCustomData() : [];
                    for (var i = 0; i < aCustomData.length; i++) {
                        if (aCustomData[i].getKey() === "fsType") {
                            this._sFSType = aCustomData[i].getValue();
                            break;
                        }
                    }
                    oParent = oParent.getParent();
                }
            }
            
            console.log("Financials Controller: Initialized with FSType:", this._sFSType);
        },

        onBeforeRendering: function() {
            if (!this._bInitialized) {
                this._loadFinancialData();
                this._bInitialized = true;
            }
        },

        onPeriodUpdate: function() {
            if (this._sFSType) {
                this._loadFinancialData();
            }
        },

        _loadFinancialData: function() {
            var sTableId = "financialTreeTable"; // ID in Fragment
            var oTable = this.byId(sTableId);
            if (!oTable) {
                console.error("Financials Controller: Table 'financialTreeTable' not found for FSType:", this._sFSType);
                return;
            }
            console.log("Financials Controller: Table found for FSType:", this._sFSType);

            // Technical Info Update
             var oTechConfig = (this._sFSType === Constants.FSType.PNL) ? Constants.TechInfo.IncomeStatement : 
                              (this._sFSType === Constants.FSType.BAS) ? Constants.TechInfo.BalanceSheet : null;
            
            if (oTechConfig) {
                 this._oFinancialService.updateTechInfo(oTechConfig, this.getView().getModel("tech"));
            }

            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) {
                console.error("Financials Controller: viewSettings model not found for FSType:", this._sFSType);
                return;
            }
            console.log("Financials Controller: viewSettings model found for FSType:", this._sFSType);
            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");

            if (!oPeriodA || !oPeriodB) {
                console.error("Financials Controller: Periods not configured. PeriodA:", oPeriodA, "PeriodB:", oPeriodB);
                return;
            }
            console.log("Financials Controller: Loading data for FSType:", this._sFSType, "PeriodA:", oPeriodA, "PeriodB:", oPeriodB);
            
            var fnPromise;
            if (this._sFSType === "COMBINED") {
                 fnPromise = this._oFinancialService.getCombinedTree(oPeriodA, oPeriodB);
            } else {
                 fnPromise = this._oFinancialService.getFinancialStatementsTree(this._sFSType, oPeriodA, oPeriodB);
            }

            fnPromise.then(function(oRoot) {
                var oTreeModel = new JSONModel(oRoot);
                oTreeModel.setSizeLimit(100000);
                oTable.setModel(oTreeModel); // Default Model matches fragment bindings {name}, {amountA}
                oTable.bindRows({
                    path: "/root",
                    parameters: { arrayNames: ['nodes'] }
                });
            }.bind(this)).catch(function(err) {
                console.error("Failed to load FS " + this._sFSType, err);
                MessageBox.error("Failed to load data: " + (err.message || err));
            }.bind(this));
        },

        onExportFinancial: function(oEvent) {
             var oTable = this.byId("financialTreeTable");
             var oModel = oTable.getModel();
             if (!oModel) return;

             var oRoot = oModel.getData();
             var aRows = (oRoot && oRoot.root) ? oRoot.root.nodes : [];
             
            if (!aRows || aRows.length === 0) {
                sap.m.MessageToast.show("No data to export");
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
                 { label: "Diff %", property: "diffPrc", type: "Number", scale: 2 }
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

            ExportHelper.export(oSettings, null); // export helper handles hierarchy if configured
        }

    });
});