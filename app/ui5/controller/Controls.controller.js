sap.ui.define([
    "demo/ui5/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "demo/ui5/model/formatter",
    "demo/ui5/model/FinancialService",
    "demo/ui5/model/Constants",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, FinancialService, Constants, MessageBox) {
    "use strict";

    return BaseController.extend("demo.ui5.controller.Controls", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            // _loadControls moved to onBeforeRendering
        },

        onBeforeRendering: function() {
             if (!this._bInitialized) {
                 this._loadControls();
                 this._bInitialized = true;
             }
        },

        onPeriodUpdate: function() {
             this._loadControls();
        },

        _loadControls: function() {
            // Set Technical Info
            if (Constants.TechInfo && Constants.TechInfo.Controls) {
                 this._oFinancialService.updateTechInfo(Constants.TechInfo.Controls, this.getView().getModel("tech"));
            }

            this._oFinancialService.getControlsData().then(function(aData) {
                var aRows = this._oFinancialService.transformControlsData(aData);
                
                var oControlsModel = new JSONModel({
                    rows: aRows
                });
                this.getView().setModel(oControlsModel, "controls");
            }.bind(this)).catch(this._handleError.bind(this));
        }

    });
});