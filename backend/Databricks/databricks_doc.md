# 📊 E-Commerce Data Lakehouse & Analytics Implementation

## Important Files
- `backend\Databricks\scripts\syncToDataBricks.js`
- `backend\routes\analyticsRoutes.js`
- `backend\controllers\analyticsController.js`
- `frontend\components\admin-components\Analytics.tsx` 


**Architecture**: TiDB (OLTP) ➔ Databricks (Lakehouse/Bronze) ➔ Node.js ➔ Next.js (Admin Dashboard)

</br>

## 1. Databricks Setup & Workspace Configuration
Before running the pipeline, you must configure a *Serverless SQL Warehouse** in Databricks to act as the compute engine for our analytics.

### Step-by-Step Configuration:
1. **Create a SQL Warehouse**: Go to the "SQL Warehouse" tab in the sidebar and create a "Serverless" or "Pro" warehouse. Ensure it is started.

2. Get Connection Details:

- Navigate to your SQL Warehouse ➔ Connection details.

- **Server Hostname**: This is your `DATABRICKS_HOST`.

- **HTTP Path**: This is your `DATABRICKS_PATH`.

3. **Generate Access Token**:

- Go to **Settings ➔ Developer ➔ Access tokens**.

- Click **Generate new token**. This is your `DATABRICKS_TOKEN`.

### Environment Variables (.env)
Add these to your backend environment file:

```Code snippet
DATABRICKS_HOST=xxxx.azuredatabricks.net
DATABRICKS_PATH=/sql/1.0/warehouses/xxxx
DATABRICKS_TOKEN=dapi_xxxxxxxxxxxxxx
```

---

## 2. Data Pipeline: TiDB to Databricks (`syncToBricks.js`)
This script implements a **Bronze Layer** sync. It extracts data from our operational TiDB database via Prisma and loads it into Databricks Delta Tables.

**Key Logic**:
- **Modular Sync**: We use a `tablesToSync` array to manage multiple models (`orders`, `order_items`, `products`).

- **Schema Enforcement**: It drops and recreates tables to ensure the schema remains consistent with the latest Prisma models.

- **Delta Tables**: Uses `USING DELTA` to ensure high-performance ACID transactions.

---

## 3. Backend Implementation: Databricks SQL API
Instead of querying our main production database (TiDB) for heavy analytics—which could slow down the user experience—we query Databricks.

**Controller**: `analyticsController.js`
This controller handles the connection to the Databricks SQL Warehouse.

- **Parallel Execution**: We use `Promise.all()` to fire off KPI calculations, status breakdowns, and top product queries simultaneously.

- **Lakehouse Joins**: We perform complex joins (Order Items + Products) inside Databricks, sending only the final result set (top 5 products) back to the server.

**Router**: `analyticsRouter.js`
The route is protected by `verifyToken` middleware, ensuring only authorized admins can access company financial data.

---

## 4. Frontend: Executive Dashboard (`Analytics.tsx`)
The frontend is built with **Next.js (App Router)** and uses **Recharts** for high-fidelity data visualization.

**Features**:
- **KPI Cards**: Real-time display of Total Revenue, Order Count, and Average Order Value (AOV).

- **Top Product Performance**: A Bar Chart visualizing which products drive the most revenue.

- **Order Fulfilment Status**: A Donut Chart showing the distribution of order states (Delivered, Pending, Cancelled).

- **Auth Integration**: Uses a custom `authFetch` wrapper to pass JWT headers for secure data retrieval.

---

## 🚀 How to Run
1. **Install Dependencies**:

```Bash
# Backend
npm install @databricks/sql

# Frontend
npm install recharts lucide-react
```

2. **Run Sync Script**:

```Bash
node backend/Databricks/scripts/syncToDataBricks.js
```

3. **Start Dev Servers**:
Run both your backend and frontend. Navigate to the `/admin` section to view the live Databricks-powered analytics.