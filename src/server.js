import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { generateInsights, generateStaticHtml } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const webRoot = path.join(projectRoot, 'frontend', 'dist');
const legacyWebRoot = path.join(projectRoot, 'web');
const sessionsDir = path.join(projectRoot, 'sessions');
const outputDir = path.join(projectRoot, 'output');
const reportsDir = path.join(outputDir, 'reports');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const jobs = new Map();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/output', express.static(outputDir));
app.use(express.static(webRoot));
app.use(express.static(legacyWebRoot));

function nowIso() {
  return new Date().toISOString();
}

function stampForFile() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

function createJobId() {
  return `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function createJobRecord(inputPath) {
  return {
    id: createJobId(),
    status: 'queued',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    inputPath,
    progress: {
      step: 'queued',
      percent: 0,
      message: 'Job queued',
    },
    outputJsonPath: null,
    outputHtmlPath: null,
    summary: null,
    error: null,
  };
}

function updateJob(jobId, patch) {
  const current = jobs.get(jobId);
  if (!current) return;
  const next = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  jobs.set(jobId, next);
}

function updateJobProgress(jobId, step, percent, message) {
  const current = jobs.get(jobId);
  if (!current) return;
  const monotonicPercent = Math.max(current.progress.percent || 0, percent);
  current.progress = { step, percent: monotonicPercent, message };
  current.updatedAt = nowIso();
  jobs.set(jobId, current);
}

async function ensureDirs() {
  await fs.mkdir(sessionsDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
}

async function writeJsonlInput(jsonlText) {
  await ensureDirs();
  const trimmed = String(jsonlText || '').trim();
  if (!trimmed) {
    throw new Error('Input JSONL is empty.');
  }

  const inputPath = path.join(sessionsDir, `session-${stampForFile()}.jsonl`);
  await fs.writeFile(inputPath, `${trimmed}\n`, 'utf-8');
  return inputPath;
}

function safeWebPathFromAbsolute(absPath) {
  const base = path.basename(absPath);
  if (absPath.includes(`${path.sep}reports${path.sep}`)) {
    return `/output/reports/${base}`;
  }
  return `/output/${base}`;
}

async function runJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    updateJob(jobId, { status: 'running' });
    updateJobProgress(jobId, 'start', 3, 'Preparing analysis pipeline');

    const outputJsonPath = path.join(outputDir, `insight-${stampForFile()}.json`);

    const insight = await generateInsights(job.inputPath, {
      onProgress: (event) => {
        updateJobProgress(jobId, event.step, event.percent, event.message);
      },
    });

    updateJobProgress(jobId, 'write_json', 92, 'Writing insight JSON');
    await fs.writeFile(outputJsonPath, JSON.stringify(insight, null, 2), 'utf-8');

    updateJobProgress(jobId, 'render_html', 96, 'Generating dashboard report');
    const outputHtmlPath = await generateStaticHtml(outputJsonPath, (stage, percent) => {
      const mapped = Math.min(100, 96 + Math.round((percent / 100) * 4));
      updateJobProgress(jobId, 'render_html', mapped, stage);
    });

    updateJob(jobId, {
      status: 'done',
      outputJsonPath,
      outputHtmlPath,
      summary: {
        totalSessions: insight.metrics?.totalSessions ?? 0,
        totalMessages: insight.metrics?.totalMessages ?? 0,
        facets: Array.isArray(insight.facets) ? insight.facets.length : 0,
        generatedAt: insight.generatedAt,
      },
    });
    updateJobProgress(jobId, 'done', 100, 'Launch Pulse complete');
  } catch (error) {
    updateJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    updateJobProgress(jobId, 'failed', 100, 'Analysis failed');
  }
}

async function runUploadMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('jsonlFile')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

app.post('/api/jobs', async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      await runUploadMiddleware(req, res);
    }

    let jsonlText = '';
    if (req.file?.buffer) {
      jsonlText = req.file.buffer.toString('utf-8');
    } else if (typeof req.body?.jsonlText === 'string') {
      jsonlText = req.body.jsonlText;
    }

    if (!jsonlText.trim()) {
      return res.status(400).json({ error: 'Provide a .jsonl file upload or JSONL text input.' });
    }

    const inputPath = await writeJsonlInput(jsonlText);
    const jobRecord = createJobRecord(inputPath);
    jobs.set(jobRecord.id, jobRecord);

    void runJob(jobRecord.id);

    return res.status(202).json({
      jobId: jobRecord.id,
      status: jobRecord.status,
      createdAt: jobRecord.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

app.get('/api/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  return res.json({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    progress: job.progress,
    summary: job.summary,
    error: job.error,
    insightJsonPath: job.outputJsonPath ? safeWebPathFromAbsolute(job.outputJsonPath) : null,
    reportHtmlPath: job.outputHtmlPath ? safeWebPathFromAbsolute(job.outputHtmlPath) : null,
  });
});

app.get('/api/jobs/:jobId/report', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  if (job.status !== 'done' || !job.outputJsonPath) {
    return res.status(409).json({ error: 'Report is not ready yet.' });
  }

  try {
    const raw = await fs.readFile(job.outputJsonPath, 'utf-8');
    const insight = JSON.parse(raw);
    return res.json({
      jobId: job.id,
      insight,
      paths: {
        insightJsonPath: safeWebPathFromAbsolute(job.outputJsonPath),
        reportHtmlPath: job.outputHtmlPath ? safeWebPathFromAbsolute(job.outputHtmlPath) : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: nowIso() });
});

app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(webRoot, 'index.html'));
});

async function start() {
  await ensureDirs();
  const webIndex = path.join(webRoot, 'index.html');
  try {
    await fs.access(webIndex);
  } catch {
    console.error('[web] Frontend build missing. Run `npm run frontend:build` first.');
    process.exit(1);
  }
  const port = Number(process.env.PORT || 4173);
  app.listen(port, () => {
    console.log(`[web] Launch Pulse running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('[web] Failed to start server:', error);
  process.exit(1);
});
