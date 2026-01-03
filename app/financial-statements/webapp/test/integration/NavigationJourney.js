/*global QUnit*/
sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/FinancialStatementsList"
], function (opaTest) {
    "use strict";

    QUnit.module("Navigation Journey");

    opaTest("Should see the Financial Statements list", function (Given, When, Then) {
        // Arrangements
        Given.iStartMyApp();

        // Assertions
        Then.onTheListPage.iShouldSeeTheTable();

        // Cleanup
        Then.iTeardownMyApp();
    });
});
