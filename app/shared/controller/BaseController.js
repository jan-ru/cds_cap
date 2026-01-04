sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "shared/model/Constants",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, Constants, JSONModel) {
    "use strict";

    return Controller.extend("shared.controller.BaseController", {

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
