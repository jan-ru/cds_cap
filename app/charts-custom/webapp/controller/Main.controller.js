sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "shared/model/formatter",
    "shared/model/Constants",
    "shared/model/FinancialService"
], function (Controller, JSONModel, formatter, Constants, FinancialService) {
    "use strict";

    return Controller.extend("chartscustom.controller.Main", {
        formatter: formatter,
        _oFinancialService: null,

        onInit: function() {
            this._oFinancialService = new FinancialService(this.getOwnerComponent());
            
            // Initialize period selection model
            var oSettingsModel = new JSONModel({
                periodA: { year: "2025" },
                periodB: { year: "2024" }
            });
            this.getView().setModel(oSettingsModel, "viewSettings");
            
            this._updateCharts();
        },

        onPeriodChange: function() {
            this._updateCharts();
        },

        _updateCharts: function() {
            var oSettingsModel = this.getView().getModel("viewSettings");
            if (!oSettingsModel) return;

            var oPeriodA = oSettingsModel.getProperty("/periodA");
            var oPeriodB = oSettingsModel.getProperty("/periodB");

            if (!oPeriodA || !oPeriodB) return;

            this._oFinancialService.getSalesTree(oPeriodA, oPeriodB).then(function(oRoot) {
                var aNodes = oRoot.root.nodes;
                
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

                var aRevenueNodes = aNodes.filter(function(n) {
                    return n.name.includes("Revenue");
                });
                
                var aL2Nodes = [];
                aRevenueNodes.forEach(function(oL1) {
                    if (oL1.nodes) {
                        aL2Nodes = aL2Nodes.concat(oL1.nodes);
                    }
                });
                
                var oDataNOI = fnBuildChartData(aL2Nodes, "noiA");
                oDataNOI.datasets[0].label = "Net Operating Income (NOI)";
                
                var oDataWAT = fnBuildChartData(aL2Nodes, "watA");
                oDataWAT.datasets[0].label = "WAT";
                oDataWAT.datasets[0].backgroundColor = "rgba(255, 99, 132, 0.6)";
                oDataWAT.datasets[0].borderColor = "rgba(255, 99, 132, 1)";

                var oDataTotal = fnBuildChartData(aL2Nodes, "amountA");
                oDataTotal.datasets[0].label = "Total Revenue";
                oDataTotal.datasets[0].backgroundColor = "rgba(75, 192, 192, 0.6)";
                oDataTotal.datasets[0].borderColor = "rgba(75, 192, 192, 1)";

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
