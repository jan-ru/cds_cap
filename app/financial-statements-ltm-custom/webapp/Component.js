sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("financialstatementsltmcustom.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            
            // Initialize router
            this.getRouter().initialize();
            
            // Set tech info model
            var oTechModel = new JSONModel({
                dbTable: "demo.Pivot",
                odataEntity: "getPivotTree Function",
                filters: "Dynamic Period Range"
            });
            this.setModel(oTechModel, "tech");
        }
    });
});
