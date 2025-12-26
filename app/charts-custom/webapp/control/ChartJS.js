sap.ui.define([
    "sap/ui/core/Control"
], function (Control) {
    "use strict";

    return Control.extend("chartscustom.control.ChartJS", {
        metadata: {
            properties: {
                "chartType": { type: "string", defaultValue: "bar" },
                "data": { type: "object" },
                "options": { type: "object" }
            }
        },

        init: function () {
            // Initialization code
        },

        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.style("width", "100%");
                oRm.style("height", "300px"); // Default height
                oRm.style("position", "relative");
                oRm.openEnd();
                
                // Canvas
                oRm.openStart("canvas", oControl.getId() + "-canvas");
                oRm.openEnd();
                oRm.close("canvas");

                oRm.close("div");
            }
        },

        onAfterRendering: function () {
            if (typeof Chart === "undefined") {
                console.error("Chart.js is not loaded.");
                return;
            }

            // Cleanup existing chart
            if (this._chart) {
                this._chart.destroy();
            }

            var sId = this.getId() + "-canvas";
            var oCanvas = document.getElementById(sId);

            if (oCanvas) {
                var ctx = oCanvas.getContext("2d");
                this._chart = new Chart(ctx, {
                    type: this.getChartType(),
                    data: this.getData() || { labels: [], datasets: [] },
                    options: this.getOptions() || {}
                });
            }
        },

        setData: function (oData) {
            this.setProperty("data", oData, true); // Suppress invalidation
            
            if (this._chart) {
                this._chart.data = oData;
                this._chart.update();
            } else {
                this.invalidate(); // Re-render if chart instance missing
            }
        },

        setOptions: function (oOptions) {
            this.setProperty("options", oOptions, true);
            
            if (this._chart) {
                this._chart.options = oOptions;
                this._chart.update();
            } else {
                this.invalidate();
            }
        },

        exit: function () {
            if (this._chart) {
                this._chart.destroy();
                this._chart = null;
            }
        }
    });
});
