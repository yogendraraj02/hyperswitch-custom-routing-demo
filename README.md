# Hyperswitch Cost-Aware Router

Custom routing proxy for Hyperswitch that picks the cheapest connector
above a minimum success-rate floor.

---

## Quickstart (< 5 min)

### Prerequisites

- Node.js 18+
- Hyperswitch sandbox account + API key

---

## Setup

```bash
git clone https://github.com/yogendraraj02/hyperswitch-custom-routing-demo.git
cd hyperswitch-custom-routing-demo
npm install

export HYPERSWITCH_API_KEY=your_key_here
npm start
```

---

## Send a Test Payment

```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "USD"}'
```

---

## See Routing Decision in Response

```json
{
  "payment_id": "pay_xxx",
  "status": "succeeded",
  "connector_used": "pretendpay",
  "routing_trace": {
    "selected": "pretendpay",
    "reason": "cheapest eligible connector for USD",
    "decisions": [...]
  }
}
```

---

## Get Routing Trace by Payment ID

```bash
curl http://localhost:3000/v1/payments/pay_xxx/routing-trace
```

---

## Run Tests

```bash
npm test
```

---

## Custom Logic

- Cost table (fee %) per connector per currency defined in `src/costConfig.js`
- Success rate floor: `85%`
- Connectors below floor are skipped
- Fallback: highest success rate connector if all below floor

---

## Routing Logic

- `fauxpay`: cheapest (`1.8% USD`) but `success_rate 0.82` → skipped
- `pretendpay`: `2.0% USD`, `success_rate 0.88` → selected