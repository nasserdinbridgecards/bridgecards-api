/**
 * Structured JSON logger.
 *
 * WARN and ERROR entries are also pushed into the in-process fraud log
 * so the admin dashboard can surface recent alerts without a log aggregator.
 */

const fraudLog = [];
const MAX_FRAUD_LOG = 2000;
let writeLogEntry = null;
let readRecentAlerts = null;

export function attachLogWriter(writer) {
  writeLogEntry = writer;
}

export function attachRecentAlertsReader(reader) {
  readRecentAlerts = reader;
}

export function log(level, action, data = {}) {
  const entry = { ts: new Date().toISOString(), level, action, ...data };
  console.log(JSON.stringify(entry));

  if (writeLogEntry) {
    Promise.resolve(writeLogEntry(entry)).catch((err) => {
      console.error(`DB log write failed: ${err.message}`);
    });
  }

  if (level === 'WARN' || level === 'ERROR') {
    fraudLog.push(entry);
    if (fraudLog.length > MAX_FRAUD_LOG) fraudLog.shift();
  }
}

/** Returns the most recent N fraud/error entries (default: 20). */
export async function getRecentFraudAlerts(n = 20) {
  if (readRecentAlerts) {
    try {
      return await readRecentAlerts(n);
    } catch {
      return fraudLog.slice(-n);
    }
  }
  return fraudLog.slice(-n);
}
