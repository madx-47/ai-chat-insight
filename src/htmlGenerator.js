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
import { fileURLToPath } from 'url';
import { TemplateRenderer } from './renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StaticInsightGenerator {
  constructor() {
    this.templateRenderer = new TemplateRenderer();
  }

  /**
   * Ensure output/reports/ dir exists, return its absolute path.
   * @param {string} [outputRoot]  Optional root dir; defaults to package output/
   */
  async ensureOutputDirectory(outputRoot) {
    const base = outputRoot || path.resolve(__dirname, '..');
    const outputDir = path.join(base, 'output', 'reports');
    await fs.mkdir(outputDir, { recursive: true });
    return outputDir;
  }

  /** Build report filename from the input insight JSON name */
  generateOutputPath(outputDir, insightJsonPath) {
    const baseName = path.basename(insightJsonPath, path.extname(insightJsonPath));
    return path.join(outputDir, `${baseName}.html`);
  }

  /**
   * Main entry point — equivalent to Qwen's generateStaticInsight().
   *
   * @param {string} insightJsonPath  Path to insight.json (default: output/insight.json)
   * @param {Function} [onProgress]   Optional callback(stage, percent)
   * @param {string} [outputRoot]     Optional root dir for output/ (defaults to package root)
   * @returns {Promise<string>}        Absolute path of the generated HTML file
   */
  async generateStaticInsight(insightJsonPath, onProgress, outputRoot) {
    const src = insightJsonPath || path.resolve(__dirname, '../output/insight.json');

    if (onProgress) onProgress('Reading insight data...', 0);

    // 1. Read insight.json
    const raw = await fs.readFile(src, 'utf-8');
    const insightData = JSON.parse(raw);

    if (onProgress) onProgress('Rendering HTML...', 50);

    // 2. Render to self-contained HTML
    const html = await this.templateRenderer.renderInsightHTML(insightData);

    // 3. Prepare output path (respect custom outputRoot)
    const outputDir = await this.ensureOutputDirectory(outputRoot);
    const outputPath = this.generateOutputPath(outputDir, src);

    if (onProgress) onProgress('Writing HTML file...', 80);

    // 4. Write HTML file
    await fs.writeFile(outputPath, html, 'utf-8');

    if (onProgress) onProgress('Done!', 100);

    return outputPath;
  }
}
