sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/Press"
], function (Opa5, Press) {
    "use strict";

    Opa5.createPageObjects({
        onTheListPage: {
            actions: {},
            assertions: {
                iShouldSeeTheTable: function () {
                    return this.waitFor({
                        id: "fe::table::VFA_SalesInvoice::LineItem",
                        viewName: "sap.fe.templates.ListReport.ListReport",
                        success: function () {
                            Opa5.assert.ok(true, "The Working Capital table is visible");
                        },
                        errorMessage: "Did not find the Working Capital table"
                    });
                }
            }
        }
    });
});
