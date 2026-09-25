# Brief for region authors

> **Polish pass (round 2).** A first draft of every region file exists — possibly unfinished
> (the first authors were cut off mid-work). Your job now is to take your region(s) from draft to
> *beautiful*. Engine changes since round 1: snow is now triplanar (no more sawtooth streaks on
> steep faces), and trail cuts get banks that widen with depth. Findings from screenshots of the
> assembled walk, by region:
>
> - **taiga** — fine start; make the lake read clearly from the trail and the spruce/birch mix distinct from forest.
> - **alpine** — meadows good; snow peaks look like generic grey sawtooth ridges — give them believable massifs (ridged noise with fewer, larger forms, rock bands, snowfields that follow slope).
> - **glacial** — tarn colour good; valley walls read as a striped grey cliff; broadleaf trees (dark, autumn-coloured) on the slopes are wrong for a glacial valley.
> - **autumn** — colour reads as dry yellow grass; the trees are almost black silhouettes. Needs rich orange/red/gold canopies (check the leaf tint values: they multiply a bright leaf texture) and leaf-litter ground.
> - **karst** — not yet seen in the walk; verify the towers exist and read as karst.
> - **saltflat / volcanic / steppe** — all three show the same backdrop of white jagged peaks; each needs its *own* skyline (saltflat: bare low ranges in heat haze; volcanic: dark cinder cones; steppe: distant low blue ridges). Volcanic ground reads as green lumpy mounds — it should be black, blocky basalt with cinder.
> - **seacliffs** — not yet verified; the sea must be visible from the trail most of the time.
> - **pass** — renders almost black: at sunElev 5 with the camera in a cut. Keep the sunset, but raise exposure/env, keep the trail on open ground with the view ahead, and make sure the final overlook looks out over a lit landscape toward the sun.
>
> Also: avoid huge featureless faces; keep the trail on walkable ground (no trenches); check the view
> *sideways* (`&yaw=-70` and `&yaw=70`), since the walker spends much of the walk looking out.

You are writing one landscape region for a procedural "memory palace" walking engine (three.js,
runs in the browser). A narrated ~97-minute walk through Sellars' *Empiricism and the Philosophy
of Mind* passes through 12 regions in order; each region is one stretch of the walk (1–3 km of
trail). The bar is **beautiful and distinctive**: a viewer should remember each region as a
different place. Realistic, not cartoonish.

## The contract (read these files first)

- `engine/regions/forest.js` and `engine/regions/canyon.js` — the two finished reference regions.
- `engine/world.js` — how regions are blended (smooth 240 m transitions), how `floor`,
  `floorNoise`, `lift` and `water` are used, and how the trail is routed.
- `engine/layers.js` — the 16 ground texture layers you can use by name in `surface()`.
- `engine/flora.js` — `VARIANTS` (tree/bush presets you may use) and the flora kinds.

A region module default-exports:

