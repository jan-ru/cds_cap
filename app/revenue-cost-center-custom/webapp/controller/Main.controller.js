sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "shared/model/formatter",
    "shared/model/ExportHelper",
    "shared/model/FinancialService",
    "shared/model/Constants",
    "sap/m/MessageBox"
], function (Controller, JSONModel, formatter, ExportHelper, FinancialService, Constants, MessageBox) {
    "use strict";

    return Controller.extend("revenuecostcentercustom.controller.Main", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            
            // Initialize period selection model
            var oSettingsModel = new JSONModel({
                months: [
                    { key: "1", text: "1" },
                    { key: "2", text: "2" },
                    { key: "3", text: "3" },
                    { key: "4", text: "4" },
                    { key: "5", text: "5" },
                    { key: "6", text: "6" },
                    { key: "7", text: "7" },
                    { key: "8", text: "8" },
                    { key: "9", text: "9" },
                    { key: "10", text: "10" },
                    { key: "11", text: "11" },
                    { key: "12", text: "12" }
                ],
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
                workbook: { columns: this._createExportColumns(oTable), hierarchyLevel: "Level" },
                dataSource: aRows,
                fileName: "Revenue_By_Cost_Center.xlsx",
                worker: false
            };

            oTable.setBusy(true);
            ExportHelper.export(oSettings, oTable).catch(function(err) {
                console.error("Sales Export Failed:", err);
                MessageBox.error("Export failed: " + (err.message || err));
            }).finally(function() {
                oTable.setBusy(false);
            });
        },

        _createExportColumns: function(oTable) {
            var aCols = [];
            var aTableCols = oTable.getColumns();

            aTableCols.forEach(function(oColumn) {
                var sLabel = "";
                var oLabel = oColumn.getLabel();
                if (oLabel) {
                    sLabel = oLabel.getText();
                } else {
                    var aMultiLabels = oColumn.getMultiLabels();
                    if (aMultiLabels && aMultiLabels.length > 0) {
                        sLabel = aMultiLabels.map(function(label) {
                            return label.getText();
                        }).join(" - ");
                    }
                }

                var oTemplate = oColumn.getTemplate();
                var sProperty = "";

                if (oTemplate instanceof sap.m.Text || oTemplate instanceof sap.m.Label) {
                    var oBinding = oTemplate.getBindingInfo("text");
                    if (oBinding) {
                        if (oBinding.parts && oBinding.parts.length > 0) {
                            sProperty = oBinding.parts[0].path;
                        } else if (oBinding.path) {
                            sProperty = oBinding.path;
                        }
                    }
                } else if (oTemplate instanceof sap.m.ObjectStatus) {
                    var oBinding = oTemplate.getBindingInfo("text");
                    if (oBinding && oBinding.path) sProperty = oBinding.path;
                }
                
                if (sProperty && sProperty.indexOf(">") > -1) {
                    sProperty = sProperty.split(">")[1];
                }

                if (sProperty) {
                    aCols.push({
                        label: sLabel,
                        property: sProperty,
                        type: "String",
                        scale: 0
                    });
                }
            });
            return aCols;
        }
    });
});
