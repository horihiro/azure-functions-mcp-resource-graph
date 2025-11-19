import type { LogicOutput } from '../../types/types';
import { reSubscriptionId } from '../utils/patterns';

export async function queryGraphLogic(parameters: {
  subscriptions?: string[];
  query: string;
}, token: string): Promise<LogicOutput> {
  const { subscriptions, query } = parameters;

  const output: LogicOutput = {
    success: false,
    message: ''
  };
  if (!token) {
    output.message = 'Failed to obtain Azure AD token';
    return output;
  }

  if (!query) {
    output.message = 'Query is required';
    return output;
  }

  const subs = subscriptions || [];
  if (subs.length === 0) {
    subs.push(process.env.AZURE_SUBSCRIPTION_ID || '');
  }
  if (subs.filter(sub => !sub.toLowerCase().match(reSubscriptionId)).length > 0) {
    output.message = `One or more subscription IDs are invalid:
    ${subs.join(',\n')}`;
    return output;
  }

  const body: {
    subscriptions: string[];
    query: string;
  } = {
    subscriptions: subs,
    query
  };

  const uri = `https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2022-10-01`;
  const graphDataResponse = await fetch(uri, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  if (!graphDataResponse.ok) {
    output.message = `Failed to graph data: ${graphDataResponse.status} ${graphDataResponse.statusText}`;
    output.status = graphDataResponse.status;
    return output;
  }
  const graphData = await graphDataResponse.json();
  output.message = JSON.stringify(graphData);

  output.success = true;
  return output;
}
