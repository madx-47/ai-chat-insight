/**
 * insight-template.js
 *
 * Returns the CSS and JS strings to embed inside the self-contained HTML report.
 * The JS is written using React.createElement (no JSX) so it runs directly in
 * the browser after being loaded from CDN React 18.
 *
 * Architecture mirrors the Qwen web-templates package:
 *   getInsightCSS() → CSS string
 *   getInsightJS()  → JS string (browser-runnable, uses window.React / window.ReactDOM)
 */

export function getInsightCSS() {
  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
body { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 100vh; color: #0f172a; }

.mx-auto { margin-left: auto; margin-right: auto; }
.max-w-6xl { max-width: 72rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }

/* ── Header ── */
.insights-header { background: white; border-bottom: 1px solid #e2e8f0; padding: 20px 0; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.header-content { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.header-title { font-size: 1.75rem; font-weight: 700; color: #0f172a; letter-spacing: -0.025em; }
.header-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 4px; }

/* Export button */
.export-dropdown-wrapper { position: relative; }
.export-card-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
.export-card-btn:hover { background: #1e293b; }
.export-chevron { transition: transform 0.15s; }
.export-chevron.open { transform: rotate(180deg); }
.export-dropdown { position: absolute; right: 0; top: calc(100% + 6px); background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.1); z-index: 50; min-width: 160px; overflow: hidden; }
.export-dropdown-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: none; border: none; font-size: 13px; color: #374151; cursor: pointer; transition: background 0.12s; }
.export-dropdown-item:hover { background: #f8fafc; }

/* ── At a Glance ── */
.at-a-glance { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 16px; padding: 24px; margin-bottom: 32px; }
.glance-title { font-size: 15px; font-weight: 700; color: #92400e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.glance-title::before { content: '⚡'; }
.glance-sections { display: flex; flex-direction: column; gap: 12px; }
.glance-section { font-size: 14px; color: #78350f; line-height: 1.6; }
.glance-section strong { color: #92400e; font-weight: 700; }
.see-more { color: #b45309; text-decoration: none; font-size: 13px; white-space: nowrap; margin-left: 4px; }
.see-more:hover { text-decoration: underline; }

/* ── Nav TOC ── */
.nav-toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 32px 0; padding: 14px 16px; background: white; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.nav-toc a { font-size: 12px; color: #64748b; text-decoration: none; padding: 5px 12px; border-radius: 20px; background: #f1f5f9; transition: all 0.15s; }
.nav-toc a:hover { background: #0f172a; color: white; }

/* ── Stats Row ── */
.stats-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; }
.stat { flex: 1; min-width: 100px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,.04); transition: box-shadow 0.15s; }
.stat:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
.stat-label { font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

/* ── Section headings ── */
.section-heading { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }

/* ── Project Areas ── */
.project-areas { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
.project-area { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; transition: box-shadow 0.15s; }
.project-area:hover { box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.area-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.area-name { font-weight: 600; font-size: 15px; color: #0f172a; }
.area-count { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 20px; }
.area-desc { font-size: 14px; color: #475569; line-height: 1.6; }

/* ── Charts grid ── */
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
.bar-chart-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
.bar-chart-title { font-size: 12px; font-weight: 700; color: #64748b; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.05em; }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.bar-label { width: 130px; font-size: 13px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.bar-wrapper { flex: 1; display: flex; align-items: center; gap: 8px; }
.bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.bar-value { font-size: 13px; font-weight: 600; color: #475569; min-width: 24px; text-align: right; }

/* ── Glass Card (Active Hours / Heatmap) ── */
.glass-card { background: rgba(255,255,255,.85); border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(15,23,42,.06); margin-bottom: 16px; }
.glass-card-title { font-size: 1rem; font-weight: 600; color: #0f172a; }
.active-hours-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.active-hours-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.active-hours-label { font-size: 14px; font-weight: 500; color: #334155; flex: 1; }
.active-hours-time { font-size: 12px; color: #94a3b8; }
.active-hours-count { font-size: 14px; font-weight: 600; color: #0f172a; }
.active-hours-bar { width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; margin-top: 4px; margin-bottom: 8px; }
.active-hours-fill { height: 100%; border-radius: 5px; }

/* ── Heatmap ── */
.heatmap-container { overflow-x: auto; margin-top: 8px; }
.heatmap-legend { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; margin-top: 8px; }
.heatmap-legend-box { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }

/* ── Narrative / Interaction Style ── */
.narrative { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 16px; font-size: 14px; color: #475569; line-height: 1.8; }
.key-insight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 12px; font-size: 14px; color: #166534; }

/* ── Big Wins (Impressive Workflows) ── */
.section-intro { font-size: 14px; color: #64748b; margin-bottom: 16px; line-height: 1.6; }
.big-wins { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.big-win { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 10px; padding: 16px; }
.big-win-title { font-weight: 600; font-size: 15px; color: #166534; margin-bottom: 6px; }
.big-win-desc { font-size: 14px; color: #15803d; line-height: 1.6; }

/* ── Friction ── */
.friction-categories { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.friction-category { background: white; border: 1px solid #fca5a5; border-radius: 10px; padding: 16px; }
.friction-title { font-weight: 600; font-size: 15px; color: #991b1b; margin-bottom: 6px; }
.friction-desc { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 8px; }
.friction-examples { padding-left: 18px; }
.friction-examples li { font-size: 13px; color: #64748b; margin-bottom: 4px; line-height: 1.5; }

/* ── Improvements ── */
.qwen-md-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
.qwen-md-section h3 { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
.qwen-md-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
.qwen-md-item:last-child { border-bottom: none; }
.cmd-checkbox { width: 16px; height: 16px; margin-top: 3px; cursor: pointer; flex-shrink: 0; }
.cmd-code { font-size: 13px; font-family: ui-monospace, monospace; color: #0f172a; display: block; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; white-space: pre-wrap; }
.cmd-why { font-size: 13px; color: #64748b; line-height: 1.5; }
.copy-all-btn { font-size: 12px; font-weight: 500; padding: 6px 14px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.copy-all-btn:hover { background: #1e293b; }
.copy-all-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.features-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.feature-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
.feature-title { font-weight: 600; font-size: 15px; color: #1e40af; margin-bottom: 6px; }
.feature-oneliner { font-size: 14px; color: #334155; margin-bottom: 8px; line-height: 1.5; }
.feature-why { font-size: 13px; color: #64748b; margin-bottom: 8px; line-height: 1.5; }
.example-code-row { display: flex; align-items: flex-start; gap: 8px; }
.example-code { flex: 1; font-size: 12px; font-family: ui-monospace, monospace; background: #f1f5f9; padding: 8px 10px; border-radius: 6px; color: #0f172a; white-space: pre-wrap; display: block; }

.patterns-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.pattern-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
.pattern-title { font-weight: 600; font-size: 15px; color: #0f172a; margin-bottom: 4px; }
.pattern-summary { font-size: 14px; color: #334155; margin-bottom: 6px; }
.pattern-detail { font-size: 13px; color: #64748b; margin-bottom: 10px; line-height: 1.5; }
.copyable-prompt-section { background: #f8fafc; border-radius: 8px; padding: 10px 12px; }
.prompt-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 600; }
.copyable-prompt-row { display: flex; align-items: flex-start; gap: 8px; }
.copyable-prompt { flex: 1; font-size: 12px; font-family: ui-monospace, monospace; color: #334155; white-space: pre-wrap; display: block; }

/* ── Horizon (Future Opportunities) ── */
.horizon-section { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.horizon-card { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #93c5fd; border-radius: 12px; padding: 20px; }
.horizon-title { font-weight: 700; font-size: 16px; color: #1e40af; margin-bottom: 10px; }
.horizon-possible { font-size: 14px; color: #1e3a8a; line-height: 1.7; margin-bottom: 10px; }
.horizon-tip { font-size: 13px; color: #3b82f6; line-height: 1.5; margin-bottom: 10px; }
.pattern-prompt { background: rgba(255,255,255,.6); border-radius: 8px; padding: 10px 12px; }

/* ── Memorable Moment ── */
.fun-ending { background: linear-gradient(135deg, #fdf4ff, #fae8ff); border: 1px solid #e879f9; border-radius: 16px; padding: 28px 24px; margin: 32px 0 16px; text-align: center; }
.fun-headline { font-size: 1.15rem; font-weight: 700; color: #7e22ce; margin-bottom: 10px; font-style: italic; line-height: 1.4; }
.fun-detail { font-size: 14px; color: #9333ea; line-height: 1.6; }

/* ── Copy button ── */
.copy-btn { flex-shrink: 0; font-size: 11px; padding: 4px 10px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px; cursor: pointer; color: #64748b; transition: all 0.15s; white-space: nowrap; }
.copy-btn:hover { background: #e2e8f0; color: #0f172a; }
.copy-btn.copied { background: #22c55e; color: white; border-color: #22c55e; }

/* ── Share Card ── */
.share-card { margin-top: 40px; padding: 32px; background: #0f172a; border-radius: 20px; color: white; min-width: 720px; }
.share-card.light { background: white; color: #0f172a; }
.share-card-title { font-size: 1.2rem; font-weight: 700; margin-bottom: 20px; }
.share-stats { display: flex; flex-wrap: wrap; gap: 24px; }
.share-stat { }
.share-stat-val { font-size: 2rem; font-weight: 800; color: #38bdf8; }
.share-card.light .share-stat-val { color: #0284c7; }
.share-stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; }
.share-card.light .share-stat-lbl { color: #64748b; }

@media (max-width: 640px) {
  .charts-grid { grid-template-columns: 1fr; }
  .stats-row { gap: 8px; }
  .stat-value { font-size: 1.2rem; }
  .header-title { font-size: 1.3rem; }
}
`;
}

export function getInsightJS() {
  return `
(function() {
  'use strict';
  const h = React.createElement;
  const { useState, useEffect, useRef } = React;
  const data = window.INSIGHT_DATA;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function fmt(str) {
    if (!str) return str;
    // bold **text** → <strong>
    return str.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
  }

  function MarkdownText({ children }) {
    if (!children) return null;
    const html = fmt(String(children));
    return h('span', { dangerouslySetInnerHTML: { __html: html } });
  }

  function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    };
    return h('button', { className: 'copy-btn' + (copied ? ' copied' : ''), onClick: handleCopy },
      copied ? 'Copied!' : 'Copy');
  }

  function formatLabel(label) {
    if (label === 'unclear_from_transcript') return 'Unclear';
    return label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // ── Bar Chart ──────────────────────────────────────────────────────────────

  function HorizontalBarChart({ data: chartData, title, color = '#3b82f6', allowedKeys = null }) {
    if (!chartData) return null;
    let entries = Object.entries(chartData);
    if (allowedKeys) entries = entries.filter(([k]) => allowedKeys.includes(k));
    entries.sort((a, b) => b[1] - a[1]);
    entries = entries.slice(0, 10);
    if (entries.length === 0) return null;
    const maxVal = Math.max(...entries.map(([, v]) => v));

    return h('div', { className: 'bar-chart-card' },
      h('div', { className: 'bar-chart-title' }, title),
      entries.map(([label, count]) => {
        const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
        return h('div', { key: label, className: 'bar-row' },
          h('div', { className: 'bar-label', title: formatLabel(label) }, formatLabel(label)),
          h('div', { className: 'bar-wrapper' },
            h('div', { className: 'bar-bg' },
              h('div', { className: 'bar-fill', style: { width: pct + '%', backgroundColor: color } })),
            h('span', { className: 'bar-value' }, count)
          )
        );
      })
    );
  }

  // ── Active Hours ───────────────────────────────────────────────────────────

  function ActiveHoursChart({ activeHours }) {
    const phases = [
      { label: 'Morning', time: '06–12', hours: [6,7,8,9,10,11], color: '#fbbf24' },
      { label: 'Afternoon', time: '12–18', hours: [12,13,14,15,16,17], color: '#0ea5e9' },
      { label: 'Evening', time: '18–22', hours: [18,19,20,21], color: '#6366f1' },
      { label: 'Night', time: '22–06', hours: [22,23,0,1,2,3,4,5], color: '#475569' },
    ];
    const enriched = phases.map(p => ({ ...p, total: p.hours.reduce((a, h) => a + (activeHours[h] || 0), 0) }));
    const maxTotal = Math.max(...enriched.map(p => p.total), 1);

    return h('div', { className: 'glass-card' },
      h('div', { className: 'glass-card-title', style: { marginBottom: 16 } }, 'Active Hours'),
      enriched.map(item =>
        h('div', { key: item.label },
          h('div', { className: 'active-hours-row' },
            h('span', { className: 'active-hours-dot', style: { background: item.color } }),
            h('span', { className: 'active-hours-label' }, item.label),
            h('span', { className: 'active-hours-time' }, item.time),
            h('span', { className: 'active-hours-count' }, item.total)
          ),
          h('div', { className: 'active-hours-bar' },
            h('div', { className: 'active-hours-fill', style: { width: ((item.total / maxTotal) * 100) + '%', background: item.color } })
          )
        )
      )
    );
  }

  // ── Heatmap ────────────────────────────────────────────────────────────────

  function ActivityHeatmap({ heatmapData }) {
    const cellSize = 13, pad = 2, startX = 40, startY = 20;
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    const levels = [0, 2, 4, 10, 20];
    function getColor(v) {
      if (v === 0) return colors[0];
      for (let i = levels.length - 1; i >= 1; i--) if (v >= levels[i]) return colors[i];
      return colors[1];
    }
    const today = new Date();
    const oneYearAgo = new Date(today); oneYearAgo.setFullYear(today.getFullYear() - 1);
    const dates = [];
    const cur = new Date(oneYearAgo);
    while (cur <= today) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    const startDow = oneYearAgo.getDay();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthLabels = []; let lastMonth = -1, lastX = -100;
    dates.forEach((d, i) => {
      const adj = i + startDow;
      const week = Math.floor(adj / 7);
      const x = startX + week * (cellSize + pad);
      const m = d.getMonth();
      if (m !== lastMonth && x - lastX > 28) { monthLabels.push({ x, text: months[m] }); lastX = x; lastMonth = m; }
    });

    return h('svg', { width: 960, height: 120, viewBox: '0 0 960 120', style: { minWidth: '720px' } },
      dates.map((d, i) => {
        const adj = i + startDow;
        const week = Math.floor(adj / 7);
        const day = d.getDay();
        const x = startX + week * (cellSize + pad);
        const y = startY + day * (cellSize + pad);
        const key = d.toISOString().split('T')[0];
        const val = heatmapData[key] || 0;
        return h('rect', { key, x, y, width: cellSize, height: cellSize, rx: 2, fill: getColor(val) },
          h('title', null, key + ': ' + val + ' activities'));
      }),
      monthLabels.map((lb, i) => h('text', { key: i, x: lb.x, y: 14, fontSize: 11, fill: '#64748b' }, lb.text))
    );
  }

  function HeatmapSection({ heatmap }) {
    const colors = ['#ebedf0','#9be9a8','#40c463','#30a14e','#216e39'];
    return h('div', { className: 'glass-card' },
      h('div', { className: 'glass-card-title' }, 'Activity Heatmap'),
      h('p', { style: { fontSize: 12, color: '#94a3b8', margin: '4px 0 12px' } }, 'Past year of activity'),
      h('div', { className: 'heatmap-container' },
        h(ActivityHeatmap, { heatmapData: heatmap })
      ),
      h('div', { className: 'heatmap-legend' },
        h('span', null, 'Less'),
        colors.map((c, i) => h('span', { key: i, className: 'heatmap-legend-box', style: { background: c } })),
        h('span', null, 'More')
      )
    );
  }

  // ── At a Glance ────────────────────────────────────────────────────────────

  function AtAGlance({ qualitative }) {
    const q = qualitative.atAGlance;
    if (!q) return null;
    return h('div', { className: 'at-a-glance' },
      h('div', { className: 'glance-title' }, 'At a Glance'),
      h('div', { className: 'glance-sections' },
        h('div', { className: 'glance-section' },
          h('strong', null, "What's working: "),
          h(MarkdownText, null, q.whats_working),
          h('a', { href: '#section-wins', className: 'see-more' }, ' Impressive Things You Did →')),
        h('div', { className: 'glance-section' },
          h('strong', null, "What's hindering you: "),
          h(MarkdownText, null, q.whats_hindering),
          h('a', { href: '#section-friction', className: 'see-more' }, ' Where Things Go Wrong →')),
        h('div', { className: 'glance-section' },
          h('strong', null, "Quick wins to try: "),
          h(MarkdownText, null, q.quick_wins),
          h('a', { href: '#section-features', className: 'see-more' }, ' Features to Try →')),
        h('div', { className: 'glance-section' },
          h('strong', null, 'Ambitious workflows: '),
          h(MarkdownText, null, q.ambitious_workflows),
          h('a', { href: '#section-horizon', className: 'see-more' }, ' On the Horizon →'))
      )
    );
  }

  // ── Nav TOC ────────────────────────────────────────────────────────────────

  function NavToc() {
    return h('nav', { className: 'nav-toc' },
      h('a', { href: '#section-work' }, 'What You Work On'),
      h('a', { href: '#section-usage' }, 'How You Use the AI'),
      h('a', { href: '#section-wins' }, 'Impressive Things'),
      h('a', { href: '#section-friction' }, 'Where Things Go Wrong'),
      h('a', { href: '#section-features' }, 'Features to Try'),
      h('a', { href: '#section-patterns' }, 'New Usage Patterns'),
      h('a', { href: '#section-horizon' }, 'On the Horizon')
    );
  }

  // ── Stats Row ─────────────────────────────────────────────────────────────

  function StatsRow({ data: d }) {
    const keys = Object.keys(d.heatmap || {});
    let daysSpan = 0;
    if (keys.length > 0) {
      const ts = keys.map(k => new Date(k).getTime());
      daysSpan = Math.ceil((Math.max(...ts) - Math.min(...ts)) / 86400000) + 1;
    }
    const mpd = daysSpan > 0 ? Math.round((d.totalMessages || 0) / daysSpan) : 0;
    const stats = [
      { value: d.totalMessages || 0, label: 'Messages' },
      { value: '+' + (d.totalLinesAdded||0) + '/-' + (d.totalLinesRemoved||0), label: 'Lines' },
      { value: d.totalFiles || 0, label: 'Files' },
      { value: daysSpan, label: 'Days' },
      { value: mpd, label: 'Msgs/Day' },
    ];
    return h('div', { className: 'stats-row' },
      stats.map(s => h('div', { key: s.label, className: 'stat' },
        h('div', { className: 'stat-value' }, s.value),
        h('div', { className: 'stat-label' }, s.label)
      ))
    );
  }

  // ── Project Areas ─────────────────────────────────────────────────────────

  function ProjectAreas({ qualitative, topGoals, topTools }) {
    const pa = qualitative.projectAreas;
    const toolsObj = typeof topTools === 'object' && !Array.isArray(topTools) ? topTools
      : Array.isArray(topTools) ? Object.fromEntries(topTools) : {};
    return h(React.Fragment, null,
      h('h2', { id: 'section-work', className: 'section-heading' }, 'What You Work On'),
      pa && Array.isArray(pa.areas) && pa.areas.length > 0 && h('div', { className: 'project-areas' },
        pa.areas.map((area, i) => h('div', { key: i, className: 'project-area' },
          h('div', { className: 'area-header' },
            h('span', { className: 'area-name' }, area.name),
            h('span', { className: 'area-count' }, '~' + area.session_count + ' sessions')
          ),
          h('div', { className: 'area-desc' }, h(MarkdownText, null, area.description))
        ))
      ),
      h('div', { className: 'charts-grid' },
        topGoals && Object.keys(topGoals).length > 0 && h(HorizontalBarChart, { data: topGoals, title: 'What You Wanted', color: '#0ea5e9' }),
        Object.keys(toolsObj).length > 0 && h(HorizontalBarChart, { data: toolsObj, title: 'Top Tools Used', color: '#6366f1' })
      )
    );
  }

  // ── Interaction Style ─────────────────────────────────────────────────────

  function InteractionStyle({ qualitative, insights }) {
    const is = qualitative.interactionStyle;
    if (!is) return null;
    return h(React.Fragment, null,
      h('h2', { id: 'section-usage', className: 'section-heading' }, 'How You Use the AI'),
      h('div', { className: 'narrative' },
        h(MarkdownText, null, is.narrative),
        is.key_pattern && h('div', { className: 'key-insight' },
          h('strong', null, 'Key pattern: '), h(MarkdownText, null, is.key_pattern))
      ),
      h(ActiveHoursChart, { activeHours: insights.activeHours || {} }),
      h(HeatmapSection, { heatmap: insights.heatmap || {} })
    );
  }

  // ── Impressive Workflows ──────────────────────────────────────────────────

  function ImpressiveWorkflows({ qualitative, primarySuccess, outcomes }) {
    const iw = qualitative.impressiveWorkflows;
    if (!iw) return null;
    return h(React.Fragment, null,
      h('h2', { id: 'section-wins', className: 'section-heading' }, 'Impressive Things You Did'),
      iw.intro && h('p', { className: 'section-intro' }, h(MarkdownText, null, iw.intro)),
      h('div', { className: 'big-wins' },
        Array.isArray(iw.impressive_workflows) && iw.impressive_workflows.map((w, i) =>
          h('div', { key: i, className: 'big-win' },
            h('div', { className: 'big-win-title' }, w.title),
            h('div', { className: 'big-win-desc' }, h(MarkdownText, null, w.description))
          ))
      ),
      h('div', { className: 'charts-grid' },
        primarySuccess && Object.keys(primarySuccess).length > 0 && h(HorizontalBarChart, {
          data: primarySuccess, title: "What Helped Most (AI Capabilities)", color: '#3b82f6',
          allowedKeys: ['fast_accurate_search','correct_code_edits','good_explanations','proactive_help','multi_file_changes','good_debugging']
        }),
        outcomes && Object.keys(outcomes).length > 0 && h(HorizontalBarChart, {
          data: outcomes, title: 'Outcomes', color: '#8b5cf6',
          allowedKeys: ['fully_achieved','mostly_achieved','partially_achieved','not_achieved','unclear_from_transcript']
        })
      )
    );
  }

  // ── Friction Points ───────────────────────────────────────────────────────

  function FrictionPoints({ qualitative, satisfaction, friction }) {
    const fp = qualitative.frictionPoints;
    if (!fp) return null;
    return h(React.Fragment, null,
      h('h2', { id: 'section-friction', className: 'section-heading' }, 'Where Things Go Wrong'),
      fp.intro && h('p', { className: 'section-intro' }, h(MarkdownText, null, fp.intro)),
      h('div', { className: 'friction-categories' },
        Array.isArray(fp.categories) && fp.categories.map((cat, i) =>
          h('div', { key: i, className: 'friction-category' },
            h('div', { className: 'friction-title' }, cat.category),
            h('div', { className: 'friction-desc' }, h(MarkdownText, null, cat.description)),
            Array.isArray(cat.examples) && cat.examples.length > 0 && h('ul', { className: 'friction-examples' },
              cat.examples.map((ex, j) => h('li', { key: j }, h(MarkdownText, null, ex)))
            )
          ))
      ),
      h('div', { className: 'charts-grid' },
        friction && Object.keys(friction).length > 0 && h(HorizontalBarChart, {
          data: friction, title: 'Primary Friction Types', color: '#ef4444',
          allowedKeys: ['misunderstood_request','wrong_approach','buggy_code','user_rejected_action','excessive_changes']
        }),
        satisfaction && Object.keys(satisfaction).length > 0 && h(HorizontalBarChart, {
          data: satisfaction, title: 'Inferred Satisfaction', color: '#10b981',
          allowedKeys: ['happy','satisfied','likely_satisfied','dissatisfied','frustrated']
        })
      )
    );
  }

  // ── Improvements ─────────────────────────────────────────────────────────

  function SystemPromptAdditions({ additions }) {
    const [checked, setChecked] = useState(additions.map(() => true));
    const [copiedAll, setCopiedAll] = useState(false);
    const handleCheck = i => setChecked(checked.map((v, idx) => idx === i ? !v : v));
    const handleCopyAll = () => {
      const text = additions.filter((_, i) => checked[i]).map(a => a.addition).join('\\n\\n');
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); });
    };
    const checkedCount = checked.filter(Boolean).length;
    return h('div', { className: 'qwen-md-section' },
      h('h3', null, 'Suggested System Prompt Additions'),
      h('p', { style: { fontSize: 12, color: '#94a3b8', marginBottom: 12 } }, 'Copy these into your AI system prompt or notes.'),
      h('button', { className: 'copy-all-btn', onClick: handleCopyAll, disabled: checkedCount === 0 },
        copiedAll ? 'Copied All!' : 'Copy All Checked (' + checkedCount + ')'),
      additions.map((item, i) =>
        h('div', { key: i, className: 'qwen-md-item' },
          h('input', { type: 'checkbox', className: 'cmd-checkbox', checked: checked[i], onChange: () => handleCheck(i) }),
          h('div', { style: { flex: 1 } },
            h('code', { className: 'cmd-code' }, item.addition),
            h('div', { className: 'cmd-why' }, h(MarkdownText, null, item.why))
          ),
          h(CopyButton, { text: item.addition })
        )
      )
    );
  }

  function Improvements({ qualitative }) {
    const imp = qualitative.improvements;
    if (!imp) return null;
    const additions = imp.system_prompt_additions || imp.Qwen_md_additions || [];
    return h(React.Fragment, null,
      h('h2', { id: 'section-features', className: 'section-heading' }, 'Features & Tips to Try'),
      additions.length > 0 && h(SystemPromptAdditions, { additions }),
      Array.isArray(imp.features_to_try) && imp.features_to_try.length > 0 && h('div', { className: 'features-section' },
        imp.features_to_try.map((feat, i) =>
          h('div', { key: i, className: 'feature-card' },
            h('div', { className: 'feature-title' }, feat.feature),
            h('div', { className: 'feature-oneliner' }, h(MarkdownText, null, feat.one_liner)),
            h('div', { className: 'feature-why' }, h('strong', null, 'Why for you: '), h(MarkdownText, null, feat.why_for_you)),
            (feat.example_code || feat.example) && h('div', { style: { marginTop: 8 } },
              h('div', { className: 'example-code-row' },
                h('code', { className: 'example-code' }, feat.example_code || feat.example),
                h(CopyButton, { text: feat.example_code || feat.example })
              )
            )
          )
        )
      ),
      Array.isArray(imp.usage_patterns) && imp.usage_patterns.length > 0 && h(React.Fragment, null,
        h('h2', { id: 'section-patterns', className: 'section-heading' }, 'New Usage Patterns'),
        h('div', { className: 'patterns-section' },
          imp.usage_patterns.map((pat, i) =>
            h('div', { key: i, className: 'pattern-card' },
              h('div', { className: 'pattern-title' }, pat.title),
              h('div', { className: 'pattern-summary' }, h(MarkdownText, null, pat.suggestion)),
              h('div', { className: 'pattern-detail' }, h(MarkdownText, null, pat.detail)),
              pat.copyable_prompt && h('div', { className: 'copyable-prompt-section' },
                h('div', { className: 'prompt-label' }, 'Copyable Prompt'),
                h('div', { className: 'copyable-prompt-row' },
                  h('code', { className: 'copyable-prompt' }, pat.copyable_prompt),
                  h(CopyButton, { text: pat.copyable_prompt })
                )
              )
            )
          )
        )
      )
    );
  }

  // ── Future Opportunities ──────────────────────────────────────────────────

  function FutureOpportunities({ qualitative }) {
    const fo = qualitative.futureOpportunities;
    if (!fo) return null;
    return h(React.Fragment, null,
      h('h2', { id: 'section-horizon', className: 'section-heading' }, 'On the Horizon'),
      fo.intro && h('p', { className: 'section-intro' }, h(MarkdownText, null, fo.intro)),
      h('div', { className: 'horizon-section' },
        Array.isArray(fo.opportunities) && fo.opportunities.map((opp, i) =>
          h('div', { key: i, className: 'horizon-card' },
            h('div', { className: 'horizon-title' }, opp.title),
            h('div', { className: 'horizon-possible' }, h(MarkdownText, null, opp.whats_possible)),
            h('div', { className: 'horizon-tip' }, h('strong', null, 'Getting started: '), h(MarkdownText, null, opp.how_to_try)),
            opp.copyable_prompt && h('div', { className: 'pattern-prompt' },
              h('div', { className: 'prompt-label' }, 'Copyable Prompt'),
              h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 8 } },
                h('code', { style: { flex: 1, fontSize: 12, fontFamily: 'ui-monospace, monospace', color: '#1e3a8a', whiteSpace: 'pre-wrap', display: 'block' } }, opp.copyable_prompt),
                h(CopyButton, { text: opp.copyable_prompt })
              )
            )
          )
        )
      )
    );
  }

  // ── Memorable Moment ──────────────────────────────────────────────────────

  function MemorableMoment({ qualitative }) {
    const mm = qualitative.memorableMoment;
    if (!mm) return null;
    return h('div', { className: 'fun-ending' },
      h('div', { className: 'fun-headline' }, '"' + mm.headline + '"'),
      h('div', { className: 'fun-detail' }, h(MarkdownText, null, mm.detail))
    );
  }

  // ── Share Card ────────────────────────────────────────────────────────────

  function ShareCard({ data: d, theme }) {
    const cls = 'share-card' + (theme === 'light' ? ' light' : '');
    const keys = Object.keys(d.heatmap || {});
    let dateStr = '';
    if (keys.length > 0) {
      const sorted = keys.slice().sort();
      dateStr = sorted[0] + ' → ' + sorted[sorted.length - 1];
    }
    return h('div', { id: 'share-card', className: cls },
      h('div', { className: 'share-card-title' }, '🤖 AI Chat Insights'),
      dateStr && h('div', { style: { fontSize: 12, color: '#94a3b8', marginBottom: 20 } }, dateStr),
      h('div', { className: 'share-stats' },
        h('div', { className: 'share-stat' }, h('div', { className: 'share-stat-val' }, d.totalMessages || 0), h('div', { className: 'share-stat-lbl' }, 'Messages')),
        h('div', { className: 'share-stat' }, h('div', { className: 'share-stat-val' }, d.totalSessions || 0), h('div', { className: 'share-stat-lbl' }, 'Sessions')),
        h('div', { className: 'share-stat' }, h('div', { className: 'share-stat-val' }, Math.round(d.totalHours || 0) + 'h'), h('div', { className: 'share-stat-lbl' }, 'Total Time')),
        h('div', { className: 'share-stat' }, h('div', { className: 'share-stat-val' }, (d.currentStreak || 0) + 'd'), h('div', { className: 'share-stat-lbl' }, 'Current Streak'))
      )
    );
  }

  // ── Export Button ─────────────────────────────────────────────────────────

  function ExportCardButton({ onExport }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      if (!open) return;
      const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);
    return h('div', { className: 'export-dropdown-wrapper', ref },
      h('button', { className: 'export-card-btn', onClick: () => setOpen(!open) },
        '↑ Export Card',
        h('span', { className: 'export-chevron' + (open ? ' open' : '') }, ' ▼')
      ),
      open && h('div', { className: 'export-dropdown' },
        h('button', { className: 'export-dropdown-item', onClick: () => { setOpen(false); onExport('light'); } }, '☀ Light Theme'),
        h('button', { className: 'export-dropdown-item', onClick: () => { setOpen(false); onExport('dark'); } }, '🌙 Dark Theme')
      )
    );
  }

  // ── Main App ──────────────────────────────────────────────────────────────

  function InsightApp({ data: d }) {
    const [cardTheme, setCardTheme] = useState('dark');
    const pendingExport = useRef(false);

    const performExport = async () => {
      const card = document.getElementById('share-card');
      if (!card || !window.html2canvas) { alert('Export not available'); return; }
      try {
        const clone = card.cloneNode(true);
        clone.style.position = 'fixed'; clone.style.left = '-9999px'; clone.style.top = '0';
        document.body.appendChild(clone);
        const canvas = await window.html2canvas(clone, { scale: 2, useCORS: true, width: 1200, height: clone.scrollHeight });
        document.body.removeChild(clone);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'ai-insights-card-' + new Date().toISOString().slice(0,10) + '.png';
        link.click();
      } catch (e) { console.error(e); alert('Export failed'); }
    };

    useEffect(() => {
      if (pendingExport.current) { pendingExport.current = false; performExport(); }
    }, [cardTheme]);

    const handleExport = theme => {
      if (theme === cardTheme) { performExport(); }
      else { pendingExport.current = true; setCardTheme(theme); }
    };

    if (!d) return h('div', { style: { textAlign: 'center', color: '#64748b', paddingTop: '4rem' } }, 'No insight data available.');

    const hKeys = Object.keys(d.heatmap || {});
    let dateRangeStr = '';
    if (hKeys.length > 0) {
      const sorted = hKeys.slice().sort();
      dateRangeStr = sorted[0] + ' to ' + sorted[sorted.length - 1];
    }

    const q = d.qualitative;

    return h('div', null,
      h('header', { className: 'insights-header' },
        h('div', { className: 'header-content' },
          h('div', { className: 'header-title-section' },
            h('h1', { className: 'header-title' }, '🤖 AI Chat Insights'),
            h('p', { className: 'header-subtitle' },
              d.totalMessages ? (d.totalMessages.toLocaleString() + ' messages across ' + (d.totalSessions || 0).toLocaleString() + ' sessions') : 'Your personalized AI conversation patterns',
              dateRangeStr && (' · ' + dateRangeStr)
            )
          ),
          h(ExportCardButton, { onExport: handleExport })
        )
      ),
      h('div', { className: 'mx-auto max-w-6xl px-6 py-10' },
        q && h(AtAGlance, { qualitative: q }),
        q && h(NavToc, null),
        h(StatsRow, { data: d }),
        q && h(ProjectAreas, { qualitative: q, topGoals: d.topGoals, topTools: d.topTools }),
        q && h(InteractionStyle, { qualitative: q, insights: d }),
        q && h(ImpressiveWorkflows, { qualitative: q, primarySuccess: d.primarySuccess, outcomes: d.outcomes }),
        q && h(FrictionPoints, { qualitative: q, satisfaction: d.satisfaction, friction: d.friction }),
        q && h(Improvements, { qualitative: q }),
        q && h(FutureOpportunities, { qualitative: q }),
        q && h(MemorableMoment, { qualitative: q }),
        h(ShareCard, { data: d, theme: cardTheme })
      )
    );
  }

  // Mount
  const container = document.getElementById('react-root');
  if (container && window.INSIGHT_DATA && window.ReactDOM) {
    const root = window.ReactDOM.createRoot(container);
    root.render(h(InsightApp, { data: window.INSIGHT_DATA }));
  } else {
    console.error('Failed to mount InsightApp:', { container: !!container, data: !!window.INSIGHT_DATA, ReactDOM: !!window.ReactDOM });
  }
})();
`;
}
