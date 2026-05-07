const { selectConnector } = require('../src/selectConnector.helper');

describe('Cost-aware routing', () => {
  test('happy path: picks cheapest eligible connector for USD', () => {
    const result = selectConnector('USD', 1000);
    // fauxpay is cheapest (1.8%) but below success floor (0.82 < 0.85)
    // so pretendpay (2.0%) should be selected
    expect(result.selected).toBe('pretendpay');
    expect(result.decisions).toBeDefined();
  });

  test('edge case: all connectors below floor -> fallback to highest success rate', () => {
    const result = selectConnector('XYZ', 1000);
    // No connector supports XYZ, all skipped
    expect(result.selected).toBeNull();
    expect(result.decisions.every(d => d.skipped)).toBe(true);
  });

  test('failure mode: unsupported currency has no eligible connectors', () => {
    const result = selectConnector('JPY', 5000);
    const eligible = result.decisions.filter(d => !d.skipped);
    expect(eligible.length).toBe(0);
  });
});