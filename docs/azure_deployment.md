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

## Evaluation Demo Checklist

- Open `/docs` and show the FastAPI APIs.
- Call `/api/v1/ingest/vitals`.
- Call `/api/v1/predict`.
- Call `/api/v1/analyze` and show agent outputs.
- Call `/api/v1/rag/search?q=sepsis` and show vector-store retrieval metadata.
- Open the React dashboard and show alerts/trends.
- Open Power BI report connected to exported CSVs or Azure SQL.
