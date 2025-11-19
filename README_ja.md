# MCP Resource Graph (Azure Functions)

Azure Functions (Node.js v4) で Model Context Protocol (MCP) のツールを公開し、Azure Resource Graph に対して KQL を実行できるサーバーです。MCP クライアントから `query_resource_graph` ツールを呼び出して、サブスクリプション横断のリソース検索が可能です。

## 構成概要
- エントリ: `src/index.ts` – Functions の初期化。
- MCP ツール: `src/functions/mcpResourceGraph.ts`
  - ツール名: `query_resource_graph`
  - ハンドラ: `mcpQueryGraph`
- ロジック: `src/logics/queryGraphLogic.ts` – Resource Graph REST API 呼び出し。
- 認証: `src/utils/auth.ts` – `DefaultAzureCredential` で ARM スコープのトークンを取得。
- バリデーション: `src/utils/patterns.ts` – サブスクリプションID等の正規表現。

## できること
- Azure Resource Graph に KQL を投げて結果を取得します。
  - 例: 仮想マシンの一覧、リソースグループ、サブスクリプション、特定タグのリソースなど。
- `subscriptions` 引数を省略すると、環境変数 `AZURE_SUBSCRIPTION_ID`（存在する場合）を既定として利用します。

## 前提条件
- Node.js 18+（TypeScript 5）
- Azure Functions Core Tools v4（`func`）
- Azure CLI（ローカル実行時の認証に推奨）
- 権限: クエリ対象サブスクリプションに対して Reader 以上（Resource Graph 参照権限）

## セットアップ
```bash
# 依存関係のインストール
npm install

# 認証（ローカル）
az login

# 既定のサブスクリプションを環境変数で指定（任意）
# Linux / macOS
export AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
# Windows (PowerShell)
$env:AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
```

`local.settings.json` は開発用に `AzureWebJobsStorage=UseDevelopmentStorage=true` を設定済みです（Azurite を利用）。本関数はストレージトリガーを使いませんが、Functions の実行に接続文字列が必要です。

## 実行方法（ローカル）
- VS Code のタスク
  - `npm watch (functions)`（バックグラウンド）
  - `func: host start`（バックグラウンド）
- もしくはコマンドで実行
```bash
# TypeScript をウォッチビルド
npm run watch
# 別ターミナル、または prestart でビルドして起動
npm start   # = func start
```
Functions Core Tools が起動すると、MCP Webhook は `http://localhost:7071/runtime/webhooks/mcp` で待ち受けます。

## MCP からの使い方
- エンドポイント: `http://localhost:7071/runtime/webhooks/mcp`
- ツール名: `query_resource_graph`
- パラメータ:
  - `subscriptions?: string[]` – クエリ対象サブスクリプションID（省略可）
  - `query: string` – Resource Graph の KQL

MCP 対応クライアント（例: 対応エディタ/エージェント）のサーバー設定で、上記エンドポイントを登録してください。クライアント側のツール一覧に `query_resource_graph` が表示され、引数を渡して実行できます。

> 備考: MCP Webhook の HTTP ペイロード形式はクライアント実装に依存します。手動で `curl` するより、MCP クライアントを利用することを推奨します。

## クエリ例（KQL）
- 仮想マシン一覧:
```kusto
Resources
| where type =~ "Microsoft.Compute/virtualMachines"
| project name, location, resourceGroup, subscriptionId, properties.hardwareProfile.vmSize
```
- リソースグループ一覧:
```kusto
ResourceContainers
| where type =~ "microsoft.resources/subscriptions/resourcegroups"
| project name, location, subscriptionId, tags
```

## 典型的なエラーと対処
- One or more subscription IDs are invalid:
  - サブスクリプションIDの形式（UUID）を確認してください。
- Failed to obtain Azure AD token / Entra ID token:
  - `az login` 済みか、または `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` などの資格情報が正しく設定されているか確認。
- Failed to graph data: <status> <statusText>
  - 対象スコープの権限（Reader 以上）と、ネットワーク到達性、API バージョン（現在 `2022-10-01`）を確認。

## デプロイ（概要）
1. Azure で Function App（Node 18、Linux 推奨）を作成。
2. システム割り当てマネージドIDを有効化し、対象サブスクリプションに Reader 以上を付与。
3. 必要に応じてアプリ設定に `AZURE_SUBSCRIPTION_ID` を追加。
4. VS Code からデプロイ、または Functions Core Tools で発行:
```bash
func azure functionapp publish <your-function-app-name>
```

## 開発メモ
- TypeScript コンパイル: `npm run build` / `npm run watch`
- 主要コード:
  - `src/functions/mcpResourceGraph.ts` – MCP ツールの公開と引数定義
  - `src/logics/queryGraphLogic.ts` – Resource Graph REST API 実行
  - `src/utils/auth.ts` – `DefaultAzureCredential` によるトークン取得
- API 呼び出し先:
  - `POST https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2022-10-01`

## ライセンス
このリポジトリのライセンスが未定義の場合は、社内/個人の合意に従って取り扱ってください。