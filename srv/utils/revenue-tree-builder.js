const RevenueTreeBuilder = {
    
    build: function(aData, sStartYear, sStartMonth, sEndYear, sEndMonth) {
        // Defaults if missing (though Service should handle this, builder assumes valid input or handles defaults)
        if (!sStartYear) sStartYear = 2024;
        if (!sStartMonth) sStartMonth = 1;
        if (!sEndYear) sEndYear = 2025;
        if (!sEndMonth) sEndMonth = 1;

        const dStart = new Date(sStartYear, sStartMonth - 1, 1);
        const dEnd = new Date(sEndYear, sEndMonth - 1, 1);
        
        const aColumns = [];

        // 1. Calculate Period Columns (Iterate from Start to End)
        const dCurrent = new Date(dStart);
        while (dCurrent <= dEnd) {
            const iYear = dCurrent.getFullYear();
            const iMonth = dCurrent.getMonth() + 1;
            
            aColumns.push({
                label: iYear + "-" + (iMonth < 10 ? "0" + iMonth : iMonth),
                property: "Amount_" + iYear + (iMonth < 10 ? "0" + iMonth : iMonth) 
            });
            
            dCurrent.setMonth(dCurrent.getMonth() + 1);
        }

        // 2. Process Data into Pivot Structure
        const mRows = {};
        const aPivotData = [];

        aData.forEach(function(row) {
            const sKey = row.RevenueType + "|" + row.CostCenterGroup;
            if (!mRows[sKey]) {
                mRows[sKey] = {
                    RevenueType: row.RevenueType,
                    CostCenterGroup: row.CostCenterGroup
                };
            }
            const sPeriod = row.PeriodYear + (row.PeriodMonth < 10 ? "0" + row.PeriodMonth : "" + row.PeriodMonth);
            mRows[sKey]["Amount_" + sPeriod] = row.TotalAmount || row.Amount; // Handle aggregated or raw
        });

        for (const key in mRows) {
            aPivotData.push(mRows[key]);
        }

        // 3. Sort: Recurring > One-off, NOI > WAT > Other
        const mSortType = { "Recurring": 1, "One-off": 2 };
        const mSortCenter = { "NOI": 1, "WAT": 2, "Other": 3 };

        aPivotData.sort(function(a, b) {
            if (mSortType[a.RevenueType] !== mSortType[b.RevenueType]) {
                return (mSortType[a.RevenueType] || 99) - (mSortType[b.RevenueType] || 99);
            }
            return (mSortCenter[a.CostCenterGroup] || 99) - (mSortCenter[b.CostCenterGroup] || 99);
        });

        // 4. Add Groups and Spacers
        const aFinalRows = [];
        const addGroup = function(sType) {
            const aGroupRows = aPivotData.filter(function(r) { return r.RevenueType === sType; });
            const oTotalRow = { RevenueType: sType, CostCenterGroup: "Total" };
            let bHasData = false;

            aGroupRows.forEach(function(row) {
                 aFinalRows.push(row);
                 // Sum to Total
                 for (const k in row) {
                     if (k.startsWith("Amount_")) {
                         oTotalRow[k] = (oTotalRow[k] || 0) + row[k];
                         bHasData = true;
                     }
                 }
            });
            
            if (bHasData) aFinalRows.push(oTotalRow);
        };

        addGroup("Recurring");
        aFinalRows.push({ RevenueType: "", CostCenterGroup: "" }); // Spacer
        addGroup("One-off");
        aFinalRows.push({ RevenueType: "", CostCenterGroup: "" }); // Spacer

        // 5. Grand Total
        const oGrandTotal = { RevenueType: "Total", CostCenterGroup: "Revenue" };
        aPivotData.forEach(function(row) {
             for (const k in row) {
                 if (k.startsWith("Amount_")) {
                     oGrandTotal[k] = (oGrandTotal[k] || 0) + row[k];
                 }
             }
        });
        aFinalRows.push(oGrandTotal);

        return {
            rows: aFinalRows,
            columns: aColumns
        };
    }
};

module.exports = RevenueTreeBuilder;
