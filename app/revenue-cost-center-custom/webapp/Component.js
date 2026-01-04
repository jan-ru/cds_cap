sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("revenuecostcentercustom.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
        },

        exit: function () {
            // Destroy router to prevent memory leaks
            const oRouter = this.getRouter();
            if (oRouter) {
                oRouter.destroy();
            }

            // Call parent exit handler
            if (UIComponent.prototype.exit) {
                UIComponent.prototype.exit.apply(this, arguments);
            }
        }
    });
});
