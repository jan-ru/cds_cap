sap.ui.define([
    "sap/ui/test/Opa5",
    "revenueanalysis/test/integration/arrangements/Startup",
    "revenueanalysis/test/integration/NavigationJourney"
], function (Opa5, Startup) {
    "use strict";

    Opa5.extendConfig({
        arrangements: new Startup(),
        viewNamespace: "revenueanalysis.view.",
        autoWait: true
    });
});
