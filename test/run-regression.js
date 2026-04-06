import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { aggregateFacets } from '../src/aggregator.js';
import { generateMetrics } from '../src/metrics.js';
import { readJsonlFile, groupBySession, isConversationalSession } from '../src/reader.js';

async function testReader() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-chat-insight-'));
  const file = path.join(tempDir, 'sample.jsonl');
  await fs.writeFile(
    file,
    [
      '{"sessionId":"s1","type":"user","timestamp":"2026-04-01T10:00:00Z"}',
      '  ',
      '{"sessionId":"s1","type":"assistant","timestamp":"2026-04-01T10:01:00Z"}',
      '{not-json}',
    ].join('\n'),
    'utf-8',
  );

  const records = await readJsonlFile(file);
  assert.equal(records.length, 2);
  assert.equal(records[0].type, 'user');
  assert.equal(records[1].type, 'assistant');

  const grouped = groupBySession([
    { sessionId: 'a', type: 'user' },
    { type: 'assistant' },
    { sessionId: 'a', type: 'assistant' },
    { sessionId: 'b', type: 'user' },
  ]);
  assert.equal(grouped.size, 2);
  assert.equal(grouped.get('a').length, 2);
  assert.equal(grouped.get('b').length, 1);

  assert.equal(isConversationalSession([{ type: 'user' }, { type: 'assistant' }]), true);
  assert.equal(isConversationalSession([{ type: 'user' }]), false);
}

function testAggregator() {
  const facets = [
    {
      user_satisfaction_counts: { happy: 2, neutral: 1 },
      friction_counts: { delay: 1 },
      primary_success: 'resolved',
      outcome: 'success',
      goal_categories: { coding: 2 },
    },
    {
      user_satisfaction_counts: { happy: 1, sad: 2 },
      friction_counts: { delay: 2, confusion: 1 },
      primary_success: 'none',
      outcome: 'partial',
      goal_categories: { coding: 1, learning: 3 },
    },
  ];

  assert.deepEqual(aggregateFacets(facets), {
    satisfactionAgg: { happy: 3, neutral: 1, sad: 2 },
    frictionAgg: { delay: 3, confusion: 1 },
    primarySuccessAgg: { resolved: 1 },
    outcomesAgg: { success: 1, partial: 1 },
    goalsAgg: { coding: 3, learning: 3 },
  });
}

function testMetrics() {
  const sessionMap = new Map([
    [
      's1',
      [
        { sessionId: 's1', type: 'user', timestamp: '2026-04-01T10:00:00.000Z' },
        { sessionId: 's1', type: 'assistant', timestamp: '2026-04-01T10:05:00.000Z', message: { parts: [{ functionCall: { name: 'read_file' } }] } },
        { sessionId: 's1', type: 'system', subtype: 'slash_command', timestamp: '2026-04-01T10:06:00.000Z' },
      ],
    ],
    [
      's2',
      [
        { sessionId: 's2', type: 'user', timestamp: '2026-04-02T11:00:00.000Z' },
        { sessionId: 's2', type: 'assistant', timestamp: '2026-04-02T11:10:00.000Z', message: { parts: [{ functionCall: { name: 'read_file' } }, { functionCall: { name: 'run_test' } }] } },
      ],
    ],
  ]);

  const { metrics, sessions } = generateMetrics(sessionMap);
  assert.equal(metrics.totalSessions, 2);
  assert.equal(metrics.totalMessages, 3);
  assert.equal(metrics.totalHours, 0);
  assert.equal(metrics.longestWorkDuration, 10);
  assert.equal(metrics.longestWorkDate, '2026-04-02');
  assert.deepEqual(metrics.heatmap, { '2026-04-01': 2, '2026-04-02': 1 });
  assert.deepEqual(metrics.topTools, [['read_file', 2], ['run_test', 1]]);
  assert.equal(sessions.length, 2);
}

async function main() {
  await testReader();
  testAggregator();
  testMetrics();
  console.log('Regression checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
