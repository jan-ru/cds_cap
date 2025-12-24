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
                showHierarchies: false,
                showImports: false,
                
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
                showSBA: false,

                // Imports
                showDataSources: true,
                showStaging: true,
                showTables: true,
                showDataModel: true,
                showMetrics: true,
                showLog: true
            });
            this.getView().setModel(oAppViewModel, "appView");

            // Attach Route Matched to update button state
            this.getOwnerComponent().getRouter().attachRouteMatched(this.onRouteMatched, this);
        },

        onRouteMatched: function(oEvent) {
            var sRouteName = oEvent.getParameter("name");
            
            // Reset all buttons to Transparent
            this.byId("btnReports").setType("Transparent");
            this.byId("btnHierarchies").setType("Transparent");
            this.byId("btnImports").setType("Transparent");

            // Highlight active button
            switch (sRouteName) {
                case "RouteReports":
                    this.byId("btnReports").setType("Emphasized");
                    break;
                case "RouteHierarchies":
                    this.byId("btnHierarchies").setType("Emphasized");
                    break;
                case "RouteImports":
                    this.byId("btnImports").setType("Emphasized");
                    break;
            }
        },

        onNavToReports: function() {
            this.getOwnerComponent().getRouter().navTo("RouteReports");
        },

        onNavToHierarchies: function() {
            this.getOwnerComponent().getRouter().navTo("RouteHierarchies");
        },

        onNavToImports: function() {
            this.getOwnerComponent().getRouter().navTo("RouteImports");
        },

        onSideNavButtonPress: function() {
            // Publish event to toggle side nav in sub-controllers
            var oBus = this.getOwnerComponent().getEventBus();
            oBus.publish("demo.ui5", "toggleSideNav");
        },

        onUserPress: function(oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oUserPopover) {
                this._oUserPopover = sap.ui.xmlfragment("demo.ui5.view.fragments.UserPopover", this);
                this.getView().addDependent(this._oUserPopover);
            }
            this._oUserPopover.openBy(oButton);
        },

        onUserPopoverClose: function() {
            if (this._oUserPopover) {
                this._oUserPopover.close();
            }
        },

        onSettingsPress: function() {
             if (!this._oSettingsDialog) {
                this._oSettingsDialog = sap.ui.xmlfragment("demo.ui5.view.fragments.SettingsDialog", this);
                this.getView().addDependent(this._oSettingsDialog);
            }
            this._oSettingsDialog.open();
        },

        onCloseSettings: function() {
            if (this._oSettingsDialog) {
                this._oSettingsDialog.close();
            }
        },

        onSaveSettings: function() {
            var oAppViewModel = this.getView().getModel("appView");
            var oVersionModel = this.getView().getModel("versionInfo");
            
            if (!oAppViewModel || !oVersionModel) return;

            var sUser = oVersionModel.getProperty("/currentUser") || "anonymous";
            var sSettings = JSON.stringify(oAppViewModel.getData());

            var oODataModel = this.getOwnerComponent().getModel("odata");
            
            // Call the Action
            var oActionContext = oODataModel.bindContext("/saveSettings(...)");
            oActionContext.setParameter("user", sUser);
            oActionContext.setParameter("settings", sSettings);

            oActionContext.execute().then(function() {
                sap.m.MessageToast.show("Settings saved for " + sUser);
                this.onCloseSettings();
            }.bind(this)).catch(function(oError) {
                console.error("Save failed", oError);
                sap.m.MessageBox.error("Failed to save settings: " + oError.message);
            });
        },

        _loadUserSettings: function(sUser) {
            var oODataModel = this.getOwnerComponent().getModel("odata");
            var sPath = "/UserSettings('" + sUser + "')";
            var oContext = oODataModel.bindContext(sPath);

            oContext.requestObject().then(function(oData) {
                if (oData && oData.settings) {
                    try {
                        var oSettings = JSON.parse(oData.settings);
                        var oAppViewModel = this.getView().getModel("appView");
                        oAppViewModel.setData(oSettings);
                        sap.m.MessageToast.show("Settings loaded for " + sUser);
                    } catch (e) {
                        console.error("Failed to parse user settings", e);
                    }
                }
            }.bind(this)).catch(function(oError) {
                // It's okay if not found, we use defaults
                console.log("No saved settings found for " + sUser);
            });
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

                    // Load Settings using the fetched user
                    this._loadUserSettings(oInfo.currentUser || "anonymous");

                } catch (e) {
                    console.error("Failed to parse AppInfo", e);
                }
            }.bind(this)).catch(function(oError){
                console.error("Version Info Fetch Error:", oError);
            });
        }
    });
});
