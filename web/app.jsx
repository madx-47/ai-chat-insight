const { useMemo, useState, useEffect } = React;

const fmtNum = (n) => Number(n || 0).toLocaleString();
const fmtLabel = (k) => String(k || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
const asArray = (v) => (Array.isArray(v) ? v : []);

function BarChart({ title, data }) {
  const entries = useMemo(() => {
    const pairs = Object.entries(data || {});
    pairs.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
    return pairs.slice(0, 8);
  }, [data]);

  if (!entries.length) {
    return (
      <div className="chart-card fade-in">
        <h4 className="chart-title">{title}</h4>
        <p className="hint">No data</p>
      </div>
    );
  }

  const max = Math.max(...entries.map(([, v]) => Number(v || 0)), 1);

  return (
    <div className="chart-card fade-in">
      <h4 className="chart-title">{title}</h4>
      {entries.map(([k, v]) => (
        <div className="bar-row" key={k}>
          <div className="bar-label" title={fmtLabel(k)}>{fmtLabel(k)}</div>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${(Number(v || 0) / max) * 100}%` }} />
          </div>
          <div>{v}</div>
        </div>
      ))}
    </div>
  );
}

function normalizeInsight(insight) {
  const m = insight?.metrics || {};
  const agg = insight?.aggregated || {};
  const q = insight?.qualitative || {};
  const topTools = Array.isArray(m.topTools) ? Object.fromEntries(m.topTools) : (m.topTools || {});

  return {
    kpi: {
      totalSessions: m.totalSessions || 0,
      totalMessages: m.totalMessages || 0,
      currentStreak: m.currentStreak || 0,
      totalHours: Math.round(m.totalHours || 0),
      totalFiles: m.totalFiles || 0,
      linesAdded: m.totalLinesAdded || 0,
      linesRemoved: m.totalLinesRemoved || 0,
      longestStreak: m.longestStreak || 0,
    },
    charts: {
      topTools,
      outcomes: agg.outcomesAgg || {},
      goals: agg.goalsAgg || {},
      friction: agg.frictionAgg || {},
      satisfaction: agg.satisfactionAgg || {},
      success: agg.primarySuccessAgg || {},
    },
    sessions: asArray(insight?.sessions),
    facets: asArray(insight?.facets),
    q: {
      atGlance: q.at_a_glance || null,
      interaction: q.interaction_style || null,
      projectAreas: asArray(q.project_areas?.areas),
      workflows: asArray(q.impressive_workflows?.impressive_workflows),
      frictionCategories: asArray(q.friction_points?.categories),
      opportunities: asArray(q.future_opportunities?.opportunities),
      improvements: {
        promptAdditions: asArray(q.improvements?.system_prompt_additions),
        features: asArray(q.improvements?.features_to_try),
        patterns: asArray(q.improvements?.usage_patterns),
      },
      memorable: q.memorable_moment || null,
    },
  };
}

function InfoList({ title, items, renderItem }) {
  if (!items?.length) return null;
  return (
    <div className="text-card fade-in">
      <h3>{title}</h3>
      <div className="stack-list">
        {items.map((item, idx) => (
          <div className="stack-item" key={idx}>{renderItem(item, idx)}</div>
        ))}
      </div>
    </div>
  );
}

function DashboardPulse({ reportData, onReset }) {
  const insight = reportData?.insight;
  const data = useMemo(() => normalizeInsight(insight), [insight]);

  return (
    <section className="dashboard">
      <div className="summary">
        <div className="kpi fade-in"><div className="label">Messages</div><div className="value">{fmtNum(data.kpi.totalMessages)}</div></div>
        <div className="kpi fade-in"><div className="label">Sessions</div><div className="value">{fmtNum(data.kpi.totalSessions)}</div></div>
        <div className="kpi fade-in"><div className="label">Current Streak</div><div className="value">{fmtNum(data.kpi.currentStreak)}d</div></div>
        <div className="kpi fade-in"><div className="label">Total Hours</div><div className="value">{fmtNum(data.kpi.totalHours)}h</div></div>
        <div className="kpi fade-in"><div className="label">Longest Streak</div><div className="value">{fmtNum(data.kpi.longestStreak)}d</div></div>
        <div className="kpi fade-in"><div className="label">Files Touched</div><div className="value">{fmtNum(data.kpi.totalFiles)}</div></div>
        <div className="kpi fade-in"><div className="label">Lines Added</div><div className="value">{fmtNum(data.kpi.linesAdded)}</div></div>
        <div className="kpi fade-in"><div className="label">Lines Removed</div><div className="value">{fmtNum(data.kpi.linesRemoved)}</div></div>
      </div>

      <div className="grid-two">
        <BarChart title="Top Goals" data={data.charts.goals} />
        <BarChart title="Top Tools" data={data.charts.topTools} />
      </div>

      <div className="grid-two">
        <BarChart title="Outcomes" data={data.charts.outcomes} />
        <BarChart title="Friction Signals" data={data.charts.friction} />
      </div>

      <div className="grid-two">
        <BarChart title="Satisfaction" data={data.charts.satisfaction} />
        <BarChart title="Primary Success" data={data.charts.success} />
      </div>

      {data.q.atGlance && (
        <div className="text-card fade-in highlight-card">
          <h3>At a Glance</h3>
          <p><strong>What's Working:</strong> {data.q.atGlance.whats_working}</p>
          <p><strong>What's Hindering:</strong> {data.q.atGlance.whats_hindering}</p>
          <p><strong>Quick Wins:</strong> {data.q.atGlance.quick_wins}</p>
          {data.q.atGlance.ambitious_workflows && <p><strong>Ambitious Workflows:</strong> {data.q.atGlance.ambitious_workflows}</p>}
        </div>
      )}

      {data.q.interaction && (
        <div className="text-card fade-in">
          <h3>Interaction Style</h3>
          <p>{data.q.interaction.narrative}</p>
          <p><strong>Key Pattern:</strong> {data.q.interaction.key_pattern}</p>
        </div>
      )}

      <InfoList
        title="Project Areas"
        items={data.q.projectAreas}
        renderItem={(area) => (
          <>
            <div className="row-title">{area.name} <span className="badge">{area.session_count} sessions</span></div>
            <p>{area.description}</p>
          </>
        )}
      />

      <InfoList
        title="Impressive Workflows"
        items={data.q.workflows}
        renderItem={(w) => (
          <>
            <div className="row-title">{w.title}</div>
            <p>{w.description}</p>
          </>
        )}
      />

      <InfoList
        title="Friction Categories"
        items={data.q.frictionCategories}
        renderItem={(c) => (
          <>
            <div className="row-title">{c.category}</div>
            <p>{c.description}</p>
            {asArray(c.examples).length > 0 && <p className="subtle">Examples: {c.examples.join(' | ')}</p>}
          </>
        )}
      />

      <InfoList
        title="Future Opportunities"
        items={data.q.opportunities}
        renderItem={(o) => (
          <>
            <div className="row-title">{o.title}</div>
            <p>{o.whats_possible}</p>
            <p><strong>How to Try:</strong> {o.how_to_try}</p>
            {o.copyable_prompt && <pre className="code-inline">{o.copyable_prompt}</pre>}
          </>
        )}
      />

      <InfoList
        title="Prompt Additions"
        items={data.q.improvements.promptAdditions}
        renderItem={(p) => (
          <>
            <pre className="code-inline">{p.addition}</pre>
            <p>{p.why}</p>
          </>
        )}
      />

      <InfoList
        title="Features to Try"
        items={data.q.improvements.features}
        renderItem={(f) => (
          <>
            <div className="row-title">{f.feature}</div>
            <p>{f.one_liner}</p>
            <p><strong>Why:</strong> {f.why_for_you}</p>
            {f.example && <pre className="code-inline">{f.example}</pre>}
          </>
        )}
      />

      <InfoList
        title="Usage Patterns"
        items={data.q.improvements.patterns}
        renderItem={(p) => (
          <>
            <div className="row-title">{p.title}</div>
            <p>{p.suggestion}</p>
            <p>{p.detail}</p>
            {p.copyable_prompt && <pre className="code-inline">{p.copyable_prompt}</pre>}
          </>
        )}
      />

      {data.q.memorable && (
        <div className="text-card fade-in">
          <h3>Memorable Moment</h3>
          <p className="quote">"{data.q.memorable.headline}"</p>
          <p>{data.q.memorable.detail}</p>
        </div>
      )}

      {data.sessions.length > 0 && (
        <div className="text-card fade-in">
          <h3>Session Metadata</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Messages</th>
                  <th>Duration (min)</th>
                  <th>Tools</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr key={s.session_id}>
                    <td title={s.session_id}>{String(s.session_id || '').slice(0, 16)}</td>
                    <td>{s.message_count || 0}</td>
                    <td>{Math.round(s.duration_minutes || 0)}</td>
                    <td>{asArray(s.tool_calls).join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.facets.length > 0 && (
        <div className="text-card fade-in">
          <h3>Session Facets</h3>
          <div className="stack-list">
            {data.facets.map((f) => (
              <div className="stack-item" key={f.session_id}>
                <div className="row-title">{f.brief_summary || f.session_id}</div>
                <p><strong>Goal:</strong> {f.underlying_goal || '-'}</p>
                <p><strong>Outcome:</strong> {fmtLabel(f.outcome)} | <strong>Helpfulness:</strong> {fmtLabel(f.ai_helpfulness)} | <strong>Type:</strong> {fmtLabel(f.session_type)}</p>
                {f.friction_detail && <p><strong>Friction:</strong> {f.friction_detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-card fade-in">
        <h3>Artifacts</h3>
        <div className="link-row">
          <a className="out-link" href={reportData.paths.insightJsonPath} target="_blank" rel="noreferrer">Insight JSON</a>
          {reportData.paths.reportHtmlPath && <a className="out-link" href={reportData.paths.reportHtmlPath} target="_blank" rel="noreferrer">Static HTML Report</a>}
          <button type="button" className="out-link" onClick={onReset}>Run New Pulse</button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [mode, setMode] = useState('upload');
  const [file, setFile] = useState(null);
  const [jsonlText, setJsonlText] = useState('');
  const [view, setView] = useState('home');
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState('');
  const [jobState, setJobState] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('pulse');

  const canLaunch = mode === 'upload' ? !!file : jsonlText.trim().length > 0;

  useEffect(() => {
    if (!jobId || view !== 'loading') return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch job status.');

        setJobState(data);

        if (data.status === 'failed') {
          setError(data.error || 'Analysis failed.');
          setView('home');
          clearInterval(timer);
          return;
        }

        if (data.status === 'done') {
          clearInterval(timer);
          const reportRes = await fetch(`/api/jobs/${jobId}/report`);
          const reportJson = await reportRes.json();
          if (!reportRes.ok) throw new Error(reportJson.error || 'Failed to load report payload.');
          setReportData(reportJson);
          setDashboardTab('pulse');
          setView('dashboard');
        }
      } catch (err) {
        clearInterval(timer);
        setError(err.message || String(err));
        setView('home');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [jobId, view]);

  async function handleLaunch(e) {
    e.preventDefault();
    setError('');

    try {
      let res;
      if (mode === 'upload') {
        const form = new FormData();
        form.append('jsonlFile', file);
        res = await fetch('/api/jobs', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonlText }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create analysis job.');

      setJobId(data.jobId);
      setJobState({ status: data.status, progress: { percent: 0, message: 'Queued' } });
      setView('loading');
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  function resetAll() {
    setView('home');
    setReportData(null);
    setJobId('');
    setJobState(null);
    setError('');
    setFile(null);
    setJsonlText('');
  }

  return (
    <main className="shell">
      {view === 'home' && (
        <section className="hero meshy-home fade-in">
          <div className="mesh-orb mesh-a" />
          <div className="mesh-orb mesh-b" />
          <div className="mesh-orb mesh-c" />
          <div className="hero-content">
            <h1>Launch Pulse</h1>
            <p className="tagline">
              Convert AI chat session JSONL into a complete Insight JSON and a premium static dashboard report.
            </p>
            <p className="hero-subline">
              Upload logs or paste raw JSONL, then generate project-level metrics, qualitative insights, facets, and export-ready artifacts.
            </p>
          </div>

          <form className="panel prompt-shell" onSubmit={handleLaunch}>
            <div className="input-modes">
              <button type="button" className={`mode-btn ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>Attach JSONL</button>
              <button type="button" className={`mode-btn ${mode === 'paste' ? 'active' : ''}`} onClick={() => setMode('paste')}>Paste JSONL</button>
            </div>

            {mode === 'upload' ? (
              <div className="dropzone">
                <div>Drop or pick a JSONL export from your AI session logs</div>
                <input type="file" accept=".jsonl,.txt,application/json" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div className="hint">Selected file: {file ? file.name : 'None'}</div>
              </div>
            ) : (
              <textarea
                value={jsonlText}
                onChange={(e) => setJsonlText(e.target.value)}
                placeholder="Paste JSONL here. Each line should be one JSON object from your session transcript."
              />
            )}

            <div className="launch-row">
              <button className="launch-btn" disabled={!canLaunch}>Launch Pulse Report</button>
              <div className="hint">Runs async analysis and opens full dashboard when complete.</div>
            </div>

            {error && <div className="error">{error}</div>}
          </form>
        </section>
      )}

      {view === 'loading' && (
        <section className="loader-screen fade-in">
          <div className="loader-wrap">
            <div className="orb">
              <div className="ring r1" />
              <div className="ring r2" />
              <div className="ring r3" />
              <div className="pulse-core" />
            </div>
            <h2>Synthesizing Session Intelligence</h2>
            <div className="loader-sub">{jobState?.progress?.message || 'Initializing pipeline...'}</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${jobState?.progress?.percent || 0}%` }} />
            </div>
            <div className="loader-sub">{jobState?.progress?.percent || 0}% complete</div>
          </div>
        </section>
      )}

      {view === 'dashboard' && reportData?.insight && (
        <section className="dashboard-shell fade-in">
          <div className="dash-tabs">
            <button className={`tab-btn ${dashboardTab === 'pulse' ? 'active' : ''}`} onClick={() => setDashboardTab('pulse')}>Pulse Dashboard</button>
            <button className={`tab-btn ${dashboardTab === 'full' ? 'active' : ''}`} onClick={() => setDashboardTab('full')}>Full Static Report</button>
          </div>

          {dashboardTab === 'pulse' ? (
            <DashboardPulse reportData={reportData} onReset={resetAll} />
          ) : (
            <div className="report-embed-card">
              <div className="link-row" style={{ marginBottom: 12 }}>
                <a className="out-link" href={reportData.paths.reportHtmlPath} target="_blank" rel="noreferrer">Open Static Report in New Tab</a>
                <a className="out-link" href={reportData.paths.insightJsonPath} target="_blank" rel="noreferrer">Open Insight JSON</a>
                <button type="button" className="out-link" onClick={resetAll}>Run New Pulse</button>
              </div>
              <iframe className="report-frame" title="Full Static Report" src={reportData.paths.reportHtmlPath} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
