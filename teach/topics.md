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

## Movement of peoples across Europe (dawn of civilization – 800s)

- atoms: [2026-09-19_european-migrations]
- neighbors: [Celts, Germanic peoples / Goths, Migration Period, Anglo-Saxons, Franks, Slavs,
  Vikings, early medieval Europe]
- covered: arc scaffold (two demic replacement waves; Migration Period elite-vs-demic rule;
  Viking settlement modes); cast of pre-Charlemagne peoples; Celts in depth (origins debate,
  Hallstatt/La Tène, expansion, Roman conquest, insular survival); Germanic peoples and the
  Goths to 376/378.
- retention: untested (no formal checks; session ended by learner)
- hooks: Goths inside the empire (Adrianople 378 → Alaric → 410); Franks and Clovis;
  Anglo-Saxon conquest and conversion (Whitby 664); Slavic expansion; the 800s turn
  (Charlemagne, Vikings)
