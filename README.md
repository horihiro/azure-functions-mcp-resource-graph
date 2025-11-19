# MCP Resource Graph (Azure Functions)

This project exposes a Model Context Protocol (MCP) tool via Azure Functions (Node.js v4). It lets MCP clients execute KQL queries against Azure Resource Graph, enabling cross-subscription resource search through the `query_resource_graph` tool.

## Overview
- Entry: `src/index.ts` – Functions initialization.
- MCP Tool: `src/functions/mcpResourceGraph.ts`
  - Tool Name: `query_resource_graph`
  - Handler: `mcpQueryGraph`
- Logic: `src/logics/queryGraphLogic.ts` – Calls Resource Graph REST API.
- Auth: `src/utils/auth.ts` – Obtains an ARM-scoped token via `DefaultAzureCredential`.
- Validation: `src/utils/patterns.ts` – Regex for subscription IDs, etc.

## Capabilities
- Send KQL queries to Azure Resource Graph and retrieve results.
  - Examples: list virtual machines, resource groups, subscriptions, resources with specific tags, etc.
- If `subscriptions` is omitted, the environment variable `AZURE_SUBSCRIPTION_ID` (when present) is used as default.

## Prerequisites
- Node.js 18+ (TypeScript 5)
- Azure Functions Core Tools v4 (`func`)
- Azure CLI (recommended for local auth)
- Permissions: Reader or higher on the target subscription(s)

## Setup
```bash
# Install dependencies
npm install

# Authenticate locally
az login

# Optionally set a default subscription for queries
# Linux / macOS
export AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
# Windows (PowerShell)
$env:AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
```

`local.settings.json` is configured for development with `AzureWebJobsStorage=UseDevelopmentStorage=true` (Azurite). The function does not use storage triggers, but Functions requires a storage connection.

## Run Locally
- VS Code tasks
  - `npm watch (functions)` (background)
  - `func: host start` (background)
- Or via commands
```bash
# TypeScript watch build
npm run watch
# In another terminal, or let prestart build and start
npm start   # = func start
```
When Functions Core Tools starts, the MCP Webhook listens at `http://localhost:7071/runtime/webhooks/mcp`.

## Use From MCP
- Endpoint: `http://localhost:7071/runtime/webhooks/mcp`
- Tool: `query_resource_graph`
- Parameters:
  - `subscriptions?: string[]` – Target subscription IDs (optional)
  - `query: string` – KQL for Resource Graph

Configure your MCP-capable client (editor/agent) to register the endpoint above. The client will list `query_resource_graph` and allow you to pass arguments and run queries.

> Note: The HTTP payload format for MCP webhooks depends on the client implementation. Using an MCP client is recommended over manual `curl`.

## Sample Queries (KQL)
- List virtual machines:
```kusto
Resources
| where type =~ "Microsoft.Compute/virtualMachines"
| project name, location, resourceGroup, subscriptionId, properties.hardwareProfile.vmSize
```
- List resource groups:
```kusto
ResourceContainers
| where type =~ "microsoft.resources/subscriptions/resourcegroups"
| project name, location, subscriptionId, tags
```

## Common Errors & Remedies
- One or more subscription IDs are invalid:
  - Confirm the subscription ID format (UUID).
- Failed to obtain Azure AD/Entra ID token:
  - Ensure `az login` is done, or `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` (or managed identity) are set correctly.
- Failed to graph data: <status> <statusText>
  - Check permissions (Reader+), network reachability, and API version (`2022-10-01`).

## Deploy (Overview)
1. Create a Function App in Azure (Node 18, Linux recommended).
2. Enable system-assigned managed identity and grant Reader or higher on target subscription(s).
3. Optionally set `AZURE_SUBSCRIPTION_ID` in App Settings.
4. Deploy from VS Code or Functions Core Tools:
```bash
func azure functionapp publish <your-function-app-name>
```

## Dev Notes
- TypeScript: `npm run build` / `npm run watch`
- Key code:
  - `src/functions/mcpResourceGraph.ts` – MCP tool exposure and arg definitions
  - `src/logics/queryGraphLogic.ts` – Resource Graph REST execution
  - `src/utils/auth.ts` – Token acquisition via `DefaultAzureCredential`
- API endpoint:
  - `POST https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2022-10-01`

## License
If no license is defined for this repository, handle per your organization/personal agreement.