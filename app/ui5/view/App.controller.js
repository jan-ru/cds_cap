sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("demo.ui5.view.App", {
        onInit: function () {
            this._fetchVersionInfo();
            
            // App View Model for UI state
            var oAppViewModel = new sap.ui.model.json.JSONModel({
                // Global
                showHierarchies: true,
                
                // Reports
                showFinance: true,
                showIncome: true,
                showBalanceSheet: true,
                showPivot: true,
                showWorkingCapital: true,
                showCreditors: true,
                showDebtors: true,
                showInventory: true,
                showPeriodComparison: true,
                showCombined: true,
                showSales: true,
                showRevenueLTM: true,
                showCharts: true,
                showControls: true,

                // Hierarchies
                showMainHierarchy: true,
                showGL: true,
                showSCA: true,
                showPGA: false,
                showVFA: false,
                showVOA: false,
                showESL: false,
                showIOA: false,
                showGUA: false,
                showOFA: false,
                showSBA: false
            });
            this.getView().setModel(oAppViewModel, "appView");

            // Attach Route Matched to update button state
            this.getOwnerComponent().getRouter().attachRouteMatched(this.onRouteMatched, this);
        },

        onRouteMatched: function(oEvent) {
            var sRouteName = oEvent.getParameter("name");
            
            // Reset all buttons to Transparent
            this.byId("btnReports").setType("Transparent");

            // Highlight active button
            if (sRouteName === "RouteReports") {
                this.byId("btnReports").setType("Emphasized");
            }
        },

        onNavToReports: function() {
            this.getOwnerComponent().getRouter().navTo("RouteReports");
        },

        onSideNavButtonPress: function() {
            // Publish event to toggle side nav in sub-controllers
            var oBus = this.getOwnerComponent().getEventBus();
            oBus.publish("demo.ui5", "toggleSideNav");
        },

        onToggleTechnicalInfo: function() {
             // For now just log, or implement global technical info toggle
             // We can also publish an event if sub-views need to react
             console.log("Toggle Technical Info");
        },

        _fetchVersionInfo: function() {
            // Use the OData model from the component / manifest
            var oModel = this.getOwnerComponent().getModel("odata");
            if (!oModel) return;

            // Bind to the function import
            var oContext = oModel.bindContext("/getAppInfo(...)");
            
            oContext.execute().then(function() {
                var oResult = oContext.getBoundContext().getObject();
                var sValue = oResult && oResult.value ? oResult.value : oResult;
                
                try {
                    var oInfo = JSON.parse(sValue);
                    
                    // Augment with UI5 version
                    oInfo.ui5Version = sap.ui.version;
                    
                    // Initials
                    if (oInfo.currentUser) {
                        oInfo.userInitials = oInfo.currentUser.substring(0, 2).toUpperCase();
                    } else {
                        oInfo.userInitials = "??";
                    }
                    
                    // Set model on the View (App view propagates to children)
                    var oVersionModel = new sap.ui.model.json.JSONModel(oInfo);
                    this.getView().setModel(oVersionModel, "versionInfo");
                    console.log("App Controller: Version Info Loaded", oInfo);

                } catch (e) {
                    console.error("Failed to parse AppInfo", e);
                }
            }.bind(this)).catch(function(oError){
                console.error("Version Info Fetch Error:", oError);
            });
        }
    });
});
