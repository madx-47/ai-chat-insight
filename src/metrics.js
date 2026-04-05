/**
 * generateMetrics — Layer 1 of the pipeline.
 * Pure computation over raw ChatRecord[]. No LLM calls.
 *
 * Returns MetricsData plus a SessionMeta[] array for every session found.
 */

/**
 * Format a Date as YYYY-MM-DD (local date, not UTC).
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate current and longest streaks from a list of active date strings.
 * @param {string[]} dates - array of 'YYYY-MM-DD' strings (may have duplicates)
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
function calculateStreaks(dates) {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Deduplicate and sort ascending
  const unique = [...new Set(dates)].sort();
  const dateObjs = unique.map((d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  });

  let currentStreak = 1;
  let longestStreak = 1;
  let runStreak = 1;

  for (let i = 1; i < dateObjs.length; i++) {
    const diffDays = Math.floor(
      (dateObjs[i].getTime() - dateObjs[i - 1].getTime()) / 86_400_000,
    );

    if (diffDays === 1) {
      runStreak++;
      longestStreak = Math.max(longestStreak, runStreak);
    } else if (diffDays > 1) {
      runStreak = 1;
    }
    // diffDays === 0 → same day, no change
  }

  // Is the streak still active? (last active day was today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastActive = dateObjs[dateObjs.length - 1];
  currentStreak =
    lastActive.getTime() === today.getTime() ||
    lastActive.getTime() === yesterday.getTime()
      ? runStreak
      : 0;

  return { currentStreak, longestStreak };
}

/**
 * Build SessionMeta for one session's records.
 * @param {string} sessionId
 * @param {object[]} records
 * @returns {import('./types.js').SessionMeta}
 */
function buildSessionMeta(sessionId, records) {
  const timestamps = records.map((r) => new Date(r.timestamp)).filter(Boolean);
  const startTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));
  const endTime = new Date(Math.max(...timestamps.map((t) => t.getTime())));
  const durationMinutes = Math.round((endTime - startTime) / 60_000);

  // Count actual user messages (not tool_results, not system)
  const messageCount = records.filter((r) => r.type === 'user').length;

  // Collect unique tool names called by the assistant
  const toolCallSet = new Set();
  for (const r of records) {
    if (r.type === 'assistant' && r.message?.parts) {
      for (const part of r.message.parts) {
        if (part.functionCall?.name) {
          toolCallSet.add(part.functionCall.name);
        }
      }
    }
  }

  return {
    session_id: sessionId,
    record_count: records.length,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_minutes: durationMinutes,
    message_count: messageCount,
    tool_calls: [...toolCallSet],
  };
}

/**
 * Main metrics generator.
 *
 * @param {Map<string, object[]>} sessionMap - sessionId → ChatRecord[]
 * @returns {{ metrics: import('./types.js').MetricsData, sessions: import('./types.js').SessionMeta[] }}
 */
export function generateMetrics(sessionMap) {
  const heatmap = {};
  const activeHours = {};
  const toolUsage = {};
  const activeDates = [];
  let totalMessages = 0;
  let totalDurationMs = 0;
  let longestWorkDuration = 0;
  let longestWorkDate = null;

  const sessions = [];

  for (const [sessionId, records] of sessionMap) {
    const meta = buildSessionMeta(sessionId, records);
    sessions.push(meta);

    // Accumulate total duration
    totalDurationMs += meta.duration_minutes * 60_000;

    if (meta.duration_minutes > longestWorkDuration) {
      longestWorkDuration = meta.duration_minutes;
      longestWorkDate = formatDate(new Date(meta.start_time));
    }

    // Walk every record for heatmap, activeHours, messages, tools
    for (const record of records) {
      const ts = new Date(record.timestamp);
      const dateKey = formatDate(ts);
      const hour = ts.getHours();

      // Count user messages and slash commands as "active interactions"
      const isUserMsg = record.type === 'user';
      const isSlashCmd =
        record.type === 'system' && record.subtype === 'slash_command';

      if (isUserMsg || isSlashCmd) {
        totalMessages++;
        heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;
        activeHours[hour] = (activeHours[hour] || 0) + 1;
        activeDates.push(dateKey);
      }

      // Tool usage from assistant function calls
      if (record.type === 'assistant' && record.message?.parts) {
        for (const part of record.message.parts) {
          if (part.functionCall?.name) {
            const name = part.functionCall.name;
            toolUsage[name] = (toolUsage[name] || 0) + 1;
          }
        }
      }
    }
  }

  const { currentStreak, longestStreak } = calculateStreaks(activeDates);
  const totalHours = Math.round(totalDurationMs / 3_600_000);

  const topTools = Object.entries(toolUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    metrics: {
      totalSessions: sessionMap.size,
      totalMessages,
      totalHours,
      heatmap,
      activeHours,
      currentStreak,
      longestStreak,
      longestWorkDuration,
      longestWorkDate,
      topTools,
      // Lines/files only available if tool results contain diff data
      // Kept as 0 for now; extendable later
      totalLinesAdded: 0,
      totalLinesRemoved: 0,
      totalFiles: 0,
    },
    sessions,
  };
}
