sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press"
], function (Opa5, Press) {
	"use strict";

	Opa5.createPageObjects({
		onTheRevenueLTMPage: {
			actions: {
				iPressTheRevenueLTMTab: function () {
					return this.waitFor({
						controlType: "sap.m.IconTabFilter",
                        matchers: function(oControl) {
                            return oControl.getText() === "Revenue LTM";
                        },
						actions: new Press(),
						errorMessage: "Did not find the Revenue LTM tab"
					});
				}
			},
			assertions: {
				iShouldSeeTheTable: function () {
					return this.waitFor({
						id: "idRevenueReportTable", 
                        // Note: We renamed it to idRevenueReportTable in recent steps
						success: function () {
							Opa5.assert.ok(true, "The Revenue LTM table is visible");
						},
						errorMessage: "Did not find the Revenue LTM table"
					});
				},
                iShouldSeeThePeriodSelector: function() {
                    return this.waitFor({
                        controlType: "sap.m.Select",
                        success: function(aSelects) {
                             Opa5.assert.ok(aSelects.length >= 4, "Found Period Selectors");
                        },
                        errorMessage: "No Period Selectors found"
                    });
                }
			}
		}
	});
});
