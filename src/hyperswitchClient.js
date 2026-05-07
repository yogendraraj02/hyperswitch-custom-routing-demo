const axios = require("axios");

const HYPERSWITCH_BASE = "https://sandbox.hyperswitch.io";
const API_KEY =  process.env.HYPERSWITCH_API_KEY

async function createPayment({ amount, currency, connector }) {
  const response = await axios.post(
    `${HYPERSWITCH_BASE}/payments`,
    {
      amount,
      currency,
      payment_method: "card",
      payment_method_type: "credit",
      payment_method_data: {
        card: {
          card_number: "4242424242424242",
          card_exp_month: "12",
          card_exp_year: "30",
          card_holder_name: "Test User",
          card_cvc: "123",
        },
      },
      connector: [connector],   
      routing: {
        type: 'single',
        data: { connector }
      },
      confirm: true,
      capture_method: "automatic",
    },
    {
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
}

module.exports = { createPayment };
