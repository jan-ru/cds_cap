sap.ui.define(
    ["sap/fe/core/AppComponent"],
    function (Component) {
        "use strict";

        return Component.extend("deliverynotes.Component", {
            metadata: {
                manifest: "json"
            },

            exit: function() {
                // Destroy router to prevent memory leaks
                const oRouter = this.getRouter();
                if (oRouter) {
                    oRouter.destroy();
                }

                // Call parent exit handler
                if (Component.prototype.exit) {
                    Component.prototype.exit.apply(this, arguments);
                }
            }
        });
    }
);
