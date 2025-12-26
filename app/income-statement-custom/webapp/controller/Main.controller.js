sap.ui.define([
    "shared/controller/BaseFinancialController",
    "shared/model/Constants"
], function (BaseFinancialController, Constants) {
    "use strict";

    return BaseFinancialController.extend("incomestatementcustom.controller.Main", {

        onInit: function() {
            BaseFinancialController.prototype.onInit.apply(this, arguments);
            this._sFSType = Constants.FSType.PNL; // "PNL"
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
