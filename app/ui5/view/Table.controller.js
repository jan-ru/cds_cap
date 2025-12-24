sap.ui.define([
    "demo/ui5/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "demo/ui5/model/formatter",
    "demo/ui5/model/Constants",
    "demo/ui5/model/FinancialService",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Constants, FinancialService, MessageBox) {
    "use strict";

    /**
     * @typedef {import("demo/ui5/model/FinancialService")} FinancialService
     */

    return BaseController.extend("demo.ui5.view.Table", {
        formatter: formatter,

        /** @type {FinancialService} */
        _oFinancialService: null,

        onInit: function() {
            // Initialize Service
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            
            // Attach Route Matched to update button state? 
            // Table view is a target, so it might need pattern match if we had parameters.
            // For now just load data.
            
            this._oRouter = this.getOwnerComponent().getRouter();
            
            // Initialize Models
            var oUiModel = new JSONModel({
                busy: false,
                delay: 0,
                layout: "OneColumn"
            });
            this.getView().setModel(oUiModel, "ui");

            var oViewModel = new sap.ui.model.json.JSONModel({
                glTotalDebit: "Loading...",
                glTotalCredit: "Loading...",
                glTotalBalance: "Loading..."
            });
            this.getView().setModel(oViewModel, "view");

            // Subscribe to Global SideNav Toggle
            this.getOwnerComponent().getEventBus().subscribe("demo.ui5", "toggleSideNav", this.onSideNavButtonPress, this);
            
            // Empty models for new tabs
            this.getView().setModel(new JSONModel({ root: {} }), "cashFlow");
            this.getView().setModel(new JSONModel({ root: {} }), "sales");
            this.getView().setModel(new JSONModel({ root: {} }), "debtors");
            this.getView().setModel(new JSONModel({ root: {} }), "debtors");
            this.getView().setModel(new JSONModel({ root: {} }), "creditors");

            
            // Technical Info Model
            this.getView().setModel(new JSONModel({
                dbTable: "Unknown",
                odataEntity: "Unknown",
                filters: "None"
            }), "tech");
            
            
            // View Settings Model (for Period Selection)
            var oSettingsModel = new sap.ui.model.json.JSONModel({
                years: [], // Populated dynamically
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
                },
                showTechnicalInfo: false // Default hidden
            });
            this.getView().setModel(oSettingsModel, "viewSettings");

            // this._fetchGLTotals([]); // Moved to Hierarchies
            // this._fetchPivotData(); // Moved to Pivot Controller
            this._loadYears(); // Load Dynamic Years

            
            // Initial Data Load
            // Financials/CashFlow loaded by their own controllers


        },

        onAfterRendering: function() {
             // GL Table moved to Hierarchies
        },

        onPeriodUpdate: function() {
            this._loadData();
        },

        onToggleTechnicalInfo: function() {
            var oModel = this.getView().getModel("viewSettings");
            var bState = oModel.getProperty("/showTechnicalInfo");
            oModel.setProperty("/showTechnicalInfo", !bState);
        },

        // Controls logic moved to demo.ui5.controller.Controls


        _loadData: function() {
            // ... existing loadData logic
            // Load Financial Statements
            // Financials/CashFlow/Sales/Charts loaded by their own controllers

            // Controls logic moved to demo.ui5.controller.Controls

        },

        _loadYears: function() {
            this._oFinancialService.getAvailableYears().then(function(aYears) {
                var aYearItems = aYears.map(function(sYear) {
                    return { key: sYear, text: sYear };
                });
                
                var oModel = this.getView().getModel("viewSettings");
                oModel.setProperty("/years", aYearItems);
                
                // Set default to latest if not set? 
                // Currently defaults are 2025/2024 hardcoded in init. 
                // We should probably check if current default exists, if not update it.
                var sCurrentA = oModel.getProperty("/periodA/year");
                if (aYears.length > 0 && !aYears.includes(sCurrentA)) {
                     oModel.setProperty("/periodA/year", aYears[0]);
                }
                 var sCurrentB = oModel.getProperty("/periodB/year");
                if (aYears.length > 1 && !aYears.includes(sCurrentB)) {
                     oModel.setProperty("/periodB/year", aYears[1]);
                }

            }.bind(this)).catch(this._handleError.bind(this));
        },



        _fetchData: function(sTechInfoKey, sTargetModelName, fnFetchPromise) {
            // Set Technical Info
            this._oFinancialService.updateTechInfo(Constants.TechInfo[sTechInfoKey], this.getView().getModel("tech"));
            
            fnFetchPromise().then(function(oRoot) {
                var oModel = new sap.ui.model.json.JSONModel(oRoot);
                oModel.setSizeLimit(100000);
                this.getView().setModel(oModel, sTargetModelName);
                
                // Allow chaining
                return oRoot;
            }.bind(this)).catch(this._handleError.bind(this));
        },

        // Sales logic moved to demo.ui5.controller.Sales


        onUserPress: function(oEvent) {
             var oSource = oEvent.getSource();
             var oModel = this.getView().getModel("versionInfo");
             var sUser = oModel ? oModel.getProperty("/currentUser") : "Unknown";
             if (!sUser) sUser = "Unknown";
             
             if (!this._pUserPopover) {
                 this._pUserPopover = this.loadFragment({
                     name: "demo.ui5.view.fragments.UserPopover"
                 });
             }
             
             this._pUserPopover.then(function(oPopover) {
                 var oText = this.byId("userText");
                 if (oText) {
                     oText.setText(sUser);
                 }
                 oPopover.openBy(oSource);
             }.bind(this));
        },

        onUserClose: function() {
            this.byId("userPopover").close();
        },

        // ... rest of file



        // --- General Ledger Handlers Moved to Hierarchies ---

        // Pivot Logic moved to demo.ui5.controller.Pivot



        // --- Export Handlers ---

        onExportSales: function() {
             sap.m.MessageToast.show("Export disabled for Sales Analytics");
        },



        // --- Side Navigation Handlers ---

        onItemSelect: function(oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            
            if (sKey === "version") {
                this.onVersionPress();
                return;
            }

            var oNavContainer = this.byId("pageContainer");
            
            // Map keys to Page IDs
            var mPages = {
                "income": "pageIncome",
                "balanceSheet": "pageBalanceSheet",
                "combined": "pageCombined",
                "cashFlow": "pageCashFlow",
                "pivot": "pagePivot",
                "creditors": "pageCreditors",
                "debtors": "pageDebtors",
                "inventory": "pageInventory",
                "sales": "pageSales",
                "revenueLTM": "pageRevenueLTM",
                "charts": "pageCharts",
                "controls": "pageControls"
            };

            var sPageId = mPages[sKey];
            if (sPageId) {
                oNavContainer.to(this.byId(sPageId));
                
                // RevenueLTM loaded by its own controller


                // Note: Charts update handled by onAfterShow delegate in onInit
            }
        },

        onSideNavButtonPress: function() {
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();
            
            // Toggle
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        _handleError: function(oError) {
            console.error("Data Fetch Error:", oError);
            MessageBox.error("Failed to fetch data. Please check your connection or try again later.\n\n" + (oError.message || oError));
        },

        // --- Chart Handlers ---

        // --- Chart Handlers ---

        // Charts logic moved to demo.ui5.controller.Charts


        // RevenueLTM logic moved to demo.ui5.controller.RevenueLTM

    });
});
