import { DefaultAzureCredential } from '@azure/identity';

export async function getMSIToken() {
  const credential = new DefaultAzureCredential();
  const { token } = await credential.getToken('https://management.azure.com/.default');

  return token;
}
