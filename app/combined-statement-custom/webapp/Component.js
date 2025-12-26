sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("combinedstatementcustom.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();

            // Initialize tech model
            var oTechModel = new JSONModel({
                dbTable: "FinancialStatements",
                odataEntity: "getCombinedTree",
                filters: "Combined PNL + BAS"
            });
            this.setModel(oTechModel, "tech");
        }
    });
});
