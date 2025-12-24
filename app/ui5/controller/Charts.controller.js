sap.ui.define([
    "demo/ui5/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "demo/ui5/model/formatter",
    "demo/ui5/model/Constants",
    "demo/ui5/model/FinancialService",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, Constants, FinancialService, MessageBox) {
    "use strict";

    return BaseController.extend("demo.ui5.controller.Charts", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            // Fetch logic moved to onBeforeRendering to safe-guard against missing models
        },

        onBeforeRendering: function() {
             // Only auto-load if not already loaded? Or always update?
             // Charts need data.
             if (!this._bInitialized) {
                 this._updateCharts();
                 this._bInitialized = true;
             }
        },

        onPeriodUpdate: function() {
            this._updateCharts();
        },

        _updateCharts: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) return;

            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");

            if (!oPeriodA || !oPeriodB) return;

             // Charts usage of getSalesTree
             this._oFinancialService.getSalesTree(oPeriodA, oPeriodB).then(function(oRoot) {
                 var aNodes = oRoot.root.nodes;
                 
                 // Helper to build chart data from a list of nodes (L2 items)
                 var fnBuildChartData = function(aSourceNodes, sValueProp) {
                     var aLabels = [];
                     var aValues = [];
                     
                     aSourceNodes.forEach(function(node) {
                         aLabels.push(node.name);
                         aValues.push(node[sValueProp]);
                     });
                     
                     return {
                         labels: aLabels,
                         datasets: [{
                             label: "Amount",
                             data: aValues,
                             backgroundColor: "rgba(54, 162, 235, 0.6)",
                             borderColor: "rgba(54, 162, 235, 1)",
                             borderWidth: 1
                         }]
                     };
                 };

                 // Find 'Revenue (Recurring)' node
                 // Note: Name comes from Constants.Headers.RevenueRecurring
                 // We can also find by checking if keys are '8xxx' but TreeBuilder groups them.
                 // Let's iterate and collect all L2 nodes from "Revenue" groups.
                 
                 var aRevenueNodes = aNodes.filter(function(n) {
                     return n.name.includes("Revenue"); // Matches "Revenue (Recurring)" and "Revenue (One-Off)"
                 });
                 
                 // Flatten L2 nodes from all Revenue groups
                 var aL2Nodes = [];
                 aRevenueNodes.forEach(function(oL1) {
                     if (oL1.nodes) {
                         aL2Nodes = aL2Nodes.concat(oL1.nodes);
                     }
                 });
                 
                 // Sort by map key or name? They are already sorted by Builder.
                 
                 // Build Data Sets
                 // 1. NOI (noiA)
                 var oDataNOI = fnBuildChartData(aL2Nodes, "noiA");
                 oDataNOI.datasets[0].label = "Net Operating Income (NOI)";
                 
                 // 2. WAT (watA)
                 var oDataWAT = fnBuildChartData(aL2Nodes, "watA");
                 oDataWAT.datasets[0].label = "WAT";
                 oDataWAT.datasets[0].backgroundColor = "rgba(255, 99, 132, 0.6)";
                 oDataWAT.datasets[0].borderColor = "rgba(255, 99, 132, 1)";

                 // 3. Total (amountA = noiA + watA usually)
                 var oDataTotal = fnBuildChartData(aL2Nodes, "amountA");
                 oDataTotal.datasets[0].label = "Total Revenue";
                 oDataTotal.datasets[0].backgroundColor = "rgba(75, 192, 192, 0.6)";
                 oDataTotal.datasets[0].borderColor = "rgba(75, 192, 192, 1)";

                 // Options
                 var oOptions = {
                     responsive: true,
                     maintainAspectRatio: false,
                     scales: {
                         y: {
                             beginAtZero: true,
                             ticks: {
                                 callback: function(value) {
                                     return formatter.formatCurrency(value);
                                 }
                             }
                         }
                     },
                     plugins: {
                         tooltip: {
                             callbacks: {
                                 label: function(context) {
                                     var label = context.dataset.label || '';
                                     if (label) {
                                         label += ': ';
                                     }
                                     if (context.parsed.y !== null) {
                                         label += formatter.formatCurrency(context.parsed.y);
                                     }
                                     return label;
                                 }
                             }
                         }
                     }
                 };

                 var oModel = new JSONModel({
                     revenueNOI: oDataNOI,
                     revenueWAT: oDataWAT,
                     revenueTotal: oDataTotal,
                     options: oOptions
                 });
                 this.getView().setModel(oModel, "charts");

             }.bind(this)).catch(function(err) {
                 console.error("Charts Update Failed", err);
             });
        }

    });
});