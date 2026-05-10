const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// outcome: 'success' | 'fallback' | 'rejected'
const routingDecisionsTotal = new client.Counter({
  name: 'routing_decisions_total',
  help: 'Total number of routing decisions made',
  labelNames: ['connector', 'outcome'],
  registers: [register],
});

module.exports = { register, routingDecisionsTotal };
