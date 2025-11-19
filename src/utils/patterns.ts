const reUuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
export const reSubscriptionId = new RegExp(`^${reUuid.source}$`, 'i');
export const reResourceGroupId = new RegExp(`^\/subscriptions\/(${reUuid.source})\/resourcegroups\/([^\/]+)$`, 'i');
export const reResourceId = new RegExp(`${reResourceGroupId.source.replace(/\$$/, '')}\/providers\/([^\/]+\/(?:.*))`, 'i');