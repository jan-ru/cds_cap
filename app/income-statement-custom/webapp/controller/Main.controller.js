sap.ui.define([
    "shared/controller/BaseFinancialController",
    "shared/model/Constants"
], function (BaseFinancialController, Constants) {
    "use strict";

    return BaseFinancialController.extend("incomestatementcustom.controller.Main", {

        onInit: function() {
            BaseFinancialController.prototype.onInit.apply(this, arguments);
            this._sFSType = Constants.FSType.PNL; // "PNL"

            // Delay initialization to ensure fragment is loaded
            setTimeout(function() {
                this._initViewSettings();
                this._loadAvailableYears();
                this.loadData();
            }.bind(this), 100);
        },

        _getDataPromise: function(oPeriodA, oPeriodB) {
            return this._oFinancialService.getFinancialStatementsTree(
                this._sFSType,
                oPeriodA,
                oPeriodB
            );
        }
    });
});
