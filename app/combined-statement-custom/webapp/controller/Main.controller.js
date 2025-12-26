sap.ui.define([
    "shared/controller/BaseFinancialController"
], function (BaseFinancialController) {
    "use strict";

    return BaseFinancialController.extend("combinedstatementcustom.controller.Main", {

        onInit: function() {
            BaseFinancialController.prototype.onInit.apply(this, arguments);
            this._sFSType = "COMBINED";
        },

        _getDataPromise: function(oPeriodA, oPeriodB) {
            // Uses different service method for combined statements
            return this._oFinancialService.getCombinedTree(oPeriodA, oPeriodB);
        }
    });
});
