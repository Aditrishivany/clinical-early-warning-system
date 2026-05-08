# Azure Deployment Plan

## Azure Components Used

1. **Azure App Service or Azure Container Apps**
   - Hosts the FastAPI backend container.
   - Optional second App Service or Static Web App hosts the React dashboard.

2. **Azure SQL Database**
   - Production SQL database for patients, vitals, predictions, agent reports, alerts, audit logs, and conversations.
   - Configure with `DATABASE_URL=mssql+pyodbc://...` or a SQLAlchemy-compatible Azure SQL URL.

3. **Azure OpenAI or Azure AI Search**
   - Azure OpenAI can replace Groq for clinical chat completions.
   - Azure AI Search can replace the local TF-IDF vector store for managed vector retrieval.

4. **Azure Key Vault**
   - Stores `SECRET_KEY`, database password, OpenAI keys, and search keys.
   - Accessed by managed identity from the backend app.

5. **Azure Data Factory / Databricks / Fabric**
   - Orchestrates Raw -> Staged -> Curated vitals processing.
   - Local equivalent is `scripts/data_engineering_pipeline.py`.

## Environment Variables

```text
ENV=production
DEBUG=false
DATABASE_URL=<azure-sql-connection-string>
SECRET_KEY=<from-key-vault>
ALLOWED_ORIGINS=https://<frontend-host>
GROQ_API_KEY=<optional-local-llm-key>
AZURE_OPENAI_ENDPOINT=<azure-openai-endpoint>
AZURE_OPENAI_API_KEY=<from-key-vault>
AZURE_AI_SEARCH_ENDPOINT=<azure-search-endpoint>
AZURE_AI_SEARCH_KEY=<from-key-vault>
```

## Deployment Steps

1. Build and test locally:

```powershell
$env:DEBUG='false'
pytest -q
docker compose build
```

2. Provision Azure resources:

```powershell
az group create --name rg-clinicalai --location centralindia
az acr create --resource-group rg-clinicalai --name clinicalaiacr --sku Basic
az sql server create --resource-group rg-clinicalai --name clinicalai-sql --admin-user clinicaladmin --admin-password <password>
az sql db create --resource-group rg-clinicalai --server clinicalai-sql --name clinicalai
az keyvault create --resource-group rg-clinicalai --name clinicalai-kv
```

3. Push container image and deploy to App Service or Container Apps.

4. Configure app settings from Key Vault references.

5. Run database migration/startup once so SQLAlchemy creates tables.

6. Publish Power BI report using the Azure SQL database as the refresh source.

## Azure SQL Live Database Migration

Use this flow when the deployed backend must write directly to Azure SQL so Power BI can refresh from live cloud data.

### 1. Create Azure SQL From Portal

1. Azure Portal -> search **SQL databases** -> **Create**.
2. Resource group: `rg-clinicalai`.
3. Database name: `clinicalai`.
4. Server: create a new server, for example `clinicalai-sql-aditri`.
5. Authentication: SQL authentication.
6. Admin login: `clinicaladmin`.
7. Save the password securely.
8. Networking:
   - Public endpoint: Enabled.
   - Allow Azure services and resources to access this server: Yes.
   - Add your current client IP: Yes.
9. Review + create.

### 2. Use SQLAlchemy Connection String

The App Service uses `pymssql`, so set `DATABASE_URL` like this:

```text
mssql+pymssql://clinicaladmin:<URL_ENCODED_PASSWORD>@clinicalai-sql-aditri.database.windows.net:1433/clinicalai
```

If the password has special characters, URL-encode them before pasting. Examples:

| Character | Encoded |
| --- | --- |
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `/` | `%2F` |

### 3. Configure Backend App Service

1. Azure Portal -> App Services -> `clinicalai-backend-aditri`.
2. Settings -> Environment variables.
3. Edit `DATABASE_URL` to the Azure SQL connection string.
4. Keep `DEBUG=false`.
5. Save.
6. Overview -> Restart.

### 4. Create Tables And Seed Users

After restart, open backend Kudu:

1. Backend App Service -> Advanced Tools -> Go.
2. SSH (App).
3. Run:

```bash
python scripts/seed_data.py
```

This creates the SQL tables and inserts demo staff/patient users.

### 5. Verify Azure SQL Backend

Open:

```text
https://clinicalai-backend-aditri-gdf3fgecfsendmcw.koreacentral-01.azurewebsites.net/health
```

Then test login:

```text
POST /api/v1/auth/login
ADM001 / admin123
```

Then test a write endpoint:

```text
POST /api/v1/analyze
```

If it succeeds, vitals, predictions, alerts, and agent reports are now stored in Azure SQL.

### 6. Connect Power BI

1. Power BI Desktop -> Get data -> Azure -> Azure SQL Database.
2. Server:

```text
clinicalai-sql-aditri.database.windows.net
```

3. Database:

```text
clinicalai
```

4. Data Connectivity mode:
   - Import for scheduled refresh, or
   - DirectQuery for near-live dashboard behavior.
5. Select tables:
   - `patients`
   - `vital_readings`
   - `predictions`
   - `alerts`
   - `agent_reports`
   - `patient_assignments`
6. Build visuals and publish to Power BI Service.

## Evaluation Demo Checklist

- Open `/docs` and show the FastAPI APIs.
- Call `/api/v1/ingest/vitals`.
- Call `/api/v1/predict`.
- Call `/api/v1/analyze` and show agent outputs.
- Call `/api/v1/rag/search?q=sepsis` and show vector-store retrieval metadata.
- Open the React dashboard and show alerts/trends.
- Open Power BI report connected to exported CSVs or Azure SQL.
