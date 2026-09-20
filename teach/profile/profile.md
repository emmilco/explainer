# Learner profile — Elliot

Schema v0, seeded 2026-09-20. Working document: agent-maintained, human-auditable.
Evidence tags: `seed:<slug>` = conversation in `teach/seeding/`; `seed:design` = the
scoping session (`2f281e55`); `session:YYYY-MM-DD_<slug>` = teach-node sessions (none yet).
Where evidence is thin, the entry says so. Claims without a tag are structural scaffolding.

## Registers

### What lands

- **Confident, non-hedging exposition.** He demands it directly: "speak with confidence"
  (`seed:gadamer`); corrections delivered as corrections, not softened. Hedged answers get
  challenged or ignored.
- **Named mechanisms and portable formulations.** Coining/naming is the highest-value move
  in his own conversations — "commitment laundering" (`seed:commitment-laundering`), "the
  fanout cliff" (`seed:gatekeeping`), the Premack principle (`seed:self-care-app`). He adopts
  the term and extends it himself.
- **Concrete artifacts over prose.** Diagrams, hour-by-hour plans, simulations, mockups,
  retrieved primary-source material. Asked for "a simple text based diagram" after rejecting
  prose (`seed:nutrition-productivity`); escalated fanout-cliff finding into simulation → UI
  (`seed:gatekeeping`).
- **Scaffolding before material.** Outlines/frameworks first, then the thing:
  "give me an outline and brief of the rest of the book just so I have a framework to use as
  I listen" (`seed:brandom-walking`); recalled his recollection was "just the first chapter"
  and asked for the "superstructure" (`seed:sellars`).
- **Recall structures.** Cued reconstruction is his deliberate practice: outline-driven
  recall "so that it gets stored better" (`seed:gadamer`); re-reads and re-drills (Myth of
  Jones "to reinforce my memory", `seed:sellars`).
- **One question at a time.** The taste interview ran ~190 turns on his own correction:
  "ok you've got to ask me one at a time" (`seed:taste-profile`); the startup decision
  resolved via single-question interview (`seed:startup-decision`).
- **Being corrected and correcting.** "This is good pushback"; "You nailed it"
  (`seed:document-confirmation`). He wants weak joints identified, not comfort.
- **Direct retrieval.** What the source actually says — Murphy's "incoherent," Karp quotes
  (`seed:trump-voters`), paper findings (`seed:mech-interp`).

### What misses

- **Enumerated option menus, in topic conversations.** Refused 6–8 times across the corpus:
  "None of them. I follow everything." (`seed:commitment-laundering`); "I don't wanna zoom in
  on that specific sector" (`seed:economic-scenario`). **Exception:** in *decision* conversations he welcomes enumerated forks and
  picks decisively (prune list, backfill picks, "supabase", `seed:design`; `seed:macro-app`).
- **Hedging, over-reassurance, praise.** Praise produces no follow-up; substance does
  (`seed:gadamer`). Emotional-framing moves got a topic change (`seed:career-ai`).
- **Mirroring his interests back.** Named twice: "you're being a little too influenced by my
  specific past interests" (`seed:trump-voters`); redirect-to-Brandom rejected when he asked
  for engineering specifics (`seed:mech-interp`).
- **Generic reframes and life-coach moves.** "That doesn't feel like a very sophisticated
  approach" (`seed:self-care-app`); "This is really naive" (`seed:gatekeeping`).
- **Rigid prescriptions.** Fixed-day schedules get abandoned; "I tend to get resentful of
  excessively prescriptive or rigid schedules and then stop following them"
  (`seed:life-strategy`). Plans need slack.
- **"Would you like me to…?" closures.** Zero uptake, consistently
  (`seed:nutrition-productivity`, others).
- **Fabrication.** Claimed to have read his essay; invented a fund ticker; local model
  fabricated a self-correction (`seed:nonmonotonic`, `seed:investment-sim`,
  `seed:hermeneutics-llm`). He catches these; cost is trust.

### Style facts

- Long turns = arguing (200–400 words, dictated); terse = absorbing ("Okay.", "Keep going.",
  "Fascinating.").
- Voice-first: dictation artifacts tolerated (Brandom→"random", scorekeeping→"sportkeeping");
  corrected only when load-bearing ("No. No. You misheard me. I said deontic scorekeeping").
- Ambulatory sessions are a live option — walks a lot, listens to audiobooks; also learns at
  home on laptop (`seed:design`).
- Profanity when excited; "Bravo" as genuine appraisal (`seed:rorty`).
- Profanity-tolerant, formality-hostile; register is peer-level, warm.

## Domains

Fluency tiers: **native** (corrects us; skip basics), **working** (fluent use; wants edges),
**novice-internals** (owns the vocabulary, learning the machinery), **novice** (asks plainly).

- **Continental philosophy — native.** Brandom (*Making It Explicit*, finished essays on it),
  Rorty (full corpus; "a soulmate"), Wittgenstein (*PI* on a 17-week close reread, 15 pp/wk),
  Gadamer (*Truth and Method*), Heidegger (calls the authentic/inauthentic distinction
  "pseudoethical"), Kant (corrects the assistant), Nietzsche, Kierkegaard. German terms used
  unprompted (*Spiel*, *Bildung*, *verbum*, *logos*). `seed:brandom-walking`, `seed:gadamer`,
  `seed:sellars`, `seed:hermeneutics-llm`
- **Analytic philosophy / phil. of language — native-ish.** Sellars (*EPM* chapter-by-chapter),
  Kripke/Kripkenstein literature, rule-following debates (Baker & Hacker, McDowell),
  inferentialism. `seed:sellars`, `seed:rorty`
