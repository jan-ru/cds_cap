sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("balancesheetcustom.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();

            // Initialize tech model
            var oTechModel = new JSONModel({
                dbTable: "FinancialStatements",
                odataEntity: "getFinancialStatementsTree",
                filters: "FStype = 'BAS'"
            });
            this.setModel(oTechModel, "tech");
        }
    });
});
