const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'routing_traces.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS routing_traces (
    payment_id TEXT PRIMARY KEY,
    amount     INTEGER NOT NULL,
    currency   TEXT    NOT NULL,
    selected   TEXT,
    reason     TEXT,
    decisions  TEXT    NOT NULL,
    status     TEXT,
    timestamp  TEXT    NOT NULL
  )
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO routing_traces
    (payment_id, amount, currency, selected, reason, decisions, status, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertTrace(trace) {
  insertStmt.run(
    trace.payment_id,
    trace.amount,
    trace.currency,
    trace.selected,
    trace.reason,
    JSON.stringify(trace.decisions),
    trace.status,
    trace.timestamp,
  );
}

function getTrace(paymentId) {
  const row = db.prepare('SELECT * FROM routing_traces WHERE payment_id = ?').get(paymentId);
  if (!row) return null;
  return { ...row, decisions: JSON.parse(row.decisions) };
}

module.exports = { insertTrace, getTrace };
