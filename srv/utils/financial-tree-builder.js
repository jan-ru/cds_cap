const Constants = {

    SortConfig: {
        PNL: ["8-Recurring", "8-OneOff", "7", "4", "9"],
        SALES: ["8-Recurring", "8-OneOff", "7", "4", "9"],
        BAS: "ASC",
        COMBINED: ["8-Recurring", "8-OneOff", "7", "4", "9"]
    },
    Spacers: {
        PNL: ["7"],
        COMBINED: ["9"]
    },
    Headers: {
        NetIncome: "Net Income",
        BalanceSheet: "Balance sheet",
        IncomeStatement: "Income statement",
        CashFlow: "Cash Flow",
        GrossMargin: "Gross Margin (8000 + 7000)",
        TotalRevenue: "Total Revenue",
        GrandTotal: "Grand Total",
        CostOfSales: "Cost of Sales",
        RevenueRecurring: "Revenue (Recurring)",
        RevenueOneOff: "Revenue (One-Off)"
    },
    LabelOverrides: {
        "02": "02xx Fixed Assets",
        "06": "06xx Equity",
        "11": "11xx Cash & Cash Equivalents",
        "15": "15xx Taxes",
        "30": "30xx Inventories",
        "40": "40xx Operating Costs",
        "41": "41xx Personel Costs",
        "42": "42xx Housing Costs",
        "43": "43xx Office Costs",
        "44": "44xx Car Costs",
        "45": "45xx Sales Costs",
        "46": "46xx General Costs",
        "70": "70xx Cost of Sales",
        "80": "80xx Revenue Recurring",
        "84": "84xx Revenue One-Off",
        "85": "85xx Revenue One-Off",
        "86": "86xx Revenue Recurring",
        "87": "87xx Revenue Recurring",
        "88": "88xx Revenue Recurring",
        "90": "90xx Interest Income",
        "91": "91xx Interest Expense",
        "93": "93xx Exchange Rate Differences"
    }
};

// Helper to create a new node
var createNode = function(name, level) {
    return {
        name: name,
        level: level,
        amountA: 0,
        amountB: 0,
        watA: 0,
        noiA: 0,
        watB: 0,
        noiB: 0,
        // Computed Total (WAT + NOI)
        wnA: 0,
        wnB: 0,
        diffAbs: 0,
        diffPrc: 0,
        isBold: false
    };
};

// Helper to create spacer
var createSpacer = function() {
    var oSpacer = createNode("", 1);
    oSpacer.amountA = null;
    oSpacer.amountB = null;
    oSpacer.watA = null;
    oSpacer.noiA = null;
    oSpacer.watB = null;
    oSpacer.noiB = null;
    oSpacer.wnA = null;
    oSpacer.wnB = null;
    oSpacer.diffAbs = null;
    oSpacer.diffPrc = null;
    return oSpacer;
};

// Helper to check period
var checkPeriod = function(iYear, iMonth, oPeriod) {
    if (!oPeriod) return false;
    if (String(iYear) !== String(oPeriod.year)) return false;
    
    var iFrom = parseInt(oPeriod.monthFrom, 10);
    var iTo = parseInt(oPeriod.monthTo, 10);
    var iMonthInt = parseInt(iMonth, 10);
    
    if (iMonthInt < iFrom) return false;
    if (iMonthInt > iTo) return false;
    return true;
};

// Helper to calc diffs and totals
var calcDiffs = function(node) {
    // Round Inputs First? Or just formatting? 
    // Best to round cumulative values to avoid float artifacts
    node.watA = parseFloat((node.watA || 0).toFixed(2));
    node.noiA = parseFloat((node.noiA || 0).toFixed(2));
    node.watB = parseFloat((node.watB || 0).toFixed(2));
    node.noiB = parseFloat((node.noiB || 0).toFixed(2));
    
    // Calculate Computed Totals (WAT + NOI)
    node.wnA = parseFloat((node.watA + node.noiA).toFixed(2));
    node.wnB = parseFloat((node.watB + node.noiB).toFixed(2));
    
    // Total Amount A/B should match wnA/wnB if filtering matches completely
    // But keeping original amountA logic for backward compatibility / correctness if other Codes exist
    // Actually, amountA/B assumes sum of everything.
    node.amountA = parseFloat((node.amountA || 0).toFixed(2));
    node.amountB = parseFloat((node.amountB || 0).toFixed(2));

    node.diffAbs = node.amountB - node.amountA;
    if (node.amountA !== 0) {
        node.diffPrc = (node.diffAbs / Math.abs(node.amountA)) * 100;
    } else {
        node.diffPrc = 0; 
    }
    
    node.diffAbs = parseFloat(node.diffAbs.toFixed(2));
};

