import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileJson, LayoutDashboard, LoaderCircle } from "lucide-react";

import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { Button } from "@/components/ui/button";
import { WavyBackground } from "@/components/ui/blue-meshy-background";

type JobState = {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  progress: { step: string; percent: number; message: string };
  error?: string | null;
};

type ReportPayload = {
  jobId: string;
  insight: any;
  paths: { insightJsonPath: string; reportHtmlPath: string | null };
};

const fmtNum = (n: unknown) => Number(n || 0).toLocaleString();
const label = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const asArray = <T,>(value: unknown) => (Array.isArray(value) ? (value as T[]) : []);
const asNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const asText = (value: unknown) => {
  if (value == null) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

function ChartCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data || {})
    .map(([k, v]) => [k, asNumber(v)] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = Math.max(1, ...entries.map(([, v]) => asNumber(v)));

  return (
    <div className="rounded-2xl border border-cyan-200/15 bg-gradient-to-br from-slate-900/80 to-slate-950/70 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1">
      <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-slate-300">{title}</h3>
      {entries.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_1fr_36px] items-center gap-2 text-sm">
            <div className="truncate text-slate-200" title={label(k)}>{label(k)}</div>
            <div className="h-2 rounded-full bg-slate-700/70">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <div className="text-right text-cyan-100">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.30)] ${className}`}>
      <h3 className="mb-3 font-['Space_Grotesk'] text-xl font-semibold text-cyan-100">{title}</h3>
      <div className="space-y-2 text-sm text-slate-200">{children}</div>
    </div>
  );
}

function ActiveHoursChart({ data }: { data: Record<string, number> }) {
  const buckets = [
    { name: "Morning", hours: [6, 7, 8, 9, 10, 11], color: "from-amber-300 to-orange-300" },
    { name: "Afternoon", hours: [12, 13, 14, 15, 16, 17], color: "from-cyan-300 to-sky-300" },
    { name: "Evening", hours: [18, 19, 20, 21], color: "from-indigo-300 to-violet-300" },
    { name: "Night", hours: [22, 23, 0, 1, 2, 3, 4, 5], color: "from-blue-300 to-slate-300" },
  ];
  const totals = buckets.map((b) => ({
    ...b,
    value: b.hours.reduce((acc, h) => acc + asNumber(data?.[String(h)]), 0),
  }));
  const max = Math.max(1, ...totals.map((t) => t.value));

  return (
    <InsightPanel title="Active Hours" className="bg-gradient-to-br from-slate-900/80 to-blue-950/40">
      <div className="space-y-3">
        {totals.map((t) => (
          <div key={t.name}>
            <div className="mb-1 flex items-center justify-between text-sm text-slate-100">
              <span>{t.name}</span>
              <span>{fmtNum(t.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-700/70">
              <div className={`h-2 rounded-full bg-gradient-to-r ${t.color}`} style={{ width: `${(t.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </InsightPanel>
  );
}

function HeatmapChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data || {}).sort(([a], [b]) => a.localeCompare(b)).slice(-28);
  const max = Math.max(1, ...entries.map(([, v]) => asNumber(v)));
  return (
    <InsightPanel title="Activity Heatmap (Last 28 Days)" className="bg-gradient-to-br from-slate-900/80 to-emerald-950/30">
      <div className="grid grid-cols-7 gap-2">
        {entries.map(([date, value]) => {
          const ratio = asNumber(value) / max;
          const bg = ratio === 0 ? "bg-slate-800/60" : ratio < 0.34 ? "bg-cyan-900/70" : ratio < 0.67 ? "bg-cyan-700/80" : "bg-cyan-400/90";
          return (
            <div key={date} className={`h-9 rounded-md border border-cyan-100/10 ${bg} p-1 text-[10px] text-cyan-50`} title={`${date}: ${value}`}>
              <div className="truncate">{date.slice(5)}</div>
              <div className="text-right">{fmtNum(value)}</div>
            </div>
          );
        })}
      </div>
    </InsightPanel>
  );
}

