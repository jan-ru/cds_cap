sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "shared/model/FinancialService",
    "shared/model/Constants",
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "shared/model/formatter"
], function (Controller, JSONModel, FinancialService, Constants, Spreadsheet, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("glcustom.controller.Main", {
        formatter: formatter,

        onInit: function () {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());

            // View Model for GL Totals
            var oViewModel = new JSONModel({
                glTotalDebit: "Loading...",
                glTotalCredit: "Loading...",
                glTotalBalance: "Loading...",
                glRowCount: 0,
                glColCount: 0
            });
            this.getView().setModel(oViewModel, "view");

            // Initialize table with default view
            this.onPressGLByAccount();
        },

        _attachGLBindingEvents: function(oTable) {
            var oBinding = oTable.getBinding("rows");
            if (oBinding) {
                oBinding.attachDataReceived(function() {
                    this._updateGLTotalsFromBinding(oBinding, oTable);
                }.bind(this));
            }
        },

        _updateGLTotalsFromBinding: function(oBinding, oTable) {
            var aFilters = [];

            try {
                var aAppFilters = oBinding.getFilters("Application") || [];
                if (Array.isArray(aAppFilters)) {
                    aFilters = aFilters.concat(aAppFilters);
                } else if (aAppFilters && typeof aAppFilters === "object") {
                     aFilters.push(aAppFilters);
                }
                
                var aControlFilters = oBinding.getFilters("Control") || [];
                 if (Array.isArray(aControlFilters)) {
                    aFilters = aFilters.concat(aControlFilters);
                }
            } catch (e) {
                console.warn("Error retrieving binding filters:", e);
            }

            if (aFilters.length === 0 && oTable) {
                // Update Row Count
                 var iLength = oBinding.getLength();
                 this.getView().getModel("view").setProperty("/glRowCount", iLength);

                var aCols = oTable.getColumns();
                aCols.forEach(function(oCol) {
                    var sValue = oCol.getFilterValue();
                    var sPath = oCol.getFilterProperty();
                    if (sValue && sPath) {
                        var sOperator = "Contains"; 
                        var sType = oCol.getFilterType();
                        if (sType && (sType.indexOf("Integer") > -1 || sType.indexOf("Float") > -1 || sType.indexOf("Int") > -1)) {
                            sOperator = "EQ";
                        }
                        aFilters.push(new Filter(sPath, sOperator, sValue));
                    }
                });
            }
            
            this._fetchGLTotals(aFilters);
        },

        onPressGLDetails: function() {
            var oTable = this.byId("tableGL");
            this._setGLColumnsVisible("Details");
            oTable.bindRows({ path: "odata>" + Constants.EntityPaths.Dump });
            this._attachGLBindingEvents(oTable);
        },

        onPressGLByAccount: function() {
            var oTable = this.byId("tableGL");
            this._setGLColumnsVisible("Account");
            oTable.bindRows({
                path: "odata>/Dump",
                parameters: {
                    $apply: "groupby((CodeGrootboekrekening,NaamGrootboekrekening), aggregate(Debet with sum as Debet, Credit with sum as Credit, Saldo with sum as Saldo))"
                }
            });
            this._attachGLBindingEvents(oTable);
        },

        onPressGLByJournal: function() {
            var oTable = this.byId("tableGL");
            this._setGLColumnsVisible("Journal");
            oTable.bindRows({
                path: "odata>/Dump",
                parameters: {
                    $apply: "groupby((Code), aggregate(Debet with sum as Debet, Credit with sum as Credit, Saldo with sum as Saldo))"
                }
            });
            this._attachGLBindingEvents(oTable);
        },

        onPressGLByCostCenter: function() {
            var oTable = this.byId("tableGL");
            this._setGLColumnsVisible("CostCenter");
            oTable.bindRows({
                path: "odata>/Dump",
                parameters: {
                    $apply: "groupby((Code1), aggregate(Debet with sum as Debet, Credit with sum as Credit, Saldo with sum as Saldo))"
                }
            });
            this._attachGLBindingEvents(oTable);
        },

        onPressGLByPeriod: function() {
            var oTable = this.byId("tableGL");
            this._setGLColumnsVisible("Period");
            oTable.bindRows({
                path: "odata>/Dump",
                parameters: {
                    $apply: "groupby((Periode,PeriodYear,PeriodSortKey), aggregate(Debet with sum as Debet, Credit with sum as Credit, Saldo with sum as Saldo))"
                }
            });
            this._attachGLBindingEvents(oTable);
        },

        _fetchGLTotals: function(aFilters) {
            this._oFinancialService.getGLTotals(aFilters).then(function(oTotals) {
                if (oTotals) {
                    var oViewModel = this.getView().getModel("view");
                    var fnRound = function(val) {
                        return parseFloat(parseFloat(val || 0).toFixed(2));
                    };
                    oViewModel.setProperty("/glTotalDebit", fnRound(oTotals.TotalDebit));
                    oViewModel.setProperty("/glTotalCredit", fnRound(oTotals.TotalCredit));
                    oViewModel.setProperty("/glTotalBalance", fnRound(oTotals.TotalBalance));
                }
            }.bind(this));
        },

        onExportGL: function() {
            var oTable = this.byId("tableGL");
            var oRowBinding = oTable.getBinding("rows");
            var aCols = [];

            Constants.ExportConfig.GL.forEach(function(oColConfig) {
                if (this.byId(oColConfig.id).getVisible()) {
                    aCols.push({
                        label: oColConfig.label,
                        property: oColConfig.property,
                        type: oColConfig.type,
                        scale: oColConfig.scale
                    });
                }
            }.bind(this));

            var oSettings = {
                workbook: { columns: aCols, context: { sheetName: "General Ledger" } },
                dataSource: oRowBinding,
                fileName: "General_Ledger.xlsx",
                worker: false
            };

            new Spreadsheet(oSettings).build().finally(function() {
                oTable.setBusy(false);
            });
        },

        _setGLColumnsVisible: function(sMode) {
            var oTable = this.byId("tableGL");
            if (!oTable) return;

            var oConfig = Constants.GLViewModes[sMode];
            if (!oConfig) {
                console.error("Invalid GL View Mode:", sMode);
                return;
            }

            var fnSet = function(sId, bVis) {
                var oCol = this.byId(sId);
                if (oCol) oCol.setVisible(bVis);
            }.bind(this);

            Object.keys(oConfig).forEach(function(sColId) {
                fnSet(sColId, oConfig[sColId]);
            });
            
             // Update Column Count
             this._updateGLColCount(oTable);
        },

        _updateGLColCount: function(oTable) {
             var aCols = oTable.getColumns();
             var iVisible = 0;
             aCols.forEach(function(oCol) {
                 if (oCol.getVisible()) iVisible++;
             });
             this.getView().getModel("view").setProperty("/glColCount", iVisible);
        }
    });
});
