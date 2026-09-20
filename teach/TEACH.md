# TEACH.md — operating contract for "teach me about X"

Read this when Elliot says **"teach me about X"** or **"teach me more about X"** in this repo
(or otherwise clearly starts a learning session). The design rationale is `DESIGN.md`; this
file is the procedure. Sections referenced as §N are in `DESIGN.md`.

## Before the first move — silent, no preamble

Read, in order:

1. `profile/profile.md` — registers, domains, move preferences, open questions.
2. `topics.md` — the topic and its neighbors.
3. The last ~3 session atoms in `sessions/*/session.md`, if any.

Then write a **disposable plan** as a `## Plan` block at the top of
`sessions/<YYYY-MM-DD>_<topic-slug>/session.md`:

- topic slice — what X covers in this sitting (one-shot; do not schedule continuations)
- depth target — from the profile's fluency tier for the domain + `topics.md` hooks
- opening move — from `moves.md`; execute it immediately (no "what would you like" questions)
- likely format mix — chat / recall / deck / mixed

If `topics.md` shows prior atoms on X or a neighbor, include a **probe-or-refresh** early:
"we covered this on <date> — want me to probe what stuck, or refresh first?" — phrased as a
move, not a meta-question.

## During the session

- One atomic move at a time (taxonomy: `moves.md`). A move is a single teaching act.
- After **each** Elliot response, append one record to `sessions/<dir>/signals.jsonl` before
  the next move. Schema (§5):

  ```json
  {"ts":"...","move":"socratic-question","seq":7,"target":"...",
   "len_chars":412,"latency_s":25,"shape":"extended","agent_read":"landed","notes":"..."}
  ```

- Revise the plan when a signal warrants; log the revision in `session.md` (one line).
- The opening 2–3 moves carry the calibration — adapt fastest there.
- Registers in force (from the profile): no enumerated menus *about the topic*; no hedging;
  no interest-mirroring; no praise; give the requested material; corrections as corrections.

## DeepSeek assist — Slice 1, not available yet

Skip until `teach/tools/ds.py` exists. When it does: call `candidates` at the opening and the
first 2–3 decision points, then `judge`; the agent chooses, logging any override of the
judged ranking in `session.md` (§9).

## Close

1. **Debrief move** — three free-form questions: what landed, what didn't, what next.
2. **Formal checks** where natural: quiz / teach-back / recall-drill. Record each item's
   result in `debrief.md` as `correct | fuzzy | missed`.
3. **Write `session.md`** — narrative: what was covered, what worked, plan revisions, any
   DS override.
4. **Update state** (one touch per file, one reason per change):
   - `profile/profile.md` — append evidence with `session:<date>_<slug>` tags; adjust
     move-preference counts; registers only with evidence.
   - `topics.md` — coverage bullets, retention status, hooks, neighbors, atom reference.
   - `moves.md` — only if the taxonomy should change (dated rationale in Revision history).
5. If a deck was made, it lives in `decks/` and renders per `PROJECT_INDEX.md` (authoring
   workflow; production audio via the gpu-broker).

## Discipline

- Every profile claim carries an evidence tag; where evidence is thin, write
  "insufficient evidence" rather than generalize.
- QMS applies: status line at session start; chat mode only if Elliot invokes it (§7.4);
  §7.2 experimental regime for changes to the system itself; AISP for all model calls.
- `deepseek-flash` is a reasoning model — if you ever call the API directly: budget ≥8k
  completion tokens; empty `content` or `finish_length` is a failure, not an answer (§3).
- This contract is the protocol layer of the change model (§2): it changes only on evidence,
  logged — not on the fly.
