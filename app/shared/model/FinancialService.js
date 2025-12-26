sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "shared/model/Constants",
    "shared/utils/json-helper"
], function(BaseObject, Filter, FilterOperator, Sorter, JSONModel, Constants, JSONHelper) {
    "use strict";

    return BaseObject.extend("shared.model.FinancialService", {

        constructor: function(oComponent) {
            this._oComponent = oComponent;
            this._oODataModel = oComponent.getModel("odata");
            this._oTechModel = oComponent.getModel("tech") || new JSONModel(); // Fallback if not init ?? usually Controller inits
            // Actually, we should probably let the controller pass the models or update them here if we have access.
            // But usually Services return Data/Promises and Controller updates View Models.
            // OR Service can manage its own state.
            // For now, let's keep it simple: Service fetches Data, returns Promise. Controller updates View Models.
            // EXCEPT for Technical Info, which is a global state side-effect.
        },

        /**
         * Updates the global 'tech' model with metadata for the current context.
         * @param {object} oTechConfig Constants.TechInfo entry
         * @param {sap.ui.model.json.JSONModel} oTechModel
         */
        updateTechInfo: function(oTechConfig, oTechModel) {
             if (oTechModel && oTechConfig) {
                 oTechModel.setData(oTechConfig);
             }
        },

        /**
         * Fetches Financial Statements (PNL or BAS) and builds the tree.
         * @param {string} sFStype
         * @param {object} oPeriodA
         * @param {object} oPeriodB
         * @returns {Promise<object>} The root node of the tree.
         */
        getFinancialStatementsTree: function(sFStype, oPeriodA, oPeriodB) {
            // New Implementation using OData Function
            var oFunction = this._oODataModel.bindContext("/getFinancialStatementsTree(...)");
            oFunction.setParameter("FStype", sFStype);
            oFunction.setParameter("PeriodAYear", parseInt(oPeriodA.year));
            oFunction.setParameter("PeriodAMonthFrom", parseInt(oPeriodA.monthFrom));
            oFunction.setParameter("PeriodAMonthTo", parseInt(oPeriodA.monthTo));
            oFunction.setParameter("PeriodBYear", parseInt(oPeriodB.year));
            oFunction.setParameter("PeriodBMonthFrom", parseInt(oPeriodB.monthFrom));
            oFunction.setParameter("PeriodBMonthTo", parseInt(oPeriodB.monthTo));

            // Execute function
            return oFunction.execute().then(function() {
                var oContext = oFunction.getBoundContext();
                var sResult = oContext.getObject().value;
                return JSONHelper.safeParse(sResult, {});
            });
        },

        getSalesTree: function(oPeriodA, oPeriodB) {
            var oFunction = this._oODataModel.bindContext("/getSalesTree(...)");
            oFunction.setParameter("PeriodAYear", parseInt(oPeriodA.year));
            oFunction.setParameter("PeriodAMonthFrom", parseInt(oPeriodA.monthFrom));
            oFunction.setParameter("PeriodAMonthTo", parseInt(oPeriodA.monthTo));
            oFunction.setParameter("PeriodBYear", parseInt(oPeriodB.year));
            oFunction.setParameter("PeriodBMonthFrom", parseInt(oPeriodB.monthFrom));
            oFunction.setParameter("PeriodBMonthTo", parseInt(oPeriodB.monthTo));

            // Execute function
            return oFunction.execute().then(function() {
                var oContext = oFunction.getBoundContext();
                var sResult = oContext.getObject().value;
                return JSONHelper.safeParse(sResult, {});
            });
        },

        getCombinedTree: function(oPeriodA, oPeriodB) {
            var oFunction = this._oODataModel.bindContext("/getCombinedTree(...)");
            oFunction.setParameter("PeriodAYear", parseInt(oPeriodA.year));
            oFunction.setParameter("PeriodAMonthFrom", parseInt(oPeriodA.monthFrom));
            oFunction.setParameter("PeriodAMonthTo", parseInt(oPeriodA.monthTo));
            oFunction.setParameter("PeriodBYear", parseInt(oPeriodB.year));
            oFunction.setParameter("PeriodBMonthFrom", parseInt(oPeriodB.monthFrom));
            oFunction.setParameter("PeriodBMonthTo", parseInt(oPeriodB.monthTo));

            return oFunction.execute().then(function() {
                var oContext = oFunction.getBoundContext();
                var sResult = oContext.getObject().value;
                return JSONHelper.safeParse(sResult, {});
            });
        },

        transformControlsData: function(aData) {
            var aRows = [];
            if (aData.length > 0) {
                var currentYear = aData[0].PeriodYear;

                var createTotal = function(year) {
                    return {
                        PeriodYear: year,
                        PeriodMonth: "Total",
                        BasTotalDebit: 0,
                        BasTotalCredit: 0,
                        BasTotalBalance: 0,
                        PnlTotalDebit: 0,
                        PnlTotalCredit: 0,
                        PnlTotalBalance: 0,
                        isTotal: true
                    };
                };

                var currentTotal = createTotal(currentYear);

                aData.forEach(function(item) {
                    if (item.PeriodYear !== currentYear) {
                        aRows.push(currentTotal);
                        aRows.push({ isSpacer: true });
                        currentYear = item.PeriodYear;
                        currentTotal = createTotal(currentYear);
                    }
                    currentTotal.BasTotalDebit += item.BasTotalDebit || 0;
                    currentTotal.BasTotalCredit += item.BasTotalCredit || 0;
                    currentTotal.BasTotalBalance += item.BasTotalBalance || 0;
                    currentTotal.PnlTotalDebit += item.PnlTotalDebit || 0;
                    currentTotal.PnlTotalCredit += item.PnlTotalCredit || 0;
                    currentTotal.PnlTotalBalance += item.PnlTotalBalance || 0;
                    aRows.push(item);
                });
                aRows.push(currentTotal);
                aRows.push({ isSpacer: true });
            }
            return aRows;
        },

        /**
         * Fetches Controls Data.
         * @returns {Promise<Array>} Raw array of control rows.
         */
        getControlsData: function() {
            var sPath = Constants.EntityPaths.Controls;
            var aSorters = [new Sorter(Constants.SortConfig.Controls, false)];

            return this._fetchList(sPath, null, aSorters);
        },

        /**
         * Fetches Pivot Data.
         * @returns {Promise<Array>} Raw Pivot rows.
         */
        getPivotData: function() {
            var sPath = Constants.EntityPaths.Pivot;
            var mParams = {
                $orderby: Constants.SortConfig.Pivot.join(",")
            };
            return this._fetchList(sPath, null, null, null, mParams);
        },

        /**
         * Fetches GL Totals.
         * @returns {Promise<object>} Object containing TotalDebit, TotalCredit, TotalBalance.
         */
        getGLTotals: function(aFilters) {
            var sPath = Constants.EntityPaths.Dump;

            // Build the $apply string manually: filter(...) / aggregate(...)
            // This ensures filters are applied BEFORE aggregation.
            var sFilter = this._convertFiltersToExpr(aFilters);
            var sAggregate = "aggregate(Debet with sum as TotalDebit, Credit with sum as TotalCredit, Saldo with sum as TotalBalance)";
            var sApply = sFilter ? "filter(" + sFilter + ")/" + sAggregate : sAggregate;

            // Note: We pass 'null' for filters to bindList because they are already in $apply
            var mParams = {
                 $apply: sApply
            };

            var oListBinding = this._oODataModel.bindList(sPath, null, null, [], mParams);
            return oListBinding.requestContexts().then(function(aContexts) {
                 if (aContexts.length > 0) {
                     return aContexts[0].getObject();
                 }
                 return null;
            });
        },

        _convertFiltersToExpr: function(aFilters) {
             if (!aFilters || aFilters.length === 0) {
                 return "";
             }

             var aExprs = [];
             aFilters.forEach(function(oFilter) {
                 var sPath = oFilter.getPath();
                 var sOp = oFilter.getOperator();
                 var vValue = oFilter.getValue1();
                 // Note: We assume simple filters here.
                 // Complex filters (Multi, Ranges) would require recursion.

                 // Handle Types
                 // Ideally we'd check metadata, but for now we try to guess or handle known Integer fields
                 var bIsString = true;
                 // Columns known to be Integer/Date-ish
                 if (["PeriodYear", "PeriodSortKey", "Boekingsnummer"].indexOf(sPath) > -1) {
                     bIsString = false;
                 }

                 var sValStr = bIsString ? "'" + vValue + "'" : vValue;

                 // Handle Case Insensitive for Strings if operator is Contains or EQ
                 // Usually CAP / SQLite is case insensitive naturally or needs tolower()

                 if (sOp === "Contains") {
                     aExprs.push("contains(" + sPath + "," + sValStr + ")");
                 } else if (sOp === "EQ") {
                     aExprs.push(sPath + " eq " + sValStr);
                 } else if (sOp === "GT") {
                     aExprs.push(sPath + " gt " + sValStr);
                 } else if (sOp === "LT") {
                     aExprs.push(sPath + " lt " + sValStr);
                 } else if (sOp === "GE") {
                     aExprs.push(sPath + " ge " + sValStr);
                 } else if (sOp === "LE") {
                     aExprs.push(sPath + " le " + sValStr);
                 }
             });

             return aExprs.join(" and ");
        },

        /**
         * Fetches Pivot Tree.
         * @returns {Promise<object>} Pivot Tree Root
         */
        getPivotTree: function(sStartYear, sStartMonth, sEndYear, sEndMonth) {
            var oFunction = this._oODataModel.bindContext("/getPivotTree(...)");
            if (sStartYear) oFunction.setParameter("PeriodAYear", parseInt(sStartYear));
            if (sStartMonth) oFunction.setParameter("PeriodAMonth", parseInt(sStartMonth));
            if (sEndYear) oFunction.setParameter("PeriodBYear", parseInt(sEndYear));
            if (sEndMonth) oFunction.setParameter("PeriodBMonth", parseInt(sEndMonth));

            return oFunction.execute().then(function() {
                var oContext = oFunction.getBoundContext();
                var sResult = oContext.getObject().value;
                return JSONHelper.safeParse(sResult, {});
            });
        },




        getRevenueLTM: function(sStartYear, sStartMonth, sEndYear, sEndMonth) {
            var oFunction = this._oODataModel.bindContext("/getRevenueTree(...)");
            if (sStartYear) oFunction.setParameter("PeriodAYear", parseInt(sStartYear));
            if (sStartMonth) oFunction.setParameter("PeriodAMonth", parseInt(sStartMonth));
            if (sEndYear) oFunction.setParameter("PeriodBYear", parseInt(sEndYear));
            if (sEndMonth) oFunction.setParameter("PeriodBMonth", parseInt(sEndMonth));

            return oFunction.execute().then(function() {
                var oContext = oFunction.getBoundContext();
                var sResult = oContext.getObject().value;
                return JSONHelper.safeParse(sResult, {});
            });
        },


        /**
         * Fetches available distinct years from the data.
         * @returns {Promise<Array>} Array of years (e.g. ["2024", "2025"])
         */
        getAvailableYears: function() {
            var mParams = {
                $apply: "groupby((PeriodYear))"
            };
            // Use Dump as source of truth
            return this._fetchList(Constants.EntityPaths.Dump, null, null, [], mParams).then(function(aData) {
                var aYears = aData.map(function(item) {
                     return item.PeriodYear.toString();
                });
                // Unique and Sort Descending
                aYears = [...new Set(aYears)].sort().reverse();
                return aYears;
            });
        },

        /**
         * Helper to fetch list data.
         */
        _fetchList: function(sPath, oContext, aSorters, aFilters, mParameters) {
            var oListBinding = this._oODataModel.bindList(sPath, oContext, aSorters, aFilters, mParameters);
            return oListBinding.requestContexts(0, 100000).then(function(aContexts) { // Use large batch
                return aContexts.map(function(oContext) {
                    return oContext.getObject();
                });
            });
        }

    });
});
