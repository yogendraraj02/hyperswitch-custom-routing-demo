const {
  COST_TABLE,
  SUCCESS_RATE_FLOOR,
  SUCCESS_RATES,
} = require("./costConfig");

function selectConnector(currency, amount) {
  const connectors = Object.keys(COST_TABLE);
  const decisions = [];

  for (const connector of connectors) {
    const fee = COST_TABLE[connector][currency];
    const successRate = SUCCESS_RATES[connector];

    if (fee === undefined) {
      decisions.push({
        connector,
        skipped: true,
        reason: `currency ${currency} not supported`,
      });
      continue;
    }

    if (successRate < SUCCESS_RATE_FLOOR) {
      decisions.push({
        connector,
        skipped: true,
        reason: `success_rate ${successRate} below floor ${SUCCESS_RATE_FLOOR}`,
        fee,
      });
      continue;
    }

    decisions.push({ connector, skipped: false, fee, successRate });
  }

  // Among eligible connectors, pick cheapest
  const eligible = decisions.filter((d) => !d.skipped);

  if (eligible.length === 0) {
    // Check if skipped due to success rate OR unsupported currency
    const hasUnsupportedCurrency = decisions.every((d) =>
      d.reason?.includes("not supported"),
    );

    if (hasUnsupportedCurrency) {
      return {
        selected: null,
        reason: `no connector supports currency ${currency}`,
        decisions,
      };
    }

    // All below floor - fallback to highest success rate
    const fallback = decisions
      .filter((d) => SUCCESS_RATES[d.connector] !== undefined)
      .sort(
        (a, b) => SUCCESS_RATES[b.connector] - SUCCESS_RATES[a.connector],
      )[0];

    return {
      selected: fallback?.connector || null,
      reason: "fallback: all connectors below success rate floor",
      decisions,
    };
  }

  const cheapest = eligible.sort((a, b) => a.fee - b.fee)[0];

  return {
    selected: cheapest.connector,
    reason: `cheapest eligible connector for ${currency}`,
    decisions,
  };
}

module.exports = { selectConnector };
