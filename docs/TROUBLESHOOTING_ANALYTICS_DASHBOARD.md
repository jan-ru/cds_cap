# Troubleshooting Analytics Dashboard

## Issue: No data showing in Income Statement, Balance Sheet, or Financial Statements

### Verification Steps

1. **Check if data exists in database:**
   ```bash
   sqlite3 db.sqlite "SELECT FStype, COUNT(*) FROM demo_FinancialStatements GROUP BY FStype"
   ```
   Expected output:
   ```
   BAS|24219
   PNL|11027
   ```

2. **Check CAP server logs:**
   When you open the Analytics Dashboard, check the server console for:
   - DEBUG messages showing function calls
   - Any error messages
   - Look for: `"DEBUG: getFinancialStatementsTree called with FStype:"`

3. **Check browser console:**
   - Open browser Developer Tools (F12)
   - Go to Console tab
   - Look for JavaScript errors or failed network requests
   - Check Network tab for failed OData requests

### Common Issues and Fixes

#### 1. Service Functions Not Found
**Symptom:** Browser console shows 404 errors for `/analytics/getFinancialStatementsTree`

**Fix:** Restart the CAP server to reload the service definitions:
```bash
cds watch
```

#### 2. Authentication Issues
**Symptom:** 401 Unauthorized errors in browser console

**Fix:** Check if you're properly logged in. The launchpad should handle authentication automatically.

#### 3. Model Propagation Issue
**Symptom:** Console logs show "Not yet propagated" or "viewSettings model not found"

**Fix:** The viewSettings model should be set in Table.controller.js and propagate to child views. Check that the model is initialized before the Financials view renders.

#### 4. Period Selection Issue
**Symptom:** Data loads but shows empty because period doesn't match data

**Solution:** Check available periods in database:
```bash
sqlite3 db.sqlite "SELECT DISTINCT PeriodYear FROM demo_FinancialStatements ORDER BY PeriodYear DESC"
```

Default periods in app are:
- Period A: 2025 (months 1-12)
- Period B: 2024 (months 1-12)

### Testing the Service Directly

You can test if the service functions work by calling them directly in the browser console:

```javascript
// Get the OData model
var oModel = sap.ui.getCore().byId("container-demo.ui5---table").getModel("odata");

// Call the function
var oContext = oModel.bindContext("/getFinancialStatementsTree(...)");
oContext.setParameter("FStype", "PNL");
oContext.setParameter("PeriodAYear", 2025);
oContext.setParameter("PeriodAMonthFrom", 1);
oContext.setParameter("PeriodAMonthTo", 12);
oContext.setParameter("PeriodBYear", 2024);
oContext.setParameter("PeriodBMonthFrom", 1);
oContext.setParameter("PeriodBMonthTo", 12);

oContext.execute().then(function() {
    var result = oContext.getBoundContext().getObject();
    console.log("Result:", JSON.parse(result.value));
}).catch(function(err) {
    console.error("Error:", err);
});
```

### Debug Mode

To enable more detailed logging, add this to your browser console:
```javascript
jQuery.sap.log.setLevel(jQuery.sap.log.Level.DEBUG);
```

### Expected Behavior

When working correctly:
1. App loads and shows Income Statement by default
2. Period selector shows available years (2024, 2025)
3. Financial data displays in a tree table format
4. Can navigate between Income Statement and Balance Sheet
5. Can change periods and see data refresh

### If Still Not Working

1. **Clear browser cache** and reload
2. **Check server logs** for any errors during startup
3. **Verify all required npm packages** are installed:
   ```bash
   npm install
   ```
4. **Restart the CAP server**:
   ```bash
   npm start
   ```

### Contact for Support

If the issue persists, provide:
- Browser console errors (screenshot or text)
- Server console logs during app load
- Result of database query showing data exists
- Network tab showing OData requests/responses
