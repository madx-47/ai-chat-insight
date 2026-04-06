import fs from 'fs/promises';

/**
 * Read a .jsonl file and return an array of parsed ChatRecord objects.
 * Skips blank lines and lines that fail to parse (with a warning).
 *
 * @param {string} filePath - absolute or relative path to the .jsonl file
 * @returns {Promise<object[]>} array of ChatRecord objects
 */
export async function readJsonlFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  const lines = raw.split('\n');
  const records = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      records.push(JSON.parse(line));
    } catch (err) {
      console.warn(`[reader] Skipping malformed JSON at line ${i + 1}: ${err.message}`);
    }
  }

  return records;
}

/**
 * Group a flat list of ChatRecords by their sessionId.
 *
 * @param {object[]} records
 * @returns {Map<string, object[]>} sessionId → records[]
 */
export function groupBySession(records) {
  const map = new Map();
  const getBucket = (id) => {
    if (!map.has(id)) map.set(id, []);
    return map.get(id);
  };

  for (const record of records) {
    const id = record.sessionId;
    if (!id) continue;
    getBucket(id).push(record);
  }

  return map;
}

/**
 * A session is "conversational" only if it has at least one 'user' record
 * AND at least one 'assistant' record. System-only or telemetry-only
 * sessions have no conversation value for facet analysis.
 *
 * @param {object[]} records
 * @returns {boolean}
 */
export function isConversationalSession(records) {
  let hasUser = false;
  let hasAssistant = false;

  for (const r of records) {
    if (r.type === 'user') hasUser = true;
    if (r.type === 'assistant') hasAssistant = true;
    if (hasUser && hasAssistant) return true;
  }

  return false;
}
