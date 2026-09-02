# Article 00 — outline (Kevin writes)

PlantCast-style series opener for RosettaDash. This piece is **you**:
why the series exists, how you work (Cursor, AI, models), and where
articles 01–07 fit. Not a product manual — a debrief invitation.

**Primary search cluster:** cross-framework dashboard components  
**Discovery hooks:** Cursor, AI-assisted development, model choices,
local-first builder

---

## Working title options

Pick one tone; subtitle can carry SEO.

1. **RosettaDash: Why I Built a Dashboard Factory in the Cursor Era**
2. **Cross-Framework Dashboard Components — a series debrief**
3. **PlantCast-adjacent:** *RosettaDash, Debrief* (if you want an
   explicit callback to Binge Debrief)

Suggested subtitle (any title):

> How I use Cursor and several AI models to build components that
> export to React, Vue, Angular, Svelte, or custom elements — without
> rewriting the same screen five times.

---

## Promise (first 3 sentences — draft toward this)

Answer immediately:

1. **Who you are** (one line — builder of RosettaDash, how you work).
2. **Why now** — AI helps you write code fast, but still locks you
   into one framework at a time.
3. **What this series is** — seven articles + this intro; product
   walkthrough, not a sales deck.

Optional fourth sentence: **What worked in PlantCast** — readers
came for honest tool + model reporting; this series adds a real
open-source product behind that story.

---

## Section 1 — The problem you actually hit

**Goal:** Reader nods before any product name lands.

Beat list:

- You (or your clients) live in React *or* Vue *or* Angular — AI
  assistants assume the same.
- Copy-pasting a KPI from one stack to another is not “travel.”
- Storybook in one repo does not solve export to another.
- Name the feeling: **framework tax** on every new client or migration.

**Do not:** Define IR, composite graphs, or exporter plugins.

**Optional personal line:** One sentence on PlantCast readership —
people clicked when you showed *workflow*, not just *topic*.

---

## Section 2 — How I work (Cursor + AI)

**Goal:** PlantCast magnet section. This is what the thousands
clicked for.

Beat list:

- **Cursor** is your daily editor — agents, chat, repo context.
- **RosettaDash** is local (`npm start`, no required cloud) — same
  machine as Cursor.
- Loop you actually run:
  1. Compose / inspect in builder (4200)
  2. Cursor for export wiring, refactors, docs, article drafts
  3. Proof apps / Storybook to verify behavior
- **AI assist in the builder** (toolbar) — separate from Cursor;
  optional Ollama or BYOK cloud keys; keys stay in the browser.

**Model map (honest, brief — your real opinions):**

Use a small table or bullet list; only models you actually use.

| Task | Model / tool | Why |
| ------ | ---------------- | ----- |
| Architecture / long refactors | e.g. Claude … | … |
| Fast passes, copy, summaries | e.g. Gemini Flash … | … |
| Local / private runs | Ollama … | … |
| Builder canvas suggestions | AI assist drawer + your BYOK | … |

Include **one failure anecdote** — model hallucinated a binding,
wrong framework import, bad export target. PlantCast trust comes
from debrief, not hype.

**Do not:** Benchmark scores, “frontier” flex without context, or
imply RosettaDash hosts inference.

---

## Section 3 — What RosettaDash is (in plain language)

**Goal:** Payload after the hook — 1–2 minutes max.

Beat list:

- Component **factory**, not a hosted dashboard SaaS.
- One canvas → export **real source** (standalone zip default).
- Same pieces as **npm packages** if you prefer imports.
- Five runtimes + custom elements — say the names once, spelled out.
- **Destination Atlas** — the demo app that proves it is a product,
  not a toy KPI (articles 4–7).

One sentence on **cross-framework core** without saying “single source
of truth” if that feels marketing-heavy — or use it once if it
sounds like you.

---

## Section 4 — Four doors (map to the series)

**Goal:** Table of contents with *why* read each part.

| Door | Article | One-line hook |
| ------ | --------- | ---------------- |
| Builder | 02 | Canvas, preview, export — where you compose |
| Storybook | 03 | One component isolated, five catalogs |
| Destination Atlas | 04–06 | Full app: maps, video extract, BYOK, roles |
| npm / demos | 01, 07 | Drop a widget in an existing app; five proofs |

Mention **article 01** as “what travel means” even though it publishes
after this intro — or publish 00 and 01 same day.

---

## Section 5 — What I am not claiming

**Goal:** Credibility; anti-arrogance (matches series voice fix).

Beat list:

- Not Haxe; not magic compile-everywhere without tradeoffs.
- Svelte proof **mixes** frameworks on purpose; the other four
  (React, Angular, Vue, Web Components) stay native end to end —
  article 07 explains.
- AI speeds you up; it does not replace knowing your export target.
- You still test; proof apps exist for that reason.

---

## Section 6 — How to read the series

**Goal:** Binge Debrief rhythm.

- Short articles, one runtime or one theme each.
- Screenshots are real (`articles/*/graphics/`).
- Clone repo, run commands in boxes — same as articles.
- Optional: “I’ll post workflow pieces when a model or Cursor
  release changes how I work.”

**CTA:** Clone → `npm start` → article 01 (or 02 if you want hands
on canvas first).

---

## Section 7 — Close (personal)

**Goal:** Echo PlantCast; invite return readers.

- One paragraph: why you open-sourced / document this now.
- Optional tie to agencies, multi-client stacks, or your own migration
  scars — whatever is true.
- Last line idea: *The pieces travel. You keep the source.* (only if
  it still sounds like you after article 07 edits — or rewrite.)

---

## Name-dropping checklist (SEO + shareability)

Use naturally, not in every paragraph:

- [ ] Cursor  
- [ ] AI / AI-assisted  
- [ ] At least 2 model names you actually use  
- [ ] React, Vue, Angular, Svelte, web components  
- [ ] Storybook  
- [ ] BYOK / keys in browser (tease article 06)  
- [ ] ffmpeg.wasm or 360° (tease article 05 — distinctive)  
- [ ] Optional: Ollama (local AI audience)

Skip unless relevant: GPT-4o, “frontier,” “AGI,” Copilot (unless you
use it).

---

## Graphics (optional)

| Asset | Suggestion |
| ------- | ------------ |
| Hero | Cursor + builder side by side, or builder welcome |
| Model map | Simple table graphic (you can skip — text is fine) |
| Four doors | Reuse or echo article 01 `03-doors.png` |

---

## Length & tone

- **Target:** 1,200–1,800 words — shorter than a full article 04.
- **Voice:** First person where it’s your workflow; second person
  for “clone and run.”
- **Avoid:** Compiler jargon, glib one-liners, unexplained acronyms.
- **Spell out on first use:** KPI, BYOK.

---

## Publish strategy (optional notes)

- Publish **00 + 01 same day** — intro hooks, 01 delivers product.
- Title/subtitle carry **Cursor + cross-framework** for discovery;
  body delivers substance so product readers stay.
- Cross-link from PlantCast bio or a short “continuing in RosettaDash”
  note if platform allows.

---

## After you draft

- [ ] First paragraph names Cursor or AI within 100 words  
- [ ] Model map is opinion, not marketing  
- [ ] Links to `../01-components-that-travel/` etc.  
- [ ] `keyword-clusters.md` cluster 00 terms appear in title/lede  
- [ ] Read aloud — sounds like Kevin at a meetup, not a whitepaper
