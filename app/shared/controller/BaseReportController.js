sap.ui.define([
    "shared/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "shared/model/ExportHelper",
    "shared/model/FinancialService"
], function(BaseController, JSONModel, MessageBox, ExportHelper, FinancialService) {
    "use strict";

    return BaseController.extend("shared.controller.BaseReportController", {

        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
        },

        onBeforeRendering: function() {
            if (!this._bInitialized) {
                this._initViewSettings();
                this._loadAvailableYears();
                this.loadData();
                this._bInitialized = true;
            }
        },

        /**
         * Initialize view settings with dynamic defaults.
         */
        _initViewSettings: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) {
                // Initialize the model if it doesn't exist
                oSettingsModel = new JSONModel({
                    years: [],
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
                    ltm: null
                });
                this.getView().setModel(oSettingsModel, "viewSettings");
            }

            if (!oSettingsModel.getProperty("/ltm")) {
                // Dynamic Defaults
                // End = Current Month (or Previous Month if data lag?) - Let's use Current.
                // Start = 11 Months ago.
                var dNow = new Date();
                var dStart = new Date(dNow);
                dStart.setMonth(dNow.getMonth() - 11);

                oSettingsModel.setProperty("/ltm", {
                    start: {
                        year: dStart.getFullYear().toString(),
                        month: (dStart.getMonth() + 1).toString()
                    },
                    end: {
                        year: dNow.getFullYear().toString(),
                        month: (dNow.getMonth() + 1).toString()
                    }
                });
            }
        },

        /**
         * Load available years from the financial service.
         */
        _loadAvailableYears: function() {
            this._oFinancialService.getAvailableYears().then(function(aYears) {
                var aYearItems = aYears.map(function(sYear) {
                    return { key: sYear, text: sYear };
                });

                var oSettingsModel = this.getView().getModel("viewSettings");
                oSettingsModel.setProperty("/years", aYearItems);
            }.bind(this)).catch(function(err) {
                console.error("Failed to load available years:", err);
            });
        },

        /**
         * Abstract method to load data. Should be overridden.
         */
        loadData: function() {
            // Override me
        },

        /**
         * Shared Handler for Period Update.
         */
        onPeriodUpdate: function() {
            this.loadData();
        },

        /**
         * Helper to get selected start/end periods.
         * Returns { startYear, startMonth, endYear, endMonth } (Integers)
         */
        _getPeriodRange: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            var res = {
                startYear: 2024, startMonth: 1,
                endYear: 2025, endMonth: 1
            };

            if (oSettingsModel && oSettingsModel.getProperty("/ltm")) {
                var oLtm = oSettingsModel.getProperty("/ltm");
                if (oLtm.start) {
                    res.startYear = parseInt(oLtm.start.year);
                    res.startMonth = parseInt(oLtm.start.month);
                }
                if (oLtm.end) {
                    res.endYear = parseInt(oLtm.end.year);
                    res.endMonth = parseInt(oLtm.end.month);
                }
            }
            return res;
        }

    });
});