// Helper: Add Net Income and Balance Sheet Header
var addNetIncomeAndBalanceSheetHeader = function(aL1Nodes, sL1Key, sNextKey) {
     var bIsPNL = Constants.SortConfig.COMBINED.includes(sL1Key);
     var bNextIsBAS = sNextKey && !Constants.SortConfig.COMBINED.includes(sNextKey);

     if (bIsPNL && (!sNextKey || bNextIsBAS)) {
          var oNetIncome = createNode(Constants.Headers.NetIncome, 1);
          oNetIncome.isBold = true;
          aL1Nodes.forEach(function(node) {
              var sStartChar = node.name.substring(0, 1);
              if (["8", "7", "4", "9"].includes(sStartChar)) {
                  oNetIncome.amountA += node.amountA;
                  oNetIncome.amountB += node.amountB;
                  oNetIncome.watA += node.watA;
                  oNetIncome.noiA += node.noiA;
                  oNetIncome.watB += node.watB;
                  oNetIncome.noiB += node.noiB;
              }
          });
          calcDiffs(oNetIncome);
          aL1Nodes.push(oNetIncome);

          aL1Nodes.push(createSpacer());
          aL1Nodes.push(createSpacer());
          var oHeaderBAS = createNode(Constants.Headers.BalanceSheet, 1);
          oHeaderBAS.isBold = true;
          oHeaderBAS.amountA = null;
          oHeaderBAS.amountB = null;
          aL1Nodes.push(oHeaderBAS);
     }
};

// Helper: Add Gross Margin
var addGrossMargin = function(aL1Nodes) {
     var oNode7 = aL1Nodes.find(n => n.name.startsWith("7"));

     // Check for any revenue node (starts with 8)
     var aRevenueNodes = aL1Nodes.filter(n => n.name.startsWith("8")); 

     if (aRevenueNodes.length > 0 || oNode7) {
         var oGrossMargin = createNode(Constants.Headers.GrossMargin, 1);
         oGrossMargin.isBold = true; 
         
         aRevenueNodes.forEach(function(oNode) {
             oGrossMargin.amountA += oNode.amountA;
             oGrossMargin.amountB += oNode.amountB;
             oGrossMargin.watA += oNode.watA;
             oGrossMargin.noiA += oNode.noiA;
             oGrossMargin.watB += oNode.watB;
             oGrossMargin.noiB += oNode.noiB;
         });
         
         if (oNode7) {
             oGrossMargin.amountA += oNode7.amountA;
             oGrossMargin.amountB += oNode7.amountB;
             oGrossMargin.watA += oNode7.watA;
             oGrossMargin.noiA += oNode7.noiA;
             oGrossMargin.watB += oNode7.watB;
             oGrossMargin.noiB += oNode7.noiB;
         }
         calcDiffs(oGrossMargin);

         var iIdx7 = aL1Nodes.findIndex(n => n.name.startsWith("7"));
         if (iIdx7 > -1) {
             aL1Nodes.splice(iIdx7 + 1, 0, oGrossMargin);
         } else {
             aL1Nodes.push(oGrossMargin);
         }
     }
};

// Helper: Add Total Revenue (Combined View)
var addTotalRevenue = function(aL1Nodes) {
     var aRevenueNodes = aL1Nodes.filter(n => n.name.startsWith("8")); 

     if (aRevenueNodes.length > 0) {
         var oTotalRevenue = createNode(Constants.Headers.TotalRevenue, 1);
         oTotalRevenue.isBold = true; 
         
         aRevenueNodes.forEach(function(oNode) {
             oTotalRevenue.amountA += oNode.amountA;
             oTotalRevenue.amountB += oNode.amountB;
             oTotalRevenue.watA += oNode.watA;
             oTotalRevenue.noiA += oNode.noiA;
             oTotalRevenue.watB += oNode.watB;
             oTotalRevenue.noiB += oNode.noiB;
         });
         calcDiffs(oTotalRevenue);

         // Insert before 7xxx
         var iIdx7 = aL1Nodes.findIndex(n => n.name.startsWith("7"));
         if (iIdx7 > -1) {
             aL1Nodes.splice(iIdx7, 0, oTotalRevenue);
             aL1Nodes.splice(iIdx7 + 1, 0, createSpacer()); // Spacer after Total Revenue
         } else {
             // Fallback if no 7xxx
             aL1Nodes.push(oTotalRevenue);
         }
     }
};

