# How Mesh Networks Work

---
## How mesh networks work

- many nodes · no center · many paths

::: narration
This is a short visual tour of how mesh networks work. A mesh network is a way of connecting many devices so that there is no central point everything depends on. Instead, each node talks directly to its neighbours, and messages travel by hopping from node to node until they reach their destination. We'll build the idea up from the more familiar centralized network, see why mesh topologies are so resilient, and then look at the two hard problems any mesh has to solve: finding routes, and paying for the flexibility.
:::

---
## The centralized network

<div class="st">
<style>
.st svg{width:62%}
.st line{stroke:#B9A78A;stroke-width:2}
.st .hub{fill:#1A3F70;stroke:#1A3F70}
.st .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.st .pk{fill:#9D3A24}
</style>
<svg viewBox="0 0 320 230">
<line x1="160" y1="115" x2="160" y2="32"/>
<line x1="160" y1="115" x2="288" y2="78"/>
<line x1="160" y1="115" x2="250" y2="200"/>
<line x1="160" y1="115" x2="70" y2="200"/>
<line x1="160" y1="115" x2="32" y2="78"/>
<circle class="nd" cx="160" cy="32" r="14"/>
<circle class="nd" cx="288" cy="78" r="14"/>
<circle class="nd" cx="250" cy="200" r="14"/>
<circle class="nd" cx="70" cy="200" r="14"/>
<circle class="nd" cx="32" cy="78" r="14"/>
<circle class="hub" cx="160" cy="115" r="17"/>
<circle class="pk" r="6"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;0.5;1" keyTimes="0;0.5;1" calcMode="linear" path="M32,78 L160,115 L250,200"/></circle>
</svg>
</div>

- one hub · every message routes through the center

::: narration
Start with the network most people picture: the star, or hub-and-spoke. A single central node — your home router, a cell tower, a server — sits in the middle, and every other device connects only to it. When two leaf nodes want to talk, their traffic always goes in to the hub and back out. This is simple to build and easy to reason about, because the hub has a complete view and makes all the forwarding decisions. The cost of that simplicity is hidden in the middle, and it becomes obvious the moment the hub has a bad day.
:::

---
## One failure isolates everyone

<div class="sf">
<style>
.sf svg{width:62%}
.sf line{stroke:#B9A78A;stroke-width:2;animation:sflink 4s infinite}
.sf .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5;animation:sfnode 4s infinite}
.sf .hub{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5;animation:sfhub 4s infinite}
.sf .x{stroke:#9D3A24;stroke-width:3.5;opacity:0;animation:sfx 4s infinite}
@keyframes sflink{0%,38%{opacity:1}52%,100%{opacity:.1}}
@keyframes sfnode{0%,38%{stroke:#1A3F70;opacity:1}52%,100%{stroke:#B9A78A;opacity:.45}}
@keyframes sfhub{0%,38%{fill:#F6E5D2;stroke:#1A3F70}52%,100%{fill:#9D3A24;stroke:#9D3A24}}
@keyframes sfx{0%,44%{opacity:0}54%,100%{opacity:1}}
</style>
<svg viewBox="0 0 320 230">
<line x1="160" y1="115" x2="160" y2="32"/>
<line x1="160" y1="115" x2="288" y2="78"/>
<line x1="160" y1="115" x2="250" y2="200"/>
<line x1="160" y1="115" x2="70" y2="200"/>
<line x1="160" y1="115" x2="32" y2="78"/>
<circle class="nd" cx="160" cy="32" r="14"/>
<circle class="nd" cx="288" cy="78" r="14"/>
<circle class="nd" cx="250" cy="200" r="14"/>
<circle class="nd" cx="70" cy="200" r="14"/>
<circle class="nd" cx="32" cy="78" r="14"/>
<circle class="hub" cx="160" cy="115" r="17"/>
<line class="x" x1="150" y1="105" x2="170" y2="125"/>
<line class="x" x1="170" y1="105" x2="150" y2="125"/>
</svg>
</div>

- hub is a single point of failure

::: narration
Here is the star's fatal weakness. The hub is a single point of failure: when it goes down, every node attached to it is instantly cut off, not just from the hub but from each other, because the only path between any two leaves ran through the middle. The same brittleness shows up under load and at range — the hub is a bottleneck for all traffic, and a device too far from it simply has no connection at all. Centralization buys simplicity and pays for it in fragility. Mesh networks are the response to exactly this problem.
:::

---
## A mesh has no center

<div class="mt">
<style>
.mt svg{width:74%}
.mt line{stroke:#B9A78A;stroke-width:2;animation:mtpulse 3s infinite}
.mt .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
@keyframes mtpulse{0%,100%{opacity:.55}50%{opacity:1}}
</style>
<svg viewBox="0 0 360 230">
<line x1="40" y1="115" x2="130" y2="45"/>
<line x1="40" y1="115" x2="130" y2="185"/>
<line x1="130" y1="45" x2="130" y2="185"/>
<line x1="130" y1="45" x2="240" y2="45"/>
<line x1="130" y1="45" x2="240" y2="185"/>
<line x1="130" y1="185" x2="240" y2="185"/>
<line x1="240" y1="45" x2="240" y2="185"/>
<line x1="240" y1="45" x2="320" y2="115"/>
<line x1="240" y1="185" x2="320" y2="115"/>
<circle class="nd" cx="40" cy="115" r="14"/>
<circle class="nd" cx="130" cy="45" r="14"/>
<circle class="nd" cx="130" cy="185" r="14"/>
<circle class="nd" cx="240" cy="45" r="14"/>
<circle class="nd" cx="240" cy="185" r="14"/>
<circle class="nd" cx="320" cy="115" r="14"/>
</svg>
</div>

- every node links to several neighbours

::: narration
In a mesh, there is no privileged center. Each node connects to whatever neighbours are in range, and every node is willing to forward traffic on behalf of others — so each one is simultaneously an endpoint and a relay. The picture is no longer a star but a web, and the key property to notice is redundancy: between most pairs of nodes there is more than one possible path. That redundancy is the whole point. It is what lets the network keep working when individual nodes or links fail, and it is also what creates the new problems we have to solve, because now something has to decide which of the many paths a message should actually take.
:::

---
## Reaching a distant node: multi-hop

<div class="mh">
<style>
.mh svg{width:74%}
.mh line{stroke:#B9A78A;stroke-width:2}
.mh .route{stroke:#0F5D5D;stroke-width:3.5}
.mh .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.mh .src{fill:#1A3F70}
.mh .dst{fill:#0F5D5D}
.mh .pk{fill:#9D3A24}
</style>
<svg viewBox="0 0 360 230">
<line x1="40" y1="115" x2="130" y2="185"/>
<line x1="130" y1="45" x2="130" y2="185"/>
<line x1="130" y1="45" x2="240" y2="185"/>
<line x1="130" y1="185" x2="240" y2="185"/>
<line x1="240" y1="45" x2="240" y2="185"/>
<line x1="240" y1="185" x2="320" y2="115"/>
<line class="route" x1="40" y1="115" x2="130" y2="45"/>
<line class="route" x1="130" y1="45" x2="240" y2="45"/>
<line class="route" x1="240" y1="45" x2="320" y2="115"/>
<circle class="nd" cx="130" cy="185" r="14"/>
<circle class="nd" cx="240" cy="185" r="14"/>
<circle class="nd" cx="130" cy="45" r="14"/>
<circle class="nd" cx="240" cy="45" r="14"/>
<circle class="nd src" cx="40" cy="115" r="15"/>
<circle class="nd dst" cx="320" cy="115" r="15"/>
<circle class="pk" r="6.5"><animateMotion dur="2.4s" repeatCount="indefinite" keyPoints="0;0.33;0.66;1" keyTimes="0;0.34;0.67;1" calcMode="linear" path="M40,115 L130,45 L240,45 L320,115"/></circle>
</svg>
</div>

- source → relay → relay → destination

::: narration
Suppose the blue node on the left wants to send to the teal node on the right, and they are not in direct range. The message travels multi-hop: it is relayed from neighbour to neighbour along a chain until it arrives. Each intermediate node receives the packet and forwards it one step closer. This is the core mechanic of a mesh — reach is built up out of many short links rather than one long one — and it is why a mesh can blanket an area far larger than any single node's radio range. The number of hops is also the price: every relay adds a little latency and another chance for something to go wrong, which is what the next idea fixes.
:::

---
## Self-healing: routing around failure

<div class="sh">
<style>
.sh svg{width:74%}
.sh line{stroke:#B9A78A;stroke-width:2}
.sh .r1{stroke:#0F5D5D;stroke-width:3.5;animation:shr1 6s infinite}
.sh .r2{stroke:#B9A78A;stroke-width:3.5;animation:shr2 6s infinite}
.sh .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.sh .src{fill:#1A3F70}
.sh .dst{fill:#0F5D5D}
.sh .dead{animation:shdead 6s infinite}
.sh .x{stroke:#9D3A24;stroke-width:3.5;opacity:0;animation:shx 6s infinite}
.sh .p1{fill:#9D3A24;animation:shp1 6s infinite}
.sh .p2{fill:#9D3A24;opacity:0;animation:shp2 6s infinite}
@keyframes shr1{0%,40%{stroke:#0F5D5D}50%,100%{stroke:#B9A78A;opacity:.5}}
@keyframes shr2{0%,48%{stroke:#B9A78A;opacity:.5}58%,100%{stroke:#0F5D5D;opacity:1}}
@keyframes shdead{0%,42%{fill:#F6E5D2;stroke:#1A3F70}52%,100%{fill:#9D3A24;stroke:#9D3A24}}
@keyframes shx{0%,46%{opacity:0}56%,100%{opacity:1}}
@keyframes shp1{0%,38%{opacity:1}44%,100%{opacity:0}}
@keyframes shp2{0%,54%{opacity:0}60%,100%{opacity:1}}
</style>
<svg viewBox="0 0 360 230">
<line x1="40" y1="115" x2="130" y2="185"/>
<line x1="130" y1="45" x2="130" y2="185"/>
<line x1="130" y1="185" x2="240" y2="185"/>
<line x1="240" y1="45" x2="240" y2="185"/>
<line class="r1" x1="40" y1="115" x2="130" y2="45"/>
<line class="r1" x1="130" y1="45" x2="240" y2="45"/>
<line class="r1" x1="240" y1="45" x2="320" y2="115"/>
<line class="r2" x1="130" y1="45" x2="240" y2="185"/>
<line class="r2" x1="240" y1="185" x2="320" y2="115"/>
<circle class="nd" cx="130" cy="185" r="14"/>
<circle class="nd" cx="130" cy="45" r="14"/>
<circle class="nd" cx="240" cy="185" r="14"/>
<circle class="nd dead" cx="240" cy="45" r="14"/>
<line class="x" x1="232" y1="37" x2="248" y2="53"/>
<line class="x" x1="248" y1="37" x2="232" y2="53"/>
<circle class="nd src" cx="40" cy="115" r="15"/>
<circle class="nd dst" cx="320" cy="115" r="15"/>
<circle class="p1" r="6.5"><animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;0.33;0.66;1" keyTimes="0;0.34;0.67;1" calcMode="linear" path="M40,115 L130,45 L240,45 L320,115"/></circle>
<circle class="p2" r="6.5"><animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;0.33;0.66;1" keyTimes="0;0.34;0.67;1" calcMode="linear" path="M40,115 L130,45 L240,185 L320,115"/></circle>
</svg>
</div>

- a node dies → traffic takes another path

::: narration
This is the property that gives mesh networks their reputation: self-healing. Traffic is flowing along the top route, through the upper-right relay. Then that node fails — it loses power, moves out of range, is destroyed. In a star this would be catastrophic, but here the network simply notices the link is gone and reroutes: the same source and destination keep talking over a different path, down through the lower relay, without any central coordinator being involved. Because the redundancy was already there in the topology, recovery is a local decision, not a global rebuild. No human intervenes, and from the endpoints' point of view the conversation barely hiccups.
:::

---
## Finding a route: flooding

<div class="fl">
<style>
.fl svg{width:74%}
.fl line{stroke:#B9A78A;stroke-width:2}
.fl .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.fl .src{fill:#1A3F70}
.fl .w{fill:none;stroke:#1A3F70;stroke-width:2.5;opacity:0}
</style>
<svg viewBox="0 0 360 230">
<line x1="40" y1="115" x2="130" y2="45"/>
<line x1="40" y1="115" x2="130" y2="185"/>
<line x1="130" y1="45" x2="130" y2="185"/>
<line x1="130" y1="45" x2="240" y2="45"/>
<line x1="130" y1="45" x2="240" y2="185"/>
<line x1="130" y1="185" x2="240" y2="185"/>
<line x1="240" y1="45" x2="240" y2="185"/>
<line x1="240" y1="45" x2="320" y2="115"/>
<line x1="240" y1="185" x2="320" y2="115"/>
<circle class="nd" cx="130" cy="45" r="14"/>
<circle class="nd" cx="130" cy="185" r="14"/>
<circle class="nd" cx="240" cy="45" r="14"/>
<circle class="nd" cx="240" cy="185" r="14"/>
<circle class="nd" cx="320" cy="115" r="14"/>
<circle class="nd src" cx="40" cy="115" r="15"/>
<circle class="w" cx="40" cy="115" r="20"><animate attributeName="r" values="20;230" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="2.5s" repeatCount="indefinite"/></circle>
<circle class="w" cx="40" cy="115" r="20"><animate attributeName="r" values="20;230" dur="2.5s" begin="0.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.7;0" dur="2.5s" begin="0.8s" repeatCount="indefinite"/></circle>
</svg>
</div>

- broadcast a request · reply retraces the path

::: narration
But how does a node discover a working path in the first place, with no central map of the network? The most basic answer is flooding. The source broadcasts a route-request to all its neighbours; each neighbour that hasn't seen it rebroadcasts to its own neighbours, and the request ripples outward across the whole mesh. When it finally reaches the destination, the destination sends a reply back along the reverse of the path the winning request took — and now both ends know a route. Reactive protocols like AODV work essentially this way, discovering routes on demand. Flooding is robust and needs no prior knowledge, which is exactly why it's the fallback every mesh can rely on — but notice that a single request touched every node in the network.
:::

---
## The cost of all those links

<div class="fm">
<style>
.fm svg{width:56%}
.fm line{stroke:#1A3F70;stroke-width:1.6;opacity:.5;stroke-dasharray:6 6;animation:fmdraw 4s infinite}
.fm .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
@keyframes fmdraw{0%{stroke-dashoffset:80;opacity:0}40%{opacity:.55}100%{stroke-dashoffset:0;opacity:.55}}
</style>
<svg viewBox="0 0 240 230">
<line x1="120" y1="30" x2="210" y2="95"/>
<line x1="120" y1="30" x2="176" y2="200"/>
<line x1="120" y1="30" x2="64" y2="200"/>
<line x1="120" y1="30" x2="30" y2="95"/>
<line x1="210" y1="95" x2="176" y2="200"/>
<line x1="210" y1="95" x2="64" y2="200"/>
<line x1="210" y1="95" x2="30" y2="95"/>
<line x1="176" y1="200" x2="64" y2="200"/>
<line x1="176" y1="200" x2="30" y2="95"/>
<line x1="64" y1="200" x2="30" y2="95"/>
<circle class="nd" cx="120" cy="30" r="13"/>
<circle class="nd" cx="210" cy="95" r="13"/>
<circle class="nd" cx="176" cy="200" r="13"/>
<circle class="nd" cx="64" cy="200" r="13"/>
<circle class="nd" cx="30" cy="95" r="13"/>
</svg>
</div>

- full mesh links: $\dbinom{n}{2}=\dfrac{n(n-1)}{2}$
- 5 nodes → 10 · 50 nodes → 1,225

::: narration
Redundancy is not free, and flooding hinted at the bill. In a fully-connected mesh, where every node links to every other, the number of links grows as n-choose-2 — roughly n squared over two. Five nodes need ten links; fifty nodes would need over twelve hundred. That quadratic growth is unsustainable, in radios, in routing-table size, and in the storm of control traffic that flooding generates. So real meshes are almost never fully connected. They are partial meshes, where each node keeps only a handful of neighbours, and they lean on smarter routing than naive flooding to keep the overhead manageable as the network grows.
:::

---
## What you trade

- **gain:** resilience · range via relaying · no single point of failure · self-configuring
- **pay:** routing overhead · added latency per hop · complexity at scale

::: narration
So the mesh trade is now clear in both directions. What you gain is resilience — no single point of failure — along with extended coverage built from short hops, and the ability to self-configure and self-heal as nodes come and go. What you pay for it is overhead: every node must participate in routing, each hop adds latency, and the control traffic needed to discover and maintain routes grows faster than the number of nodes unless the protocol is clever. The engineering of a real mesh is essentially the management of that tension — keeping the resilience while taming the cost.
:::

---
## Where meshes live

- **home Wi-Fi mesh** — Eero, Orbi
- **low-power IoT** — Thread, Zigbee, Bluetooth mesh
- **ad-hoc & tactical** — MANETs, vehicle networks
- **off-grid messaging** — goTenna, Meshtastic

::: narration
These ideas are all around you. Consumer Wi-Fi mesh systems like Eero and Orbi blanket a house with multiple units that relay for one another. Low-power standards — Thread, Zigbee, Bluetooth mesh — let battery devices like sensors and bulbs form self-healing webs where most nodes are also relays. Mobile ad-hoc networks, or MANETs, let vehicles and devices network with no fixed infrastructure at all. And off-grid messengers like goTenna and Meshtastic build long-range text networks over cheap radios where there is no cell coverage. Same skeleton in every case: no center, multi-hop relaying, and routing that heals around failure.
:::

---
## Recap

- no center · every node relays
- reach by **multi-hop** · survive by **rerouting**
- routes found by **flooding / on-demand discovery**
- the price is **overhead that grows with the network**

::: narration
To pull it together. A mesh network replaces the central hub with a web of nodes that each relay for the others. Distant nodes are reached by hopping across many short links, and the network survives failure by rerouting around dead nodes over the redundant paths that were already there. Routes are discovered without any central map, in the simplest case by flooding a request across the whole network. And the price for all of that resilience is overhead — control traffic and routing state that grow with the network, which is why real meshes stay partial and invest in smarter routing. No center, many paths: fragile in no single place, precisely because it is not strong in any single place.
:::