function SessionTrendChart({ sessions }: { sessions: any[] }) {
  const points = sessions.slice(0, 20).map((s, idx) => ({
    x: idx,
    y: asNumber(s?.duration_minutes),
  }));
  const max = Math.max(1, ...points.map((p) => p.y));
  const width = 720;
  const height = 180;
  const path = points
    .map((p, idx) => {
      const x = points.length <= 1 ? 0 : (p.x / (points.length - 1)) * (width - 20) + 10;
      const y = height - (p.y / max) * (height - 30) - 10;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <InsightPanel title="Session Duration Trend" className="bg-gradient-to-br from-slate-900/80 to-violet-950/30">
      {points.length === 0 ? (
        <p className="text-slate-300">No session duration data available.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <defs>
            <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#a7f3d0" />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="url(#trendLine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, idx) => {
            const x = points.length <= 1 ? 0 : (p.x / (points.length - 1)) * (width - 20) + 10;
            const y = height - (p.y / max) * (height - 30) - 10;
            return <circle key={idx} cx={x} cy={y} r="3" fill="#cffafe" />;
          })}
        </svg>
      )}
    </InsightPanel>
  );
}

function DonutChart({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data || {})
    .map(([k, v]) => [k, asNumber(v)] as const)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  const colors = ["#67e8f9", "#5eead4", "#93c5fd", "#a5b4fc", "#f9a8d4", "#fca5a5"];
  let angle = 0;

  return (
    <InsightPanel title={title} className="bg-gradient-to-br from-slate-900/80 to-cyan-950/25">
      {entries.length === 0 ? (
        <p className="text-slate-300">No distribution data available.</p>
      ) : (
        <div className="flex flex-col items-center gap-3 md:flex-row">
          <svg viewBox="0 0 42 42" className="h-36 w-36 -rotate-90">
            {entries.map(([k, v], idx) => {
              const start = (angle / total) * 100;
              const len = (v / total) * 100;
              angle += v;
              return (
                <circle
                  key={k}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="5"
                  strokeDasharray={`${len} ${100 - len}`}
                  strokeDashoffset={-start}
                />
              );
            })}
          </svg>
          <div className="space-y-1 text-xs">
            {entries.map(([k, v], idx) => (
              <div key={k} className="flex items-center gap-2 text-slate-100">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[idx % colors.length] }} />
                <span className="min-w-[120px]">{label(k)}</span>
                <span className="text-cyan-200">{fmtNum(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </InsightPanel>
  );
}

function App() {
  const [view, setView] = useState<"home" | "loading" | "dashboard">("home");
  const [tab, setTab] = useState<"pulse" | "full">("pulse");
  const [jobId, setJobId] = useState<string>("");
  const [job, setJob] = useState<JobState | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [error, setError] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!jobId || view !== "loading") return;

    const timer = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/jobs/${jobId}`);
        const status = await statusRes.json();
        if (!statusRes.ok) throw new Error(status.error || "Failed to fetch job status");
        setJob(status);

        if (status.status === "failed") {
          throw new Error(status.error || "Analysis failed");
        }

        if (status.status === "done") {
          clearInterval(timer);
          const reportRes = await fetch(`/api/jobs/${jobId}/report`);
          const payload = await reportRes.json();
          if (!reportRes.ok) throw new Error(payload.error || "Failed to fetch report");
          if (!payload?.insight || !payload?.paths?.insightJsonPath) {
            throw new Error("Report payload is incomplete.");
          }
          setReport(payload);
          setTab("pulse");
          setView("dashboard");
        }
      } catch (e: any) {
        clearInterval(timer);
        setError(e?.message || String(e));
        setView("home");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [jobId, view]);

  async function handleSend(message: string, files?: File[]) {
    setError("");
    try {
      let res: Response;
      if (files?.length) {
        const form = new FormData();
        form.append("jsonlFile", files[0]);
        if (message) form.append("jsonlText", message);
        res = await fetch("/api/jobs", { method: "POST", body: form });
      } else {
        res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonlText: message }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start job");

      setJobId(data.jobId);
      setJob({ id: data.jobId, status: data.status, progress: { step: "queued", percent: 0, message: "Queued" } });
      setView("loading");
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  const normalized = useMemo(() => {
    const insight = report?.insight || {};
    const metrics = insight.metrics || {};
    const aggregated = insight.aggregated || {};
    const qualitative = insight.qualitative || {};
    const topToolsEntries = Array.isArray(metrics.topTools)
      ? metrics.topTools.filter((row: unknown) => Array.isArray(row) && row.length === 2)
      : [];
    return {
      metrics,
      sessions: Array.isArray(insight.sessions) ? insight.sessions : [],
      facets: Array.isArray(insight.facets) ? insight.facets : [],
      topTools: Object.fromEntries(topToolsEntries),
      aggregated,
      qualitative,
      qualitativeSections: {
        atAGlance: qualitative.at_a_glance || null,
        interactionStyle: qualitative.interaction_style || null,
        projectAreas: asArray<any>(qualitative.project_areas?.areas),
        impressiveWorkflows: asArray<any>(qualitative.impressive_workflows?.impressive_workflows),
        frictionCategories: asArray<any>(qualitative.friction_points?.categories),
        opportunities: asArray<any>(qualitative.future_opportunities?.opportunities),
        promptAdditions: asArray<any>(qualitative.improvements?.system_prompt_additions),
        featuresToTry: asArray<any>(qualitative.improvements?.features_to_try),
        usagePatterns: asArray<any>(qualitative.improvements?.usage_patterns),
        memorableMoment: qualitative.memorable_moment || null,
      },
    };
  }, [report]);

  const reset = () => {
    setView("home");
    setReport(null);
    setJob(null);
    setJobId("");
    setError("");
    setShowPrompt(false);
  };

  return (
    <main className="w-full min-h-screen">
      <WavyBackground className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="flex min-h-[56vh] items-center justify-center">
          <div className="z-10 space-y-4 text-center lg:space-y-6">
            <h4 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-wide text-white drop-shadow-xl lg:text-5xl">
              Turning Session Logs Into Insight Impact
            </h4>
            <p className="mx-auto max-w-2xl text-sm text-slate-200 md:text-base">
              Launch Pulse transforms JSONL chat transcripts into Insight JSON, static reports, and a modern analytics dashboard for your project.
            </p>
            <button
              type="button"
              className="rounded-xl bg-white px-6 py-3 text-lg font-semibold text-blue-900 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => {
                setShowPrompt(true);
                requestAnimationFrame(() => {
                  document.getElementById("prompt-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
            >
              Start Your Journey
            </button>
          </div>
        </div>

        {view === "home" && showPrompt && (
          <div className="mx-auto mt-8 max-w-4xl space-y-3" id="prompt-box">
            <PromptInputBox onSend={handleSend} placeholder="Paste JSONL logs from your chat session, or attach a .jsonl file." />
            <p className="text-center text-xs text-slate-300">Output: <code>output/insight-&lt;timestamp&gt;.json</code> and matching static report in <code>output/reports/</code>.</p>
            {error && <p className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          </div>
        )}

        {view === "loading" && (
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-cyan-200/20 bg-slate-950/65 p-8 text-center backdrop-blur-xl">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-cyan-200" />
            <h2 className="mt-4 font-['Space_Grotesk'] text-2xl font-bold">Generating Pulse Dashboard</h2>
            <p className="mt-2 text-slate-300">{job?.progress?.message || "Preparing pipeline"}</p>
            <div className="mt-5 h-2 rounded-full bg-slate-700/60">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all" style={{ width: `${job?.progress?.percent || 0}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-300">{job?.progress?.percent || 0}%</p>
          </div>
        )}
      </WavyBackground>

      {view === "dashboard" && report && (
        <section className="relative mx-auto mt-6 w-full max-w-7xl overflow-hidden rounded-3xl border border-cyan-200/15 bg-[radial-gradient(1200px_400px_at_10%_-10%,rgba(34,211,238,0.12),transparent_70%),radial-gradient(1000px_420px_at_95%_0%,rgba(16,185,129,0.12),transparent_65%),linear-gradient(160deg,rgba(2,6,23,0.95),rgba(15,23,42,0.95))] p-4 pb-8 shadow-[0_25px_70px_rgba(0,0,0,0.45)] md:p-8">
          <div className="pointer-events-none absolute -left-24 top-24 h-56 w-56 animate-pulse rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-10 h-64 w-64 animate-pulse rounded-full bg-emerald-300/10 blur-3xl [animation-delay:900ms]" />
          <div className="relative z-10 space-y-4">
          <div className="inline-flex rounded-full border border-cyan-200/25 bg-slate-900/70 p-1">
            <Button variant={tab === "pulse" ? "default" : "ghost"} size="default" onClick={() => setTab("pulse")}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Pulse Dashboard
            </Button>
            <Button variant={tab === "full" ? "default" : "ghost"} size="default" onClick={() => setTab("full")}>
              <FileJson className="mr-2 h-4 w-4" /> Full Static Report
            </Button>
          </div>

          {tab === "pulse" ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-4 transition-transform duration-300 hover:-translate-y-1"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Messages</p><p className="mt-2 text-3xl font-bold">{fmtNum(asNumber(normalized.metrics.totalMessages))}</p></div>
                <div className="rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-4 transition-transform duration-300 hover:-translate-y-1"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Sessions</p><p className="mt-2 text-3xl font-bold">{fmtNum(asNumber(normalized.metrics.totalSessions))}</p></div>
                <div className="rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-4 transition-transform duration-300 hover:-translate-y-1"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Current Streak</p><p className="mt-2 text-3xl font-bold">{fmtNum(asNumber(normalized.metrics.currentStreak))}d</p></div>
                <div className="rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-4 transition-transform duration-300 hover:-translate-y-1"><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Hours</p><p className="mt-2 text-3xl font-bold">{fmtNum(Math.round(asNumber(normalized.metrics.totalHours)))}h</p></div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Top Goals" data={normalized.aggregated.goalsAgg || {}} />
                <ChartCard title="Top Tools" data={normalized.topTools || {}} />
                <ChartCard title="Outcomes" data={normalized.aggregated.outcomesAgg || {}} />
                <ChartCard title="Satisfaction" data={normalized.aggregated.satisfactionAgg || {}} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ActiveHoursChart data={normalized.metrics.activeHours || {}} />
                <HeatmapChart data={normalized.metrics.heatmap || {}} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <SessionTrendChart sessions={normalized.sessions || []} />
                <DonutChart title="Primary Success Distribution" data={normalized.aggregated.primarySuccessAgg || {}} />
              </div>

              {normalized.qualitative?.at_a_glance && (
                <div className="rounded-2xl border border-cyan-200/30 bg-gradient-to-br from-cyan-400/15 to-emerald-300/15 p-4">
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold">At a Glance</h3>
                  <p className="mt-2 text-sm text-slate-100"><strong>Working:</strong> {asText(normalized.qualitative.at_a_glance.whats_working)}</p>
                  <p className="mt-1 text-sm text-slate-100"><strong>Hindering:</strong> {asText(normalized.qualitative.at_a_glance.whats_hindering)}</p>
                  <p className="mt-1 text-sm text-slate-100"><strong>Quick Wins:</strong> {asText(normalized.qualitative.at_a_glance.quick_wins)}</p>
                </div>
              )}

              {normalized.qualitativeSections.interactionStyle && (
                <InsightPanel title="Interaction Style" className="bg-gradient-to-br from-indigo-950/50 to-cyan-950/40">
                  <p>{asText(normalized.qualitativeSections.interactionStyle.narrative)}</p>
                  <p><strong>Key Pattern:</strong> {asText(normalized.qualitativeSections.interactionStyle.key_pattern)}</p>
                </InsightPanel>
              )}

              {normalized.qualitativeSections.projectAreas.length > 0 && (
                <InsightPanel title="Project Areas" className="bg-gradient-to-br from-sky-950/40 to-emerald-950/30">
                  <div className="grid gap-3 md:grid-cols-2">
                    {normalized.qualitativeSections.projectAreas.map((area: any, idx: number) => (
                      <div key={`${asText(area?.name)}-${idx}`} className="rounded-xl border border-cyan-100/15 bg-slate-950/60 p-3">
                        <p className="font-semibold text-cyan-100">{asText(area?.name)}</p>
                        <p className="text-xs text-cyan-300/90">{fmtNum(asNumber(area?.session_count))} sessions</p>
                        <p className="mt-1 text-slate-300">{asText(area?.description)}</p>
                      </div>
                    ))}
                  </div>
                </InsightPanel>
              )}

              {normalized.qualitativeSections.impressiveWorkflows.length > 0 && (
                <InsightPanel title="Impressive Workflows" className="bg-gradient-to-br from-emerald-950/35 to-cyan-950/30">
                  <div className="space-y-3">
                    {normalized.qualitativeSections.impressiveWorkflows.map((w: any, idx: number) => (
                      <div key={`${asText(w?.title)}-${idx}`} className="rounded-xl border border-emerald-200/20 bg-slate-950/60 p-3">
                        <p className="font-semibold text-emerald-200">{asText(w?.title)}</p>
                        <p>{asText(w?.description)}</p>
                      </div>
                    ))}
                  </div>
                </InsightPanel>
              )}

              {normalized.qualitativeSections.frictionCategories.length > 0 && (
                <InsightPanel title="Friction Categories" className="bg-gradient-to-br from-rose-950/30 to-slate-950/40">
                  <div className="space-y-3">
                    {normalized.qualitativeSections.frictionCategories.map((f: any, idx: number) => (
                      <div key={`${asText(f?.category)}-${idx}`} className="rounded-xl border border-rose-200/20 bg-slate-950/60 p-3">
                        <p className="font-semibold text-rose-200">{asText(f?.category)}</p>
                        <p>{asText(f?.description)}</p>
                        {asArray<string>(f?.examples).length > 0 && (
                          <p className="text-xs text-rose-100/80">Examples: {asArray<string>(f?.examples).map((e) => asText(e)).join(" | ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </InsightPanel>
              )}

              {normalized.qualitativeSections.opportunities.length > 0 && (
                <InsightPanel title="Future Opportunities" className="bg-gradient-to-br from-violet-950/30 to-indigo-950/40">
                  <div className="space-y-3">
                    {normalized.qualitativeSections.opportunities.map((o: any, idx: number) => (
                      <div key={`${asText(o?.title)}-${idx}`} className="rounded-xl border border-violet-200/20 bg-slate-950/60 p-3">
                        <p className="font-semibold text-violet-200">{asText(o?.title)}</p>
                        <p>{asText(o?.whats_possible)}</p>
                        <p><strong>How to try:</strong> {asText(o?.how_to_try)}</p>
                        {asText(o?.copyable_prompt) !== "-" && (
                          <pre className="mt-2 overflow-x-auto rounded-lg border border-violet-200/20 bg-black/30 p-2 text-xs text-violet-100">{asText(o?.copyable_prompt)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                </InsightPanel>
              )}

              {(normalized.qualitativeSections.promptAdditions.length > 0 ||
                normalized.qualitativeSections.featuresToTry.length > 0 ||
                normalized.qualitativeSections.usagePatterns.length > 0) && (
                <InsightPanel title="Improvements & Next Steps" className="bg-gradient-to-br from-cyan-950/35 to-blue-950/40">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-cyan-100/15 bg-slate-950/60 p-3">
                      <p className="mb-2 text-sm font-semibold text-cyan-200">Prompt Additions</p>
                      <div className="space-y-2 text-xs text-slate-300">
                        {normalized.qualitativeSections.promptAdditions.slice(0, 4).map((p: any, idx: number) => (
                          <div key={`pa-${idx}`} className="rounded border border-cyan-200/15 p-2">
                            <p className="text-cyan-100">{asText(p?.addition)}</p>
                            <p className="mt-1 opacity-80">{asText(p?.why)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-cyan-100/15 bg-slate-950/60 p-3">
                      <p className="mb-2 text-sm font-semibold text-cyan-200">Features To Try</p>
                      <div className="space-y-2 text-xs text-slate-300">
                        {normalized.qualitativeSections.featuresToTry.slice(0, 4).map((f: any, idx: number) => (
                          <div key={`ft-${idx}`} className="rounded border border-cyan-200/15 p-2">
                            <p className="text-cyan-100">{asText(f?.feature)}</p>
                            <p className="mt-1 opacity-80">{asText(f?.one_liner)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-cyan-100/15 bg-slate-950/60 p-3">
                      <p className="mb-2 text-sm font-semibold text-cyan-200">Usage Patterns</p>
                      <div className="space-y-2 text-xs text-slate-300">
                        {normalized.qualitativeSections.usagePatterns.slice(0, 4).map((u: any, idx: number) => (
                          <div key={`up-${idx}`} className="rounded border border-cyan-200/15 p-2">
                            <p className="text-cyan-100">{asText(u?.title)}</p>
                            <p className="mt-1 opacity-80">{asText(u?.suggestion)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </InsightPanel>
              )}

              {normalized.qualitativeSections.memorableMoment && (
                <InsightPanel title="Memorable Moment" className="bg-gradient-to-br from-fuchsia-950/30 to-indigo-950/35">
                  <p className="text-lg font-semibold text-fuchsia-200">"{asText(normalized.qualitativeSections.memorableMoment.headline)}"</p>
                  <p>{asText(normalized.qualitativeSections.memorableMoment.detail)}</p>
                </InsightPanel>
              )}

              {normalized.sessions.length > 0 && (
                <InsightPanel title="Session Metadata" className="bg-gradient-to-br from-slate-900/70 to-cyan-950/20">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs md:text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="py-2 pr-3">Session</th>
                          <th className="py-2 pr-3">Messages</th>
                          <th className="py-2 pr-3">Duration</th>
                          <th className="py-2 pr-3">Tools</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-200">
                        {normalized.sessions.slice(0, 20).map((s: any, idx: number) => (
                          <tr key={`${asText(s?.session_id)}-${idx}`} className="border-t border-cyan-100/10">
                            <td className="py-2 pr-3">{asText(s?.session_id).slice(0, 16)}</td>
                            <td className="py-2 pr-3">{fmtNum(asNumber(s?.message_count))}</td>
                            <td className="py-2 pr-3">{fmtNum(Math.round(asNumber(s?.duration_minutes)))} min</td>
                            <td className="py-2 pr-3">{asArray<string>(s?.tool_calls).map((t) => asText(t)).join(", ") || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </InsightPanel>
              )}

              {normalized.facets.length > 0 && (
                <div className="rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-['Space_Grotesk'] text-xl font-bold"><BarChart3 className="h-5 w-5 text-cyan-300" /> Session Facets</h3>
                  <div className="space-y-3">
                    {normalized.facets.slice(0, 12).map((f: any, idx: number) => (
                      <div key={asText(f?.session_id) + idx} className="rounded-xl border border-cyan-100/15 bg-slate-950/60 p-3">
                        <p className="font-semibold text-cyan-100">{asText(f?.brief_summary) !== "-" ? asText(f?.brief_summary) : asText(f?.session_id)}</p>
                        <p className="mt-1 text-sm text-slate-300"><strong>Goal:</strong> {asText(f?.underlying_goal)}</p>
                        <p className="mt-1 text-sm text-slate-300"><strong>Outcome:</strong> {label(asText(f?.outcome || "unknown"))} · <strong>Helpfulness:</strong> {label(asText(f?.ai_helpfulness || "unknown"))}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <a href={report.paths.insightJsonPath} target="_blank" rel="noreferrer" className="rounded-full border border-cyan-200/25 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-200/10">Open Insight JSON</a>
                {report.paths.reportHtmlPath && <a href={report.paths.reportHtmlPath} target="_blank" rel="noreferrer" className="rounded-full border border-cyan-200/25 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-200/10">Open Static HTML</a>}
                <Button variant="outline" onClick={reset}>Run New Pulse</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-cyan-200/15 bg-slate-900/70 p-3 animate-in fade-in duration-300">
              <div className="flex flex-wrap gap-2">
                {report.paths.reportHtmlPath && <a href={report.paths.reportHtmlPath} target="_blank" rel="noreferrer" className="rounded-full border border-cyan-200/25 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-200/10">Open in New Tab</a>}
                <Button variant="outline" onClick={reset}>Run New Pulse</Button>
              </div>
              {report.paths.reportHtmlPath ? (
                <iframe title="Full Static Report" src={report.paths.reportHtmlPath} className="min-h-[75vh] w-full rounded-xl border border-cyan-200/20 bg-white" />
              ) : (
                <p className="rounded-xl border border-yellow-300/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
                  Static HTML report is not available for this run.
                </p>
              )}
            </div>
          )}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