// Helper: Add Grand Total
var addGrandTotal = function(aL1Nodes, sFStype) {
    if (aL1Nodes.length > 0) {
        var sTotalLabel = Constants.Headers.GrandTotal;
        if (sFStype === 'PNL') {
            sTotalLabel = Constants.Headers.NetIncome;
        } else if (sFStype === 'SALES') {
            sTotalLabel = Constants.Headers.TotalRevenue;
        }
        var oTotalNode = createNode(sTotalLabel, 1);
        oTotalNode.isBold = true; 
        aL1Nodes.forEach(function(node) {
            if (node.name !== Constants.Headers.GrossMargin && node.name !== "") {
                 oTotalNode.amountA += node.amountA;
                 oTotalNode.amountB += node.amountB;
                 oTotalNode.watA += node.watA;
                 oTotalNode.noiA += node.noiA;
                 oTotalNode.watB += node.watB;
                 oTotalNode.noiB += node.noiB;
            }
        });
        calcDiffs(oTotalNode);
        aL1Nodes.push(oTotalNode);
    }
};

// Helper: Add Cash Flow
var addCashFlow = function(aL1Nodes) {
     aL1Nodes.push(createSpacer());
     aL1Nodes.push(createSpacer());
     var oHeaderCF = createNode(Constants.Headers.CashFlow, 1);
     oHeaderCF.isBold = true;
     oHeaderCF.amountA = null;
     oHeaderCF.amountB = null;
     aL1Nodes.push(oHeaderCF);
};

