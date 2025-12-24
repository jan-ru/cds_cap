module.exports = {
    /**
     * Builds a hierarchical tree for Pivot Analysis.
     * Hierarchy: L1 (0xxx) -> L2 (00xx) -> Account (Leaf)
     * Columns: Dynamic based on PeriodSortKey
     * @param {Array} aData - Flat array of Pivot data
     * @returns {Object} { root: { nodes: [], columns: [] } }
     */
    build: function(aData) {
        var oRoot = { root: { nodes: [], columns: [] } };
        
        // 1. Identify all unique Periods (Columns)
        var sPeriods = new Set();
        aData.forEach(item => {
            if (item.PeriodSortKey) sPeriods.add(item.PeriodSortKey);
        });
        var aPeriods = Array.from(sPeriods).sort(); // 2024001, 2024002...
        oRoot.root.columns = aPeriods;

        // 2. Build Tree Structure
        var mGroups = {}; 
        
        // Helper to create node
        var createNode = function(name, level, code) {
            var node = {
                name: name,
                level: level,
                // Initialize periods with 0
                // We'll attach aggregations dynamically
            };
            if (code) node.code = code;
            aPeriods.forEach(p => node[p] = 0);
            return node;
        };

        aData.forEach(function(item) {
            var sCode = item.CodeGrootboekrekening.toString();
            var fAmount = parseFloat(parseFloat(item.Saldo || 0).toFixed(2));
            var sPeriod = item.PeriodSortKey;

            // Keys
            var sL1Key = sCode.substring(0, 1); 
            var sL2Key = sCode.substring(0, 2);

            // L1 Node
            if (!mGroups[sL1Key]) {
                mGroups[sL1Key] = Object.assign(createNode(sL1Key + "xxx Series", 1), { nodesMap: {} });
            }
            var oL1 = mGroups[sL1Key];

            // L2 Node
            if (!oL1.nodesMap[sL2Key]) {
                oL1.nodesMap[sL2Key] = Object.assign(createNode(sL2Key + "xx Group", 2), { nodesList: [] });
            }
            var oL2 = oL1.nodesMap[sL2Key];

            // Aggregation (L1 & L2)
            if (sPeriod) {
                oL1[sPeriod] = (oL1[sPeriod] || 0) + fAmount;
                oL2[sPeriod] = (oL2[sPeriod] || 0) + fAmount;
            }

            // Leaf Node
            var oLeaf = oL2.nodesList.find(n => n.code === sCode);
            if (!oLeaf) {
                oLeaf = createNode(sCode + " - " + item.NaamGrootboekrekening, 3, sCode);
                oL2.nodesList.push(oLeaf);
            }
            
            if (sPeriod) {
                oLeaf[sPeriod] = (oLeaf[sPeriod] || 0) + fAmount;
            }
        });

        // 3. Flatten and Sort
        var aL1Nodes = [];
        Object.keys(mGroups).sort().forEach(function(sL1Key) {
            var oL1 = mGroups[sL1Key];
            
            var aL2Nodes = [];
            Object.keys(oL1.nodesMap).sort().forEach(function(sL2Key) {
                var oL2 = oL1.nodesMap[sL2Key];
                
                // Sort Leaves
                oL2.nodesList.sort((a, b) => a.code.localeCompare(b.code));
                oL2.nodes = oL2.nodesList;
                delete oL2.nodesList;

                // Rounding L2
                aPeriods.forEach(p => oL2[p] = parseFloat((oL2[p] || 0).toFixed(2)));
                
                aL2Nodes.push(oL2);
            });

            oL1.nodes = aL2Nodes;
            delete oL1.nodesMap;

            // Rounding L1
            aPeriods.forEach(p => oL1[p] = parseFloat((oL1[p] || 0).toFixed(2)));

            aL1Nodes.push(oL1);
        });

        // 4. Grand Total
        if (aL1Nodes.length > 0) {
            var oTotalNode = createNode("Grand Total", 1);
            oTotalNode.isBold = true; // For UI5 handling if needed
            
            aL1Nodes.forEach(function(node) {
                 aPeriods.forEach(function(p) {
                      oTotalNode[p] = (oTotalNode[p] || 0) + node[p];
                 });
            });

            // Rounding Grand Total
            aPeriods.forEach(p => oTotalNode[p] = parseFloat((oTotalNode[p] || 0).toFixed(2)));

            aL1Nodes.push(oTotalNode);
        }

        oRoot.root.nodes = aL1Nodes;
        return oRoot;
    }
};
