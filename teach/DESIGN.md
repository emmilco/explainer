# teach — a learning-loop node for explainer

**Status:** design v0 (2026-09-20). Approved; Slice 0 in progress.
**Origin:** scoping session `2f281e55-ebcc-4847-8444-e9192c8a4edb` (2026-09-19/20), seeded by
`teach/seeding/seed_profile.md` (26 extracted conversations from Elliot's claude.ai export;
see `teach/seeding/` for the corpus, scripts, and raw observations).

## 1. Purpose

When Elliot launches a Claude session in this repo and says **"teach me about X"**, the node
teaches him — and gets better at teaching *him* over time by accumulating a profile, a
topic-aware graph of past sessions, and evidence about which moves land in which domains and
formats.

Design decisions inherited from the scoping session (all rulings made by Elliot):

- **Single learner (n=1), not a general tutoring system.** The target is optimizing teaching
  for Elliot specifically.
- **Format space is open:** explainer decks are one modality among several (Socratic chat,
  taught-back recall, worked examples, mixed sessions).
- **Three signal types:** formal (quizzes, teach-back, cloze), semi-formal (end-of-session
  debrief), implicit (shape of Elliot's responses). Delayed check-ins are ruled out.
- **Sessions are one-shot atoms**; atoms form a topic-indexed directed graph of awareness.
  Revisiting a topic triggers opportunistic refresh/retention probes — never scheduled review.
- **Silent opening:** the agent consults profile + graph and simply starts; no preamble
  questions. It adapts fast on implicit signal, especially in the first 2–3 moves.
- **Loop shape:** a light, disposable pre-session plan plus per-move refinement. DeepSeek is
  the cheap variant-generator and judge; frontier-quality judgment is not needed there.
- **Move ontology is hybrid:** a typed outer layer (a revisable taxonomy) with open content
  within a type. The taxonomy can grow and split; changes are logged.
- **This is a standalone project.** Do not import frames or vocabulary from adjacent projects
  (deontic-scorekeeping, taste-modeling); Elliot ruled cross-project inference out.

## 2. Change model

The design is a living document; change is evidence-driven and logged, never drift. Three
layers, with different speeds and authorities:

1. **State** — `profile/profile.md`, `topics.md`, session atoms. Changes every session; this
   is the system working.
2. **Taxonomy** — `moves.md`. Changes when signals show the typed layer is hiding variance
   (a new move type, a split). Accepted changes append a dated rationale; the table is never
   silently rewritten.
3. **Protocol** — `TEACH.md`, loop mechanics, `tools/ds.py`. Changes when the system's own
   experiments show the mechanism is wrong: hypothesis, empirical log, convergence check per
   QMS §7.2 (entries prefixed `teach:` in the repo `experiment_log.md`).

**Constitutional layer — not agent-revisable.** The rulings in §1 change only by Elliot's
instruction: single learner; open format space; the three signal types; one-shot atoms +
topic-indexed graph; silent opening; plan + per-move loop; hybrid revisable taxonomy; no
cross-project inference. Everything below them is revisable on evidence.

## 3. Constraints

- **QMS (`~/.claude/CLAUDE.md`) applies to every session in this repo** — status line, modes,
  empirical-log discipline for the system's own development, chat mode when Elliot invokes it.
- **AISP (Annex A):** the DeepSeek calls are a **fixed-prompt** workload (text in → candidate
  text out, applied mechanically — no action surface). Private data, vetted by Elliot for
  DeepSeek. The API key is injected at runtime as `DEEPSEEK_API_KEY`; never written to disk,
  never logged. Re-classify if ds.py ever gains tools or write-paths driven by model output.
- **GPU:** any production TTS for deck moves goes through the gpu-broker runners
  (`tools/render_higgs.sh`), per PROJECT_INDEX. CPU `say` drafts need no broker.
- **No Anthropic API calls from code** (QMS §11.1). All model calls from this node go to
  DeepSeek; the teaching itself is done by the attended Claude Code session.
- **`deepseek-flash` is a reasoning model.** It emits `reasoning_content` before `content`;
  budget `max_tokens` generously (≥8k) and treat `finish_reason == "length"` or empty
  `content` as failure. (Learned during seeding: a 2k cap silently produced empty outputs.)

## 4. Layout

```
teach/
  DESIGN.md           # this file
  TEACH.md            # session operating contract (agent-facing; the protocol below)
  profile/
    profile.md        # learner profile, schema v0 (seeded)
  topics.md           # awareness graph v0 (single file)
  moves.md            # move taxonomy + revision history
  sessions/
    YYYY-MM-DD_<topic-slug>/
      session.md      # the atom: plan, narrative, outcomes
      signals.jsonl   # per-move signal records (appended live)
      debrief.md      # formal + semi-formal artifacts
      ds/             # candidate sets + judgments (auditable search trail)
  tools/
    ds.py             # DeepSeek helper (candidates | judge)
    prompts/          # versioned prompt files for ds.py
  seeding/            # seed corpus (gitignored; raw evidence base)
```

- Docs (`TEACH.md`, `profile/`, `topics.md`, `moves.md`, `sessions/*.md`, `tools/`) are
  tracked. `teach/seeding/` is gitignored (personal data).
- **Discovery:** a short `CLAUDE.md` at the repo root adds: when the user says "teach me about
  X" (or "teach me more about X"), read `teach/TEACH.md` and follow it. Nothing else changes
  for ordinary deck work. `teach/` gets a row in `PROJECT_INDEX.md` (QMS §7.1 INDEX discipline).

## 5. Session protocol (the loop)

1. **Open silently.** Read `profile/profile.md`, `topics.md`, and recent session atoms.
   Form a disposable plan: topic slice, depth target, opening move, likely format mix.
   Start with the opening move — no questions first. (If `topics.md` shows prior atoms on the
   topic or a neighbor, the plan may *offer* a retention probe vs. refresh, phrased as a move,
   not a preamble question.)
2. **Per move.** Execute the move. After each user response, append one record to
   `signals.jsonl` and revise the plan if the signal warrants. Fast adaptation early.
3. **DeepSeek assist.** At junctions (start with opening + the first 2–3 decision points;
   tune frequency by evidence), call `ds.py candidates` with a bounded context (profile
   excerpt, plan, last exchange summary, taxonomy), then `ds.py judge` to rank. The agent
   chooses; when it overrides the judged ranking, it logs why in `session.md`.
4. **Formal checks.** Insert quiz / teach-back / recall-drill moves at natural breaks; record
   results in `debrief.md` (what was tested, correct/fuzzy/missed).
5. **Close.** Run a debrief move (three questions: what landed, what didn't, what next).
6. **Update state.** Write `session.md`; update `profile.md` (move × domain evidence, new
   domain facts, register adjustments — all evidence-tagged), `topics.md` (coverage, retention,
   hooks, neighbors), and `moves.md` if the taxonomy shifts. One file touch, one reason.

### Signals (append-only JSONL)

```json
{"ts":"2026-09-20T14:03:00Z","move":"socratic-question","seq":7,
 "target":"rule-following / deviant pupil","len_chars":412,"latency_s":25,
 "shape":"extended","agent_read":"landed","notes":"built his own continuant example"}
```

- `shape`: `extended | terse | correction | pushback | question-back | topic-shift | stall | silence`
- `agent_read`: `landed | partial | missed | uncertain` (the agent's interpretation — evidence
  stays in `notes`).

## 6. Profile schema v0 (`profile/profile.md`)

Markdown with fixed headings; every claim carries an evidence tag (`seed:<conversation>`,
`session:<date>`). Agent-maintained; human-auditable; DS prompts consume excerpts.

1. **Registers** — what lands and what misses: density, length, tone, hedging, praise, menus,
   rigid prescriptions. Example seeded entries: enumerated menus miss in *topic* conversations
   but work in *decision* conversations; named mechanisms and portable formulations land;
   teach-back/recall structures land; sycophancy and interest-mirroring get called out.
2. **Domains** — one block per domain: fluency tier (native / working / novice), what can be
   skipped, known gaps, sources read, vocabulary used. Domains seeded from the corpus:
   continental philosophy, analytic philosophy, logic, Catholic theology/history, AI/ML theory,
   applied AI/engineering, software engineering, economics/politics, personal systems, media.
3. **Move preferences** — table of move × domain → evidence with counts once sessions exist.
4. **Retention index** — topics formally tested, status (`untested | fuzzy | confirmed`),
   method and date. (Kept in sync with `topics.md`; profile holds the summary.)
5. **Open questions** — hypotheses awaiting evidence (e.g., does engagement differ by domain
   among math / history / science — currently unknown).
6. **Evidence base pointer** — `teach/seeding/` (raw observations), not duplicated here.

## 7. Move taxonomy v0 (`moves.md`)

Typed outer layer, revisable inner layer. Seeded from the corpus (evidence noted at seed time):

| Move | Notes |
|---|---|
| `explain-segment` | Monologue exposition; strong when it is confident and precise, weak when it hedges. |
| `socratic-question` | One question at a time; enumerate multi-part questions miss. |
| `recall-drill` | Cued reconstruction of material he has read (his Gadamer/Sellars pattern: "outline-driven recall, so it gets stored better"). |
| `teach-back` | Elliot explains; agent corrects. He volunteers this unprompted ("let me repeat that back"). |
| `worked-example` | Stepwise through a concrete instance (parsing, lexing, macro math). |
| `analogy-mapping` | From an adjacent domain he owns (slime mold, roguelike, hand-loom). |
| `anticipation` | He predicts (objections, outcomes) before the reveal; he does this natively. |
| `steelman` | Adversarial best-case for a position; he requests this explicitly on disliked views. |
| `quiz-item` | Formal check; use sparingly, at natural breaks. |
| `minideck` | 3–8 slides through the existing deck pipeline (draft `say` by default; production audio only if it earns it). |
| `debrief` | Semi-formal signal capture; three questions, free-form answers. |

Revision protocol: the post-session state update may propose a new type or a split (e.g.,
"worked example" → worked-and-explained vs. worked-and-you-fill-the-gaps) when signals show
hidden variance. Accepted changes append to `moves.md` with a dated rationale — never silently
rewritten.

## 8. Topic graph v0 (`topics.md`)

One file, one block per topic:

```
## <topic>
- atoms: [2026-09-20_<slug>, ...]
- neighbors: [<topic>, ...]
- covered: one or two bullets of what was covered
- retention: untested | fuzzy | confirmed (method, date)
- hooks: open questions worth resuming from
```

Maintained by the agent at session close. Read at session open for the topic and its neighbors.
Opportunistic refresh only — no review queue, no scheduling. If the file stops being usable at
a glance, split it or move to JSONL + a small renderer; not before.

## 9. DeepSeek helper (`tools/ds.py`)

Fixed-prompt, file-based, auditable. Two subcommands in v0:

- `ds.py candidates --session <dir> --profile-excerpt <path> --n 5` → writes
  `ds/candidates_<seq>.json`: N candidate next-moves (taxonomy type + content sketch + rationale).
- `ds.py judge --session <dir> --candidates <file>` → writes `ds/judgment_<seq>.json`: ranking
  with reasons grounded in profile evidence.

Implementation notes:

- Model `deepseek-flash`; `max_tokens` default 8192; on `finish_reason == "length"` or empty
  content → single retry with doubled budget, then fail loudly (never write empty output).
- Key: `os.environ["DEEPSEEK_API_KEY"]`, clear error if unset. Never persisted, never logged.
- Prompts live in `tools/prompts/` as versioned files; every call records model, prompt file,
  and a content hash in the output JSON — the search stays reproducible and reviewable.
- Writing candidates/judgments is mechanical (fixed paths, model text only) — fixed-prompt per
  AISP §2. That classification is a precondition; revisit if ds.py ever acts on its output.

## 10. Deck integration

`minideck` moves author into `decks/` in the standard format and follow the existing authoring
workflow: draft render (`say`) → `audit_overflow.py` → `shoot.py` → production audio via the
gpu-broker runners. No changes to `render.py` in v0. The teach node decides *when* a deck is the
right move and *what it must cover* (from plan + profile); the deck contract decides *how*.

## 11. Build order

- **Slice 0 — protocol + state (no new code).** `teach/DESIGN.md`, `teach/TEACH.md`,
  `profile/profile.md` (condensed from `teach/seeding/seed_profile.md`), `topics.md`,
  `moves.md`, `sessions/` skeleton, repo `CLAUDE.md` trigger, PROJECT_INDEX row. Test: two real
  sessions — "teach me about X", then a revisit of X or a neighbor — validating the protocol,
  the state updates, and the retention probe. The riskiest part is the conversational shape of
  the protocol, not the model calls; retire it first.
- **Slice 1 — DeepSeek in the loop.** `tools/ds.py` + prompts; wire into opening and first
  decision points. Experiment (logged in the repo `experiment_log.md`, entries prefixed
  `teach:`): do DS-proposed moves beat agent-only moves on Elliot's implicit signal?
- **Slice 2 — minideck.** First loop-authored mini-deck played and measured.
- **Slice 3 — formal signals + retention.** Quiz/teach-back exercised; retention statuses
  updated on a topic revisit; first evidence on whether formal checks change anything.

## 12. Out of scope (v0)

- No daemon, UI, scheduler, or background process. Files + an attended agent session only.
- No cross-project imports (see §1, final bullet).
- No delayed/spaced-repetition scheduling — opportunistic only, by Elliot's ruling.
- No general-user or multi-learner concerns; if the algorithm generalizes, great, but nothing
  here is designed for it.

## 13. Open questions

- Does engagement style differ by subject domain (humanities vs. math vs. history)? No corpus
  evidence either way.
- Where formal checks sit relative to Elliot's stated friction tolerance — he endorses them in
  principle; frequency and phrasing are unproven.
- Ambulatory usage: voice/walking sessions are a live option but the node is text-first. A
  voice path is a later question, not a v0 one.
