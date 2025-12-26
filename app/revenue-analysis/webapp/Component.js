sap.ui.define(
    ["sap/fe/core/AppComponent"],
    function (Component) {
        "use strict";

        return Component.extend("revenueanalysis.Component", {
            metadata: {
                manifest: "json"
            },

            exit: function() {
                if (Component.prototype.exit) {
                    Component.prototype.exit.apply(this, arguments);
                }
            }
        });
    }
);
