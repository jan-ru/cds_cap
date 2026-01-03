sap.ui.define([
    "sap/ui/test/Opa5",
    "financialstatements/test/integration/arrangements/Startup",
    "financialstatements/test/integration/NavigationJourney"
], function (Opa5, Startup) {
    "use strict";

    Opa5.extendConfig({
        arrangements: new Startup(),
        viewNamespace: "financialstatements.view.",
        autoWait: true
    });
});
