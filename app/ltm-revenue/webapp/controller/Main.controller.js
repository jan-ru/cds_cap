sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "ltmrevenue/model/FinancialService",
    "ltmrevenue/model/formatter"
], function (Controller, JSONModel, MessageBox, FinancialService, formatter) {
    "use strict";

    return Controller.extend("ltmrevenue.controller.Main", {
        formatter: formatter,

        onInit: function () {
            // Initialize Financial Service
            this._oFinancialService = new FinancialService(this.getOwnerComponent());

            // Initialize view settings model
            this._initViewSettings();

            // Initialize view model for busy state
            var oViewModel = new JSONModel({
                busy: false
            });
            this.getView().setModel(oViewModel, "view");

            // Load initial data
            this.loadData();
        },

        _initViewSettings: function () {
            var dNow = new Date();
            var dStart = new Date(dNow);
            dStart.setMonth(dNow.getMonth() - 11);

            // Generate year options (last 5 years + current year)
            var aYears = [];
            var currentYear = dNow.getFullYear();
            for (var i = currentYear - 5; i <= currentYear; i++) {
                aYears.push({ key: i.toString(), text: i.toString() });
            }

            // Generate month options
            var aMonths = [
                { key: "1", text: "Jan" }, { key: "2", text: "Feb" }, { key: "3", text: "Mar" },
                { key: "4", text: "Apr" }, { key: "5", text: "May" }, { key: "6", text: "Jun" },
                { key: "7", text: "Jul" }, { key: "8", text: "Aug" }, { key: "9", text: "Sep" },
                { key: "10", text: "Oct" }, { key: "11", text: "Nov" }, { key: "12", text: "Dec" }
            ];

            var oSettingsModel = new JSONModel({
                years: aYears,
                months: aMonths,
                ltm: {
                    start: {
                        year: dStart.getFullYear().toString(),
                        month: (dStart.getMonth() + 1).toString()
                    },
                    end: {
                        year: dNow.getFullYear().toString(),
                        month: (dNow.getMonth() + 1).toString()
                    }
                }
            });

            this.getView().setModel(oSettingsModel, "viewSettings");
        },

        _getPeriodRange: function () {
            var oSettingsModel = this.getView().getModel("viewSettings");
            var oLtm = oSettingsModel.getProperty("/ltm");

            return {
                startYear: parseInt(oLtm.start.year),
                startMonth: parseInt(oLtm.start.month),
                endYear: parseInt(oLtm.end.year),
                endMonth: parseInt(oLtm.end.month)
            };
        },

        loadData: function () {
            var oTable = this.byId("revenueTable");
            var oViewModel = this.getView().getModel("view");

            if (!oTable) {
                console.error("Revenue table not found");
                return;
            }

            oViewModel.setProperty("/busy", true);

            var range = this._getPeriodRange();

            this._oFinancialService.getRevenueLTM(range.startYear, range.startMonth, range.endYear, range.endMonth)
                .then(function (oResult) {
                    var aRows = oResult.rows;
                    var aColumns = oResult.columns;

                    // Bind Data
                    var oJsonModel = new JSONModel({ rows: aRows });
                    oTable.setModel(oJsonModel, "revenue");

                    // Rebuild Columns - keep fixed columns, destroy dynamic ones
                    while (oTable.getColumns().length > 2) {
                        oTable.removeColumn(2);
                    }

                    // Add dynamic columns
                    aColumns.forEach(function (col) {
                        oTable.addColumn(new sap.ui.table.Column({
                            label: new sap.m.Label({ text: col.label }),
                            hAlign: "End",
                            template: new sap.m.Text({
                                text: {
                                    path: "revenue>" + col.property,
                                    formatter: this.formatter.formatCurrency
                                }
                            }),
                            width: "6rem"
                        }));
                    }.bind(this));

                    oTable.bindRows("revenue>/rows");
                    oViewModel.setProperty("/busy", false);

                }.bind(this))
                .catch(function (err) {
                    console.error("Failed to load Revenue Report", err);
                    MessageBox.error("Failed to load Revenue Report: " + (err.message || err));
                    oViewModel.setProperty("/busy", false);
                }.bind(this));
        },

        onPeriodUpdate: function () {
            this.loadData();
        },

        onRefresh: function () {
            this.loadData();
        },

        onExport: function () {
            MessageBox.information("Export functionality will be implemented");
        }
    });
});
