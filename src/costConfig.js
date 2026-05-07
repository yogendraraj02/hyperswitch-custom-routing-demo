// Cost table: connector -> currency -> fee percentage
const COST_TABLE = {
  stripe: {
    USD: 2.9,
    EUR: 2.5,
    INR: 3.5,
  },
  paypal: {
    USD: 3.5,
    EUR: 3.2,
    INR: 4.0,
  },
  fauxpay: {
    USD: 1.8,
    EUR: 1.9,
    INR: 2.5,
  },
  pretendpay: {
    USD: 2.0,
    EUR: 2.1,
    INR: 2.8,
  },
};

// Minimum success rate floor (below this, connector is skipped)
const SUCCESS_RATE_FLOOR = 0.85;

// Mock success rates (in production: pulled from DB/metrics)
const SUCCESS_RATES = {
  stripe: 0.97,
  paypal: 0.91,
  fauxpay: 0.82, // below floor - will be skipped
  pretendpay: 0.88,
};

module.exports = { COST_TABLE, SUCCESS_RATE_FLOOR, SUCCESS_RATES };