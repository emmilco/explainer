# Mesh Networks at Scale, and Their Vulnerabilities

---
## Mesh networks: scale & security

- large partial meshes · graph structure · the attack surface

::: narration
This is a follow-up to the introduction to mesh networks. We'll go in two directions. First, what happens at scale: when a mesh grows to hundreds or thousands of nodes, it becomes a large, partially-connected graph, and the tools of network science tell us how it behaves — whether it stays connected, how far apart nodes are, how much traffic it can carry. Second, the darker side: the same openness and cooperative relaying that make a mesh self-healing also make it a rich attack surface. We'll look at how a mesh can be eavesdropped, poisoned, and hijacked — and what defends it.
:::

---
## A deployment is a graph

<div class="g2">
<style>
.g2 svg{width:70%}
.g2 line{stroke:#B9A78A;stroke-width:2;animation:g2p 3s infinite}
.g2 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
@keyframes g2p{0%,100%{opacity:.5}50%{opacity:1}}
</style>
<svg viewBox="0 0 380 240">
<line x1="45" y1="120" x2="120" y2="55"/>
<line x1="45" y1="120" x2="120" y2="190"/>
<line x1="120" y1="55" x2="120" y2="190"/>
<line x1="120" y1="55" x2="210" y2="120"/>
<line x1="120" y1="190" x2="210" y2="120"/>
<line x1="210" y1="120" x2="290" y2="55"/>
<line x1="210" y1="120" x2="290" y2="190"/>
<line x1="290" y1="55" x2="290" y2="190"/>
<line x1="290" y1="55" x2="350" y2="120"/>
<line x1="290" y1="190" x2="350" y2="120"/>
<circle class="nd" cx="45" cy="120" r="13"/>
<circle class="nd" cx="120" cy="55" r="13"/>
<circle class="nd" cx="120" cy="190" r="13"/>
<circle class="nd" cx="210" cy="120" r="13"/>
<circle class="nd" cx="290" cy="55" r="13"/>
<circle class="nd" cx="290" cy="190" r="13"/>
<circle class="nd" cx="350" cy="120" r="13"/>
</svg>
</div>

- nodes $V$ · links $E$ · degree $k$ · mean degree $\langle k \rangle$

::: narration
To reason about a mesh at scale, model it as a graph: nodes are the devices, edges are the direct links between in-range neighbours. The single most important local quantity is a node's degree — how many neighbours it has — and the network's average degree, written angle-k, captures how richly connected it is overall. Almost every property we care about, from whether the network is connected to how much it can carry, turns out to be governed by the interplay between the average degree and the total number of nodes. So the questions become graph questions.
:::

---
## Real meshes are random geometric graphs

<div class="g3">
<style>
.g3 svg{width:70%}
.g3 line{stroke:#B9A78A;stroke-width:2}
.g3 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.g3 .rng{fill:#1A3F70;opacity:.07;stroke:#1A3F70;stroke-width:1.5;stroke-dasharray:4 5;animation:g3r 3.5s infinite}
@keyframes g3r{0%,100%{opacity:.05}50%{opacity:.16}}
</style>
<svg viewBox="0 0 380 240">
<circle class="rng" cx="210" cy="120" r="105"/>
<line x1="45" y1="120" x2="120" y2="55"/>
<line x1="45" y1="120" x2="120" y2="190"/>
<line x1="120" y1="55" x2="120" y2="190"/>
<line x1="120" y1="55" x2="210" y2="120"/>
<line x1="120" y1="190" x2="210" y2="120"/>
<line x1="210" y1="120" x2="290" y2="55"/>
<line x1="210" y1="120" x2="290" y2="190"/>
<line x1="290" y1="55" x2="290" y2="190"/>
<line x1="290" y1="55" x2="350" y2="120"/>
<line x1="290" y1="190" x2="350" y2="120"/>
<circle class="nd" cx="45" cy="120" r="13"/>
<circle class="nd" cx="120" cy="55" r="13"/>
<circle class="nd" cx="120" cy="190" r="13"/>
<circle class="nd" cx="210" cy="120" r="13"/>
<circle class="nd" cx="290" cy="55" r="13"/>
<circle class="nd" cx="290" cy="190" r="13"/>
<circle class="nd" cx="350" cy="120" r="13"/>
</svg>
</div>

- edge iff within radio range $r$ · $\langle k \rangle \approx \rho\,\pi r^2$

::: narration
Wireless meshes aren't wired up arbitrarily — geometry decides the edges. Each node connects to exactly those others that fall within its radio range. That makes a real deployment a random geometric graph: scatter nodes in space, and join any two closer than the range r. The consequence is that average degree is set by density times the area of a node's coverage disc — roughly rho times pi r-squared. You tune connectivity with two physical knobs: how many nodes per unit area, and how far each radio reaches. Everything else about the network's large-scale behaviour follows from that.
:::

---
## The connectivity threshold

<div class="g4">
<style>
.g4 svg{width:70%}
.g4 .base{stroke:#B9A78A;stroke-width:2}
.g4 .extra{stroke:#1A3F70;stroke-width:2.5;animation:g4e 4s infinite}
.g4 .nd{fill:#F6E5D2;stroke:#B9A78A;stroke-width:2.5;animation:g4n 4s infinite}
@keyframes g4e{0%,40%{opacity:0}55%,100%{opacity:1}}
@keyframes g4n{0%,40%{stroke:#B9A78A}55%,100%{stroke:#1A3F70}}
</style>
<svg viewBox="0 0 380 240">
<line class="base" x1="45" y1="120" x2="120" y2="55"/>
<line class="base" x1="120" y1="55" x2="120" y2="190"/>
<line class="base" x1="290" y1="55" x2="350" y2="120"/>
<line class="base" x1="290" y1="190" x2="350" y2="120"/>
<line class="extra" x1="120" y1="55" x2="210" y2="120"/>
<line class="extra" x1="120" y1="190" x2="210" y2="120"/>
<line class="extra" x1="210" y1="120" x2="290" y2="55"/>
<line class="extra" x1="210" y1="120" x2="290" y2="190"/>
<line class="extra" x1="45" y1="120" x2="120" y2="190"/>
<line class="extra" x1="290" y1="55" x2="290" y2="190"/>
<circle class="nd" cx="45" cy="120" r="13"/>
<circle class="nd" cx="120" cy="55" r="13"/>
<circle class="nd" cx="120" cy="190" r="13"/>
<circle class="nd" cx="210" cy="120" r="13"/>
<circle class="nd" cx="290" cy="55" r="13"/>
<circle class="nd" cx="290" cy="190" r="13"/>
<circle class="nd" cx="350" cy="120" r="13"/>
</svg>
</div>

- below critical density → fragments · connectivity needs $\langle k \rangle \sim \ln n$

::: narration
Connectivity is not gradual — it snaps. As you raise node density, the network goes through a sharp percolation transition: below a critical point it is a scatter of disconnected islands, and just above it a single giant component suddenly spans almost everything. The precise result is striking — to keep a random network of n nodes connected, the average degree has to grow like the natural log of n, not stay constant. Add nodes without scaling range or density to match, and you don't get a gracefully sparser network; you get fragmentation. Deployers live right at this threshold, and a margin above it is what buys the redundancy that makes self-healing possible.
:::

---
## Critical relays — and articulation points

<div class="g5">
<style>
.g5 svg{width:70%}
.g5 line{stroke:#B9A78A;stroke-width:2}
.g5 .cut{animation:g5cut 5s infinite}
.g5 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.g5 .right{animation:g5r 5s infinite}
.g5 .hub{fill:#0F5D5D;stroke:#0F5D5D;animation:g5h 5s infinite}
.g5 .x{stroke:#9D3A24;stroke-width:3.5;opacity:0;animation:g5x 5s infinite}
.g5 .pk{fill:#9D3A24;animation:g5p 5s infinite}
@keyframes g5cut{0%,42%{opacity:1}55%,100%{opacity:.1}}
@keyframes g5h{0%,42%{fill:#0F5D5D;stroke:#0F5D5D}55%,100%{fill:#9D3A24;stroke:#9D3A24}}
@keyframes g5x{0%,48%{opacity:0}58%,100%{opacity:1}}
@keyframes g5r{0%,48%{opacity:1}60%,100%{opacity:.3}}
@keyframes g5p{0%,40%{opacity:1}46%,100%{opacity:0}}
</style>
<svg viewBox="0 0 380 240">
<line x1="45" y1="120" x2="120" y2="55"/>
<line x1="45" y1="120" x2="120" y2="190"/>
<line x1="120" y1="55" x2="120" y2="190"/>
<line class="cut" x1="120" y1="55" x2="210" y2="120"/>
<line class="cut" x1="120" y1="190" x2="210" y2="120"/>
<line class="cut" x1="210" y1="120" x2="290" y2="55"/>
<line class="cut" x1="210" y1="120" x2="290" y2="190"/>
<line class="right" x1="290" y1="55" x2="290" y2="190"/>
<line class="right" x1="290" y1="55" x2="350" y2="120"/>
<line class="right" x1="290" y1="190" x2="350" y2="120"/>
<circle class="nd" cx="45" cy="120" r="13"/>
<circle class="nd" cx="120" cy="55" r="13"/>
<circle class="nd" cx="120" cy="190" r="13"/>
<circle class="nd right" cx="290" cy="55" r="13"/>
<circle class="nd right" cx="290" cy="190" r="13"/>
<circle class="nd right" cx="350" cy="120" r="13"/>
<circle class="nd hub" cx="210" cy="120" r="15"/>
<line class="x" x1="201" y1="111" x2="219" y2="129"/>
<line class="x" x1="219" y1="111" x2="201" y2="129"/>
<circle class="pk" r="6"><animateMotion dur="1.8s" repeatCount="indefinite" keyPoints="0;0.5;1" keyTimes="0;0.5;1" calcMode="linear" path="M120,55 L210,120 L290,190"/></circle>
</svg>
</div>

- high **betweenness** = bottleneck + single point of failure
- an **articulation point** partitions the graph when it fails

::: narration
Not all nodes are equal. A node's betweenness centrality is the fraction of shortest paths that run through it, and in a partial mesh a handful of nodes carry wildly disproportionate relay traffic — they sit on the bridges between dense clusters. The teal node here is one: every left-to-right path funnels through it. That makes it two things at once — a throughput bottleneck, and a single point of failure in a network that was supposed not to have one. When it is also an articulation point, removing it doesn't just reroute traffic; it splits the graph into pieces that can no longer reach each other at all. Mapping these critical nodes is the first thing both an operator and an attacker want to do.
:::

---
## Capacity doesn't scale

- per-node throughput: $\displaystyle \lambda(n)=\Theta\!\left(\frac{1}{\sqrt{n\log n}}\right)$
- double the nodes → each gets *less* than half
- shared medium + relaying = interference grows with size

::: narration
Here is the result that disciplines every large mesh design — the Gupta and Kumar scaling law. In a random wireless network of n nodes sharing the same medium, the throughput available to each node falls off like one over the square root of n log n. Read that carefully: as you add nodes, per-node capacity doesn't just fail to grow — it actively shrinks toward zero. The reason is built into the mesh idea. Every relayed packet consumes airtime on multiple links, and nearby transmissions interfere, so a larger network spends a larger fraction of its capacity just carrying other people's traffic. A flat mesh is therefore self-limiting: past some size, adding nodes makes everyone slower.
:::

---
## So large meshes go hierarchical

<div class="g7">
<style>
.g7 svg{width:74%}
.g7 line{stroke:#B9A78A;stroke-width:1.8}
.g7 .bb{stroke:#1A3F70;stroke-width:3}
.g7 .up{stroke:#0F5D5D;stroke-width:2.5;stroke-dasharray:5 5;animation:g7up 1.6s linear infinite}
.g7 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2}
.g7 .gw{fill:#0F5D5D;stroke:#0F5D5D}
@keyframes g7up{to{stroke-dashoffset:-20}}
</style>
<svg viewBox="0 0 380 230">
<line class="bb" x1="70" y1="40" x2="310" y2="40"/>
<line x1="60" y1="150" x2="110" y2="120"/>
<line x1="60" y1="150" x2="55" y2="200"/>
<line x1="110" y1="120" x2="55" y2="200"/>
<line x1="270" y1="150" x2="320" y2="120"/>
<line x1="270" y1="150" x2="320" y2="200"/>
<line x1="320" y1="120" x2="320" y2="200"/>
<line x1="180" y1="160" x2="160" y2="205"/>
<line x1="180" y1="160" x2="210" y2="205"/>
<line class="up" x1="85" y1="40" x2="60" y2="150"/>
<line class="up" x1="190" y1="40" x2="180" y2="160"/>
<line class="up" x1="290" y1="40" x2="270" y2="150"/>
<circle class="nd" cx="110" cy="120" r="11"/>
<circle class="nd" cx="55" cy="200" r="11"/>
<circle class="nd" cx="320" cy="120" r="11"/>
<circle class="nd" cx="320" cy="200" r="11"/>
<circle class="nd" cx="160" cy="205" r="11"/>
<circle class="nd" cx="210" cy="205" r="11"/>
<circle class="nd gw" cx="60" cy="150" r="13"/>
<circle class="nd gw" cx="180" cy="160" r="13"/>
<circle class="nd gw" cx="270" cy="150" r="13"/>
<circle class="nd" cx="70" cy="40" r="9"/>
<circle class="nd" cx="190" cy="40" r="9"/>
<circle class="nd" cx="310" cy="40" r="9"/>
</svg>
</div>

- local clusters + **gateways** onto a high-capacity backhaul

::: narration
The escape from the scaling trap is structure. Instead of one flat mesh of thousands of equal nodes, real large deployments are hierarchical: nodes form local clusters, and each cluster has one or more gateway nodes — shown in teal — that uplink to a higher-capacity backhaul, whether that's wired, fibre, or dedicated point-to-point radio. Traffic stays local where it can, and long-haul traffic jumps onto the backbone instead of being relayed hop-by-hop across the whole network. This keeps path lengths short and sidesteps the worst of the interference penalty. It also, notice, quietly reintroduces special nodes — the gateways — which is exactly where the security story is about to get interesting.
:::

---
## The attack surface

- every node is a router **you don't control**
- the medium is **shared** — anyone in range hears it
- membership is often **open** — no central gatekeeper

::: narration
Now the second half. The properties that make a mesh resilient are the same ones that make it exposed, and it's worth stating the root cause plainly. In a mesh, forwarding is cooperative, which means your traffic passes through nodes you neither own nor trust. The medium is broadcast radio, so anyone within range simply hears transmissions. And membership is frequently open — there's no central authority deciding who may join and relay. Decentralization removed the single point of failure, but it also removed the single point of control and the single point of trust. Every defense from here on is a response to one fact: you cannot assume the nodes carrying your packets are honest.
:::

---
## Eavesdropping and man-in-the-middle

<div class="s9">
<style>
.s9 svg{width:74%}
.s9 line{stroke:#B9A78A;stroke-width:2}
.s9 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.s9 .src{fill:#1A3F70}
.s9 .relay{fill:#A87B12;stroke:#A87B12}
.s9 .atk{fill:#9D3A24;stroke:#9D3A24}
.s9 .tap{stroke:#9D3A24;stroke-width:2;stroke-dasharray:4 4}
.s9 .pk{fill:#1A3F70}
.s9 .copy{fill:#9D3A24}
</style>
<svg viewBox="0 0 380 220">
<line x1="50" y1="90" x2="190" y2="90"/>
<line x1="190" y1="90" x2="330" y2="90"/>
<line class="tap" x1="190" y1="90" x2="300" y2="185"/>
<circle class="nd src" cx="50" cy="90" r="15"/>
<circle class="nd relay" cx="190" cy="90" r="16"/>
<circle class="nd src" cx="330" cy="90" r="15"/>
<circle class="nd atk" cx="300" cy="185" r="14"/>
<circle class="pk" r="6.5"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;0.5;1" keyTimes="0;0.5;1" calcMode="linear" path="M50,90 L190,90 L330,90"/></circle>
<circle class="copy" r="5"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;0;0.5;1" keyTimes="0;0.5;0.75;1" calcMode="linear" path="M190,90 L190,90 L300,185"/></circle>
</svg>
</div>

- a relay can **read, copy, or alter** what it forwards

::: narration
The most basic consequence is eavesdropping. A packet travelling from the blue source to the blue destination must pass through the relay in the middle — and that relay sees everything it forwards. If it's compromised or simply malicious, it copies your traffic off to an attacker, shown by the dashed tap, and it can do worse than read: it can modify packets in flight, becoming a true man-in-the-middle on the conversation. Multi-hop relaying is structurally man-in-the-middle by design — the middle is the whole point. On a shared radio medium it's even cheaper, because an attacker doesn't have to be on the path at all; being in range is enough to listen. Without cryptographic protection, every hop is a wiretap.
:::

---
## Blackhole and sinkhole attacks

<div class="s10">
<style>
.s10 svg{width:72%}
.s10 line{stroke:#B9A78A;stroke-width:2}
.s10 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.s10 .bh{fill:#9D3A24;stroke:#9D3A24}
.s10 .p1{fill:#1A3F70}
.s10 .p2{fill:#1A3F70}
.s10 .p3{fill:#1A3F70}
</style>
<svg viewBox="0 0 380 220">
<line x1="50" y1="40" x2="195" y2="110"/>
<line x1="40" y1="180" x2="195" y2="110"/>
<line x1="330" y1="50" x2="195" y2="110"/>
<line x1="340" y1="175" x2="195" y2="110"/>
<circle class="nd" cx="50" cy="40" r="13"/>
<circle class="nd" cx="40" cy="180" r="13"/>
<circle class="nd" cx="330" cy="50" r="13"/>
<circle class="nd" cx="340" cy="175" r="13"/>
<circle class="nd bh" cx="195" cy="110" r="17"/>
<circle class="p1" r="6"><animateMotion dur="2.2s" repeatCount="indefinite" keyTimes="0;0.8;1" keyPoints="0;1;1" calcMode="linear" path="M50,40 L195,110"/></circle>
<circle class="p2" r="6"><animateMotion dur="2.2s" begin="0.5s" repeatCount="indefinite" keyTimes="0;0.8;1" keyPoints="0;1;1" calcMode="linear" path="M40,180 L195,110"/></circle>
<circle class="p3" r="6"><animateMotion dur="2.2s" begin="1s" repeatCount="indefinite" keyTimes="0;0.8;1" keyPoints="0;1;1" calcMode="linear" path="M330,50 L195,110"/></circle>
</svg>
</div>

- advertise irresistible routes → attract traffic → **drop it**
- selective dropping = **grayhole** (harder to detect)

::: narration
Because routing is cooperative and trusting, an attacker can lie about routes. In a sinkhole attack, a malicious node advertises that it has excellent paths to everywhere — lowest cost, fewest hops — so the routing protocol steers traffic toward it from all directions. Once the traffic arrives, the blackhole variant simply discards all of it: packets flow in and nothing comes out. The cleverer grayhole drops only some packets — perhaps only a particular flow, or one in ten — which keeps throughput statistics looking healthy and makes the attack far harder to localize. The root problem is that route advertisements were believed without proof, which is precisely what authenticated routing sets out to fix.
:::

---
## Wormhole attacks

<div class="s11">
<style>
.s11 svg{width:76%}
.s11 line{stroke:#B9A78A;stroke-width:2}
.s11 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.s11 .wh{fill:#9D3A24;stroke:#9D3A24}
.s11 .tunnel{fill:none;stroke:#9D3A24;stroke-width:2.5;stroke-dasharray:7 6;animation:s11t 1.2s linear infinite}
.s11 .pa{fill:#9D3A24;animation:s11a 3s infinite}
.s11 .pb{fill:#9D3A24;opacity:0;animation:s11b 3s infinite}
@keyframes s11t{to{stroke-dashoffset:-26}}
@keyframes s11a{0%,42%{opacity:1}48%,100%{opacity:0}}
@keyframes s11b{0%,48%{opacity:0}54%,100%{opacity:1}}
</style>
<svg viewBox="0 0 380 220">
<line x1="40" y1="70" x2="95" y2="120"/>
<line x1="340" y1="70" x2="285" y2="120"/>
<path class="tunnel" d="M95,120 Q190,210 285,120"/>
<circle class="nd" cx="40" cy="70" r="13"/>
<circle class="nd" cx="340" cy="70" r="13"/>
<circle class="nd wh" cx="95" cy="120" r="15"/>
<circle class="nd wh" cx="285" cy="120" r="15"/>
<circle class="pa" r="6"><animateMotion dur="3s" repeatCount="indefinite" keyTimes="0;0.42;1" keyPoints="0;1;1" calcMode="linear" path="M40,70 L95,120"/></circle>
<circle class="pb" r="6"><animateMotion dur="3s" repeatCount="indefinite" keyTimes="0;0.54;1" keyPoints="0;0;1" calcMode="linear" path="M285,120 L285,120 L340,70"/></circle>
</svg>
</div>

- two colluders tunnel packets → fake **proximity** → capture routes
- countered by **packet leashes** (time/geo bounds)

::: narration
The wormhole is the most distinctively mesh attack, because it doesn't forge messages at all. Two colluding nodes, far apart in the real network, secretly link themselves with a fast private channel — the dashed tunnel. A packet that enters one end is whisked to the other and re-injected, so the two distant points appear to be neighbours. That fake proximity is poison for routing: the wormhole advertises absurdly short paths, so huge swaths of traffic route through it, where it can be recorded, dropped, or selectively manipulated. What makes it dangerous is that every individual message can be perfectly authentic, so signatures don't catch it. The standard defence is a packet leash — binding each packet with tight timing or location bounds so a link that implies impossible speed or distance is rejected.
:::

---
## Sybil and identity attacks

<div class="s12">
<style>
.s12 svg{width:66%}
.s12 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.s12 .real{fill:#9D3A24;stroke:#9D3A24}
.s12 .fake{fill:#9D3A24;stroke:#9D3A24;opacity:0}
.s12 .f1{animation:s12a 4s infinite}
.s12 .f2{animation:s12b 4s infinite}
.s12 .f3{animation:s12c 4s infinite}
.s12 .f4{animation:s12d 4s infinite}
.s12 .f5{animation:s12e 4s infinite}
@keyframes s12a{0%,12%{opacity:0}30%,90%{opacity:.6}100%{opacity:0}}
@keyframes s12b{0%,22%{opacity:0}40%,90%{opacity:.6}100%{opacity:0}}
@keyframes s12c{0%,34%{opacity:0}52%,90%{opacity:.6}100%{opacity:0}}
@keyframes s12d{0%,46%{opacity:0}64%,90%{opacity:.6}100%{opacity:0}}
@keyframes s12e{0%,58%{opacity:0}76%,90%{opacity:.6}100%{opacity:0}}
</style>
<svg viewBox="0 0 360 230">
<circle class="nd real" cx="180" cy="120" r="17"/>
<circle class="nd fake f1" cx="70" cy="60" r="12"/>
<circle class="nd fake f2" cx="290" cy="60" r="12"/>
<circle class="nd fake f3" cx="60" cy="180" r="12"/>
<circle class="nd fake f4" cx="300" cy="180" r="12"/>
<circle class="nd fake f5" cx="180" cy="40" r="12"/>
</svg>
</div>

- one attacker forges **many identities**
- subverts voting, reputation, quorum, geographic routing

::: narration
Many mesh defences are democratic: route by majority vote, trust nodes with good reputation, require a quorum to accept information. The Sybil attack guts all of them at once. A single physical attacker fabricates many distinct identities — the faint nodes spawning here — and now controls a majority of the "votes" while being one machine. It can outvote honest reputation systems, occupy many positions in the routing table, or claim to be in many places to defeat geographic routing. The deep reason it works is that identities in an open network are cheap, and nothing ties one identity to one real device. The defences are correspondingly about making identity expensive or accountable: certificates from a trusted authority, resource-testing puzzles, or anchoring identity in physical or social constraints.
:::

---
## Poisoning and resource exhaustion

<div class="s13">
<style>
.s13 svg{width:70%}
.s13 line{stroke:#B9A78A;stroke-width:2}
.s13 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.s13 .atk{fill:#9D3A24;stroke:#9D3A24}
.s13 .w{fill:none;stroke:#9D3A24;stroke-width:2.5;opacity:0}
</style>
<svg viewBox="0 0 380 220">
<line x1="60" y1="110" x2="160" y2="55"/>
<line x1="60" y1="110" x2="160" y2="165"/>
<line x1="160" y1="55" x2="160" y2="165"/>
<line x1="160" y1="55" x2="280" y2="55"/>
<line x1="160" y1="165" x2="280" y2="165"/>
<line x1="280" y1="55" x2="280" y2="165"/>
<line x1="280" y1="55" x2="345" y2="110"/>
<line x1="280" y1="165" x2="345" y2="110"/>
<circle class="nd" cx="160" cy="55" r="12"/>
<circle class="nd" cx="160" cy="165" r="12"/>
<circle class="nd" cx="280" cy="55" r="12"/>
<circle class="nd" cx="280" cy="165" r="12"/>
<circle class="nd" cx="345" cy="110" r="12"/>
<circle class="nd atk" cx="60" cy="110" r="15"/>
<circle class="w" cx="60" cy="110" r="18"><animate attributeName="r" values="18;250" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="1.6s" repeatCount="indefinite"/></circle>
<circle class="w" cx="60" cy="110" r="18"><animate attributeName="r" values="18;250" dur="1.6s" begin="0.55s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="1.6s" begin="0.55s" repeatCount="indefinite"/></circle>
<circle class="w" cx="60" cy="110" r="18"><animate attributeName="r" values="18;250" dur="1.6s" begin="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="1.6s" begin="1.1s" repeatCount="indefinite"/></circle>
</svg>
</div>

- inject false routing state (**poisoning**)
- flood route-requests → drain bandwidth & **battery** (DoS)

::: narration
Two more attacks exploit the control plane and the energy budget. Route poisoning means injecting false routing information — advertising links that don't exist, or stale and forged updates — so that honest nodes' routing tables fill with lies and traffic is misdirected or black-holed downstream. And because route discovery is flood-based, an attacker can simply broadcast a torrent of bogus route-requests, shown rippling out here. Each one is dutifully rebroadcast by every node, saturating the shared medium and — critically for battery-powered IoT meshes — draining energy from devices that may need to last years on a coin cell. Denial of service is cheap in an open network precisely because cooperation is mandatory: honest nodes can't tell a real request from a malicious one without authentication.
:::

---
## What defends a mesh

<div class="s14">
<style>
.s14 svg{width:72%}
.s14 line{stroke:#B9A78A;stroke-width:2}
.s14 .nd{fill:#F6E5D2;stroke:#1A3F70;stroke-width:2.5}
.s14 .src{fill:#1A3F70}
.s14 .relay{fill:#A87B12;stroke:#A87B12}
.s14 .tap{stroke:#9D3A24;stroke-width:2;stroke-dasharray:4 4;opacity:.5}
.s14 .xx{stroke:#9D3A24;stroke-width:3;opacity:0;animation:s14x 2.6s infinite}
.s14 .lock{fill:#0F5D5D}
.s14 .pk{fill:#0F5D5D}
@keyframes s14x{0%,55%{opacity:0}70%,100%{opacity:1}}
</style>
<svg viewBox="0 0 380 220">
<line x1="50" y1="90" x2="190" y2="90"/>
<line x1="190" y1="90" x2="330" y2="90"/>
<line class="tap" x1="190" y1="90" x2="290" y2="180"/>
<circle class="nd src" cx="50" cy="90" r="15"/>
<circle class="nd relay" cx="190" cy="90" r="16"/>
<circle class="nd src" cx="330" cy="90" r="15"/>
<circle class="nd" cx="290" cy="180" r="13" fill="#9D3A24" stroke="#9D3A24"/>
<line class="xx" x1="232" y1="128" x2="252" y2="148"/>
<line class="xx" x1="252" y1="128" x2="232" y2="148"/>
<g class="pk"><circle r="8"><animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;0.5;1" keyTimes="0;0.5;1" calcMode="linear" path="M50,90 L190,90 L330,90"/></circle></g>
</svg>
</div>

- **end-to-end auth-encryption** — relays carry, can't read or forge
- **signed routing** (SAODV, Ariadne) · **packet leashes** · **reputation** · **Sybil-resistant identity**

::: narration
The defences follow directly from the threats, organized around one principle: assume the relays are hostile and protect the traffic end to end. Authenticated encryption between the true endpoints means a relay can faithfully carry a packet it cannot read or alter — which neutralizes eavesdropping and man-in-the-middle even when the middle is owned by the enemy. Secure routing protocols like SAODV and Ariadne sign and authenticate the control messages, so a node can't forge cheap routes for sinkholes or poison the tables. Packet leashes bound timing and geography to strangle wormholes. Watchdog and reputation systems catch nodes that drop or misforward. And Sybil resistance — certificates or resource tests — keeps one attacker from becoming a crowd. What no protocol fully solves is availability: a determined jammer or flooder can still degrade an open shared medium.
:::

---
## Resilience and vulnerability share a root

- **no center** → no single point of failure *and* no single point of trust
- assume **hostile relays**; protect **end-to-end**; make **routing accountable**
- the mesh's strength and its exposure are the same property

::: narration
Step back and the two halves of this talk turn out to be one observation. Decentralization is the mesh's defining move, and it cuts both ways. Removing the center removes the single point of failure — that is the resilience, the self-healing, the graceful degradation we saw at the start. But it equally removes the single point of trust and the single point of control — and that is the entire attack surface: untrusted relays, forgeable identities, unauthenticated routing, an open shared medium. You cannot keep one without the other; they are the same property seen from two sides. So securing a mesh is never about rebuilding a center. It's about engineering trust without one — assume the nodes are hostile, protect traffic end to end, and make every routing claim something a node has to prove.
:::
