# Topic graph

One block per topic, maintained by the agent at session close (§8). Read at session open for
the topic and its neighbors. Opportunistic refresh only — no review queue, no scheduling.

Format:

```
## <topic>
- atoms: [YYYY-MM-DD_<slug>, ...]
- neighbors: [<topic>, ...]
- covered: one or two bullets of what was covered
- retention: untested | fuzzy | confirmed (method, date)
- hooks: open questions worth resuming from
```

---

_No topics yet — no teach sessions have run. The first session adds the first block._
