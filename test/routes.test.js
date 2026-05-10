const { selectConnector } = require('../src/selectConnector.helper');

describe('Cost-aware routing', () => {
  test('happy path: picks cheapest eligible connector for USD', () => {
    const result = selectConnector('USD', 1000);
    // fauxpay is cheapest (1.8%) but below success floor (0.82 < 0.85)
    // so pretendpay (2.0%) should be selected
    expect(result.selected).toBe('pretendpay');
    expect(result.decisions).toBeDefined();
  });

  test('fallback: all connectors below success rate floor -> selects highest success rate', () => {
    // Raise the floor to 0.99 so every connector (max 0.97) fails the check,
    // but all support USD — triggering the fallback branch.
    jest.mock('../src/costConfig', () => ({
      COST_TABLE: {
        stripe:     { USD: 2.9 },
        paypal:     { USD: 3.5 },
        fauxpay:    { USD: 1.8 },
        pretendpay: { USD: 2.0 },
      },
      SUCCESS_RATE_FLOOR: 0.99,
      SUCCESS_RATES: {
        stripe:     0.97,
        paypal:     0.91,
        fauxpay:    0.82,
        pretendpay: 0.88,
      },
    }));
    jest.resetModules();

    const { selectConnector: select } = require('../src/selectConnector.helper');
    const result = select('USD', 1000);

    expect(result.selected).toBe('stripe'); // highest success rate (0.97)
    expect(result.reason).toMatch(/fallback/i);
    expect(result.decisions.every(d => d.skipped)).toBe(true);
  });

  test('failure mode: unsupported currency has no eligible connectors', () => {
    const result = selectConnector('JPY', 5000);
    const eligible = result.decisions.filter(d => !d.skipped);
    expect(eligible.length).toBe(0);
  });
});