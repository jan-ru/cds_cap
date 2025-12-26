sap.ui.define(
    ["sap/fe/core/AppComponent"],
    function (Component) {
        "use strict";

        return Component.extend("salesinvoices.Component", {
            metadata: {
                manifest: "json"
            },

            exit: function() {
                // Clean up component properly on exit
                if (Component.prototype.exit) {
                    Component.prototype.exit.apply(this, arguments);
                }
            }
        });
    }
);
