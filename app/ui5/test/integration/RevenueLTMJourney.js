sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/RevenueLTM"
], function (opaTest) {
	"use strict";

	QUnit.module("Revenue LTM Journey");

	opaTest("Should see the Revenue LTM table", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyAppInAFrame("../../index.html");

		// Actions
		When.onTheRevenueLTMPage.iPressTheRevenueLTMTab();

		// Assertions
		Then.onTheRevenueLTMPage.iShouldSeeTheTable();
        Then.onTheRevenueLTMPage.iShouldSeeThePeriodSelector();

		// Cleanup
		Then.iTeardownMyApp();
	});
});
