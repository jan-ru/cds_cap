sap.ui.define([
    "demo/ui5/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "demo/ui5/model/formatter",
    "demo/ui5/model/ExportHelper",
    "demo/ui5/model/Constants",
    "demo/ui5/model/FinancialService",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, Spreadsheet, formatter, ExportHelper, Constants, FinancialService, MessageBox) {
    "use strict";

    return BaseController.extend("demo.ui5.controller.Financials", {
        formatter: formatter,
        _oFinancialService: null,
        _sFSType: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            
            // Read Custom Data from View to determine Report Type (PNL, BAS, COMBINED)
            // Note: In XMLView usage, CustomData is on the View control itself.
            this._sFSType = this.getView().data("fsType");
            
            // If not found (e.g. top level or not set), default or error?
            // "COMBINED" is passed as value in XML.
            
            // Initial Load - MOVED to onBeforeRendering
            // The viewSettings model (propagated from parent) is often not available in onInit of nested view.
        },

        onBeforeRendering: function() {
              if (this._sFSType && !this._bInitialized) {
                  // Delay to ensure model propagation
                  setTimeout(function() {
                      this._loadFinancialData();
                  }.bind(this), 0);
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
                  // Wait for rendering if not ready
                 return;
            }

            // Technical Info Update
             var oTechConfig = (this._sFSType === Constants.FSType.PNL) ? Constants.TechInfo.IncomeStatement : 
                              (this._sFSType === Constants.FSType.BAS) ? Constants.TechInfo.BalanceSheet : null;
            
            if (oTechConfig) {
                 this._oFinancialService.updateTechInfo(oTechConfig, this.getView().getModel("tech"));
            }

            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) {
                // Not yet propagated
                return;
            }
            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");
            
            if (!oPeriodA || !oPeriodB) {
                return;
            }
            
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
                worker: false
            };

            ExportHelper.export(oSettings, null); // export helper handles hierarchy if configured
        }

    });
});