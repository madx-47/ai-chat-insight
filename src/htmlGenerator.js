/**
 * StaticInsightGenerator — mirrors Qwen's StaticInsightGenerator.ts
 *
 * Methods (same names as Qwen):
 *   ensureOutputDirectory()     → creates output/reports/
 *   generateOutputPath(dir)     → timestamped collision-safe filename
 *   generateStaticInsight(src)  → reads insight.json, renders HTML, writes file
 */

import fs from 'fs/promises';
import path from 'path';
import { TemplateRenderer } from './renderer.js';

export class StaticInsightGenerator {
  constructor() {
    this.templateRenderer = new TemplateRenderer();
  }

  /** Ensure output/reports/ dir exists, return its absolute path */
  async ensureOutputDirectory() {
    const outputDir = path.resolve('output', 'reports');
    await fs.mkdir(outputDir, { recursive: true });
    return outputDir;
  }

  /**
   * Generate a timestamped filename. If today's date file already exists,
   * append HHMMSS to avoid collision — same logic as Qwen.
   */
  async generateOutputPath(outputDir) {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS

    let outputPath = path.join(outputDir, `insight-${date}.html`);
    try {
      await fs.access(outputPath);
      // File exists → use timestamped version
      outputPath = path.join(outputDir, `insight-${date}-${time}.html`);
    } catch {
      // File doesn't exist → use date-only name (no-op)
    }
    return outputPath;
  }

  /**
   * Main entry point — equivalent to Qwen's generateStaticInsight().
   *
   * @param {string} insightJsonPath  Path to insight.json (default: output/insight.json)
   * @param {Function} [onProgress]   Optional callback(stage, percent)
   * @returns {Promise<string>}        Absolute path of the generated HTML file
   */
  async generateStaticInsight(insightJsonPath, onProgress) {
    const src = insightJsonPath || path.resolve('output', 'insight.json');

    if (onProgress) onProgress('Reading insight data...', 0);

    // 1. Read insight.json
    const raw = await fs.readFile(src, 'utf-8');
    const insightData = JSON.parse(raw);

    if (onProgress) onProgress('Rendering HTML...', 50);

    // 2. Render to self-contained HTML
    const html = await this.templateRenderer.renderInsightHTML(insightData);

    // 3. Prepare output path
    const outputDir = await this.ensureOutputDirectory();
    const outputPath = await this.generateOutputPath(outputDir);

    if (onProgress) onProgress('Writing HTML file...', 80);

    // 4. Write HTML file
    await fs.writeFile(outputPath, html, 'utf-8');

    if (onProgress) onProgress('Done!', 100);

    return outputPath;
  }
}
