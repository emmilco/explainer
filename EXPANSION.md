# DDIA deck — expansion plan (+29 slides)

Goal: make the deck a viable substitute for reading the book for an experienced
SWE — depth and synthesis, not more breadth (breadth is already ~90%). Takes the
deck from 69 → ~98 slides (~88 min). Build order: A → B → C, verifying each.

Legend: ★ core (highest value/slide) · ◦ nice-to-have.

## Cluster A — batch/stream depth + dataflow worldview (11)
Slots into the derived-data section (currently the thinnest third).
- ★ The Unix philosophy of data — uniform interface, immutable inputs, composition.
- ★ Joins in a batch world — co-locate related records by partition/sort; skew.
- ★ Beyond MapReduce: dataflow engines — Spark/Flink, fusion, lineage vs checkpoint.
- ◦ Batch output is immutable — human fault tolerance, reruns, time-travel.
- ★ The log unifies messaging and storage — offsets, replay, consumer groups, HOL.
- ★ Stream joins — stream-stream, stream-table (CDC enrichment), table-table.
- ★ Exactly-once, honestly — effectively-once = idempotence + checkpointing.
- ◦ Windows & watermarks — tumbling/hopping/sliding/session; stragglers; watermark.
- ★ State and streams are dual — state = integral of stream; changelog = derivative.
- ◦ Lambda → Kappa — batch+speed vs unified stream-first reprocessing.
- ◦ Processing streams: the three uses — CEP, windowed analytics, materialized views.

## Cluster B — the "why" under headline claims (9)
Interleaved after the slides that currently only assert the conclusion.
- ★ The three replication-lag anomalies, shown — read-your-writes/monotonic/prefix.
- ★ How MVCC actually works — visibility rules, txn IDs, update=delete+insert, GC.
- ★ SSI: optimistic serializability — detect-at-commit, abort/retry, scales past 2PL.
- ★ 2PC blocks, consensus doesn't — SPOF+all-yes vs any-node+quorum.
- ◦ You already use consensus — as a log — total-order broadcast = replicated log.
- ◦ The LSM read path — memtable → SSTables newest-first → Bloom skip.
- ◦ What actually breaks a rolling upgrade — add/remove/retype a field; compat matrix.
- ◦ Replication ≠ backup, restated — and what log reprocessing buys you.
- ◦ Causal consistency: the cheaper "almost linearizable".

## Cluster C — synthesis / decision guides (9)
Concentrated guidance the book scatters across 600 pages. Mostly tables/matrices.
- ★ Decision: which isolation level?
- ★ Decision: single-leader vs multi-leader vs leaderless.
- ★ Decision: when to shard (and when not).
- ★ Decision: do you actually need linearizability?
- ★ Decision: batch vs stream vs request/response.
- ★ The trade-off cheat sheet — capstone synthesis of the book's thesis.
- ◦ Storage engine by workload — LSM vs B-tree.
- ◦ Choosing an encoding format — JSON / Avro / protobuf.
- ◦ The "what to reach for" map — problem → concept, navigational capstone.

## Authoring contract (from PROJECT_INDEX)
- Narration carries the full argument; stands alone with eyes shut; never "as you see".
- Slide carries only what you look at — a diagram, a formula, terse concept labels.
  The two must not say the same thing.
- Diagrams use the .viz vocabulary, no per-slide <style>. Reach for .store for
  logs/datastores, .cell/tables for decision matrices, sequences for protocols.
- Render `say` voice (no GPU). Verify with tools/audit_overflow.py + screenshots.
