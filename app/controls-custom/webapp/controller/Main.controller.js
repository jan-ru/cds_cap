sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "shared/model/formatter",
    "shared/model/FinancialService",
    "shared/model/Constants"
], function (Controller, JSONModel, formatter, FinancialService, Constants) {
    "use strict";

    return Controller.extend("controlscustom.controller.Main", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            this._loadControls();
        },

        _loadControls: function() {
            this._oFinancialService.getControlsData().then(function(aData) {
                var aRows = this._oFinancialService.transformControlsData(aData);
                
                var oControlsModel = new JSONModel({
                    rows: aRows
                });
                this.getView().setModel(oControlsModel, "controls");
            }.bind(this)).catch(function(oError) {
                console.error("Error loading controls data:", oError);
            });
        }
    });
});
