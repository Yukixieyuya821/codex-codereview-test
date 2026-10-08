export const fulfillmentReport = orders => ({reserved: orders.filter(order => order.state === 'reserved').length});