- **Logic — working.** Nonmonotonic logic; closure operators, lattices, order-theoretic vs.
  algebraic distinctions; category theory as a lens; Lean granted as a real concession.
  `seed:nonmonotonic`, `seed:document-confirmation`
- **Catholic theology & history — native (insider).** MA in Thomistic theology (Foucault vs.
  Aquinas), taught CCD/high-school theology, graduate coursework in first-millennium
  Christianity, first Latin Mass 2009. Manualists, Garrigou-Lagrange, Newman, *Dei Verbum*,
  conciliar procedure. Uses the tradition as his worked test case for normative-system decay.
  `seed:thomism-critique`, `seed:brandom-walking`, `seed:nonmonotonic`
- **AI/ML theory — novice-internals, working in concepts.** Fluent: SAEs, monosemanticity,
  interventions, RLHF data constraints, scaling arguments. Asks from scratch at the machinery
  level: feed-forward, residuals (stopped Raschka at the attention chapter); tool-call
  mechanics; "forget my interests, I want the actual technical process" (`seed:mech-interp`).
  Exceptions: attention/sparse-attention opinions he holds firmly (`seed:murray-hill`).
- **Applied AI / engineering management — native.** RAG, evals (golden sets, mechanical vs.
  semantic scoring), fine-tuning, agent architecture, Claude Code workflows (verifier/reviewer
  as throttle; 120% merged-PR increase). `seed:commitment-laundering`, `seed:interview-prep`
- **Software engineering — native.** TypeScript, Python, React, Postgres/Supabase, some Go
  (learning, via interpreter-building), debugging; $0-infra instincts; staff-level opinions;
  hostile to abstraction purism. `seed:macro-app`, `seed:investment-sim`, `seed:brandom-walking`
- **Economics / finance — working.** Scenario gaming, 10b5-1, CapEx/S-1/operating leverage,
  wage stickiness, incumbency moats; personal finance (maxes 401k, net worth tracking).
  `seed:economic-scenario`, `seed:career-ai`, `seed:life-strategy`
- **Politics / intellectual history — working, insider edges.** First Things (worked with
  Reno, met Deneen); constitutional mechanics; postliberalism. Corrects "mainstream" framings.
  `seed:trump-voters`
- **Personal systems — native self-knowledge.** Macros (300/160/112; brand-level detail), LPR
  diet, 3-of-4 lifting cycle, ~6h sleep, NYC housing math; behavior design (has tried and
  exhausted the obvious interventions). `seed:nutrition-productivity`, `seed:self-care-app`
- **Media / film — native.** Bergman complete, Tarkovsky rewatches, prestige TV; operative
  rule: "I don't need to be made miserable in order to feel deep insight." `seed:taste-profile`
- **Math, history, natural science — insufficient evidence.** Corpus shows linear-algebra and
  information-theory decks rendered, lattice/category-theory vocabulary in logic contexts, and
  no observed learning sessions in these domains. Open question (§ Open questions).

**Known gaps (his own asks):** attention/FF/residual internals; tool-call mechanics; Go
idioms; anaphora ("Can you tell me what anaphora is?"); "what does recursive self-improvement
even mean"; interview-domain readiness ("this is not a domain I'm ready to pontificate on");
executive function around cooking/scheduling.

## Move preferences

Seeded from corpus; counts accrue as teach sessions run. `n` = observed instances.

| Move | Evidence |
|---|---|
| explain-segment | Lands when confident/specific; misses when hedged. n=many. |
| socratic-question | Single-question form lands strongly (n≥3); multi-part/menu form misses (n≥6 refusals). |
| recall-drill | Lands — his own stated practice: "refresh my memory so that it gets stored better" (n≥3). |
| teach-back | Lands — he volunteers it ("let me repeat that back", "let me tell you what I think the answer is") (n≥4). |
| worked-example | Lands in technical learning; he controls pacing ("stop at each phase") (n≥1 sustained: interpreter). |
| analogy-mapping | Lands when concrete and apt (hand-loom, slime mold, roguelike); risky when decorative. |
| anticipation | Native — "state what I expect the objections to be" (n≥2). |
| steelman | Requested explicitly ("steel man the perspective for me") (n≥2). |
| quiz-item | Endorsed in principle (ruling on formal signals); frequency unproven. n=0 observations. |
| minideck | New modality; no evidence. Seed corpus has no deck exposure. |
| debrief | Endorsed (semi-formal check-ins approved, `seed:design`). n=0. |

## Retention index

No teach-session records yet. Seed baseline: he runs his own uncued recall drills and re-reads
(Gadamer ch. 4–5, Sellars, Rorty, *PI* reread in progress) — self-assessed retention, not
system-tested. No `confirmed` entries to date.

## Open questions

- **Domain modulation.** All corpus evidence is philosophy/AI/personal; does his engagement
  style differ in math, history, or natural science? Unknown.
- **Pushback vs. concession.** He concedes cleanly a better frame, but rejects flatly when the
  frame is weaker than his own. The register of disagreement that actually reaches him (as
  opposed to triggering a "No.") is not yet characterized.
- **Formal-check frequency and phrasing** — endorsed, unproven in practice.
- **Ambulatory/voice sessions** — live option, text-first for now.
- **Deck efficacy** — zero data on whether rendered decks land for him at all.

## Evidence base

`teach/seeding/` — `seed_profile.md` (synthesis), `observations/` (26 per-conversation
extractions), `convos/` (full transcripts), `direct_reads/` (the two gold-standard
conversations, human turns). `seed:design` facts live in session `2f281e55`'s transcript.
