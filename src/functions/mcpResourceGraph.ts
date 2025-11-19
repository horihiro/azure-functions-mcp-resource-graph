import { app, arg, InvocationContext } from "@azure/functions";
import { getMSIToken } from '../utils/auth';
import { queryGraphLogic } from '../logics/queryGraphLogic';

import type { LogicOutput } from '../../types/types';

export async function mcpQueryGraph(toolArguments: unknown, context: InvocationContext): Promise<string> {
  const mcpToolArgs = toolArguments['arguments'] as {
    subscriptions?: string[];
    query: string;
  };
  const token = await getMSIToken();
  if (!token) {
    const errorMsg = 'Failed to obtain Entra ID token';
    context.error(errorMsg);
    return errorMsg;
  }
  const parameters = {
    subscriptions: mcpToolArgs.subscriptions,
    query: mcpToolArgs.query
  };

  context.log('Parameters for queryGraphLogic:', JSON.stringify(parameters));
  const output: LogicOutput = await queryGraphLogic(parameters, token);
  !output.success && context.error(output.message);

  return output.message;
}

app.mcpTool('mcpQueryGraph', {
  toolName: 'query_resource_graph',
  description: 'Query Azure Resource Graph with Kusto Query Language (KQL)',
  toolProperties: {
    subscriptions: arg.string().asArray().describe('List of Azure Subscription IDs to query. If not provided, the default subscription set to the Function App will be used.').optional(),
    query: arg.string().describe(
`The Kusto Query Language (KQL) query to execute against Azure Resource Graph. 
Use the Resources table to query resources and the ResourceContainers table to query resource groups and subscriptions.
Use the =~ operator for case-insensitive matching. For example: Resources | where type =~ "Microsoft.Compute/virtualMachines".
Refer to the official documentation for more details: https://learn.microsoft.com/en-us/azure/governance/resource-graph/concepts/query-language`)
  },
  handler: mcpQueryGraph
})