/*global QUnit*/
sap.ui.define([
    "workingcapital/Component"
], function (Component) {
    "use strict";

    QUnit.module("Component", {
        beforeEach: function () {
            this.oComponent = new Component();
        },
        afterEach: function () {
            this.oComponent.destroy();
        }
    });

    QUnit.test("Should instantiate the component", function (assert) {
        assert.ok(this.oComponent, "Component instance created");
    });
});
