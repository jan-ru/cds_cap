sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/GroupHeaderListItem",
    "sap/m/DisplayListItem",
    "sap/m/MessageBox",
    "demo/ui5/model/Constants",
    "sap/ui/model/json/JSONModel"
], function (Controller, GroupHeaderListItem, DisplayListItem, MessageBox, Constants, JSONModel) {
    "use strict";

    return Controller.extend("revenueltmcustom.controller.BaseController", {

        onVersionPress: function(oEvent) {
             if (!this._pVersionDialog) {
                 // Note: We assume the fragment is in view/fragments/
                 this._pVersionDialog = this.loadFragment({
                     name: "demo.ui5.view.fragments.VersionDialog"
                 });
             }
             
            this._pVersionDialog.then(function(oDialog) {
                // Ensure "versionInfo" model is available to the dialog
                // Since this is a child controller of App controller, it should have it.
                var oModel = this.getView().getModel("versionInfo");
                var oData = oModel ? oModel.getData() : {};
                
                // We access the list by ID. Since fragments are loaded with 'this' controller as owner,
                // and 'loadFragment' (if used with ID) prefixes IDs.
                // However, the standard loadFragment without ID argument usually doesn't prefix unless specified?
                // Actually loadFragment returns a Promise resolving to the Root Control.
                // If the dialog ID is "versionDialog" inside fragment, we can get it.
                
                // But the logic in existing controllers used this.byId("versionList").
                // This implies the ID is registered with the view/controller.
                var oList = this.byId("versionList");
                
                if (oList) {
                    oList.removeAllItems();
                    
                    oList.addItem(new GroupHeaderListItem({ title: "App Stack" }));
                    oList.addItem(new DisplayListItem({ label: "App Version", value: oData.appVersion }));
                    oList.addItem(new DisplayListItem({ label: "SAPUI5 Version", value: oData.ui5Version }));
                    oList.addItem(new DisplayListItem({ label: "CAP/CDS Version", value: oData.cdsVersion }));
                    oList.addItem(new DisplayListItem({ label: "Node.js Version", value: oData.nodeVersion }));
                    oList.addItem(new DisplayListItem({ label: "SQLite Version", value: oData.sqliteVersion }));
                    
                    oList.addItem(new GroupHeaderListItem({ title: "Data Pipeline" }));
                    oList.addItem(new DisplayListItem({ label: "dbt Version", value: oData.dbtVersion }));
                    oList.addItem(new DisplayListItem({ label: "DuckDB Version", value: oData.duckdbVersion }));
                    oList.addItem(new DisplayListItem({ label: "Docker Version", value: oData.dockerVersion }));
                }

                oDialog.open();
             }.bind(this));
        },

        onVersionClose: function() {
            var oDialog = this.byId("versionDialog");
            if (oDialog) {
                oDialog.close();
            }
        },

        _fetchData: function(sTechInfoKey, sTargetModelName, fnFetchPromise) {
            // Set Technical Info
            var oTechModel = this.getView().getModel("tech");
            if (oTechModel && Constants.TechInfo[sTechInfoKey]) {
               // We need FinancialService instance? No, just model update.
               // But FinancialService usage for updateTechInfo was:
               // this._oFinancialService.updateTechInfo(Constants.TechInfo[sTechInfoKey], oTechModel);
               // If we don't have _oFinancialService here, we can't call it.
               // Should we move updateTechInfo to BaseController or just set property directly?
               // updateTechInfo is simple: oModel.setProperty("/dbTable", ...);
               // Let's implement simple update here to avoid Service dependency in Base.
               var oInfo = Constants.TechInfo[sTechInfoKey];
               oTechModel.setProperty("/dbTable", oInfo.dbTable);
               oTechModel.setProperty("/odataEntity", oInfo.odataEntity);
               oTechModel.setProperty("/filters", oInfo.filters);
            }
            
            fnFetchPromise().then(function(oRoot) {
                var oModel = new sap.ui.model.json.JSONModel(oRoot);
                oModel.setSizeLimit(100000);
                this.getView().setModel(oModel, sTargetModelName);
                return oRoot;
            }.bind(this)).catch(this._handleError.bind(this));
        },

        _handleError: function(oError) {
             console.error("Data Fetch Error:", oError);
             MessageBox.error("Failed to fetch data.\n\n" + (oError.message || oError));
        }
    });
});
