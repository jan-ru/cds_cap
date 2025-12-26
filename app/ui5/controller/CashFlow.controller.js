sap.ui.define([
    "shared/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "demo/ui5/model/formatter",
    "shared/model/Constants",
    "shared/model/FinancialService",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Constants, FinancialService, MessageBox) {
    "use strict";

    return BaseController.extend("demo.ui5.controller.CashFlow", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            this._loadCashFlow();
        },

        onPeriodUpdate: function() {
            this._loadCashFlow();
        },

        _loadCashFlow: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            var oPeriodA = oSettingsModel ? oSettingsModel.getProperty("/periodA") : null;
            var oPeriodB = oSettingsModel ? oSettingsModel.getProperty("/periodB") : null;

             this._fetchData("CashFlow", "cashFlow", function() {
                 return this._oFinancialService.getCashFlowTree(oPeriodA, oPeriodB);
             }.bind(this));
        },
        
        /**
         * Reuse BaseController _fetchData but we might need specific handling if CashFlow model is structure differently.
         * The View expects 'cashFlow>/root/nodes'.
         * _fetchData sets model 'cashFlow' with oRoot.
         * CashFlow.view.xml fragment likely binds to {cashFlow>/root/nodes}.
         * Let's double check Custom logic if needed.
         */

    });
});