| field | meaning |
|---|---|
| `name` | region id (already set in your stub) |
| `floor` | base elevation of the valley floor (m). Neighbours blend; keep within about ±40 of them |
| `floorNoise` | optional, default 1. Set 0 if you declare still water (lake/sea) so levels line up |
| `water` | optional: `{ river: true }` (river along the valley centreline) or `{ level: y, kind: 'lake'|'sea' }` (flat water plane at floor + y across the region) |
| `lift` | trail keyframes `[[u, metres above floor], …]`, u = 0..1 through the region. The trail climbs by following contour lines on the **+d side** (z > valley centreline), so if lift > 0 the terrain must rise on that side. Start and end near 0–15 so neighbours join smoothly |
| `height(x, z, d, u)` | terrain height relative to floor. `d` = lateral offset from the valley centreline (the walk runs along +x near d≈0..250). Must be fast (called millions of times): a few fbm/ridged calls, no allocation |
| `surface(x, z, h, slope, d, u)` | `{ w: { layerName: weight, … }, tint: [r,g,b] (≈0.8–1.2 hue drift), snow: 0..1 }`. `h` is relative height, `slope` 0 flat..1 vertical |
| `grass(x, z, d, h, u)` | `[lush, dry]` density 0..1 of animated grass blades near the walker |
| `flora` | list of `{ kind: 'tree'|'bush'|'rock'|'cactus', variants: [...] or layer: 'rock'…, size: [min,max], wide?: [min,max], density(x,z,d,h,slope,u) }`. Density is expected instances per m²; keep trees ≤ 0.006, bushes ≤ 0.008, rocks ≤ 0.008 |
| `atmosphere` | `{ sunElev (deg), sunAz (deg), turbidity, rayleigh, mie, fog: [r,g,b], fogDensity, exposure, env }` — use the values assigned below (you may adjust fog/exposure/turbidity for mood) |
| `vignettes` | names from the catalogue: poppies, lupines, daisies, tallgrass, hedgering, hedgerow, bigtree, cairn, log, birches, brittlebush, barrels, ocotillo, balanced, deadtree, hoodoos, desertpoppies. Pick ones that fit; you may propose new ones in your report (don't implement) |

Ground layers: meadow, forest, rock, sand, trail (reserved), strata, snow, basalt, autumn,
limestone, salt, moss, steppe, pebbles, lichen, cinder. The `strata` layer is shaded as banded
red sandstone; the rest take the texture's own colour times your tint.

Vistas matter most: the walker spends much of the time looking out at the landscape. Give
each region a memorable skyline and a view from the trail (ridges, towers, a lake, the sea…),
not just local detail.

## Region order and sun (time of day runs morning → sunset)

| # | region | unit of the essay (mood) | sunElev | sunAz |
|---|---|---|---|---|
| 1 | forest (done) | opening; the framework of givenness | 24 | 290 |
| 2 | taiga | codes vs theories — birch/spruce taiga around a still lake | 30 | 300 |
| 3 | alpine | the logic of "looks" (longest, 16 min) — flower meadows under snow peaks, a high traverse | 42 | 320 |
| 4 | glacial | explaining looks — a glacial valley: moraines, erratic boulders, a milky tarn, ice above | 48 | 340 |
| 5 | autumn | impressions and ideas (history of Locke/Berkeley/Hume) — rolling deciduous hills in autumn colour | 50 | 20 |
| 6 | karst | the logic of "means" — limestone tower karst, green river, Guilin-like | 52 | 200 |
| 7 | canyon (done) | does knowledge have a foundation? | 40 | 250 |
| 8 | saltflat | science and ordinary usage — white salt pan, distant bare ranges, mirage-bright | 40 | 230 |
| 9 | volcanic | private episodes; thoughts — black lava fields, cinder cones, steam, sparse moss | 32 | 260 |
| 10 | steppe | Rylean ancestors; theories and models — endless rolling grassland, big sky | 24 | 280 |
| 11 | seacliffs | Jones and thoughts — trail along high sea cliffs, the sea on the −d (low) side | 14 | 120 |
| 12 | pass | impressions, and the end — a high mountain pass at sunset, final overlook | 5 | 100 |

(sunAz: 180–360 puts the sun behind the walker, who faces +x; 60–120 puts it ahead.)

## How to preview (a server is already running on port 8766; do not start another)

Preview your region between its neighbours, e.g. for alpine:

    /Users/elliotmilco/Documents/GitHub/ft-briefing/.venv-acquire/bin/python /Users/elliotmilco/Documents/GitHub/explainer/teach/palace/engine/tools/shoot.py "engine/dev.html?regions=taiga:500,alpine:2200,glacial:500" "600,1200,1800,2400" alpine

This screenshots the walker's view at those x positions into `engine/.shots/alpine/` (use your
region name as the last argument). Add `&yaw=-60` (or 60) to the page query to look sideways at
the view. Read the PNGs and iterate until it's beautiful. Check fps in the output (should stay
well above 40 headless).

## Rules

- Edit **only** your own region file(s). Do not edit world.js, flora.js, index.js or any other file.
  If you need an engine change, describe it in your report.
- Shell commands must be simple and flat: one command per call, absolute paths, no heredocs,
  no `for` loops, no `$(…)`, no `cd … &&` chains (these trigger permission prompts for the user).
  Use the Read/Write/Edit tools for files.
- Report: what the region looks like, the screenshots you consider best (paths), fps, and any
  engine changes you'd want.