module.exports = {
    /**
     * Builds a hierarchical tree from flat data.
     */
    build: function(aData, sFStype, oPeriodA, oPeriodB, mOptions) {
        // Determine Config based on Type
        const vSortConfig = (['PNL', 'COMBINED', 'SALES'].includes(sFStype)) ? Constants.SortConfig[sFStype] : Constants.SortConfig.BAS;
        const aSpacerKeys = (['PNL', 'COMBINED', 'SALES'].includes(sFStype)) ? Constants.Spacers[sFStype] : null;
        const bIncludeGrossMargin = (mOptions && mOptions.includeGrossMargin !== undefined) ? mOptions.includeGrossMargin : true;

        var oRoot = { root: { nodes: [] } };
        
        var mGroups = {}; 
        
        aData.forEach(function(item) {
            var sCode = item.CodeGrootboekrekening.toString();
            var iYear = item.PeriodYear; 
            var iMonth = item.ReportingPeriod || 0; 
            var fAmount = parseFloat(parseFloat(item.DisplayAmount || 0).toFixed(2));
            var sCostCenter = item.Code1; // NEW: Cost Center

            var bInA = checkPeriod(iYear, iMonth, oPeriodA);
            var bInB = checkPeriod(iYear, iMonth, oPeriodB);

            if (!bInA && !bInB) return; 

            // Keys
            var sL1Key = sCode.substring(0, 1); 
            var sL2Key = sCode.substring(0, 2);

            // Revenue Split Logic (8xxx)
            if (sL1Key === "8") {
                 // One-offs: 84, 85
                 // Recurring: 80, 86, 87, 88 (and others)
                 if (["84", "85"].includes(sL2Key)) {
                     sL1Key = "8-OneOff";
                 } else {
                     sL1Key = "8-Recurring";
                 }
            }

            // L1 Node
            if (!mGroups[sL1Key]) {
                var sL1Label = sL1Key + "xxx Series";
                if (sL1Key === "7") sL1Label = Constants.Headers.CostOfSales;
                if (sL1Key === "8-Recurring") sL1Label = Constants.Headers.RevenueRecurring;
                if (sL1Key === "8-OneOff") sL1Label = Constants.Headers.RevenueOneOff;

                mGroups[sL1Key] = Object.assign(createNode(sL1Label, 1), { nodesMap: {} });
            }
            var oL1 = mGroups[sL1Key];

            if (!oL1.nodesMap[sL2Key]) {
                var sL2Label = sL2Key + "xx Group"; // Default
                if (Constants.LabelOverrides[sL2Key]) {
                    sL2Label = Constants.LabelOverrides[sL2Key];
                }
                oL1.nodesMap[sL2Key] = Object.assign(createNode(sL2Label, 2), { nodesList: [] });
            }
            var oL2 = oL1.nodesMap[sL2Key];

            // Helper to add amounts
            var addAmounts = function(node) {
                if (bInA) {
                    node.amountA += fAmount;
                    if (sCostCenter === 'WAT') node.watA += fAmount;
                    if (sCostCenter === 'NOI') node.noiA += fAmount;
                }
                if (bInB) {
                    node.amountB += fAmount;
                    if (sCostCenter === 'WAT') node.watB += fAmount;
                    if (sCostCenter === 'NOI') node.noiB += fAmount;
                }
            };
            
            addAmounts(oL1);
            addAmounts(oL2);

            // Leaf Logic
            var oLeaf = oL2.nodesList.find(n => n.name.startsWith(sCode));
            if (!oLeaf) {
                oLeaf = createNode(sCode + " - " + item.NaamGrootboekrekening, 3);
                oL2.nodesList.push(oLeaf);
            }
            addAmounts(oLeaf);
        });

        // Convert Maps to Arrays and Sort
        var aL1Nodes = [];
        var aL1Keys = Object.keys(mGroups);

        // Sorting Logic
        if (Array.isArray(vSortConfig)) {
            aL1Keys.sort(function(a, b) {
                var iA = vSortConfig.indexOf(a);
                var iB = vSortConfig.indexOf(b);
                if (iA === -1) iA = 999;
                if (iB === -1) iB = 999;
                
                // Fallback to alpha sort for items not in the config (e.g. BAS items in COMBINED view)
                if (iA === 999 && iB === 999) {
                    return a.localeCompare(b);
                }
                return iA - iB;
            });
        } else if (vSortConfig === "DESC") {
            aL1Keys.sort().reverse();
        } else {
            aL1Keys.sort();
        }

        // Header for Combined - Income Statement
        if (sFStype === 'COMBINED') {
            var oHeaderPNL = createNode(Constants.Headers.IncomeStatement, 1);
            oHeaderPNL.isBold = true;
            // Suppress zeros
            oHeaderPNL.amountA = null;
            oHeaderPNL.amountB = null;
            // Spacers for new cols?
            aL1Nodes.push(oHeaderPNL);
        }

        aL1Keys.forEach(function(sL1Key, iIndex) {
            var oL1 = mGroups[sL1Key];
            calcDiffs(oL1);

            // Process L2
            var aL2Nodes = [];
            Object.keys(oL1.nodesMap).sort().forEach(function(sL2Key) {
                var oL2 = oL1.nodesMap[sL2Key];
                calcDiffs(oL2);
                
                // Process Leaves
                oL2.nodesList.forEach(calcDiffs);
                oL2.nodesList.sort(function(a, b) { return a.name.localeCompare(b.name); });
                
                oL2.nodes = oL2.nodesList;
                delete oL2.nodesList; 
                aL2Nodes.push(oL2);
            });

            oL1.nodes = aL2Nodes;
            delete oL1.nodesMap; 
            aL1Nodes.push(oL1);

            // Spacer Logic
            if (sFStype === 'COMBINED') {
                var sNextKey = aL1Keys[iIndex + 1];
                addNetIncomeAndBalanceSheetHeader(aL1Nodes, sL1Key, sNextKey);
            } else if (aSpacerKeys && aSpacerKeys.indexOf(sL1Key) > -1) {
                // Standard Spacers for non-combined views
                if (Constants.SortConfig.BAS === "ASC" && sL1Key === "9") {
                     // Hack: prevent spacer after 9 if this logic ever runs for BAS which shouldn't happen 
                     // but adhering to config.
                } else {
                     aL1Nodes.push(createSpacer());
                }
            }
        });

        // Total Revenue Logic (Combined View only)
        if (sFStype === 'COMBINED') {
            addTotalRevenue(aL1Nodes);
        }

        // Gross Margin Logic
        if (bIncludeGrossMargin) {
             addGrossMargin(aL1Nodes);
        }

        addGrandTotal(aL1Nodes, sFStype);

        // Cash Flow Header (Combined View only) - Placed at the very bottom
        if (sFStype === 'COMBINED') {
             addCashFlow(aL1Nodes);
        }

        oRoot.root.nodes = aL1Nodes;
        return oRoot;
    }
};
