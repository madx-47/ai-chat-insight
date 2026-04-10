# Wiki Agent Instructions

## Project structure
wiki/           ← LLM-maintained markdown files (you write all of this)
raw/            ← Source documents I drop in (read-only for you)
raw/assets/     ← Images and attachments
wiki/index.md   ← Master catalog of all wiki pages
wiki/log.md     ← Append-only ingest/query/lint history

## Your role
You maintain the wiki. I curate sources and ask questions.
Never modify files inside raw/. Only create/edit files inside wiki/.

---

## Operations

### INGEST
When I say "ingest [filename]":
1. Read the file from raw/
2. Summarize key takeaways with me (brief discussion first)
3. Create wiki/sources/[slug].md — full summary, key claims, metadata frontmatter
4. Create or update wiki/entities/[name].md for any person, tool, project, or concept mentioned
5. Create or update wiki/topics/[topic].md for any major theme covered
6. Update wiki/index.md — add the new source page + any new entity/topic pages
7. Append an entry to wiki/log.md in this format:
   ## [YYYY-MM-DD] ingest | [Title]
   - Source: raw/[filename]
   - Pages touched: [list]
   - Key claims: [2-3 bullets]

### QUERY
When I ask a question:
1. Read wiki/index.md to find relevant pages
2. Read those pages
3. Answer with citations to wiki pages (e.g. [[entities/nodejs]])
4. If the answer is non-trivial, offer to save it as wiki/insights/[slug].md

### LINT
When I say "lint the wiki":
1. Scan all wiki pages
2. Flag: contradictions, orphan pages, missing cross-links, stale claims
3. Suggest new pages that should exist based on mentioned-but-not-filed concepts
4. Suggest gaps I could fill by adding new sources

---

## Page formats

### Source page (wiki/sources/[slug].md)
---
title: [full title]
date_ingested: [YYYY-MM-DD]
source_file: raw/[filename]
tags: [list]
---
## Summary
[3-5 sentence summary]

## Key claims
- [claim 1]
- [claim 2]

## Related
- [[entities/...]]
- [[topics/...]]

### Entity page (wiki/entities/[name].md)
---
title: [entity name]
type: [person | tool | project | concept]
sources: [list of source slugs]
---
## What it is
[definition or description]

## Key facts
- [fact]

## Appearances
- [[sources/...]]

### Topic page (wiki/topics/[topic].md)
---
title: [topic name]
sources: [count]
---
## Overview
[evolving synthesis — update this as new sources arrive]

## Key tensions / open questions
- [question]

## Sources
- [[sources/...]]

---

## Conventions
- All filenames: lowercase-with-hyphens
- All cross-links: [[folder/slug]] style (Obsidian-compatible)
- Frontmatter: always YAML between --- fences
- log.md: append only, never edit existing entries
- index.md: keep sorted by category (sources, entities, topics, insights)

## Starting state
If wiki/ does not exist yet, create:
- wiki/index.md (empty catalog with headings: Sources, Entities, Topics, Insights)
- wiki/log.md (empty, with a ## Legend comment at top)
- The four subdirectory placeholders (sources/, entities/, topics/, insights/) by creating a .gitkeep in each

Confirm when ready.