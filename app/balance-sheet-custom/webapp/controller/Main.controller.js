sap.ui.define([
    "shared/controller/BaseFinancialController",
    "shared/model/Constants"
], function (BaseFinancialController, Constants) {
    "use strict";

    return BaseFinancialController.extend("balancesheetcustom.controller.Main", {

        onInit: function() {
            BaseFinancialController.prototype.onInit.apply(this, arguments);
            this._sFSType = Constants.FSType.BAS; // "BAS"

            // Explicitly initialize settings and load data
            this._initViewSettings();
            this._loadAvailableYears();
            this.loadData();
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
