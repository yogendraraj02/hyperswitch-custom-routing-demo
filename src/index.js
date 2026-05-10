const express = require('express');
const { selectConnector } = require('./selectConnector.helper');
const { createPayment } = require('./hyperswitchClient');
const { insertTrace, getTrace } = require('./db');
const { register, routingDecisionsTotal } = require('./metrics');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

app.post('/payments', async (req, res) => {
  const { amount, currency = 'USD', idempotency_key } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'amount is required' });
  }

  // Step 1: Cost-aware routing decision
  const routingDecision = selectConnector(currency, amount);
  console.log(routingDecision);

  if (!routingDecision.selected) {
    routingDecisionsTotal.inc({ connector: 'none', outcome: 'rejected' });
    return res.status(503).json({
      error: 'No connector available',
      routing_trace: routingDecision,
    });
  }

  // Determine outcome label
  const outcome = routingDecision.reason?.startsWith('fallback') ? 'fallback' : 'success';
  routingDecisionsTotal.inc({ connector: routingDecision.selected, outcome });

  try {
    // Step 2: Call Hyperswitch with selected connector
    const payment = await createPayment({
      amount,
      currency,
      connector: routingDecision.selected,
      idempotencyKey: idempotency_key || randomUUID(),
    });

    // Step 3: Persist trace to SQLite
    insertTrace({
      payment_id: payment.payment_id,
      amount,
      currency,
      selected: routingDecision.selected,
      reason: routingDecision.reason,
      decisions: routingDecision.decisions,
      status: payment.status,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      payment_id: payment.payment_id,
      status: payment.status,
      connector_used: routingDecision.selected,
      routing_trace: routingDecision,
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Payment failed',
      connector_attempted: routingDecision.selected,
      routing_trace: routingDecision,
      details: err.response?.data || err.message,
    });
  }
});

app.get('/v1/payments/:id/routing-trace', (req, res) => {
  const trace = getTrace(req.params.id);
  if (!trace) return res.status(404).json({ error: 'Trace not found' });
  return res.json(trace);
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Router running on port ${PORT}`));

module.exports = app;
