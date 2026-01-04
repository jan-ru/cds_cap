# API Reference

Complete API documentation for the CDS Analytics OData V4 service.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Entity Sets](#entity-sets)
- [Functions](#functions)
- [Actions](#actions)
- [Query Options](#query-options)
- [Error Responses](#error-responses)
- [Examples](#examples)

## Base URL

**Development**: `http://localhost:4004/analytics`  
**Production**: `https://your-domain.com/analytics`

All endpoints are prefixed with `/analytics`.

## Authentication

All requests require HTTP Basic Authentication (development) or OAuth2 Bearer tokens (production).

### Development Credentials

```bash
# Basic Auth
curl -u alice:alice http://localhost:4004/analytics/
```

**Available Users**:
- `alice:alice` (Admin role)
- `bob:bob` (User role)
- `charlie:charlie` (User role)

### Headers

```http
Authorization: Basic YWxpY2U6YWxpY2U=
Accept: application/json
Content-Type: application/json
```

## Entity Sets

### Financial Statements

**Endpoint**: `GET /analytics/FinancialStatements`

Financial data (P&L and Balance Sheet) organized by account, period, and type.

**Properties**:
- `ID` (UUID) - Unique identifier
- `FStype` (String) - 'PNL' (Profit & Loss) or 'BAS' (Balance Sheet)
- `CodeGrootboekrekening` (String) - Account code
- `NaamGrootboekrekening` (String) - Account name
- `PeriodYear` (Integer) - Year (e.g., 2025)
- `PeriodMonth` (Integer) - Month (1-12)
- `ReportingPeriod` (String) - Period identifier (e.g., '2025-01')
- `DisplayAmount` (Decimal) - Amount value
- `Code1` (String) - Category code

**Filters**:
```http
# Get P&L data for 2025
GET /analytics/FinancialStatements?$filter=FStype eq 'PNL' and PeriodYear eq 2025

# Get specific account
GET /analytics/FinancialStatements?$filter=CodeGrootboekrekening eq '8000'

# Get year-to-date
GET /analytics/FinancialStatements?$filter=PeriodYear eq 2025 and PeriodMonth le 6
```

**Response**:
```json
{
  "@odata.context": "$metadata#FinancialStatements",
  "value": [
    {
      "ID": "550e8400-e29b-41d4-a716-446655440000",
      "FStype": "PNL",
      "CodeGrootboekrekening": "8000",
      "NaamGrootboekrekening": "Product Sales",
      "PeriodYear": 2025,
      "PeriodMonth": 1,
      "ReportingPeriod": "2025-01",
      "DisplayAmount": 125000.50,
      "Code1": "REV"
    }
  ]
}
```

### Revenue Analysis

**Endpoint**: `GET /analytics/RevenueReport`

Revenue data with classification (recurring vs one-off).

**Properties**:
- `ID` (UUID)
- `PeriodYear` (Integer)
- `PeriodMonth` (Integer)
- `AccountCode` (String)
- `AccountName` (String)
- `Amount` (Decimal)
- `RevenueType` (String) - 'RECURRING' or 'ONE_OFF'
- `CostCenter` (String)

**Filters**:
```http
# Get recurring revenue for 2025
GET /analytics/RevenueReport?$filter=RevenueType eq 'RECURRING' and PeriodYear eq 2025

# Revenue by cost center
GET /analytics/RevenueReport?$filter=CostCenter eq 'CC001'
```

### Working Capital

#### Sales Invoices

**Endpoint**: `GET /analytics/VFA_SalesInvoice`

**Properties**:
- `InvoiceID` (String) - Primary key
- `InvoiceDate` (Date)
- `CustomerID` (String)
- `CustomerName` (String)
- `TotalAmount` (Decimal)
- `Status` (String) - 'PAID', 'OUTSTANDING', 'OVERDUE'
- `PaymentTerms` (Integer) - Days
- `DueDate` (Date)

**Filters**:
```http
# Overdue invoices
GET /analytics/VFA_SalesInvoice?$filter=Status eq 'OVERDUE'

# Invoices by date range
GET /analytics/VFA_SalesInvoice?$filter=InvoiceDate ge 2025-01-01 and InvoiceDate le 2025-03-31
```

#### Sales Orders

**Endpoint**: `GET /analytics/VOA_SalesOrder`

**Properties**:
- `OrderID` (String) - Primary key
- `OrderDate` (Date)
- `CustomerID` (String)
- `OrderAmount` (Decimal)
- `Status` (String) - 'OPEN', 'CONFIRMED', 'DELIVERED', 'CANCELLED'

#### Service Agreements

**Endpoint**: `GET /analytics/SCA_ServiceAgreement`

**Properties**:
- `AgreementID` (String) - Primary key
- `StartDate` (Date)
- `EndDate` (Date)
- `CustomerID` (String)
- `MonthlyRecurring` (Decimal)
- `Status` (String) - 'ACTIVE', 'EXPIRED', 'CANCELLED'

### Products & Catalog

#### Products

**Endpoint**: `GET /analytics/ESL_Product`

**Properties**:
- `ProductID` (String) - Primary key
- `ProductName` (String)
- `ProductGroupID` (String)
- `UnitPrice` (Decimal)
- `Active` (Boolean)

#### Product Groups

**Endpoint**: `GET /analytics/PGA_ProductGroup`

**Properties**:
- `ProductGroupID` (String) - Primary key
- `GroupName` (String)
- `Description` (String)

### Delivery Notes

**Endpoint**: `GET /analytics/GUA_DeliveryNote`

**Properties**:
- `DeliveryNoteID` (String) - Primary key
- `DeliveryDate` (Date)
- `OrderID` (String)
- `CustomerID` (String)
- `Status` (String) - 'PENDING', 'DELIVERED', 'CANCELLED'

### User Settings

**Endpoint**: `GET /analytics/UserSettings`

Store and retrieve user preferences (not read-only).

**Properties**:
- `ID` (UUID) - Primary key
- `user` (String) - Username
- `settings` (LargeString) - JSON string of preferences

**CRUD Operations**:
```http
# Create/Update settings
POST /analytics/UserSettings
{
  "user": "alice",
  "settings": "{\"theme\":\"dark\",\"defaultPeriod\":2025}"
}

# Read settings
GET /analytics/UserSettings?$filter=user eq 'alice'

# Delete settings
DELETE /analytics/UserSettings(ID='...')
```

## Functions

Functions are read-only operations that return calculated results. All tree functions return JSON strings that must be parsed client-side.

### getAppInfo

Get application version and environment information.

**Signature**: `GET /analytics/getAppInfo()`

**Parameters**: None

**Returns**: JSON string with:
```json
{
  "appVersion": "2.1.0",
  "cdsVersion": "9.5.2",
  "nodeVersion": "v20.11.0",
  "sqliteVersion": "3.43.2",
  "currentUser": "alice",
  "dbtVersion": "1.7.4",
  "duckdbVersion": "0.9.2",
  "dockerVersion": "24.0.7"
}
```

**Example**:
```bash
curl -u alice:alice "http://localhost:4004/analytics/getAppInfo()"
```

### getFinancialStatementsTree

Generate hierarchical financial statement (Income Statement or Balance Sheet).

**Signature**: 
```
GET /analytics/getFinancialStatementsTree(
  FStype,
  PeriodAYear,
  PeriodAMonthFrom,
  PeriodAMonthTo,
  PeriodBYear,
  PeriodBMonthFrom,
  PeriodBMonthTo
)
```

**Parameters**:
- `FStype` (String) - **Required**. 'PNL' or 'BAS'
- `PeriodAYear` (Integer) - **Required**. Year for Period A (e.g., 2025)
- `PeriodAMonthFrom` (Integer) - **Required**. Start month (1-12)
- `PeriodAMonthTo` (Integer) - **Required**. End month (1-12)
- `PeriodBYear` (Integer) - **Required**. Year for Period B (comparison)
- `PeriodBMonthFrom` (Integer) - **Required**. Start month (1-12)
- `PeriodBMonthTo` (Integer) - **Required**. End month (1-12)

**Returns**: JSON string with hierarchical tree structure:
```json
{
  "level": 1,
  "drillState": "expanded",
  "label": "Operating Revenue",
  "amountA": 1500000.00,
  "amountB": 1200000.00,
  "watA": 75.5,
  "watB": 68.2,
  "children": [
    {
      "level": 2,
      "drillState": "collapsed",
      "label": "Product Sales",
      "account": "8000",
      "amountA": 1000000.00,
      "amountB": 800000.00,
      "watA": 50.3,
      "watB": 45.5,
      "children": []
    }
  ]
}
```

**Tree Properties**:
- `level` (Integer) - Hierarchy depth (1=header, 2=group, 3=detail)
- `drillState` (String) - 'expanded', 'collapsed', or 'leaf'
- `label` (String) - Display name
- `account` (String) - Account code (if detail level)
- `amountA` (Decimal) - Period A total
- `amountB` (Decimal) - Period B total
- `watA` (Decimal) - Percentage of total (Period A)
- `watB` (Decimal) - Percentage of total (Period B)
- `children` (Array) - Nested tree nodes

**Example**:
```bash
# Income Statement: 2025 full year vs 2024
curl -u alice:alice "http://localhost:4004/analytics/getFinancialStatementsTree(\
FStype='PNL',\
PeriodAYear=2025,\
PeriodAMonthFrom=1,\
PeriodAMonthTo=12,\
PeriodBYear=2024,\
PeriodBMonthFrom=1,\
PeriodBMonthTo=12\
)"
```

**Revenue Classification**:
The function uses account code prefixes to classify revenue:
- **Recurring**: Accounts starting with 80, 86, 87, 88
- **One-off**: Accounts starting with 84, 85

### getSalesTree

Generate sales analysis tree (similar structure to financial statements).

**Signature**: 
```
GET /analytics/getSalesTree(
  PeriodAYear,
  PeriodAMonthFrom,
  PeriodAMonthTo,
  PeriodBYear,
  PeriodBMonthFrom,
  PeriodBMonthTo
)
```

**Parameters**: Same as `getFinancialStatementsTree` except no `FStype`

**Returns**: JSON string with sales hierarchy

### getRevenueTree

Generate revenue Last Twelve Months (LTM) analysis tree.

**Signature**: 
```
GET /analytics/getRevenueTree(
  PeriodAYear,
  PeriodAMonth,
  PeriodBYear,
  PeriodBMonth
)
```

**Parameters**:
- `PeriodAYear` (Integer) - **Required**. Year for Period A
- `PeriodAMonth` (Integer) - **Required**. Month for Period A (1-12)
- `PeriodBYear` (Integer) - **Required**. Year for Period B
- `PeriodBMonth` (Integer) - **Required**. Month for Period B (1-12)

**Returns**: JSON string with revenue analysis including LTM calculations

**Example**:
```bash
# LTM revenue as of Dec 2025 vs Dec 2024
curl -u alice:alice "http://localhost:4004/analytics/getRevenueTree(\
PeriodAYear=2025,\
PeriodAMonth=12,\
PeriodBYear=2024,\
PeriodBMonth=12\
)"
```

**Response Structure**:
```json
{
  "level": 1,
  "label": "Total Revenue (LTM)",
  "amountA": 18500000.00,
  "amountB": 16200000.00,
  "ltmA": 18500000.00,
  "ltmB": 16200000.00,
  "children": [
    {
      "level": 2,
      "label": "Recurring Revenue",
      "amountA": 12000000.00,
      "amountB": 10500000.00,
      "watA": 64.9,
      "watB": 64.8,
      "children": []
    },
    {
      "level": 2,
      "label": "One-off Revenue",
      "amountA": 6500000.00,
      "amountB": 5700000.00,
      "watA": 35.1,
      "watB": 35.2,
      "children": []
    }
  ]
}
```

### getPivotTree

Generate pivot table analysis for specific months.

**Signature**: 
```
GET /analytics/getPivotTree(
  PeriodAYear,
  PeriodAMonth,
  PeriodBYear,
  PeriodBMonth
)
```

**Parameters**:
- `PeriodAYear` (Integer) - **Required**. Year for Period A
- `PeriodAMonth` (Integer) - **Required**. Month (1-12)
- `PeriodBYear` (Integer) - **Required**. Year for Period B
- `PeriodBMonth` (Integer) - **Required**. Month (1-12)

**Returns**: JSON string with pivot table structure

**Example**:
```bash
# Pivot analysis for Jan 2025 vs Jan 2024
curl -u alice:alice "http://localhost:4004/analytics/getPivotTree(\
PeriodAYear=2025,\
PeriodAMonth=1,\
PeriodBYear=2024,\
PeriodBMonth=1\
)"
```

### getCombinedTree

Generate combined financial view (P&L + Balance Sheet).

**Signature**: 
```
GET /analytics/getCombinedTree(
  PeriodAYear,
  PeriodAMonthFrom,
  PeriodAMonthTo,
  PeriodBYear,
  PeriodBMonthFrom,
  PeriodBMonthTo
)
```

**Parameters**: Same as `getFinancialStatementsTree` except no `FStype`

**Returns**: JSON string with combined tree

### getFileContent

Read file content from server (admin only).

**Signature**: `GET /analytics/getFileContent(fileType, fileName)`

**Parameters**:
- `fileType` (String) - File category
- `fileName` (String) - File name

**Returns**: File content as string

**Security**: Restricted to admin users only

## Actions

Actions are operations that modify server state.

### saveSettings

Save or update user preferences.

**Signature**: `POST /analytics/saveSettings`

**Parameters**:
- `user` (String) - **Required**. Username
- `settings` (LargeString) - **Required**. JSON string of preferences

**Request Body**:
```json
{
  "user": "alice",
  "settings": "{\"theme\":\"dark\",\"language\":\"en\",\"defaultYear\":2025}"
}
```

**Returns**: Success message as string

**Example**:
```bash
curl -u alice:alice -X POST \
  -H "Content-Type: application/json" \
  -d '{"user":"alice","settings":"{\"theme\":\"dark\"}"}' \
  http://localhost:4004/analytics/saveSettings
```

**Response**:
```json
{
  "value": "Settings saved successfully"
}
```

## Query Options

Standard OData V4 query options are supported on entity sets.

### $filter

Filter results based on criteria.

```http
# Operators: eq, ne, gt, ge, lt, le, and, or, not
GET /analytics/FinancialStatements?$filter=PeriodYear eq 2025 and FStype eq 'PNL'

# String functions
GET /analytics/ESL_Product?$filter=startswith(ProductName, 'Pro')

# Date comparison
GET /analytics/VFA_SalesInvoice?$filter=InvoiceDate ge 2025-01-01
```

### $select

Select specific properties.

```http
GET /analytics/FinancialStatements?$select=CodeGrootboekrekening,DisplayAmount,PeriodYear
```

### $orderby

Sort results.

```http
# Ascending
GET /analytics/VFA_SalesInvoice?$orderby=InvoiceDate

# Descending
GET /analytics/FinancialStatements?$orderby=PeriodYear desc,PeriodMonth desc
```

### $top and $skip

Pagination.

```http
# First 50 records
GET /analytics/FinancialStatements?$top=50

# Skip first 100, take next 50
GET /analytics/FinancialStatements?$skip=100&$top=50
```

### $count

Get total count of records.

```http
# Include count in response
GET /analytics/FinancialStatements?$count=true

# Just get count
GET /analytics/FinancialStatements/$count
```

### $expand

Expand related entities (if navigation properties exist).

```http
GET /analytics/VOA_SalesOrder?$expand=Customer
```

### $apply

Aggregation and grouping (for analytical queries).

```http
# Group by year, sum amounts
GET /analytics/FinancialStatements?$apply=groupby((PeriodYear),aggregate(DisplayAmount with sum as TotalAmount))

# Group by account, count records
GET /analytics/RevenueReport?$apply=groupby((AccountCode),aggregate($count as RecordCount))
```

## Error Responses

### Error Structure

```json
{
  "error": {
    "code": "400",
    "message": "Invalid period range: monthFrom must be <= monthTo",
    "details": [
      {
        "code": "VALIDATION_ERROR",
        "message": "Period validation failed"
      }
    ]
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid parameters or request body
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource or endpoint not found
- `500 Internal Server Error` - Server-side error

### Common Error Messages

**Authentication Errors**:
```json
{
  "error": {
    "code": "401",
    "message": "Unauthorized: Authentication required"
  }
}
```

**Validation Errors**:
```json
{
  "error": {
    "code": "400",
    "message": "Invalid FStype: must be 'PNL' or 'BAS'"
  }
}
```

**Not Found**:
```json
{
  "error": {
    "code": "404",
    "message": "Entity not found"
  }
}
```

## Examples

### Complete Workflow: Financial Analysis

```bash
# 1. Authenticate and get app info
curl -u alice:alice "http://localhost:4004/analytics/getAppInfo()"

# 2. Get available periods
curl -u alice:alice "http://localhost:4004/analytics/FinancialStatements?\$apply=groupby((PeriodYear))"

# 3. Get Income Statement tree for 2025 vs 2024
curl -u alice:alice "http://localhost:4004/analytics/getFinancialStatementsTree(\
FStype='PNL',\
PeriodAYear=2025,\
PeriodAMonthFrom=1,\
PeriodAMonthTo=12,\
PeriodBYear=2024,\
PeriodBMonthFrom=1,\
PeriodBMonthTo=12\
)"

# 4. Get detailed account data
curl -u alice:alice "http://localhost:4004/analytics/FinancialStatements?\
\$filter=FStype eq 'PNL' and PeriodYear eq 2025 and CodeGrootboekrekening eq '8000'&\
\$orderby=PeriodMonth"

# 5. Save user preferences
curl -u alice:alice -X POST \
  -H "Content-Type: application/json" \
  -d '{"user":"alice","settings":"{\"defaultYear\":2025,\"defaultFStype\":\"PNL\"}"}' \
  http://localhost:4004/analytics/saveSettings
```

### JavaScript Client Example

```javascript
const baseUrl = 'http://localhost:4004/analytics';
const auth = 'Basic ' + btoa('alice:alice');

// Get financial tree
async function getFinancialTree(fsType, yearA, yearB) {
  const url = `${baseUrl}/getFinancialStatementsTree(` +
    `FStype='${fsType}',` +
    `PeriodAYear=${yearA},PeriodAMonthFrom=1,PeriodAMonthTo=12,` +
    `PeriodBYear=${yearB},PeriodBMonthFrom=1,PeriodBMonthTo=12)`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': auth }
  });
  
  const data = await response.json();
  const tree = JSON.parse(data.value);
  return tree;
}

// Get sales invoices with pagination
async function getSalesInvoices(skip = 0, top = 50) {
  const url = `${baseUrl}/VFA_SalesInvoice?$skip=${skip}&$top=${top}&$count=true`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': auth }
  });
  
  return response.json();
}

// Usage
const tree = await getFinancialTree('PNL', 2025, 2024);
const invoices = await getSalesInvoices(0, 100);
```

### UI5/Fiori Client Example

```javascript
// In Fiori Elements controller or extension
const oModel = this.getModel();

// Read financial statements
oModel.read("/FinancialStatements", {
  filters: [
    new Filter("PeriodYear", FilterOperator.EQ, 2025),
    new Filter("FStype", FilterOperator.EQ, "PNL")
  ],
  success: (oData) => {
    console.log("Data:", oData.results);
  }
});

// Call function import
const oContext = oModel.bindContext("/getFinancialStatementsTree(...)");
oContext.setParameter("FStype", "PNL");
oContext.setParameter("PeriodAYear", 2025);
oContext.setParameter("PeriodAMonthFrom", 1);
oContext.setParameter("PeriodAMonthTo", 12);
oContext.setParameter("PeriodBYear", 2024);
oContext.setParameter("PeriodBMonthFrom", 1);
oContext.setParameter("PeriodBMonthTo", 12);

oContext.execute().then(() => {
  const result = oContext.getBoundContext().getObject();
  const tree = JSON.parse(result.value);
  console.log("Tree:", tree);
});
```

## Rate Limiting

Currently no rate limiting is enforced in development. For production deployments:

- Consider implementing rate limiting via Caddy reverse proxy
- Recommended limits: 100 requests per minute per user
- Tree builder functions are computationally expensive - consider caching

## Caching

- Entity data: No server-side caching (real-time from SQLite)
- Tree functions: No caching (generated on each request)
- Client-side caching recommended for tree structures

## Versioning

API version is included in response headers:
```
X-API-Version: 2.1.0
X-CDS-Version: 9.5.2
```

Future breaking changes will be communicated via:
- CHANGELOG.md updates
- Deprecated endpoint warnings in response headers
- Migration guides in docs/

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication setup
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common API issues
- [srv/utils/README.md](../srv/utils/README.md) - Tree builder implementation details
