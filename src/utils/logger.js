/**
 * Structured JSON logger.
 *
 * WARN and ERROR entries are also pushed into the in-process fraud log
 * so the admin dashboard can surface recent alerts without a log aggregator.
 */

const fraudLog = [];
const MAX_FRAUD_LOG = 2000;

export function log(level, action, data = {}) {
  const entry = { ts: new Date().toISOString(), level, action, ...data };
  console.log(JSON.stringify(entry));

  if (level === 'WARN' || level === 'ERROR') {
    fraudLog.push(entry);
    if (fraudLog.length > MAX_FRAUD_LOG) fraudLog.shift();
  }
}

/** Returns the most recent N fraud/error entries (default: 20). */
export function getRecentFraudAlerts(n = 20) {
  return fraudLog.slice(-n);
}
