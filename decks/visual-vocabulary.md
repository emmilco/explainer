# A Visual Vocabulary

---
## A visual vocabulary

- shared diagram + motion system
- consistent across math · CS · philosophy

::: narration
This is a reference for the visual language the explainers are built from. Rather than hand-drawing each diagram from scratch, every visual draws on one shared vocabulary: a small set of building blocks — nodes, edges, labels, bars, grid cells — each with consistent styling and a fixed palette of semantic roles, plus a handful of named motion primitives with carefully tuned easing. The point is intentionality. A node that means "this is special" looks the same on every slide; an edge that carries data flows the same way everywhere; a thing that fails recedes with the same gesture. Consistency is what makes a diagram legible at a glance, because the viewer learns the language once and then reads fluently. The following slides walk through each pattern in turn — what it is, and when to reach for it.
:::

---
## Nodes & edges

<div class="viz">
<svg viewBox="0 0 460 230">
<defs><marker id="arrG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="90" y1="70" x2="220" y2="55" marker-end="url(#arrG)"/>
<line class="edge" x1="90" y1="70" x2="200" y2="160"/>
<line class="edge accent" x1="240" y1="60" x2="360" y2="70" marker-end="url(#arrG)"/>
<line class="edge ghost" x1="220" y1="170" x2="350" y2="170"/>
<circle class="node accent" cx="70" cy="70" r="26"/><text class="lbl on-fill" x="70" y="70">root</text>
<circle class="node" cx="225" cy="55" r="24"/><text class="lbl" x="225" y="55">A</text>
<circle class="node good" cx="380" cy="70" r="24"/><text class="lbl" x="380" y="70">B</text>
<circle class="node warn" cx="205" cy="165" r="24"/><text class="lbl" x="205" y="165">C</text>
<circle class="node danger" cx="365" cy="170" r="24"/><text class="lbl" x="365" y="170">D</text>
<text class="cap" x="230" y="220">roles: accent · good · warn · danger · muted</text>
</svg>
</div>

- `.node` + role · `.edge` (+ `accent`/`good`/`ghost`) · `.lbl`

::: narration
The foundation is nodes and edges — the right model for anything relational: graphs, networks, state machines, dependency diagrams, replication topologies, even logical arguments in philosophy. A node is a circle or box carrying the node class plus an optional role that colours it by meaning: accent for the focal element, good for a healthy or accepting state, warn for caution, danger for failure, muted for the backdrop. Edges connect them, defaulting to a quiet tan, strengthening to accent when they carry the eye, or going ghosted and dashed when the relationship is weak or hypothetical. Arrowheads come from a single reusable marker definition. Because the roles are fixed, the colours mean the same thing on every diagram — a viewer never has to relearn what red signifies. This is the pattern you reach for first, and most others build on it.
:::

---
## Trees & hierarchies

<div class="viz">
<svg viewBox="0 0 460 240">
<line class="edge" x1="230" y1="48" x2="120" y2="120"/>
<line class="edge" x1="230" y1="48" x2="340" y2="120"/>
<line class="edge" x1="120" y1="140" x2="70" y2="200"/>
<line class="edge" x1="120" y1="140" x2="170" y2="200"/>
<line class="edge" x1="340" y1="140" x2="290" y2="200"/>
<line class="edge" x1="340" y1="140" x2="390" y2="200"/>
<rect class="node accent" x="190" y="26" width="80" height="40" rx="6"/><text class="lbl on-fill" x="230" y="46">root</text>
<rect class="node" x="82" y="118" width="76" height="40" rx="6"/><text class="lbl" x="120" y="138">left</text>
<rect class="node" x="302" y="118" width="76" height="40" rx="6"/><text class="lbl" x="340" y="138">right</text>
<rect class="node muted" x="42" y="196" width="56" height="34" rx="5"/>
<rect class="node muted" x="142" y="196" width="56" height="34" rx="5"/>
<rect class="node muted" x="262" y="196" width="56" height="34" rx="5"/>
<rect class="node muted" x="362" y="196" width="56" height="34" rx="5"/>
</svg>
</div>

- same node/edge classes, laid top-down · B-trees, syntax trees, taxonomies

::: narration
A tree is just nodes and edges arranged as a hierarchy, and it recurs everywhere: B-trees and search trees in computer science, parse and syntax trees, proof trees and conceptual taxonomies in philosophy, the recursive structure of an inductive definition in mathematics. Nothing new is needed — the same node and edge classes, laid out top-down with the root accented and the leaves muted to push them into the background. Rectangles with rounded corners read as containers or records, where circles read as atomic entities; choosing between them is itself part of the vocabulary. Keeping the leaf nodes muted is a deliberate move: it directs attention up toward the structure rather than letting a row of identical boxes compete for it. When you need to show containment or descent, this is the shape.
:::

---
## Flows & pipelines

<div class="viz wide">
<svg viewBox="0 0 560 150">
<defs><marker id="arrF" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="130" y1="75" x2="205" y2="75" marker-end="url(#arrF)"/>
<line class="edge" x1="335" y1="75" x2="410" y2="75" marker-end="url(#arrF)"/>
<rect class="node" x="30" y="50" width="100" height="50" rx="7"/><text class="lbl" x="80" y="75">source</text>
<rect class="node accent" x="210" y="50" width="120" height="50" rx="7"/><text class="lbl on-fill" x="270" y="75">transform</text>
<rect class="node good" x="412" y="50" width="110" height="50" rx="7"/><text class="lbl" x="467" y="75">sink</text>
<circle class="token" r="6"><animateMotion dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.46;0.54;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1" keyPoints="0;0.5;0.5;1" path="M30,118 L270,118 L467,118"/></circle>
<text class="cap" x="280" y="138">an eased token carries data through the stages</text>
</svg>
</div>

- boxes + arrows + a flowing `.token` · ETL, dataflow, request paths

::: narration
A flow shows data or control moving through stages — an ETL pipeline, a request path, a dataflow graph, the steps of an algorithm. It's labelled boxes joined by arrows, with one addition that brings it to life: a token, a small dot that travels the path. The motion here is the key to it not looking clunky. Rather than sliding at a constant linear speed and snapping back, the token eases in and out using a spline timing curve, pausing briefly at each stage before continuing — so the eye can follow a discrete hop rather than a mechanical glide. That easing, tuned once and reused, is what separates a polished animation from a janky one. For anything that proceeds in steps — a pipeline, a protocol, a derivation — this is the pattern, and the flowing token is its signature.
:::

---
## Bars & quantities

<div class="viz">
<svg viewBox="0 0 460 230">
<line class="axis" x1="50" y1="190" x2="430" y2="190"/>
<rect class="track" x="70" y="40" width="46" height="150" rx="3"/>
<rect class="bar m-in" style="--i:0" x="70" y="120" width="46" height="70" rx="3"/>
<rect class="track" x="140" y="40" width="46" height="150" rx="3"/>
<rect class="bar accent m-in" style="--i:1" x="140" y="70" width="46" height="120" rx="3" fill="#1A3F70"/>
<rect class="track" x="210" y="40" width="46" height="150" rx="3"/>
<rect class="bar good m-in" style="--i:2" x="210" y="60" width="46" height="130" rx="3"/>
<rect class="track" x="280" y="40" width="46" height="150" rx="3"/>
<rect class="bar warn m-in" style="--i:3" x="280" y="110" width="46" height="80" rx="3"/>
<rect class="track" x="350" y="40" width="46" height="150" rx="3"/>
<rect class="bar danger m-in" style="--i:4" x="350" y="150" width="46" height="40" rx="3"/>
<text class="tag" x="93" y="210">p50</text><text class="tag" x="163" y="210">p90</text><text class="tag" x="233" y="210">p99</text><text class="tag" x="303" y="210">p999</text><text class="tag" x="373" y="210">max</text>
</svg>
</div>

- `.track` + `.bar` (role) + `.axis` · staggered `m-in` reveal

::: narration
Bars turn numbers into something you can compare at a glance — latency percentiles, throughput, the cost of two approaches, a distribution. Each bar sits in a faint track that shows the full range, with the bar itself coloured by role: accent for the figure in focus, good and warn and danger to encode whether a value is healthy or alarming. A thin axis line grounds them. The reveal uses the fade-in primitive with a stagger — each bar carries an index, and the motion system delays its appearance by a small multiple of that index, so the bars resolve left to right in a quick, orderly cascade rather than all blinking on at once. That staggered entrance is a reusable trick that works anywhere a set of things should arrive in sequence. Whenever the point is magnitude or comparison, reach for bars.
:::

---
## Grids & matrices

<div class="viz">
<svg viewBox="0 0 320 270">
<g>
<rect class="cell on" x="40" y="30" width="44" height="44"/><rect class="cell off" x="86" y="30" width="44" height="44"/><rect class="cell off" x="132" y="30" width="44" height="44"/><rect class="cell hot" x="178" y="30" width="44" height="44"/>
<rect class="cell off" x="40" y="76" width="44" height="44"/><rect class="cell sel" x="86" y="76" width="44" height="44"/><rect class="cell on" x="132" y="76" width="44" height="44"/><rect class="cell off" x="178" y="76" width="44" height="44"/>
<rect class="cell off" x="40" y="122" width="44" height="44"/><rect class="cell on" x="86" y="122" width="44" height="44"/><rect class="cell off" x="132" y="122" width="44" height="44"/><rect class="cell on" x="178" y="122" width="44" height="44"/>
<rect class="cell hot" x="40" y="168" width="44" height="44"/><rect class="cell off" x="86" y="168" width="44" height="44"/><rect class="cell sel" x="132" y="168" width="44" height="44"/><rect class="cell off" x="178" y="168" width="44" height="44"/>
</g>
<text class="cap" x="131" y="240">on · off · hot · sel — one cell, four meanings</text>
</svg>
</div>

- `.cell` + `on`/`off`/`hot`/`sel` · attention matrices, adjacency, truth tables

::: narration
A grid of cells is the right picture whenever data is two-dimensional and discrete: an attention matrix in machine learning, an adjacency matrix for a graph, a sharding layout, a bitmap index, a truth table or a logical model in philosophy. Each cell carries a state by role — on for active or true, off for the quiet background, hot to flag intensity or a hot spot, sel to mark a selection or the cell under discussion. The white gaps between cells come from a consistent two-pixel stroke, which reads as a clean grid without heavy lines. Because the four states are fixed and colour-coded the same way every time, a viewer can scan a matrix and immediately separate signal from background. When the structure is a table of discrete values, this is the vocabulary.
:::

---
## Sequences & timelines

<div class="viz">
<svg viewBox="0 0 460 250">
<defs><marker id="arrS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#1A3F70"/></marker></defs>
<rect class="node accent" x="70" y="20" width="90" height="34" rx="5"/><text class="lbl on-fill" x="115" y="37">client</text>
<rect class="node" x="300" y="20" width="90" height="34" rx="5"/><text class="lbl" x="345" y="37">server</text>
<line class="edge ghost" x1="115" y1="54" x2="115" y2="230"/>
<line class="edge ghost" x1="345" y1="54" x2="345" y2="230"/>
<line class="edge accent" x1="115" y1="90" x2="345" y2="105" marker-end="url(#arrS)"/><text class="cap" x="230" y="86">request</text>
<line class="edge" x1="345" y1="150" x2="115" y2="168" marker-end="url(#arrS)"/><text class="cap" x="230" y="146">response</text>
<circle class="token accent" r="5"><animateMotion dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.4;0.5;0.9;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1" keyPoints="0;0.5;0.5;1;1" path="M115,90 L345,105 L345,150 L115,168"/></circle>
</svg>
</div>

- lifelines (`ghost`) + message `edge`s · time flows down · protocols, dialogue

::: narration
A sequence diagram shows messages exchanged between participants over time — a request and response, a two-phase commit, a consensus round, a Socratic dialogue. Each participant gets a lifeline, a ghosted vertical line dropping down the slide, with time flowing downward. Messages are edges crossing between lifelines, an accented arrow for the outbound request, a plain one for the reply, each labelled. A token rides the message path with the same eased timing, pausing at each participant before the next hop, so you watch the exchange unfold step by step. This is the pattern for anything where the story is an ordered conversation between two or more actors — the temporal structure of a protocol, an interaction, or an argument made back and forth.
:::

---
## Geometry & vectors

<div class="viz narrow">
<svg viewBox="0 0 240 240">
<defs><marker id="arrV" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#1A3F70"/></marker><marker id="arrVg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#0F5D5D"/></marker></defs>
<line class="axis" x1="20" y1="200" x2="220" y2="200"/>
<line class="axis" x1="40" y1="20" x2="40" y2="220"/>
<polygon class="region" points="40,200 150,200 190,120 80,120"/>
<line class="edge accent" x1="40" y1="200" x2="150" y2="200" stroke-width="3" marker-end="url(#arrV)"/>
<line class="edge good" x1="40" y1="200" x2="80" y2="120" marker-end="url(#arrVg)"/>
<text class="lbl mono accent" x="100" y="216">v₁</text>
<text class="lbl mono good" x="48" y="150">v₂</text>
</svg>
</div>

- axes + vectors as `edge`s + a shaded region · spans, transforms, proofs

::: narration
Mathematics needs its own shapes: a coordinate plane with axes, vectors drawn as arrows, regions shaded to show a span or a feasible set, figures transformed. Here the axes use the same thin axis style as the bar chart, vectors are simply edges with arrowheads coloured by role, and the parallelogram they span is a translucent fill in the accent colour. Reusing the edge and axis classes keeps a geometry figure visually of a piece with the rest of the deck rather than looking like it came from a different tool. This covers linear algebra, the geometry of an optimization, a vector field, or any argument that's clearer drawn than stated. The translucent region is a particularly useful move — it shows an area or a set without obscuring the vectors that define it.
:::

---
## Regions & colored text

<div class="viz">
<svg viewBox="0 0 460 250">
<circle class="region" cx="185" cy="105" r="68"/>
<circle class="region good" cx="275" cy="105" r="68"/>
<text class="lbl" x="150" y="105">A</text>
<text class="lbl" x="310" y="105">B</text>
<text class="lbl plum" x="230" y="105">A∩B</text>
<text class="cap" x="230" y="196">overlaps blend on their own</text>
<text class="tag accent" x="90" y="230">accent</text>
<text class="tag good" x="160" y="230">good</text>
<text class="tag warn" x="230" y="230">warn</text>
<text class="tag danger" x="300" y="230">danger</text>
<text class="tag plum" x="370" y="230">plum</text>
</svg>
</div>

- `.region` (+ role) — a translucent set or area · Venn, feasible sets, spans
- `.cap` / `.lbl` / `.tag` take the same roles — colored annotation
- roles, not raw hex — the palette stays free to move

::: narration
Two additions close the vocabulary's most common workarounds. The first is the region: a translucent shape for anything that is an area rather than an object — the circles of a Venn diagram, a feasible set, the span of two vectors. Regions take the same semantic roles as nodes, and because their fills are translucent, overlapping regions blend on their own, which is exactly what a Venn diagram needs. The second is colored text: captions, labels, and tags now take the role modifiers directly, so an annotation can be marked good or dangerous by class alone. Before these existed, decks reached for raw hex values copied from the palette — which worked, but froze those colors in place. Writing roles instead of hex keeps every diagram tied to the single palette definition, so the whole library restyles together if the palette ever moves.
:::

---
## Motion primitives

<div class="viz">
<svg viewBox="0 0 460 200">
<circle class="node accent m-pulse" cx="80" cy="80" r="26"/><text class="tag" x="80" y="135">pulse</text>
<circle class="node m-dim" style="--d:0.6s" cx="180" cy="80" r="26"/><text class="tag" x="180" y="135">dim</text>
<line class="edge good m-draw" style="--len:120" x1="250" y1="80" x2="370" y2="80"/><text class="tag" x="310" y="135">draw</text>
<circle class="token good" r="7"><animateMotion dur="2.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.75;1" keySplines="0.65 0 0.35 1;0 0 1 1" keyPoints="0;1;1" path="M400,80 L440,80 L400,80"/></circle><text class="tag" x="420" y="135">flow</text>
<text class="cap" x="230" y="180">+ m-in / m-rise: staggered fade & rise on entrance</text>
</svg>
</div>

- `m-pulse` · `m-dim` · `m-draw` · token `flow` · `m-in`/`m-rise`
- all eased; one curve, reused everywhere

::: narration
The motion is itself a small fixed palette, because animation is where clunkiness creeps in. Pulse gently breathes a node's opacity to draw attention without distraction. Dim recedes an element to the background — the gesture for something that fails, is superseded, or steps out of focus — and it can be delayed so it happens at the right beat. Draw traces a stroke onto an edge, as if the connection were being made before your eyes. The flowing token, eased so it glides and rests rather than sliding mechanically. And for entrances, fade-in and rise-in, each staggerable so a group of things arrives in sequence. Every one of these shares the same two easing curves, defined once. That single discipline — reusing a handful of tuned curves rather than improvising timing per animation — is what makes the whole system feel deliberate instead of ad hoc.
:::

---
## Datastores

<div class="viz wide">
<svg viewBox="0 0 520 200">
<defs><marker id="arrST" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="140" y1="104" x2="196" y2="104" marker-end="url(#arrST)"/>
<line class="edge" x1="290" y1="104" x2="350" y2="104" marker-end="url(#arrST)"/>
<path class="store" d="M46,56 V150 A44 13 0 0 0 134,150 V56 Z"/><ellipse class="store" cx="90" cy="56" rx="44" ry="13"/>
<text class="olbl" x="90" y="174">source of record</text>
<path class="store warn" d="M214,72 V138 A36 11 0 0 0 286,138 V72 Z"/><ellipse class="store warn" cx="250" cy="72" rx="36" ry="11"/>
<text class="olbl" x="250" y="160">change log</text>
<path class="store good" d="M376,56 V150 A44 13 0 0 0 464,150 V56 Z"/><ellipse class="store good" cx="420" cy="56" rx="44" ry="13"/>
<text class="olbl" x="420" y="174">derived store</text>
<circle class="token" r="6"><animateMotion dur="3.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.45;0.55;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1" keyPoints="0;0.5;0.5;1" path="M140,104 L250,104 L420,104"/></circle>
</svg>
</div>

- `.store` cylinder (+ `good`/`warn`/`accent`) · the database / log glyph
- a body `<path>` + a top `<ellipse>`, both `class="store"`

::: narration
Computer-science decks are mostly about databases, so they need the database's canonical symbol: the cylinder. The store class draws one — a body path plus a top ellipse, both carrying the class, coloured by the same semantic roles as nodes. A plain cylinder is a system of record, warn marks a log or queue, good a derived store. Here a change flows from the source of record through the log to a derived store, the same eased token as any other flow. Reaching for the cylinder rather than a rectangle whenever the thing is a datastore is what makes a storage diagram read instantly — the shape itself says "this is where data lives."
:::

---
## Labels, code & failure

<div class="viz wide">
<svg viewBox="0 0 560 220">
<line class="edge warn" x1="96" y1="80" x2="182" y2="104"/>
<line class="edge plum" x1="96" y1="150" x2="182" y2="118"/>
<circle class="node accent" cx="80" cy="70" r="18"/><text class="olbl" x="80" y="100">leader</text>
<circle class="node" cx="80" cy="150" r="18"/><text class="lbl sm" x="80" y="150">f1</text>
<circle class="node danger m-dim" style="--d:1.4s" cx="200" cy="110" r="20"/>
<line class="x-mark" x1="188" y1="98" x2="212" y2="122"/><line class="x-mark" x1="212" y1="98" x2="188" y2="122"/>
<text class="olbl" x="200" y="146">crashed</text>
<rect class="node muted" x="330" y="46" width="210" height="128" rx="7"/>
<text class="code" x="346" y="74">events.append({</text>
<text class="code" x="346" y="98">  type: "commit",</text>
<text class="code" x="346" y="122">  ts: 42.004,</text>
<text class="code" x="346" y="146">})</text>
<text class="cap" x="435" y="194">left-aligned .code</text>
</svg>
</div>

- `.olbl` beside a node · `.lbl sm` inside a small one · `.code` block
- `.x-mark` + `m-dim` = a node dies · `.edge warn` / `.edge plum` complete the roles

::: narration
The last additions close the gaps that turn up most. When a node is too small to hold its name, the external label hangs the text beside it instead of overflowing — leader, here, beside an accented node — while a short label like an abbreviation can sit inside with the small variant. Structured text gets its own treatment: the code class is left-aligned monospace, the right tool for a snippet, a JSON document, or any annotation that shouldn't be centred. Failure has a fixed gesture too: the cross mark struck over a node, paired with the dim primitive, is the universal "this one died." And the edge roles now mirror the node roles exactly — warn and plum included — so a colour means the same thing whether it fills a node or strokes the line between two. Small pieces, but each removes a recurring workaround.
:::

---
## Composing a scene

<div class="viz wide">
<svg viewBox="0 0 560 230">
<defs><marker id="arrX" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="90" y1="110" x2="200" y2="60" marker-end="url(#arrX)"/>
<line class="edge" x1="90" y1="110" x2="200" y2="160" marker-end="url(#arrX)"/>
<line class="edge" x1="250" y1="60" x2="370" y2="110" marker-end="url(#arrX)"/>
<line class="edge ghost" x1="250" y1="160" x2="370" y2="110"/>
<line class="edge" x1="420" y1="110" x2="500" y2="110" marker-end="url(#arrX)"/>
<circle class="node accent" cx="70" cy="110" r="26"/><text class="lbl on-fill" x="70" y="110">in</text>
<circle class="node" cx="225" cy="60" r="24"/><text class="lbl" x="225" y="60">A</text>
<circle class="node danger m-dim" style="--d:1.2s" cx="225" cy="160" r="24"/><text class="lbl" x="225" y="160">B</text>
<circle class="node good" cx="395" cy="110" r="26"/><text class="lbl" x="395" y="110">out</text>
<rect class="node muted" x="500" y="86" width="48" height="48" rx="6"/>
<circle class="token" r="6"><animateMotion dur="3.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.4;0.5;0.9;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1" keyPoints="0;0.5;0.5;1;1" path="M70,110 L225,60 L395,110 L500,110"/></circle>
<text class="cap" x="290" y="215">node B fails (dim) → traffic reroutes through A — one vocabulary, one scene</text>
</svg>
</div>

::: narration
The patterns compose. This single scene combines nearly all of them: nodes in their semantic roles, edges both solid and ghosted, an eased token flowing the live path, and the dim primitive used to fail one node — node B recedes after a beat, and the flow routes around it through A to the output. Nothing here is bespoke; it's the same handful of classes and primitives assembled. That's the payoff of a vocabulary over one-off drawings — a richer picture costs little more than a simpler one, and it stays coherent because every part speaks the same language. A reader who has seen the earlier slides already knows how to read this one: the red node is in trouble, the dashed edge is the path not taken, the moving dot is the data.
:::

---
<!-- .slide: class="divider" -->
### Part II
## Slide registers

::: narration
A long deck needs visible structure — after forty slides of salmon paper, a chapter boundary should feel like one. The divider register does that: the whole screen flips to the deep navy of the accent palette, the title sets in the same serif reversed out in salmon, and a small uppercase kicker above it carries the part label. A slide opts in with a single class annotation on its first line; the background, the recolored chrome, and the vertical centering all follow from the register. Use one at each major boundary of a deck, so a listener paging back through can see its skeleton at a glance. The slide speaking right now is itself a divider — as elsewhere in this reference, each register demonstrates itself.
:::

---
<!-- .slide: class="statement" -->
One vocabulary, every deck.

::: narration
Sometimes a single sentence is the slide. The statement register gives one claim the entire screen: a large serif line, centered, with nothing competing for attention. It is the register for a thesis, a definition worth pausing on, or the turn in an argument — the moment where the narration slows down and the screen should slow down with it. Like every register it costs one line to invoke: a class annotation at the top of the slide, with the sentence as the only content. Used sparingly — once or twice in a deck — it gives the pacing somewhere to breathe, and it tells the listener that this sentence is the one to keep.
:::

---
## Authoring registers & density

- opt in on a slide's first line: a `.slide:` class comment
- `divider` — navy chapter break · `###` kicker + `##` title
- `statement` — one claim, whole screen, single paragraph
- `compact` — 26px text · tighter lists · capped diagrams
- measure, never eyeball: `tools/audit_overflow.py <deck>`
- the cover is free — title · slide count · start control

::: narration
Three registers cover the practical needs. Divider and statement give a deck rhythm; compact solves a different problem, density. When a slide genuinely needs more content than the canvas comfortably holds, the compact register drops the text a size, tightens list spacing, and caps diagram height, buying roughly a fifth more room. It is an escape hatch, not a default: the overflow audit tool measures every slide of a rendered deck and reports exactly which ones run past the canvas, so the workflow is render, measure, trim what can be trimmed, and mark what remains as compact. Every register is invoked the same way, with a class annotation as the first line of the slide. And one register comes free: the start screen each deck opens with is a cover, carrying the title, the slide count, and the play control, so the first thing a viewer sees is a title card rather than a bare button.
:::

---
## Using the vocabulary

- wrap diagrams in `.viz` (`.wide` / `.narrow` to size)
- nodes/edges/labels/bars/cells carry **semantic roles**
- motion: `m-in` · `m-rise` · `m-pulse` · `m-dim` · `m-draw` · eased `flow`
- no per-slide styles — one system, every deck

::: narration
To use the system: wrap any diagram in a viz container, which centres it and guarantees it stays inside the slide, with wide or narrow modifiers to size it. Build the figure from nodes, edges, labels, bars, and cells, each carrying a semantic role that fixes its colour and meaning. Animate sparingly with the named primitives — a fade or rise for entrances, a pulse for attention, a dim for failure, a draw for a forming connection, an eased token for flow — and lean on the shared easing so nothing feels mechanical. Because all of this lives in one place rather than being redefined on every slide, a diagram is now a few lines of clean markup instead of a block of bespoke styling, and every deck — whether the subject is mathematics, computer science, or philosophy — speaks the same visual language. That coherence is the whole point.
:::
