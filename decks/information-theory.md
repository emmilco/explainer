# Information: A Theory and Its History

---
## Information: a theory and its history

- a word made measurable
- one founding paper: Shannon, 1948
- two theorems · a 70-year arc
- compress · protect · escape

::: narration
This is the story of information theory — the discipline that took a word as soft as "information" and made it as measurable as mass or energy. It is unusual among scientific fields in having a precise birthday and a single founding document: Claude Shannon's nineteen forty-eight paper, A Mathematical Theory of Communication. But the deck is not just history. The aim is that by the end you genuinely understand the two great theorems that bound all communication — how much a message can be compressed, and how fast it can be sent reliably through noise — including why they are true, not merely what they say. We'll build the theory from first principles with two running examples we compute exactly, and let the history unfold around the ideas: physics before Shannon, the fifty-year engineering race after him, and the surprising places the theory escaped to — gambling, thermodynamics, machine learning, and the philosophy of meaning.
:::

---
## The promise

- entropy *derived*, not memorized
- source coding: the compression floor
- noisy-channel: reliability without surrender
- existence proof → 60-year hunt → 2009
- then: physics, finance, ML

::: narration
Here is the contract for the next hour. First, you will understand entropy — not as a formula to memorize but as the unique answer to a question about measuring surprise, derived from requirements you would have chosen yourself. Second, the source coding theorem: entropy is the hard floor on lossless compression, and you'll see why no cleverness can ever beat it. Third, the noisy-channel coding theorem — to my mind one of the most astonishing results in all of applied mathematics — which says that perfect reliability over a noisy line does not cost you everything, only something. Fourth, the strange aftermath: Shannon proved that ideal codes exist without showing a single one, and the engineering world spent the next half century hunting them down, finishing only in two thousand nine. And finally, how the theory leaked out of communication entirely, into physics, finance, and the foundations of machine learning.
:::

---
## The central question

> Can *information* be measured?

- what units could "information" have?
- equations vs gossip: same length, same amount?
- meaning makes it subjective…
- the way out: a deliberate surrender

::: narration
Start with the question that makes everything else possible, and hold it open for a moment rather than rushing past. What could it possibly mean to measure information? When a friend tells you something, what exactly is there more of, and in what units? A page of equations and a page of gossip can have the same word count and feel utterly different in informational weight. Any honest measure seems entangled with meaning, context, and what you already know — hopelessly subjective territory. The history of the field turns on a renunciation: the discovery that you can measure something real and useful here, but only if you deliberately give up trying to measure meaning. What that surrender buys, and what it costs, is the thread that runs through this whole story — and we will come back to the cost at the very end.
:::

---
## The road

<div class="viz wide">
<svg viewBox="0 0 1020 162">
<defs><marker id="arrRD" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge ghost" x1="104" y1="142" x2="908" y2="142"/>
<line class="edge" x1="192" y1="74" x2="215" y2="74" marker-end="url(#arrRD)"/>
<line class="edge" x1="393" y1="74" x2="416" y2="74" marker-end="url(#arrRD)"/>
<line class="edge" x1="594" y1="74" x2="617" y2="74" marker-end="url(#arrRD)"/>
<line class="edge" x1="795" y1="74" x2="818" y2="74" marker-end="url(#arrRD)"/>
<rect class="node accent" x="16" y="28" width="176" height="92" rx="8"/>
<text class="lbl on-fill" x="104" y="66">Measure</text><text class="cap" x="104" y="92" fill="#DCE6F1">surprise · entropy</text>
<rect class="node" x="217" y="28" width="176" height="92" rx="8"/>
<text class="lbl" x="305" y="66">Compress</text><text class="cap" x="305" y="92">codes · the floor</text>
<rect class="node" x="418" y="28" width="176" height="92" rx="8"/>
<text class="lbl" x="506" y="66">Protect</text><text class="cap" x="506" y="92">noise · capacity</text>
<rect class="node" x="619" y="28" width="176" height="92" rx="8"/>
<text class="lbl" x="707" y="66">Construct</text><text class="cap" x="707" y="92">the code race</text>
<rect class="node good" x="820" y="28" width="176" height="92" rx="8"/>
<text class="lbl" x="908" y="66">Generalize</text><text class="cap" x="908" y="92">physics · ML · meaning</text>
<circle class="token" r="6"><animateMotion dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.25;0.45;0.5;0.7;0.75;0.95;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1" keyPoints="0;0.25;0.25;0.5;0.5;0.75;0.75;1;1" path="M104,142 L305,142 L506,142 L707,142 L908,142"/></circle>
</svg>
</div>

- each stage earns the next
- measure → compress → protect → construct → generalize

::: narration
The road has five stages, and each one earns the next. First we measure: building, from the ground up, a number that captures how much information a source produces — that's entropy. Second we compress: the measure immediately tells us how short messages can be made, and we'll construct codes that hit that limit exactly. Third we protect: real channels corrupt what passes through them, and the theory's crown jewel says how much reliable communication a noisy channel can carry. Fourth we construct: Shannon proved perfect codes exist without exhibiting one, and the sixty-year hunt for them is one of engineering's great long games. Fifth, the theory escapes: the same mathematics turns out to govern bets, heat, learning machines, and arguably thought itself. Measure, compress, protect, construct, generalize — that's the journey.
:::

---
## The move that made it possible

> information = **selection** from a set of possibilities

- Hartley, 1928, Bell Labs
- meaning out · **selection** in
- a message = what it *rules out*
- countable ⇒ measurable

::: narration
The conceptual breakthrough predates Shannon by twenty years and belongs to Ralph Hartley, an engineer at Bell Labs. His nineteen twenty-eight insight is the de-semanticizing move on which everything rests: treat information not as content but as selection. When a message arrives, what it does — all it does, for the engineer's purposes — is pick one possibility out of a set of alternatives that could have been sent. The word "yes" carries little or much depending on one thing only: how many other things could have been said in its place, and how likely they were. Meaning, reference, truth — all deliberately set aside. This feels like it's changing the subject, and in a sense it is. But notice what it buys: sets of alternatives can be counted, and what can be counted can be measured. The whole edifice stands on this renunciation.
:::

---
## Counting alternatives

- 8 equally likely → **3** yes/no questions
- halve the field each time
- 16 → 4 · 32 → 5 · n → $\log_2 n$
- one question = one **bit**

::: narration
So let's count. Suppose a source can send exactly eight messages, all equally likely — say, one of eight weather reports. How much information arrives when you learn which one it is? Here's a concrete way to make that precise: how many yes-or-no questions would you need, asking as cleverly as possible, to identify the answer? With eight possibilities, the best strategy halves the field each time: is it in the top four? the top two? which one? Three questions, always. Sixteen possibilities need four questions, thirty-two need five. The pattern is the logarithm base two: n equally likely alternatives cost log of n questions. Each yes-or-no answer is one bit — one binary distinction. Information, in this first rough cut, is the number of binary questions a message saves you from having to ask.
:::

---
## Why the logarithm

<div class="viz">
<svg viewBox="0 0 760 200">
<g>
<rect class="cell on" x="30" y="40" width="30" height="30"/><rect class="cell on" x="62" y="40" width="30" height="30"/><rect class="cell on" x="94" y="40" width="30" height="30"/><rect class="cell on" x="126" y="40" width="30" height="30"/>
<rect class="cell on" x="30" y="72" width="30" height="30"/><rect class="cell on" x="62" y="72" width="30" height="30"/><rect class="cell on" x="94" y="72" width="30" height="30"/><rect class="cell on" x="126" y="72" width="30" height="30"/>
<text class="tag" x="93" y="125">8 choices · 3 bits</text>
</g>
<text class="lbl" x="205" y="70">×</text>
<g>
<rect class="cell sel" x="250" y="40" width="30" height="30"/><rect class="cell sel" x="282" y="40" width="30" height="30"/>
<rect class="cell sel" x="250" y="72" width="30" height="30"/><rect class="cell sel" x="282" y="72" width="30" height="30"/>
<text class="tag" x="281" y="125">4 choices · 2 bits</text>
</g>
<text class="lbl" x="365" y="70">=</text>
<g>
<rect class="cell" x="410" y="28" width="22" height="22"/><rect class="cell" x="434" y="28" width="22" height="22"/><rect class="cell" x="458" y="28" width="22" height="22"/><rect class="cell" x="482" y="28" width="22" height="22"/><rect class="cell" x="506" y="28" width="22" height="22"/><rect class="cell" x="530" y="28" width="22" height="22"/><rect class="cell" x="554" y="28" width="22" height="22"/><rect class="cell" x="578" y="28" width="22" height="22"/>
<rect class="cell" x="410" y="52" width="22" height="22"/><rect class="cell" x="434" y="52" width="22" height="22"/><rect class="cell" x="458" y="52" width="22" height="22"/><rect class="cell" x="482" y="52" width="22" height="22"/><rect class="cell" x="506" y="52" width="22" height="22"/><rect class="cell" x="530" y="52" width="22" height="22"/><rect class="cell" x="554" y="52" width="22" height="22"/><rect class="cell" x="578" y="52" width="22" height="22"/>
<rect class="cell" x="410" y="76" width="22" height="22"/><rect class="cell" x="434" y="76" width="22" height="22"/><rect class="cell" x="458" y="76" width="22" height="22"/><rect class="cell" x="482" y="76" width="22" height="22"/><rect class="cell" x="506" y="76" width="22" height="22"/><rect class="cell" x="530" y="76" width="22" height="22"/><rect class="cell" x="554" y="76" width="22" height="22"/><rect class="cell" x="578" y="76" width="22" height="22"/>
<rect class="cell" x="410" y="100" width="22" height="22"/><rect class="cell" x="434" y="100" width="22" height="22"/><rect class="cell" x="458" y="100" width="22" height="22"/><rect class="cell" x="482" y="100" width="22" height="22"/><rect class="cell" x="506" y="100" width="22" height="22"/><rect class="cell" x="530" y="100" width="22" height="22"/><rect class="cell" x="554" y="100" width="22" height="22"/><rect class="cell" x="578" y="100" width="22" height="22"/>
<text class="tag" x="505" y="145">32 choices · 5 bits</text>
</g>
<text class="cap" x="380" y="180">possibilities multiply — the measure should add</text>
</svg>
</div>

$$\log(m \cdot n) = \log m + \log n$$

- independent choices: spaces **multiply**
- information should **add**
- the only bridge: the logarithm
- formulas forced, not decreed

::: narration
Why the logarithm, specifically, and not some other shrinking function? Because of how independent choices combine. Send two unrelated messages — one selected from eight possibilities, another from four. Together they select from eight times four, thirty-two combinations: possibility spaces multiply. But intuitively, the information should add: three bits for the first message plus two for the second ought to make five bits total. We need a function that turns multiplication into addition, and that property — log of m times n equals log m plus log n — characterizes the logarithm essentially uniquely. This is the first taste of a pattern that recurs throughout the theory: the formulas are not decreed, they are forced. State the property the measure obviously should have, and the mathematics leaves you exactly one choice.
:::

---
## But alternatives aren't equally likely

| forecast | probability |
|---|---|
| sun | 1/2 |
| cloud | 1/4 |
| rain | 1/8 |
| snow | 1/8 |

- the running example — computed exactly, throughout
- Hartley says 2 bits — feels wrong
- expected sun tells you almost nothing
- rare snow carries the weight
- the measure must track probability

::: narration
Hartley's count assumes all alternatives are equally likely, and real sources are never like that. Here is the example we will carry through the whole deck — simple enough to compute everything exactly, rich enough to expose every idea. A weather station in a sunny city sends one of four reports each day. Sun half the time. Cloud a quarter of the time. Rain one day in eight, snow one day in eight. Hartley's formula says log of four — two bits per report — but that feels wrong. Most days the report says "sun," and a message you nearly always expect tells you nearly nothing. The rare snow report, when it comes, feels far weightier than the routine sun. Whatever the right measure of information is, it has to be sensitive to probability: common messages should count for little, rare ones for much. Making that intuition exact is the next step.
:::

---
## What should "surprise" satisfy?

- certain event → **zero** information
- rarer → **more** surprising
- independent events → surprises **add**
- three modest rules · one survivor

::: narration
Rather than guess a formula, let's do this the honest way: write down the properties any reasonable measure of a single event's surprise must have, and then see what survives. Property one: an event that was certain to happen carries no information at all — if the forecast in a desert says sun, with probability one, hearing it teaches you nothing, so its surprise should be exactly zero. Property two: the less probable an event, the more informative it is when it occurs — surprise should grow steadily as probability shrinks. Property three, the powerful one: when two independent events both happen, the surprise of the pair should be the sum of their individual surprises — learning two unrelated facts gives you both facts' worth, no more, no less. Three modest requirements, the kind you would have proposed yourself. Remarkably, they leave room for essentially one function.
:::

---
## Surprise is forced: $-\log p$

$$I(x) = -\log_2 p(x)$$

| forecast | $p$ | surprise |
|---|---|---|
| sun | 1/2 | **1 bit** |
| cloud | 1/4 | **2 bits** |
| rain | 1/8 | **3 bits** |
| snow | 1/8 | **3 bits** |

- the unique function passing all three
- $p{=}1 \to 0$ · $p{\to}0 \to \infty$ · products → sums
- sun 1 bit · cloud 2 · rain, snow 3
- Hartley's question count, per event

::: narration
The unique function satisfying all three requirements is the negative logarithm of the probability. Check it against each demand. A certain event has probability one, and log of one is zero — no surprise, as required. As probability falls toward zero, minus log p climbs without bound — rare events are arbitrarily surprising. And for independent events, probabilities multiply, so their logs add — surprises sum, exactly as demanded. The third property is doing the real work: requiring additivity over independence is what forces the logarithm, just as it did for Hartley. Now compute it for our weather source. Sun, probability one-half: minus log of one-half is one bit. Cloud, one-quarter: two bits. Rain and snow, one-eighth each: three bits apiece. Notice these are exactly Hartley's question-counts, now varying per event — the rare snow really does carry three times the information of the routine sun.
:::

---
## Entropy: the average surprise

<div class="viz">
<svg viewBox="0 0 760 240">
<line class="axis" x1="60" y1="200" x2="700" y2="200"/>
<rect class="track" x="100" y="50" width="90" height="150" rx="3"/>
<rect class="bar m-in" style="--i:0" x="100" y="150" width="90" height="50" rx="3"/>
<text class="tag" x="145" y="220">sun · 1 bit</text><text class="cap" x="145" y="40">p = 1/2</text>
<rect class="track" x="250" y="50" width="90" height="150" rx="3"/>
<rect class="bar m-in" style="--i:1" x="250" y="100" width="90" height="100" rx="3"/>
<text class="tag" x="295" y="220">cloud · 2 bits</text><text class="cap" x="295" y="40">p = 1/4</text>
<rect class="track" x="400" y="50" width="90" height="150" rx="3"/>
<rect class="bar warn m-in" style="--i:2" x="400" y="50" width="90" height="150" rx="3"/>
<text class="tag" x="445" y="220">rain · 3 bits</text><text class="cap" x="445" y="40">p = 1/8</text>
<rect class="track" x="550" y="50" width="90" height="150" rx="3"/>
<rect class="bar warn m-in" style="--i:3" x="550" y="50" width="90" height="150" rx="3"/>
<text class="tag" x="595" y="220">snow · 3 bits</text><text class="cap" x="595" y="40">p = 1/8</text>
<line class="edge danger" x1="60" y1="112.5" x2="700" y2="112.5" stroke-dasharray="6 5"/>
<text class="cap" x="660" y="100" fill="#9D3A24">H = 1.75 bits</text>
</svg>
</div>

$$H = \sum_x p(x) \cdot \big(-\log_2 p(x)\big) = 1.75 \text{ bits}$$

- weight each surprise by its probability
- **H = expected surprise** of the source
- $\tfrac12(1)+\tfrac14(2)+\tfrac18(3)+\tfrac18(3) = \mathbf{1.75}$
- skew → predictability → H < 2 bits

::: narration
We have the surprise of each individual event. To characterize the source as a whole, take the average — each event's surprise weighted by how often it occurs. This is entropy, the central quantity of the entire field. For the weather source: half the days contribute one bit, a quarter contribute two bits, and the two one-eighth events contribute three bits each. One-half plus one-half plus three-eighths plus three-eighths: exactly one point seven five bits per day. Read the formula as a sentence and it stays humble: entropy is just the expected surprise — how much information the source produces on a typical day. Notice it's less than Hartley's two bits for four alternatives. The skew toward sun makes this source more predictable than a uniform one, and entropy registers that predictability with a smaller number. That gap between one point seven five and two will turn out to be exactly exploitable.
:::

---
## Twenty questions, optimally played

<div class="viz">
<svg viewBox="0 0 720 250">
<line class="edge" x1="360" y1="52" x2="180" y2="100"/>
<line class="edge" x1="360" y1="52" x2="480" y2="100"/>
<line class="edge" x1="480" y1="128" x2="360" y2="178"/>
<line class="edge" x1="480" y1="128" x2="580" y2="178"/>
<line class="edge" x1="580" y1="204" x2="500" y2="238"/>
<line class="edge" x1="580" y1="204" x2="650" y2="238"/>
<rect class="node accent m-in" style="--i:0" x="290" y="20" width="140" height="34" rx="6"/><text class="lbl on-fill" x="360" y="37">sunny?</text>
<rect class="node good m-in" style="--i:1" x="120" y="98" width="110" height="32" rx="6"/><text class="lbl" x="175" y="114">sun · 1 q</text>
<rect class="node m-in" style="--i:1" x="415" y="98" width="130" height="32" rx="6"/><text class="lbl" x="480" y="114">cloudy?</text>
<rect class="node good m-in" style="--i:2" x="295" y="176" width="130" height="32" rx="6"/><text class="lbl" x="360" y="192">cloud · 2 q</text>
<rect class="node m-in" style="--i:2" x="520" y="176" width="120" height="32" rx="6"/><text class="lbl" x="580" y="192">rain?</text>
<text class="tag m-in" style="--i:3" x="500" y="248">rain · 3 q</text>
<text class="tag m-in" style="--i:3" x="650" y="248">snow · 3 q</text>
</svg>
</div>

- ask the likely things first
- sun: 1 q · cloud: 2 q · rain, snow: 3 q
- expected: $\tfrac12(1)+\tfrac14(2)+\tfrac14(3) = \mathbf{1.75}$
- entropy = the unbeatable question count

::: narration
Entropy isn't only a formula — it's an achievable strategy, and the game of twenty questions makes that concrete. You want to identify today's weather with the fewest yes-or-no questions on average. The clever order asks about the likeliest things first. First question: is it sunny? Half the time, yes — done in one question. Otherwise: is it cloudy? A quarter of the time that settles it in two. Otherwise one more question — rain? — separates the last pair in three. Now average the cost: half the days take one question, a quarter take two, the remaining quarter take three. One-half plus one-half plus three-quarters: one point seven five questions per day, exactly the entropy. That is no coincidence, and it's the deepest way to hear the number: entropy is the unbeatable average cost, in binary questions, of finding out what happened.
:::

---
## The shape of uncertainty

<div class="viz">
<svg viewBox="0 0 720 250">
<line class="axis" x1="80" y1="210" x2="660" y2="210"/>
<line class="axis" x1="80" y1="210" x2="80" y2="30"/>
<path class="edge accent m-draw" style="--len:700" d="M80,210 C 200,40 280,30 370,30 C 460,30 540,40 660,210" fill="none" stroke-width="3"/>
<line class="edge ghost" x1="370" y1="30" x2="370" y2="210"/>
<text class="tag" x="80" y="232">p = 0</text>
<text class="tag" x="370" y="232">p = 1/2</text>
<text class="tag" x="660" y="232">p = 1</text>
<text class="cap" x="370" y="18">H = 1 bit (maximum)</text>
<text class="cap" x="150" y="120">nearly certain →</text><text class="cap" x="150" y="140">nearly no information</text>
</svg>
</div>

- biased coin: the entropy arch
- near-certain edges → H ≈ 0
- fair coin → maximum: exactly 1 bit
- uniform maximizes · certainty zeroes
- a property of the **source**, not a message

::: narration
Look at entropy's shape for the simplest source there is: a coin with probability p of heads. The curve is an arch. At the edges — p near zero or near one — the coin is nearly deterministic, you nearly always know the outcome, and entropy collapses toward zero. At the center, a fair coin, maximum ignorance, entropy peaks at exactly one bit. The general lessons hold for any source: entropy is maximized when all outcomes are equally likely — log of n, recovering Hartley — and falls as the distribution skews toward predictability, hitting zero only at certainty. And note carefully what kind of thing entropy describes. It is not a property of any particular message; it's a property of the source — of the probability distribution itself, the standing uncertainty before anything is sent. The individual message has a surprise; the source has an entropy.
:::

---
## What entropy is *not*

- white noise: **maximum** entropy
- profound = banal, statistically
- measures selection statistics, never content
- blindness ⇒ universality — and a price
- keep the everyday word separate

::: narration
Before going further, confront the misreading that has haunted this field since the day it was named. High entropy does not mean rich, deep, or meaningful. Pure random static — white noise — has the maximum possible entropy: every symbol is maximally unpredictable, so the measure assigns it the most information of anything. Meanwhile a profound sentence and a banal one of the same length, drawn from the same statistical source, count identically. Nothing has gone wrong; this is precisely the bargain Hartley struck. The measure sees only the statistics of selection — which alternatives, how likely — and is constitutionally blind to what any message says. That blindness is the source of the theory's power: it's why the same theorems govern English text, genomes, and telemetry. But it means "information" here is a term of art. Keep the everyday word and the technical one apart, and the theory stays crystal clear.
:::

---
## Physics got there first

$$S = k \ln W$$

- Boltzmann, 1870s · Gibbs: same form
- thermodynamic entropy = missing microscopic info
- sixty years before Shannon
- the von Neumann naming quip (lore, but apt)

::: narration
Here's the historical twist: the formula was already famous before information theory existed — in physics. In the eighteen seventies, Ludwig Boltzmann, and after him Josiah Willard Gibbs, built statistical mechanics on a quantity they called entropy: the logarithm of the number of microscopic arrangements consistent with what you can macroscopically observe, and in Gibbs's general form, exactly minus the sum of p log p over microstates. Thermodynamic entropy, it turns out, is a measure of the information you lack about the microscopic state. The legend — told by Shannon himself, though likely polished in the retelling — is that John von Neumann advised him on what to call his quantity: call it entropy, first because the mathematics already carries that name, and second because nobody really knows what entropy is, so in any debate you will have the advantage. Whatever the truth of the quip, the identity of the formulas is no joke, and we will return to it when information turns physical.
:::

---
## Claude Shannon

- 1937 thesis: Boolean algebra **is** circuits
- wartime cryptography at Bell Labs — the incubator
- 1948: *A Mathematical Theory of Communication*
- a paper that installed a field

::: narration
The man who completed the edifice was Claude Shannon, and he had already changed the world once before nineteen forty-eight. His nineteen thirty-seven master's thesis — often called the most influential master's thesis ever written — showed that Boole's century-old algebra of logic was precisely the mathematics of relay switching circuits, the founding insight of digital design. During the war he worked on cryptography and secure speech at Bell Labs, and that work was the incubator: analyzing secrecy systems forces you to think about messages as statistical objects, about redundancy, about what an enemy can infer. In nineteen forty-eight it all crystallized into A Mathematical Theory of Communication, published in the Bell System Technical Journal. It is a rare kind of paper: it did not contribute to a field; it created one, complete with its central definitions, its two great theorems, and — as we'll see — a fifty-year homework assignment for everyone else.
:::

---
## The 1948 model

<div class="viz wide">
<svg viewBox="0 0 1020 200">
<defs><marker id="arrSH" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="156" y1="80" x2="194" y2="80" marker-end="url(#arrSH)"/>
<line class="edge" x1="356" y1="80" x2="394" y2="80" marker-end="url(#arrSH)"/>
<line class="edge" x1="606" y1="80" x2="644" y2="80" marker-end="url(#arrSH)"/>
<line class="edge" x1="806" y1="80" x2="844" y2="80" marker-end="url(#arrSH)"/>
<line class="edge danger" x1="500" y1="20" x2="500" y2="52" marker-end="url(#arrSH)"/>
<rect class="node" x="16" y="50" width="140" height="60" rx="8"/><text class="lbl" x="86" y="80">source</text>
<rect class="node accent" x="196" y="50" width="160" height="60" rx="8"/><text class="lbl on-fill" x="276" y="80">encoder</text>
<rect class="node warn" x="396" y="50" width="210" height="60" rx="8"/><text class="lbl" x="500" y="80">channel</text>
<text class="tag" x="500" y="14" fill="#9D3A24">noise</text>
<rect class="node accent" x="646" y="50" width="160" height="60" rx="8"/><text class="lbl on-fill" x="726" y="80">decoder</text>
<rect class="node good" x="846" y="50" width="158" height="60" rx="8"/><text class="lbl" x="925" y="80">destination</text>
<circle class="token" r="6"><animateMotion dur="4.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.25;0.3;0.55;0.6;0.85;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1" keyPoints="0;0.3;0.3;0.62;0.62;1;1" path="M86,140 L276,140 L500,140 L726,140 L925,140"/></circle>
<text class="cap" x="510" y="178">every act of communication, in one diagram</text>
</svg>
</div>

- one diagram, every act of communication
- source and channel **factored** — study separately
- left half: how small can it get? (compression)
- right half: how fast through noise? (capacity)

::: narration
The paper opens with a diagram so general it covers every act of communication ever attempted — a phone call, a chromosome, this very slideshow. A source produces messages. An encoder transforms them into signals suited for transmission. The signals pass through a channel, where noise — the part nobody chose — corrupts them. A decoder tries to reconstruct the original from what survives, and delivers it to the destination. The genius is in the factoring. The source and its statistics can be studied independently of the channel; the channel and its noise independently of the source. That separation hands us our two fundamental questions, one per half of the diagram. Left half: how efficiently can the encoder represent what the source produces? That's compression, and entropy will answer it. Right half: how fast can anything be pushed through the noise reliably? That's capacity, and it owns the second half of this deck.
:::

---
## Recap: we can measure

- information = selection · meaning excluded
- surprise $-\log p$ — forced by 3 rules
- entropy = average surprise = question count
- weather source: **H = 1.75 bits/day**
- next: the number becomes a wall

::: narration
First checkpoint — pause and collect what's now solid ground. Information is selection among alternatives: the de-semanticizing move that made measurement possible at the price of ignoring meaning. The surprise of a single event is minus the log of its probability — not a convention but the unique function compatible with three requirements anyone would endorse: certainty is uninformative, rarity is informative, independence adds. Entropy is the source's average surprise, and equivalently the unbeatable average number of yes-or-no questions needed to learn the outcome — for our weather source, exactly one point seven five bits per day. So far this might seem like bookkeeping: a tidy number attached to a distribution. The next act is where it becomes consequential, because that number turns out to be a wall in the world — the exact line below which no compression scheme, however ingenious, can ever squeeze the source.
:::

---
## Act II — how short can a message be?

- lossless: exact recovery, every time
- naive: 4 reports → 2 bits, flat
- but the source makes only **1.75/day** — a gap
- is there a floor under cleverness?

::: narration
Act two: compression. The question sounds almost too simple. We want to transmit the weather source's daily reports using as few bits as possible, losslessly — the receiver must recover exactly what was sent, every time, no approximations. The naive encoding is obvious: four possible reports, so assign each a two-bit label — zero-zero for sun, zero-one for cloud, and so on. Two bits per day, guaranteed. But we just computed that this source only produces one point seven five bits of information per day. That gap smells like waste. Can a cleverer code do better than two? And if so, where does cleverness end — can ever-more-ingenious schemes push the cost down indefinitely, or is there a floor in the mathematics that no amount of brilliance can break through? Hold your intuitions; the answer is one of the cleanest results in applied mathematics.
:::

---
## Morse already knew

- 1830s: letter counts from a printer's type case
- E = · (frequent → short) · Q = − − · −
- entropy coding, by instinct, a century early
- what they lacked: where to stop

::: narration
The core trick was discovered by instinct a full century before the theory. When Samuel Morse and Alfred Vail designed their telegraph code in the eighteen thirties, they wanted common letters to be fast. The story goes that Vail counted the type in a printer's type cases — printers stock more of the letters they set most often — and the code follows those counts: E, the most common English letter, is a single dot, the shortest possible signal. Q, a rarity, gets the long dash-dash-dot-dash. The principle hiding in that design is exactly the one we'll now make rigorous: match the length of a codeword to the probability of what it encodes — frequent things short, rare things long — and the average transmission length drops. Morse code is entropy coding before entropy existed. What the telegraphers lacked was the answer to the deeper question: how short can the average get, and when should you stop trying?
:::

---
## Variable lengths create a puzzle

<div class="viz">
<svg viewBox="0 0 720 200">
<text class="lbl mono" x="360" y="34" font-size="22">1 0 1 1 0 …</text>
<rect class="node warn m-in" style="--i:1" x="90" y="70" width="240" height="44" rx="6"/><text class="lbl" x="210" y="92">cloud · sun · snow?</text>
<rect class="node warn m-in" style="--i:2" x="390" y="70" width="240" height="44" rx="6"/><text class="lbl" x="510" y="92">rain · cloud?</text>
<text class="cap m-in" style="--i:3" x="360" y="160">same bits, two readings — the stream is ambiguous</text>
</svg>
</div>

- the receiver sees one unbroken stream
- careless lengths → two readings of the same bits
- Morse's pauses = a third symbol, spending time
- boundaries must live **in the bits**

::: narration
But the moment codewords have different lengths, a puzzle appears that fixed-length codes never face. The receiver sees one undifferentiated stream of bits — no spaces, no commas, no boundaries. Suppose we carelessly assigned sun the codeword zero, cloud the codeword one-zero, and rain the codeword one-zero-one-one. Now the incoming stream one-zero-one-one-zero can be carved up in more than one way: maybe it starts with cloud, or maybe it's the beginning of rain. Two different weather histories, identical bits. The code is ambiguous, which for lossless communication means broken. Morse dodged this with audible pauses between letters — but a pause is really a third symbol, quietly spending the very transmission time we're trying to save. The fix needs to live inside the bits themselves: the code must be designed so boundaries announce themselves.
:::

---
## Prefix codes: the tree picture

<div class="viz">
<svg viewBox="0 0 720 250">
<line class="edge" x1="360" y1="40" x2="220" y2="100"/><text class="tag" x="275" y="58">0</text>
<line class="edge" x1="360" y1="40" x2="500" y2="100"/><text class="tag" x="445" y="58">1</text>
<line class="edge" x1="500" y1="100" x2="400" y2="160"/><text class="tag" x="438" y="120">0</text>
<line class="edge" x1="500" y1="100" x2="600" y2="160"/><text class="tag" x="563" y="120">1</text>
<line class="edge" x1="600" y1="160" x2="530" y2="218"/><text class="tag" x="552" y="180">0</text>
<line class="edge" x1="600" y1="160" x2="670" y2="218"/><text class="tag" x="648" y="180">1</text>
<circle class="node" cx="360" cy="40" r="14"/>
<rect class="node good" x="170" y="92" width="100" height="32" rx="6"/><text class="lbl" x="220" y="108">sun · 0</text>
<circle class="node" cx="500" cy="100" r="14"/>
<rect class="node good" x="340" y="152" width="120" height="32" rx="6"/><text class="lbl" x="400" y="168">cloud · 10</text>
<circle class="node" cx="600" cy="160" r="14"/>
<rect class="node good" x="470" y="212" width="120" height="32" rx="6"/><text class="lbl" x="530" y="228">rain · 110</text>
<rect class="node good" x="612" y="212" width="120" height="32" rx="6"/><text class="lbl" x="672" y="228">snow · 111</text>
</svg>
</div>

- the rule: no codeword begins another
- codewords = **leaves** of a binary tree
- decode: walk down · hit a leaf · restart
- instant, unambiguous, no lookahead
- likely symbol = short branch

::: narration
The fix is the prefix code: design the codewords so that no codeword is the beginning of any other. The cleanest way to see it is as a binary tree. Each codeword is a path from the root — left for zero, right for one — and the rule is simply that every codeword must sit at a leaf, with nothing hanging below it. Here is such a code for the weather source: sun is zero, cloud is one-zero, rain is one-one-zero, snow is one-one-one. Decoding becomes effortless and instantaneous: start at the root, follow the incoming bits down, and the moment you land on a leaf, that's a complete symbol — emit it and jump back to the root. No lookahead, no ambiguity, no pauses; the boundaries announce themselves because hitting a leaf is unmistakable. And notice something about the shape: the likely symbol sits on a short branch, the rare ones on long branches. The tree is Morse's instinct, made structural.
:::

---
## Short codewords spend a budget

<div class="viz wide">
<svg viewBox="0 0 900 170">
<rect class="track" x="50" y="40" width="800" height="56" rx="4"/>
<rect class="bar m-in" style="--i:0" x="50" y="40" width="400" height="56" rx="4"/>
<rect class="bar good m-in" style="--i:1" x="452" y="40" width="198" height="56" rx="4"/>
<rect class="bar warn m-in" style="--i:2" x="652" y="40" width="98" height="56" rx="4"/>
<rect class="bar danger m-in" style="--i:3" x="752" y="40" width="98" height="56" rx="4"/>
<text class="tag" x="250" y="125">sun "0" · costs 1/2</text>
<text class="tag" x="551" y="125">cloud "10" · 1/4</text>
<text class="tag" x="701" y="148">rain · 1/8</text>
<text class="tag" x="801" y="125">snow · 1/8</text>
<text class="cap" x="450" y="22">code space: a codeword of length L claims 2^−L of the whole budget</text>
</svg>
</div>

$$\sum_x 2^{-L(x)} \le 1$$

- a length-L codeword claims $2^{-L}$ of code space
- all claims must total ≤ 1 (Kraft)
- our code: $\tfrac12+\tfrac14+\tfrac18+\tfrac18 = 1$ — exact
- shortness is scarce: who deserves it?

::: narration
Why can't we just make every codeword short? Because in a prefix code, short codewords are expensive — they spend a shared budget. Look at the tree again: claiming the single bit zero for sun didn't just use one leaf, it killed the entire left half of the tree — no other codeword may begin with zero. A length-one codeword consumes half of all code space; a length-two codeword consumes a quarter; in general, length L consumes two to the minus L of the budget, and the claims of all your codewords must fit inside a total of one. That's the Kraft inequality, and you can see it filling the bar above: one-half plus one-quarter plus one-eighth plus one-eighth — our weather code spends the budget exactly, nothing wasted, nothing over. This is the discipline that makes code design a real optimization: shortness is a scarce resource, and the question becomes who deserves it most.
:::

---
## The aha: code length *is* surprise

$$\text{ideal length } L(x) = -\log_2 p(x)$$

- spend budget in proportion to probability
- $2^{-L} = p \;\Rightarrow\; L = -\log p$
- ideal code length **is** the surprise function
- two independent roads, one quantity

::: narration
Now put the two halves together and watch them click. The budget says a codeword of length L costs two to the minus L of code space. We have probabilities to serve: sun deserves the most shortness, snow the least. The natural allocation is to spend code space in proportion to probability — give each symbol a share of the budget equal to its frequency. Set two to the minus L equal to p and solve for the length: L equals minus log of p. Stop and look at that. It is the surprise function — the exact formula we derived in Act One from axioms about information, re-derived here from nothing but the economics of tree-shaped codes. The ideal codeword length for a symbol is its surprise in bits. This is the moment the theory earns its keep: "information content" and "space an optimal code needs" are not analogous quantities, they are the same quantity, arrived at from two independent directions.
:::

---
## Worked: coding the weather

| forecast | $p$ | surprise | codeword | length |
|---|---|---|---|---|
| sun | 1/2 | 1 bit | `0` | 1 |
| cloud | 1/4 | 2 bits | `10` | 2 |
| rain | 1/8 | 3 bits | `110` | 3 |
| snow | 1/8 | 3 bits | `111` | 3 |

- every codeword length = its symbol's surprise
- average: $\tfrac12(1)+\tfrac14(2)+\tfrac18(3)+\tfrac18(3) = \mathbf{1.75}$ bits/day
- beats the naive 2 bits by an eighth
- could anyone ever do better?

::: narration
For our weather source the ideal lengths are all whole numbers, so the ideal is exactly achievable — and the prefix tree we built a moment ago already achieves it. Sun's surprise is one bit; its codeword zero has length one. Cloud: two bits of surprise, codeword one-zero, length two. Rain and snow: three bits each, codewords of length three. Every symbol's codeword length equals its surprise, exactly. Now the payoff arithmetic: the average bits per day is half times one, plus a quarter times two, plus an eighth times three, twice over — one point seven five bits per day. Compare the naive fixed-length code: two bits per day. We've shaved off a full eighth of the transmission with zero loss — and the number we landed on is not approximately the entropy, it is the entropy, to the last decimal. The question is whether anyone, ever, could do better.
:::

---
## The source coding theorem

$$\bar{L} \ge H \quad \text{— always}$$

- never below H — any lossless code, ever
- a law, not the current state of the art
- quick proof: Kraft + convexity
- deeper proof: counting — next two slides

::: narration
No. No one can do better, and that is Shannon's first great theorem — the source coding theorem. For any lossless code whatsoever, the average length per symbol is at least the entropy of the source. One point seven five bits per day is not the current state of the art for our weather source, waiting for a smarter coder to shave it further; it is a wall, of the same character as a conservation law in physics. The intuition for why follows from the budget argument: the Kraft inequality constrains every decodable code, and entropy is precisely the best average that any budget-respecting assignment of lengths can achieve — that's a small exercise in convexity. But there's a deeper and more beautiful way to see the floor, one whose machinery we'll need again at the most important moment of this deck. It requires thinking not about single symbols, but about long runs of them.
:::

---
## Long sequences concentrate

<div class="viz">
<svg viewBox="0 0 760 240">
<rect class="cell" x="40" y="30" width="680" height="180" rx="6"/>
<text class="tag" x="380" y="22">all 4^100 possible 100-day sequences</text>
<ellipse class="node good m-pulse" cx="380" cy="120" rx="120" ry="48"/>
<text class="lbl" x="380" y="114">the typical set</text>
<text class="cap" x="380" y="138">≈ 50 sun · 25 cloud · 12 rain · 13 snow</text>
<text class="cap" x="380" y="232">everything that actually happens, happens in here</text>
</svg>
</div>

- 100 days: $4^{100}$ conceivable histories
- law of large numbers: histories *resemble the statistics*
- ≈ 50 sun · 25 cloud · 12 rain · 13 snow
- a tiny **typical set** carries all the probability
- the desert of atypical histories never happens

::: narration
Watch the weather for a hundred days and write down the sequence. In principle, any of four to the hundredth power sequences could occur — an astronomical space. But the law of large numbers makes a much stronger statement than "the average works out": it says actual hundred-day histories overwhelmingly resemble the statistics. You will see close to fifty sun days, close to twenty-five cloud, around a dozen each of rain and snow. A hundred straight days of snow is possible the way a shuffled deck coming out sorted is possible — never to be observed in the lifetime of the universe. So the gigantic space of conceivable sequences splits in two: a relatively tiny region of typical sequences, where essentially all the probability lives, and a vast desert of atypical ones that never happen in practice. This concentration — reality huddling into a small corner of possibility space — is the single most useful phenomenon in information theory.
:::

---
## Counting the typical set

- each typical sequence: probability ≈ $2^{-nH}$
- so there are ≈ $2^{nH}$ of them
- n=100: $2^{175}$ of $2^{200}$ — one in **33 million**
- number the typical, ignore the rest
- $2^{nH}$ names need $nH$ bits: the floor is *counting*

::: narration
Now count that typical region, because the count is the theorem. A typical hundred-day sequence has probability about two to the minus one hundred times H — each of its hundred days contributes its average surprise of one point seven five bits — and since the typical sequences carry essentially all the probability and are roughly equally likely, there must be about two to the n H of them. For our source: two to the one hundred seventy-five typical sequences, out of two to the two hundred conceivable ones — a fraction of one in two to the twenty-five, roughly one in thirty-three million. Here is the entire compression story in one move: ignore the desert, and just number the typical sequences. Naming one item from a list of two to the one-seventy-five takes one hundred seventy-five bits — H bits per symbol, exactly. And no scheme can use fewer, because two to the n H nearly-equally-likely things simply cannot share fewer than n H bits of names. The floor isn't engineering; it's counting.
:::

---
## Huffman, 1952

<div class="viz">
<svg viewBox="0 0 720 240">
<line class="edge m-in" style="--i:1" x1="530" y1="190" x2="580" y2="130"/>
<line class="edge m-in" style="--i:1" x1="630" y1="190" x2="580" y2="130"/>
<line class="edge m-in" style="--i:2" x1="580" y1="118" x2="455" y2="62"/>
<line class="edge m-in" style="--i:2" x1="330" y1="190" x2="455" y2="62"/>
<line class="edge m-in" style="--i:3" x1="455" y1="50" x2="240" y2="50"/>
<line class="edge m-in" style="--i:3" x1="130" y1="190" x2="240" y2="50"/>
<rect class="node" x="80" y="186" width="100" height="34" rx="6"/><text class="lbl" x="130" y="203">sun 1/2</text>
<rect class="node" x="280" y="186" width="100" height="34" rx="6"/><text class="lbl" x="330" y="203">cloud 1/4</text>
<rect class="node warn" x="480" y="186" width="100" height="34" rx="6"/><text class="lbl" x="530" y="203">rain 1/8</text>
<rect class="node warn" x="580" y="186" width="100" height="34" rx="6"/><text class="lbl" x="630" y="203">snow 1/8</text>
<circle class="node good m-in" style="--i:1" cx="580" cy="120" r="22"/><text class="lbl m-in" style="--i:1" x="580" y="120">1/4</text>
<circle class="node good m-in" style="--i:2" cx="455" cy="50" r="22"/><text class="lbl m-in" style="--i:2" x="455" y="50">1/2</text>
<circle class="node accent m-in" style="--i:3" cx="218" cy="50" r="22"/><text class="lbl on-fill m-in" style="--i:3" x="218" y="50">1</text>
<text class="cap" x="360" y="238">repeatedly merge the two rarest — the optimal tree builds itself</text>
</svg>
</div>

- Fano's class: take the exam, or solve this
- merge the two **rarest** · repeat to the root
- greedy, bottom-up — provably optimal
- found while throwing his notes away
- inside nearly every compressed file since

::: narration
The theorem gives the floor; David Huffman, in nineteen fifty-two, gave the world the algorithm that reaches it — and the origin story is a classic. Huffman was a graduate student in Robert Fano's MIT course, offered a choice: final exam, or solve the open problem of constructing the provably optimal symbol code. He worked on the problem, nearly gave up, and found the answer just as he was throwing his notes away. The algorithm is almost embarrassingly simple, and it runs backwards from how you'd guess: build the tree from the leaves up. Take the two least probable symbols — rain and snow, an eighth each — and merge them into a node of combined weight one-quarter. Now repeat: merge the two rarest things in the room, again and again, until one tree remains. That greedy bottom-up merging is provably optimal — no symbol-by-symbol code beats it — and it beat the method of Shannon and Fano themselves. It still runs, today, inside nearly every compressed file you touch.
:::

---
## Learning the source as you go

<div class="viz wide">
<svg viewBox="0 0 900 180">
<text class="lbl mono" x="450" y="36" font-size="19">s u n s u n c l o u d s u n s u n c l o u d r a i n …</text>
<rect class="node m-in" style="--i:1" x="90" y="70" width="130" height="40" rx="6"/><text class="lbl mono m-in" style="--i:1" x="155" y="90">1: "sun"</text>
<rect class="node m-in" style="--i:2" x="240" y="70" width="150" height="40" rx="6"/><text class="lbl mono m-in" style="--i:2" x="315" y="90">2: "cloud"</text>
<rect class="node m-in" style="--i:3" x="410" y="70" width="170 " height="40" rx="6"/><text class="lbl mono m-in" style="--i:3" x="495" y="90">3: "sun sun"</text>
<rect class="node m-in" style="--i:4" x="600" y="70" width="200" height="40" rx="6"/><text class="lbl mono m-in" style="--i:4" x="700" y="90">4: "cloud rain"</text>
<text class="cap m-in" style="--i:5" x="450" y="150">repeats become references to the growing dictionary</text>
</svg>
</div>

- no statistics in advance — **learn while coding**
- repeats become references to seen phrases
- universal: converges to H anyway
- zip · gzip · PNG — billions of runs a day

::: narration
Huffman coding has a prerequisite we've been quietly assuming: you must know the source's probabilities before you start. For weather, fine. But what about compressing a file you've never seen? In nineteen seventy-seven and seventy-eight, Abraham Lempel and Jacob Ziv solved this with an idea of lovely audacity: learn the source while compressing it. Their schemes scan the data, building a dictionary of phrases already seen; whenever the text repeats something, the coder emits a short back-reference instead of the phrase itself. The data teaches the coder its own statistics on the fly. The deep theorem is that this universal method, knowing nothing in advance, still converges to the entropy floor on any well-behaved source — asymptotically as good as a coder with perfect foreknowledge. Practically, Lempel–Ziv is the most-executed compression idea in history: it lives inside zip, gzip, and PNG, running, without exaggeration, billions of times a day.
:::

---
## The redundancy of English

- raw alphabet: $\log_2 27 \approx 4.75$ bits/letter
- 1951: humans as the model — guess the next letter
- result: ≈ **1 bit/letter**
- text is ~¾ scaffolding — why crosswords work
- badly engineered? hold that thought

::: narration
How compressible is the most human of sources — English prose? Shannon answered with an experiment of characteristic elegance, in nineteen fifty-one: use a human as the statistical model. He had subjects read a passage cut off mid-stream and guess the next letter, counting how many guesses each one took. Mostly, people guess right immediately — after "informatio," the n is free. Spelling, grammar, idiom, and sense all conspire to make most letters nearly forced. From the guess statistics he estimated English at roughly one bit per letter, against the four point seven five bits that twenty-seven raw symbols would suggest. The startling reading: English text is roughly three-quarters redundant — most of every sentence is scaffolding that a sufficiently sharp predictor could reconstruct. That's why crossword puzzles and abbreviated text messages work at all. But before you conclude that language is badly engineered, hold the thought — the next act argues the redundancy is load-bearing.
:::

---
## Recap: the floor — and a question

- match length to surprise → average hits **H**, exactly
- typicality: the floor is counting, not engineering
- 1.75/day, achieved by a drawable tree
- so why is language ¾ redundant?
- unless redundancy is **protection** →

::: narration
Second checkpoint. Compression is the art of matching code length to surprise — frequent symbols short, rare symbols long — and the source coding theorem says the best achievable average is the entropy, exactly: one point seven five bits a day for our weather source, achieved by a tree you could draw by hand. The proof that no one can beat it came from typicality: long sequences huddle into a set of two to the n H members, and that many things can't share fewer than n H bits of names. The machinery is on the table — and now, the loose end, left dangling on purpose. If compression is so straightforwardly good, why has every natural language evolved to be three-quarters redundant? Evolution does not usually tolerate fourfold waste in its communication systems. Unless, of course, the redundancy is not waste — unless it's protection, paid willingly, against something every real channel does to every real message. That something is Act Three.
:::

---
## Act III — the channel corrupts

- every real channel corrupts
- Act II *removed* redundancy · Act III **re-adds it, on purpose**
- that's why you understand speech in a loud bar
- the question: the redundancy ↔ reliability *exchange rate*

::: narration
Act three. Everything so far assumed a perfect wire: bits in, identical bits out. No real channel is like that. Radio fades, cables pick up interference, magnetic domains flip, and somewhere in every system, occasionally, a zero arrives as a one. Now the structure of the subject snaps into symmetry. Act two was about removing redundancy: squeezing out everything predictable until each transmitted bit carries a full bit of information. This act is about adding redundancy back — deliberately, with engineering rather than accident, so that when noise damages the transmission, the surviving structure lets the receiver recover what was meant. That's also the answer to the riddle about language: three-quarters redundancy is what lets you understand speech in a loud bar and read smudged handwriting. Compression and error protection are mirror images, and the deep question is what the *exchange rate* is: how much redundancy must we pay for how much reliability?
:::

---
## The binary symmetric channel

<div class="viz">
<svg viewBox="0 0 720 240">
<defs><marker id="arrBC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge good" x1="200" y1="70" x2="520" y2="70" marker-end="url(#arrBC)"/>
<line class="edge good" x1="200" y1="170" x2="520" y2="170" marker-end="url(#arrBC)"/>
<line class="edge danger ghost" x1="200" y1="70" x2="520" y2="170" marker-end="url(#arrBC)"/>
<line class="edge danger ghost" x1="200" y1="170" x2="520" y2="70" marker-end="url(#arrBC)"/>
<circle class="node" cx="170" cy="70" r="24"/><text class="lbl" x="170" y="70">0</text>
<circle class="node" cx="170" cy="170" r="24"/><text class="lbl" x="170" y="170">1</text>
<circle class="node" cx="550" cy="70" r="24"/><text class="lbl" x="550" y="70">0</text>
<circle class="node" cx="550" cy="170" r="24"/><text class="lbl" x="550" y="170">1</text>
<text class="cap" x="360" y="50" fill="#0F5D5D">0.9</text>
<text class="cap" x="360" y="200" fill="#0F5D5D">0.9</text>
<text class="cap" x="270" y="112" fill="#9D3A24">0.1</text>
<text class="cap" x="270" y="142" fill="#9D3A24">0.1</text>
<text class="cap" x="360" y="232">each bit flips with probability p = 0.1</text>
</svg>
</div>

- send a bit: 0.9 intact · 0.1 flipped
- independent flips · symmetric in 0/1
- 1,000 sent ⇒ ~100 wrong — and they look honest
- everything ahead computed on **this** channel

::: narration
Meet our second running example, the simplest noisy channel there is: the binary symmetric channel. You send a bit; with probability point nine it arrives intact, and with probability point one it flips — zero becomes one, one becomes zero. Each bit suffers this lottery independently, and the channel doesn't care which symbol you sent — hence symmetric. A ten percent flip rate is brutal: send a thousand bits and about a hundred arrive wrong, scattered unpredictably. You can't tell from the received stream which ones — a flipped bit looks exactly like an honest one. Hold this picture for the rest of the act: everything we derive — equivocation, mutual information, capacity, and the great theorem — we will compute concretely for this exact channel, flip probability one-tenth. The question on the table: how can anything be communicated reliably through a device that lies one time in ten?
:::

---
## The obvious defense: repetition

| scheme | send | error rate | rate |
|---|---|---|---|
| none | `1` | 10% | 1 |
| ×3, majority vote | `111` | **2.8%** | 1/3 |
| ×5 | `11111` | **0.86%** | 1/5 |

- say it three times, majority vote
- needs ≥ 2 flips to fail: 10% → **2.8%**
- five copies: **0.86%** — error keeps falling
- but rate: 1 → ⅓ → ⅕ — collapsing in step

::: narration
The defense anyone would invent first: say it again. To send a one, transmit one-one-one; the receiver takes a majority vote. Now the channel must flip at least two of the three bits to fool the vote. Work the numbers for our ten percent channel: two specific flips happen with probability point zero one, there are three ways to choose which pair, plus the rare triple flip — total error just under three percent. Ten percent down to three: real progress. Repeat five times and majority needs three flips to fail — under one percent error. Repeat more, and the error keeps falling toward zero. So reliability is purchasable, and the naive scheme works. But look hard at the price column. Triple repetition cut our useful rate to one-third of a bit per channel use. Five copies, one-fifth. The reliability went up, and the throughput collapsed proportionally. That trade looks like a law of nature. Is it?
:::

---
## The dismal tradeoff

- error → 0 seems to need copies → ∞
- so useful rate → 0
- 1948 consensus: errors inevitable, so *shout louder*
- believe it for three slides — then watch it break

::: narration
Generalize the pattern, and the conclusion looks inescapable. Every notch of added reliability came from more repetition, and every repetition diluted the rate. Driving the error all the way toward zero seems to demand unboundedly many copies of each bit, which drives the communication rate to zero. Conclusion: over a noisy channel, you may have arbitrarily high reliability, or a decent rate, but asking for both is asking for magic — perfect fidelity costs everything. In nineteen forty-eight, this was not a strawman; it was the considered intuition of the working communication engineer, and it shaped real engineering: if errors are inevitable at any useful speed, just shout louder — more power, bigger antennas. I want you to actually believe the dismal argument for the next few slides, because feeling its force is the only way to feel what Shannon did to it. It is wrong — spectacularly, quantitatively wrong — and seeing exactly where it breaks is the summit of this deck.
:::

---
## What the noise eats

$$H(X \mid Y) = H(0.1) \approx 0.47 \text{ bits}$$

- you receive a 1 — but was it sent?
- residual doubt: $H(0.1) \approx 0.47$ bits
- **equivocation**: the part the noise ate
- the Act-I toolkit measures destruction, unchanged

::: narration
To find the crack in the dismal argument, we need to measure exactly how much information the channel destroys — and our Act One toolkit is ready for the job. Suppose you receive a one from the binary symmetric channel. What do you now know about what was sent? Probably a one — but with probability one-tenth it was a flipped zero. Your uncertainty about the input, given the output you saw, is the entropy of that ninety-ten split: H of point one, which computes to about point four seven bits. Shannon called this quantity the equivocation — the uncertainty about the message that remains even after receiving the transmission. It's the information the noise ate. Notice the elegance of the accounting: we don't need any new mathematics for noise. Entropy, the measure we built to describe sources, applied conditionally, exactly captures destruction in transit. Nearly half a bit of every transmitted bit, on this channel, simply doesn't make it through.
:::

---
## The price of concealment

<div class="viz wide">
<svg viewBox="0 0 900 250">
<text class="tag" x="450" y="20">the same 10 percent damage, two ways</text>
<g>
<rect class="cell on" x="90" y="36" width="60" height="48"/><text class="lbl mono" x="120" y="60">1</text>
<rect class="cell on" x="154" y="36" width="60" height="48"/><text class="lbl mono" x="184" y="60">0</text>
<rect class="cell off" x="218" y="36" width="60" height="48"/><text class="lbl mono" x="248" y="60">?</text>
<rect class="cell on" x="282" y="36" width="60" height="48"/><text class="lbl mono" x="312" y="60">1</text>
<rect class="cell on" x="346" y="36" width="60" height="48"/><text class="lbl mono" x="376" y="60">0</text>
<rect class="cell on" x="410" y="36" width="60" height="48"/><text class="lbl mono" x="440" y="60">1</text>
<rect class="cell off" x="474" y="36" width="60" height="48"/><text class="lbl mono" x="504" y="60">?</text>
<rect class="cell on" x="538" y="36" width="60" height="48"/><text class="lbl mono" x="568" y="60">0</text>
<text class="cap" x="730" y="55" fill="#0F5D5D">damage visible → C = 0.90</text>
</g>
<g>
<rect class="cell on" x="90" y="130" width="60" height="48"/><text class="lbl mono" x="120" y="154">1</text>
<rect class="cell on" x="154" y="130" width="60" height="48"/><text class="lbl mono" x="184" y="154">0</text>
<rect class="cell on" x="218" y="130" width="60" height="48"/><text class="lbl mono" x="248" y="154">1</text>
<rect class="cell on" x="282" y="130" width="60" height="48"/><text class="lbl mono" x="312" y="154">1</text>
<rect class="cell on" x="346" y="130" width="60" height="48"/><text class="lbl mono" x="376" y="154">0</text>
<rect class="cell on" x="410" y="130" width="60" height="48"/><text class="lbl mono" x="440" y="154">1</text>
<rect class="cell on" x="474" y="130" width="60" height="48"/><text class="lbl mono" x="504" y="154">0</text>
<rect class="cell on" x="538" y="130" width="60" height="48"/><text class="lbl mono" x="568" y="154">0</text>
<text class="cap" x="730" y="149" fill="#9D3A24">two are lies — which? → C = 0.53</text>
</g>
<text class="cap" x="450" y="225">the 0.37-bit gap is purely the cost of not knowing where</text>
</svg>
</div>

- same damage rate · wildly different price
- erasures (location **known**): C = 0.90 — you lose only your 10 percent
- flips (location **hidden**): C = 0.53
- the gap = H(0.1) — the *description cost* of the noise pattern
- a genie naming the flipped positions would restore C = 1

::: narration
Before going further, sit with how steep that price is — because a ten percent flip rate eating nearly half the channel should bother you, and the resolution is one of the deepest intuitions in the subject. Compare two channels with identical damage rates. An erasure channel loses ten percent of bits but loses them visibly — they arrive as blanks, locations known. Its capacity is point nine zero: you lose exactly your ten percent and nothing more. Our flip channel damages the same fraction, but the damaged bits look perfectly honest. Capacity: point five three. Same injury, double the price — and the difference is purely concealment. Here is the sharpest way to see it: if a genie whispered which positions had flipped, you would simply flip them back and recover the full bit per use. So what the code must implicitly accomplish is reconstructing the noise itself — and the capacity loss is exactly the information content of the genie's message: the entropy of the flip pattern, point four seven bits per use. You are not paying for the damage. You are paying to find it.
:::
---
## What survives: mutual information

<div class="viz narrow">
<svg viewBox="0 0 460 250">
<circle cx="180" cy="120" r="95" fill="#B5C5DC" fill-opacity="0.5" stroke="#1A3F70" stroke-width="2"/>
<circle cx="280" cy="120" r="95" fill="#B7CFCA" fill-opacity="0.5" stroke="#0F5D5D" stroke-width="2"/>
<text class="lbl" x="120" y="120">H(X)</text>
<text class="lbl" x="340" y="120">H(Y)</text>
<text class="lbl" x="230" y="120" fill="#9D3A24">I(X;Y)</text>
<text class="cap" x="230" y="245">the overlap: what input and output share</text>
</svg>
</div>

$$I(X;Y) = H(X) - H(X \mid Y) = 1 - 0.47 = 0.53 \text{ bits}$$

- what's left = what got through
- the overlap of input and output uncertainty
- our channel: $1 - 0.47 = \mathbf{0.53}$ bits/use
- each bit sent delivers about half a bit

::: narration
If equivocation is what the noise eats, then what's left is what got through — and that difference is the act's central quantity. Mutual information: the entropy of the input, minus the equivocation. What you didn't know before, minus what you still don't know after — in other words, what the received signal actually told you. The picture is two overlapping circles: one for the uncertainty of the input, one for the output, and the mutual information is the overlap — the shared part, the information that input and output have in common across the noisy crossing. Compute it for our channel, feeding it fair coin flips: one bit of input entropy, minus point four seven bits of equivocation — point five three bits of mutual information per use. Each transmitted bit genuinely delivers about half a bit of real information. That number is about to become the most important one in the theory.
:::

---
## Capacity: the channel's own number

$$C = \max_{p(x)} I(X;Y)$$

- maximize over what you *send*
- BSC: fair-coin input is optimal
- $C = 1 - H(p) \approx \mathbf{0.53}$ bits/use
- capacity belongs to the **channel** — like horsepower

::: narration
One refinement makes the number canonical. Mutual information depends on what you feed the channel — send nothing but zeros, and input and output share nothing, because there was nothing to share. So define the channel's capacity as the mutual information maximized over all possible input distributions: the most that input and output can be made to share, by a sender playing optimally. For the binary symmetric channel, symmetry says the optimum is the fair coin, so the maximum is the number we just computed: capacity equals one minus H of p — for our ten-percent channel, point five three bits per use. The crucial conceptual shift: capacity belongs to the channel itself, like the horsepower of an engine or the load rating of a bridge — a single number summarizing the physical medium, before anyone decides what to send through it. What Shannon claimed about this number is the most surprising thing in the theory.
:::

---
## The noisy-channel coding theorem

> Below capacity, the error rate can be made **as small as you like** — at a rate that does **not** go to zero.

- below C: error as small as you demand
- and the rate does **not** decay
- 0.53 bits/use through a 10% liar — error < any threshold
- a cliff with a number, not a slope to zero
- contemporaries flatly disbelieved it

::: narration
Here it is — the result the whole deck has been climbing toward. For any rate below capacity, there exist codes that communicate at that rate with error probability as small as you care to demand. Sit with what that says about our channel. The wire lies one time in ten — yet you may transmit at half a bit per use, a perfectly respectable rate, with the probability of error driven below one in a million, one in a trillion, below any threshold whatsoever — and the rate stays at half a bit the entire time. The dismal intuition said reliability is bought only with vanishing throughput; Shannon proved the price of essentially perfect fidelity is a fixed, knowable discount — from one bit down to point five three — and not a penny more. Reliability is not a slope falling away forever; it is a cliff with a number on it. Engineers at the time frankly disbelieved it. The next three slides are why it's true.
:::

---
## Why, part I: blocks and typicality

- protect **blocks**, not bits — thousands at once
- noise over n uses is itself *typical*: ≈ pn flips
- unknown where · known how many
- the enemy is random — and statistically reliable

::: narration
The first idea: stop protecting bits one at a time. Repetition failed because it defended each bit individually, in triplicate, like hiring three bodyguards per letter of a sentence. Shannon's move is to encode enormous blocks — thousands of channel uses treated as one giant super-symbol — and let the law of large numbers work for us instead of against us. Here's the key: over n uses of our channel, the noise itself becomes predictable in aggregate. You don't know which bits will flip, but you know almost exactly how many: very close to one-tenth of n, with fluctuations that shrink, proportionally, as n grows. The noise, in other words, is itself a typical sequence from a known source — the very concentration phenomenon that gave us compression. In Act Two, typicality told us which messages to expect. Here it tells us which corruptions to expect. The enemy is random, but statistically, the enemy is utterly reliable.
:::

---
## The geometry of strings

<div class="viz">
<svg viewBox="0 0 760 280">
<line class="edge" x1="170" y1="50" x2="430" y2="50"/>
<line class="edge" x1="430" y1="50" x2="430" y2="200"/>
<line class="edge" x1="170" y1="200" x2="430" y2="200"/>
<line class="edge" x1="330" y1="105" x2="590" y2="105"/>
<line class="edge" x1="590" y1="105" x2="590" y2="255"/>
<line class="edge" x1="330" y1="255" x2="590" y2="255"/>
<line class="edge" x1="330" y1="105" x2="330" y2="255"/>
<line class="edge" x1="430" y1="50" x2="590" y2="105"/>
<line class="edge" x1="430" y1="200" x2="590" y2="255"/>
<line class="edge" x1="170" y1="200" x2="330" y2="255"/>
<line class="edge good" x1="170" y1="50" x2="430" y2="50"/>
<line class="edge good" x1="170" y1="50" x2="170" y2="200"/>
<line class="edge good" x1="170" y1="50" x2="330" y2="105"/>
<circle class="node accent" cx="170" cy="50" r="19"/><text class="lbl on-fill mono" x="170" y="50">000</text>
<circle class="node good" cx="430" cy="50" r="17"/><text class="lbl mono" x="430" y="50">100</text>
<circle class="node good" cx="170" cy="200" r="17"/><text class="lbl mono" x="170" y="200">010</text>
<circle class="node good" cx="330" cy="105" r="17"/><text class="lbl mono" x="330" y="105">001</text>
<circle class="node muted" cx="430" cy="200" r="15"/><text class="lbl mono" x="430" y="200">110</text>
<circle class="node muted" cx="590" cy="105" r="15"/><text class="lbl mono" x="590" y="105">101</text>
<circle class="node muted" cx="330" cy="255" r="15"/><text class="lbl mono" x="330" y="255">011</text>
<circle class="node muted" cx="590" cy="255" r="15"/><text class="lbl mono" x="590" y="255">111</text>
<text class="cap" x="640" y="36">the radius-1 ball around 000</text>
</svg>
</div>

- n-bit strings = the $2^n$ corners of an n-dimensional cube
- one edge = one flipped bit
- Hamming distance = differing positions = shortest path
- a **ball** of radius r = everything within r flips · noise shoves ≈ pn steps

::: narration
To make that price concrete, we need the geometry the codes actually live in. Picture every n-bit string as a corner of an n-dimensional cube — two corners for n equals one, a square for two, the cube shown here for three, and beyond that a hypercube with two to the n corners that we trust algebra to navigate. Two corners are joined by an edge exactly when they differ in a single bit, so flipping one bit means walking along one edge. The natural distance — Hamming distance — is the number of positions where two strings differ, which is also the shortest walk between their corners. And a ball of radius r around a string is everything reachable within r flips: in the picture, the three highlighted neighbors of zero-zero-zero form its radius-one ball. Now reread the channel in this language: sending a thousand-bit codeword and receiving its corrupted version means the noise has shoved your point about a hundred edge-steps away, in directions you don't know. The next question is the crucial one: how many corners can a shove like that reach?
:::
---
## How big is a noise ball?

<div class="viz narrow">
<svg viewBox="0 0 460 260">
<circle cx="230" cy="125" r="105" fill="#F6E5D2" stroke="#E0CFB8" stroke-width="1.5"/>
<circle cx="230" cy="125" r="92" fill="none" stroke="#DDC58A" stroke-width="13" opacity="0.85"/>
<circle class="node accent" cx="230" cy="125" r="7"/>
<text class="cap" x="230" y="20">the ball around a codeword</text>
<text class="cap" x="375" y="125" fill="#A87B12">the shell at radius ≈ pn</text>
<text class="cap" x="230" y="252">in high dimension, almost all volume sits in that thin shell</text>
</svg>
</div>

$$\log_2 \binom{n}{pn} \approx nH(p)$$

- ball volume = ways to choose *which* positions flipped
- n=1000, p=0.1: $\binom{1000}{100} \approx 2^{469}$ corruption patterns
- a flip pattern **is** a 10 percent source — compressible to nH bits
- thin shell: typical noise lands at radius ≈ pn, almost exactly
- $2^{1000} \div 2^{469} \Rightarrow 2^{531}$ codewords → rate **0.531 = C**

::: narration
Count the ball, and capacity falls out of pure combinatorics. A corruption of a thousand-bit codeword is determined by which positions flipped — so the number of ways the noise can hit you with about a hundred flips is the binomial coefficient: one thousand choose one hundred. Run that through Stirling's approximation and something gorgeous appears: the logarithm of n-choose-p-n is almost exactly n times H of p. The entropy function is the growth rate of binomial coefficients — that is where the two-to-the-n-H ball size genuinely comes from. There's an equivalent reading straight from Act Two: a flip pattern is itself a sequence from a ten-percent source, so there are two-to-the-n-H typical patterns, each compressible to n H bits — describing the noise costs exactly what the genie would have told you. One more high-dimensional surprise: nearly all of the ball's volume concentrates in a thin shell right at radius p n, because the law of large numbers pins the flip count tightly. Now divide: a universe of two to the thousand corners, balls of two to the four-sixty-nine — room for two to the five-thirty-one codewords. Rate: point five three one. The capacity, counted on your fingers.
:::
---
## Why, part II: sphere packing

<div class="viz">
<svg viewBox="0 0 760 250">
<rect class="cell" x="30" y="20" width="700" height="200" rx="8"/>
<circle class="node accent" cx="150" cy="80" r="7"/><circle cx="150" cy="80" r="48" fill="none" stroke="#9D3A24" stroke-width="1.5" stroke-dasharray="5 5"/>
<circle class="node accent" cx="330" cy="150" r="7"/><circle cx="330" cy="150" r="48" fill="none" stroke="#9D3A24" stroke-width="1.5" stroke-dasharray="5 5"/>
<circle class="node accent" cx="500" cy="70" r="7"/><circle cx="500" cy="70" r="48" fill="none" stroke="#9D3A24" stroke-width="1.5" stroke-dasharray="5 5"/>
<circle class="node accent" cx="640" cy="160" r="7"/><circle cx="640" cy="160" r="48" fill="none" stroke="#9D3A24" stroke-width="1.5" stroke-dasharray="5 5"/>
<circle class="token m-pulse" cx="360" cy="125" r="5"/>
<text class="cap" x="380" y="240">codewords (blue) spaced so noise-spheres (red) don't overlap → received point decodes uniquely</text>
</svg>
</div>

- strings = points · a code = chosen points
- noise knocks you into a ball of size $2^{nH(p)}$
- decode: *which ball am I in?*
- balls mustn't overlap → fit $2^{n(1-H(p))}$ of them
- rate = $1 - H(p)$ = **C** — capacity from geometry

::: narration
The second idea turns reliability into geometry. Think of every possible n-bit string as a point in a vast space — two to the n points in all. A code is a choice of some of these points as codewords: the only strings you'll ever deliberately send. When a codeword crosses the channel, noise flips about p n of its bits, knocking the received string a predictable distance away — into a sphere of corrupted variants around the original, containing roughly two to the n times H of p strings. Decoding is then beautifully dumb: see which sphere the received string landed in, and declare that sphere's center. It fails only if spheres overlap — so choose codewords far enough apart that they don't. Now just divide: a space of two to the n, packed with disjoint spheres of size two to the n H of p, fits about two to the n times one-minus-H-of-p of them. Count the messages that many codewords can carry, and the rate is one minus H of p — capacity, falling straight out of geometry.
:::

---
## Why, part III: the random code

- which points, exactly? don't construct — **gamble**
- random points in high dimension: far apart
- average code works ⇒ some code works
- existence without a map
- the fifty-year IOU

::: narration
One step remains, and it's the one with the strange aftertaste. The sphere argument says enough well-separated codewords fit. But which strings, exactly? Constructing two to the n R explicit codewords with guaranteed pairwise separation looked hopeless. Shannon's escape is one of the great moves in twentieth-century mathematics: don't construct — gamble. Choose every codeword completely at random, by coin flips. In high dimensions, random points are overwhelmingly likely to be far apart — concentration again — and Shannon showed the average error probability over all random codes vanishes for any rate below capacity. And if the average over codes is tiny, at least one specific code must do at least that well. Therefore excellent codes exist. Notice what was just proved and what wasn't: the theorem is an existence proof with no construction whatsoever — a certificate that treasure is buried, with no map. That IOU stands open for fifty years, and Act Four is the story of the diggers.
:::

---
## The converse: the wall is real

- above C: every code fails — provably
- equivocation grows ≥ $R - C$ per use
- the receiver is permanently short
- a wall with two faces
- the speed of light of communication

::: narration
The theorem has a second, sterner half that completes the picture: above capacity, no code works — not the best ones we haven't found yet, none. Attempt a rate above C and the error probability is bounded away from zero, provably, forever. The argument runs on the accounting from earlier: the channel hands the receiver at most C bits of mutual information per use, full stop. Try to push R bits through and the receiver's residual uncertainty — the equivocation — necessarily grows at least as fast as R minus C per use; the receiver is permanently short of information, and guesses must fail at a calculable minimum rate. So capacity is a genuine wall with two faces: everything below it is achievable to any fidelity, everything above it is impossible at any ingenuity. Very few engineering quantities have this character — a sharp, proven line where possible flips to impossible. It's why capacity deserves the name "the speed of light of communication."
:::

---
## Worked end-to-end

<div class="viz wide">
<svg viewBox="0 0 1020 190">
<defs><marker id="arrEE" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="186" y1="80" x2="234" y2="80" marker-end="url(#arrEE)"/>
<line class="edge" x1="436" y1="80" x2="484" y2="80" marker-end="url(#arrEE)"/>
<line class="edge" x1="716" y1="80" x2="764" y2="80" marker-end="url(#arrEE)"/>
<rect class="node" x="26" y="46" width="160" height="68" rx="8"/><text class="lbl" x="106" y="72">weather source</text><text class="cap" x="106" y="96">H = 1.75 bits/day</text>
<rect class="node accent" x="236" y="46" width="200" height="68" rx="8"/><text class="lbl on-fill" x="336" y="72">compress</text><text class="cap" x="336" y="96" fill="#DCE6F1">1.75 bits out/day</text>
<rect class="node warn" x="486" y="46" width="230" height="68" rx="8"/><text class="lbl" x="601" y="72">protect + channel</text><text class="cap" x="601" y="96">C = 0.53 bits/use</text>
<rect class="node good" x="766" y="46" width="230" height="68" rx="8"/><text class="lbl" x="881" y="72">received, reliably</text><text class="cap" x="881" y="96">≈ 3.3 channel uses/day</text>
<circle class="token" r="6"><animateMotion dur="4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.3;0.36;0.66;0.72;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1" keyPoints="0;0.33;0.33;0.66;0.66;1" path="M106,160 L336,160 L601,160 L881,160"/></circle>
</svg>
</div>

- $1.75 \div 0.53 \approx 3.3$ channel uses per day, reliable
- through a channel that lies one time in ten
- **separation theorem**: compress, then protect — lose nothing
- the interface is bits — why the digital world is digital

::: narration
Put the whole pipeline together with our two running examples, end to end. The weather source produces one point seven five bits of irreducible information per day — Act Two compressed it precisely that far and the source coding theorem says stop there. Our channel delivers point five three reliable bits per use — Act Three's theorem says that rate is achievable essentially error-free. Divide: transmitting one day's weather through our lying ten-percent channel costs one point seven five over point five three — about three point three channel uses per day, delivered as reliably as you care to engineer. And quietly, a third major result is hiding in this picture: the separation theorem. You lose nothing by doing the two jobs independently — first compress the source as if the channel were perfect, then protect the bits as if they were random coin flips. The interface between the two stages is just bits — which is, more than anything else, *why* our digital world is digital.
:::

---
## What capacity is not

- not a symbol rate — a **reliability ceiling**
- hardware does symbols · capacity is what they're *worth*
- storm → the modem renegotiates *down*
- the wall moves; the system respects the wall

::: narration
A misconception worth disarming, because the word capacity gets used loosely everywhere. Channel capacity is not the number of raw symbols per second a medium can carry — our binary channel happily accepts one bit every use, all day long. Capacity is the rate at which *meaningful, recoverable* information can cross, with reliability made arbitrarily good. Raw symbol rate is what the hardware does; capacity is what the hardware is worth. The practical translation: when an engineer asks how fast a link can really go, the honest question is what is its capacity, and how close does our current code get? That framing also explains a familiar consumer experience: when your connection degrades in a storm, the modem doesn't usually start making errors — it renegotiates to a lower rate. It's sliding down to stay under a capacity that the weather just lowered. The wall moves; the system respects the wall.
:::

---
## The continuous channel

$$C = B \log_2\!\left(1 + \tfrac{S}{N}\right)$$

- every term physical: bandwidth, signal, noise
- noise-limited: double the power ⇒ **+1 bit** only
- phone line: ~3 kHz, ~35 dB ⇒ ~30–35 kbps
- 33.6k = engineering flat against the wall
- 56k changed the channel, not the law

::: narration
Real wires and radio links carry continuous waveforms, not abstract bits, and Shannon covered them too. The Shannon–Hartley theorem gives the capacity of a channel with bandwidth B and Gaussian noise: B times the log of one plus the signal-to-noise ratio. Every term is physical: wider bandwidth means more distinguishable wiggles per second; better signal-to-noise means more distinguishable amplitude levels per wiggle. The logarithm carries a hard message — once the channel is noise-limited, doubling your transmit power buys only one more bit per use. And you have heard this theorem. An analog telephone line passes roughly three kilohertz with a signal-to-noise ratio around thirty-five decibels; plug into the formula and you get a capacity in the mid-thirty-thousands of bits per second. Dial-up modems clawed their way to thirty-three point six kilobits and stopped — that screeching handshake was the sound of engineering pressed flat against Shannon's wall. The famous fifty-six k didn't break the theorem; it swapped in a cleaner, digital channel with better numbers.
:::

---
## 1948: reception and restraint

- "information" invades psychology, art, economics
- 1956, Shannon: a one-page plea — *please stop*
- vocabulary without mathematics ≠ insight
- the founder as the field's chief skeptic
- irony: the wild extensions later proved rigorous

::: narration
The paper's reception was unlike anything in engineering memory. Within a few years, "information theory" was being invoked in psychology, linguistics, economics, art criticism — entropy had become an intellectual fashion accessory, applied to everything and clarifying little. What happened next tells you about Shannon. In nineteen fifty-six, at the peak of his own fame, he published a one-page editorial titled The Bandwagon, gently asking the world to stop. The theory, he wrote, is not a magic key to every door; its hard core is a body of theorems about communication systems, and importing the vocabulary without the mathematics produces only the feeling of insight. It is a rare scientific virtue — the founder policing his own field's inflation — and it sets up a delicious irony we'll meet in Act Five: some of the wildest-sounding extensions, the ones connecting information to heat, money, and learning, turned out to be among the rigorous ones.
:::

---
## The cryptographic sibling

- 1949: secrecy = communication, inverted
- perfect secrecy ⇒ key entropy ≥ message entropy
- the one-time pad: unbreakable · unwieldy
- practice settles for *computational* difficulty
- redundancy switches sides — it betrays you

::: narration
One more nineteen-forties result deserves its place here, because it's the same mathematics wearing a mask — and it's where the theory was actually incubated. Shannon's wartime cryptography work, declassified in nineteen forty-nine as Communication Theory of Secrecy Systems, asks the inverted question. Communication wants the receiver to recover the message despite noise; cryptography wants the eavesdropper to fail despite perfect reception. Shannon proved that perfect secrecy — where the intercepted ciphertext gives the enemy precisely zero information, in the now-rigorous sense — is achievable, but only at a stiff entropy price: the secret key must contain at least as much entropy as the message itself. That's the one-time pad: a key as long as everything you'll ever say, used once. Provably unbreakable, and provably unwieldy — which is why practical cryptography settled for computational difficulty instead of informational impossibility. Redundancy, meanwhile, switches teams: in communication it saves you; in cryptography it's exactly what betrays you to the codebreaker.
:::

---
## Recap: two theorems, one shape

- **squeeze** to H — no further · **protect** to C — no faster
- one tool proves both: typicality
- walls, not frontiers — achievable and impossible
- they compose: bits are the currency
- outstanding debt: nobody has the codes

::: narration
Third checkpoint, and the theory's core is now complete. Two theorems, mirror images. The source coding theorem: a source's output can be compressed to its entropy and not one bit further — for our weather, one point seven five bits a day. The channel coding theorem: a noisy channel can carry reliable information up to its capacity and not one bit faster — for our flipping channel, point five three bits a use. The same engine proves both: long blocks concentrate, typical sets can be counted, and the counts are the limits. Both are walls in the strongest sense — achievable from one side, impossible from the other — and they compose cleanly, bits being the universal currency between them. One debt outstanding: every reliability claim leaned on codes that Shannon proved exist by coin-flip argument and never exhibited. Somebody had to actually find them. That hunt — four decades of brilliance, frustration, and one spectacular surprise — is next.
:::

---
## Act IV — the IOU

- the proof's codebook: $2^{nR}$ entries, no structure
- decoding = a lookup bigger than the universe
- needed: structure for speed **and** spread for capacity
- threading that needle: 61 years
- first digger: a man with ruined weekends

::: narration
Act four: paying the debt. Be precise about what nineteen forty-eight left undone. The random-coding proof doesn't just fail to name a good code — random codes themselves are unusable in practice, because decoding one means comparing the received block against a codebook of two to the n R entries, with no structure to exploit. For the block lengths the theorem needs, that's a table larger than the universe. So the engineering problem is sharper than "find Shannon's codes": find codes with enough algebraic structure that encoding and decoding are fast, yet enough randomness-like spread that they approach capacity. Structure and randomness pull in opposite directions, and threading that needle took, in the end, sixty-one years. The story begins almost immediately, with a Bell Labs mathematician whose motivation was not the grand theorem at all — it was a machine that kept ruining his weekends.
:::

---
## Hamming, 1950

- relay computer, weekends, unattended
- parity detects → machine halts → job dead by Monday
- the right question: *detect ⇒ why not locate?*
- parity bits with overlapping **districts**
- the failure pattern spells the address

::: narration
Richard Hamming shared a primitive relay computer at Bell Labs, and his jobs ran on weekends, unattended. The machine had error *detection* — a simple parity check — but its only response to a detected error was to halt. Hamming kept arriving on Monday to find Friday's job dead a few hours in. His frustration crystallized into exactly the right question: if the machine knows an error occurred, why can't it know *where*? Locate a flipped bit and you fix it for free — flip it back. His construction is a small marvel of overlapping bookkeeping. A single parity bit watches the whole block and can only say "something's wrong." Hamming instead gave each parity bit a *district* — a specific subset of positions — arranged so every position lies in a unique combination of districts. When an error strikes, the pattern of which parity checks fail spells out, literally as a binary number, the address of the guilty bit.
:::

---
## The (7,4) code

<div class="viz wide">
<svg viewBox="0 0 900 200">
<rect class="cell on" x="60" y="50" width="80" height="60"/><text class="lbl mono" x="100" y="80">d1</text>
<rect class="cell on" x="144" y="50" width="80" height="60"/><text class="lbl mono" x="184" y="80">d2</text>
<rect class="cell hot m-pulse" x="228" y="50" width="80" height="60"/><text class="lbl mono" x="268" y="80">d3</text>
<rect class="cell on" x="312" y="50" width="80" height="60"/><text class="lbl mono" x="352" y="80">d4</text>
<rect class="cell sel" x="420" y="50" width="80" height="60"/><text class="lbl mono" x="460" y="80">p1</text>
<rect class="cell sel" x="504" y="50" width="80" height="60"/><text class="lbl mono" x="544" y="80">p2</text>
<rect class="cell sel" x="588" y="50" width="80" height="60"/><text class="lbl mono" x="628" y="80">p3</text>
<text class="cap" x="226" y="32">4 data bits — one corrupted</text>
<text class="cap" x="544" y="32">3 parity districts</text>
<text class="cap m-in" style="--i:3" x="750" y="80" fill="#9D3A24">checks failing: p2, p3</text>
<text class="cap m-in" style="--i:5" x="750" y="104" fill="#0F5D5D">→ address = bit 3. Flip it.</text>
<text class="cap" x="450" y="180">7 bits sent, 4 bits meant — rate 4/7, every single error healed</text>
</svg>
</div>

- 4 data bits + 3 parity = 7 sent
- each position: a unique combination of districts
- failing checks read out the bad bit — **flip it back**
- rate 4/7 · every single error healed

::: narration
The classic instance is the seven-four Hamming code: four data bits travel with three parity bits, seven in all. Each parity bit takes responsibility for a different overlapping subset of the seven positions, and the assignment is cunning: the three yes-or-no verdicts — which checks pass, which fail — read out as a three-bit binary number that *is* the position of the error. Zero means all is well; any other value names the flipped bit, and flipping it back restores the block perfectly. In the picture, data bit three has been struck; checks two and three fail while check one passes, and the failure pattern spells the address — bit three — caught and corrected. The cost: three protective bits per four useful ones, rate four-sevenths. Crude by later standards, but the conceptual door it opened was everything: errors need not merely be detected and mourned. They can be *located and undone* — by structure alone, with no retransmission.
:::

---
## Distance is geometry — the spheres return

- Hamming distance: positions where strings differ
- minimum distance d: the closest codeword pair
- correct t errors ⇔ $d \ge 2t+1$
- Shannon's noise-spheres — crafted by hand

::: narration
Hamming also gave the field its geometric language — and here, three slides after the capacity proof, the spheres return. Define the distance between two binary strings as the number of positions where they differ — now called Hamming distance — and characterize any code by its minimum distance: the closest any two codewords come. The decoding rule is nearest-codeword, so the picture is exactly the noise-spheres from Act Three: each codeword owns a ball of radius t around it, and decoding succeeds whenever the noise stays inside the ball. Balls of radius t collide unless their centers are at least two t plus one apart — so a code corrects t errors precisely when its minimum distance clears that bar. The seven-four code has minimum distance three: every single error corrected, guaranteed. Shannon's existence proof and Hamming's working code, discovered independently in the same halls in the same years, are the same geometry at two scales — the random and the crafted.
:::

---
## Reed–Solomon, 1960

- k points fix a degree-(k−1) polynomial
- send n > k evaluations
- **any** k survivors rebuild everything
- bursts are just lost points — location-blind
- the workhorse of storage and broadcast

::: narration
The next leap came from algebra. Irving Reed and Gustave Solomon, in nineteen sixty, encoded data not with parity districts but with polynomials. The idea is high-school mathematics aimed like a weapon: two points determine a line, three a parabola — in general, k points fix a polynomial of degree k minus one, exactly. So treat your k data symbols as a polynomial's coefficients, and transmit the polynomial's value at n different points, with n comfortably bigger than k. The receiver needs any k clean values to reconstruct the polynomial — and with it, every symbol — no matter which n minus k values were destroyed. Notice the superpower that buys: the code is indifferent to *where* the damage falls. A long consecutive burst — the failure mode that shreds bit-level codes — is just another set of lost points. Reed–Solomon codes are the workhorses of storage and broadcast to this day, and two of their deployments deserve their own slide.
:::

---
## Where the codes flew

- Voyager: Neptune's portrait on a lightbulb's power
- the pictures *are* the coding
- CD, 1982: cross-interleaved Reed–Solomon
- a scratch → scattered, correctable losses
- infrastructure that vanishes when it works

::: narration
Two icons of the algebra age. Voyager's cameras sent back the first close portraits of Jupiter, Saturn, Uranus, and Neptune across billions of miles, on a transmitter drawing about as much power as a refrigerator light bulb. At that range the signal arrives unimaginably faint — the only reason the pictures exist is the coding: Reed–Solomon stacked with convolutional codes, squeezing reliable data out of nearly pure static. The second icon sits closer to home. When Philips and Sony designed the compact disc, they wrapped the music in cross-interleaved Reed–Solomon coding — interleaving spreads each codeword's symbols physically around the disc, so a scratch that obliterates millimeters of track translates into small, scattered, correctable losses across many codewords. A CD with a visible scratch that plays flawlessly is running a live algebra demonstration at seven hundred megabits an hour. This is the act's quiet theme: error correction disappearing into infrastructure, working precisely when you don't notice it.
:::

---
## Decoding as pathfinding

<div class="viz wide">
<svg viewBox="0 0 900 230">
<line class="edge ghost" x1="100" y1="60" x2="300" y2="60"/><line class="edge ghost" x1="300" y1="60" x2="500" y2="160"/><line class="edge ghost" x1="100" y1="160" x2="300" y2="160"/><line class="edge ghost" x1="300" y1="160" x2="500" y2="60"/><line class="edge ghost" x1="500" y1="60" x2="700" y2="60"/><line class="edge ghost" x1="500" y1="160" x2="700" y2="160"/><line class="edge ghost" x1="300" y1="60" x2="500" y2="60"/><line class="edge ghost" x1="300" y1="160" x2="500" y2="160"/><line class="edge ghost" x1="100" y1="60" x2="300" y2="160"/><line class="edge ghost" x1="500" y1="160" x2="700" y2="60"/>
<path class="edge good m-draw" style="--len:650" d="M100,60 L300,160 L500,160 L700,60" fill="none" stroke-width="3.5"/>
<circle class="node" cx="100" cy="60" r="13"/><circle class="node" cx="100" cy="160" r="13"/>
<circle class="node" cx="300" cy="60" r="13"/><circle class="node" cx="300" cy="160" r="13"/>
<circle class="node" cx="500" cy="60" r="13"/><circle class="node" cx="500" cy="160" r="13"/>
<circle class="node good" cx="700" cy="60" r="13"/><circle class="node" cx="700" cy="160" r="13"/>
<text class="cap" x="450" y="215">the trellis: all legal state paths — decoding = find the cheapest one (Viterbi, 1967)</text>
</svg>
</div>

- convolutional codes: a streaming state machine
- the trellis: every legal state journey
- received bits price the edges
- Viterbi, 1967: cheapest path, exactly, fast
- probes · modems · 2G — billions of paths/sec

::: narration
A different family — convolutional codes — abandoned blocks entirely: the encoder is a tiny state machine that streams output bits as a running, overlapping function of recent input bits, smearing each message bit's influence across many transmitted ones. Decoding looked hard until Andrew Viterbi, in nineteen sixty-seven, reframed it as a picture: draw every possible journey of the encoder's internal state through time as a graph — the trellis. The received noisy stream prices each edge: paths that would have produced something close to what was heard are cheap, paths that disagree are expensive. Decoding becomes finding the single cheapest path through the trellis — and dynamic programming finds it exactly, in time linear in the message length. It's the same algorithmic idea your phone's navigation uses for roads, applied to possibility itself. Viterbi decoding ran in every deep-space probe, every dial-up modem, and the entire second generation of cell phones — billions of cheapest paths per second, worldwide, for decades.
:::

---
## The long stall

<div class="viz wide">
<svg viewBox="0 0 900 240">
<line class="axis" x1="80" y1="190" x2="840" y2="190"/>
<line class="edge danger" x1="80" y1="170" x2="840" y2="170" stroke-dasharray="6 5"/>
<text class="cap" x="135" y="158" fill="#9D3A24">Shannon's wall (C)</text>
<rect class="bar muted" x="120" y="40" width="70" height="150"/><text class="tag" x="155" y="212">1950</text>
<rect class="bar muted" x="240" y="60" width="70" height="130"/><text class="tag" x="275" y="212">1960</text>
<rect class="bar muted" x="360" y="75" width="70" height="115"/><text class="tag" x="395" y="212">1970</text>
<rect class="bar" x="480" y="90" width="70" height="100"/><text class="tag" x="515" y="212">1980</text>
<rect class="bar" x="600" y="100" width="70" height="90"/><text class="tag" x="635" y="212">1990</text>
<text class="cap" x="755" y="105" fill="#7A736C">…still far</text>
<text class="cap" x="460" y="26">distance from capacity (smaller = better)</text>
</svg>
</div>

- four decades of real, shipping progress…
- …still ~3 dB short: ~2× the minimum power
- textbooks: near-capacity is "practically unreachable"
- structure or performance — pick one
- that consensus had three years left

::: narration
And then — for a long time — the wall held its distance. Four decades of genuinely brilliant work: Hamming's parities, Reed and Solomon's polynomials, Viterbi's trellis, elaborate concatenations stacking code upon code. Every step real, every step shipped. Yet measured against the only yardstick that ultimately matters — how close to Shannon's capacity can you run — progress crawled. By around nineteen ninety, the best practical systems, the ones flying on spacecraft, still needed signal energies several decibels above what Shannon's theorem said should suffice: a gap meaning two, three times more transmit power than the theoretical minimum. The community had largely made peace with it. Textbooks of the era describe near-capacity performance as a theoretical curiosity, practically out of reach; the random codes that achieve it can't be decoded, and the codes that can be decoded don't achieve it. Structure or performance — pick one. That consensus had about three years to live.
:::

---
## Turbo, 1993

- Geneva, 1993 — outsiders, flatly disbelieved
- two simple encoders · one interleaver
- decoders exchange **beliefs**, round after round
- two crossword solvers, one grid
- within ~0.5 dB of the wall

::: narration
At the nineteen ninety-three International Conference on Communications in Geneva, Claude Berrou and Alain Glavieux — professors of electronics, outsiders to coding theory's algebraic establishment — presented a scheme they called turbo codes, claiming performance within half a decibel of the Shannon limit. The reviewers' and audience's reaction has become folklore: flatly disbelieved — a decimal error, surely, or a simulation bug — until other labs reproduced the curves. The architecture is two almost insultingly simple convolutional encoders viewing the same data through an interleaver — two different scramblings of one message. The magic is in the decoder: the two decoders run in turns, each producing not decisions but *probabilities* — soft beliefs about every bit — and each round, one decoder's beliefs become the other's starting hints. Like two crossword solvers passing the same grid back and forth, each unlocking entries the other couldn't, the iteration converges in a handful of rounds to near-certainty, at rates the field had written off as fantasy.
:::

---
## LDPC: invented 1960, feasible 1996

- Gallager's 1960 thesis: sparse checks + iterative decoding
- absurd for 1960 hardware → shelved 35 years
- MacKay, 1996: capacity-class all along
- an idea can be simply *early*
- Wi-Fi · 10G Ethernet · satellite TV · SSDs

::: narration
The turbo shock sent the field digging — and the digging turned up a buried treasure with a bitter date on it. Robert Gallager's nineteen sixty MIT doctoral thesis had described low-density parity-check codes: enormous blocks governed by thousands of parity constraints, each deliberately sparse — touching just a few bits — decoded by exactly the iterative belief-passing that made turbo codes work, described thirty-three years early. On nineteen-sixty hardware, simulating such a decoder was beyond absurd, so the thesis was respectfully cited and shelved — for thirty-five years. In the mid-nineties David MacKay, coming from machine learning where message-passing on sparse graphs was daily bread, reread it and showed LDPC codes march just as close to capacity as turbo codes — and had been able to all along. The lesson cuts deeper than coding: an idea can be perfectly correct and simply *early*, waiting for the hardware its inventor will never see. Gallager, at least, lived to watch his thesis conquer the world: Wi-Fi, ten-gigabit Ethernet, satellite TV, SSDs.
:::

---
## Polar codes, 2009

<div class="viz">
<svg viewBox="0 0 760 250">
<line class="edge" x1="120" y1="120" x2="320" y2="60"/>
<line class="edge" x1="120" y1="120" x2="320" y2="180"/>
<line class="edge" x1="350" y1="50" x2="540" y2="25"/>
<line class="edge" x1="350" y1="60" x2="540" y2="85"/>
<line class="edge" x1="350" y1="175" x2="540" y2="150"/>
<line class="edge" x1="350" y1="185" x2="540" y2="215"/>
<rect class="node warn" x="50" y="95" width="140" height="50" rx="7"/><text class="lbl" x="120" y="120">C = 0.53</text>
<rect class="node m-in" style="--i:1" x="280" y="38" width="90" height="40" rx="6"/><text class="lbl m-in" style="--i:1" x="325" y="58">better</text>
<rect class="node m-in" style="--i:1" x="280" y="162" width="90" height="40" rx="6"/><text class="lbl m-in" style="--i:1" x="325" y="182">worse</text>
<rect class="node good m-in" style="--i:2" x="500" y="8" width="110" height="36" rx="6"/><text class="lbl m-in" style="--i:2" x="555" y="26">≈ perfect</text>
<rect class="node m-in" style="--i:2" x="500" y="68" width="110" height="36" rx="6"/><text class="lbl m-in" style="--i:2" x="555" y="86">middling</text>
<rect class="node m-in" style="--i:2" x="500" y="132" width="110" height="36" rx="6"/><text class="lbl m-in" style="--i:2" x="555" y="150">middling</text>
<rect class="node muted m-in" style="--i:2" x="500" y="196" width="110" height="36" rx="6"/><text class="lbl m-in" style="--i:2" x="555" y="214">≈ useless</text>
<text class="cap m-in" style="--i:4" x="380" y="245">recurse → channels polarize: perfect or useless, nothing between</text>
</svg>
</div>

- Arıkan, 2009 — a decade of solo work
- weave two channel uses → one better, one worse
- recurse ⇒ channels **polarize**: perfect or useless
- the perfect fraction = capacity, exactly
- data on the perfect, silence on the useless — *with proof*

::: narration
Turbo and LDPC codes worked stunningly well, but their guarantees were empirical — simulations and asymptotic arguments, not airtight proof of reaching capacity. The final word came in two thousand nine from Erdal Arıkan of Bilkent University, after a decade of quiet solo work. His polar codes rest on a transformation that sounds like alchemy. Take two uses of a mediocre channel and weave them together with one small operation; you get two synthetic channels — one slightly better than what you started with, one slightly worse. Now recurse: combine the betters, combine the worses, again and again. In the limit, something extraordinary happens — the synthetic channels *polarize*: each becomes either essentially perfect or essentially useless, with nothing in between. And the fraction that turn perfect is exactly the capacity. The code then writes itself: send your data bits on the perfect channels, send nothing on the useless ones. Capacity achieved — with a proof, with practical complexity, with no randomness anywhere.
:::

---
## The chart closes

<div class="viz wide">
<svg viewBox="0 0 900 240">
<line class="axis" x1="80" y1="190" x2="840" y2="190"/>
<line class="edge danger" x1="80" y1="170" x2="840" y2="170" stroke-dasharray="6 5"/>
<text class="cap" x="135" y="158" fill="#9D3A24">Shannon's wall (C)</text>
<rect class="bar muted" x="110" y="40" width="60" height="150"/><text class="tag" x="140" y="212">1950</text>
<rect class="bar muted" x="220" y="60" width="60" height="130"/><text class="tag" x="250" y="212">1960</text>
<rect class="bar muted" x="330" y="80" width="60" height="110"/><text class="tag" x="360" y="212">1975</text>
<rect class="bar" x="440" y="100" width="60" height="90"/><text class="tag" x="470" y="212">1990</text>
<rect class="bar good m-in" style="--i:2" x="550" y="160" width="60" height="30"/><text class="tag" x="580" y="212">1993 turbo</text>
<rect class="bar good m-in" style="--i:3" x="660" y="164" width="60" height="26"/><text class="tag" x="690" y="212">1996 LDPC</text>
<rect class="bar good m-in" style="--i:4" x="770" y="169" width="60" height="21"/><text class="tag" x="800" y="212">2009 polar</text>
<text class="cap" x="460" y="26">distance from capacity, 1950 → 2009: the promise kept</text>
</svg>
</div>

- 1948: wall located · 1990: stalled short
- 1993 turbo · 1996 LDPC · 2009 polar
- the promissory note: **paid in full**
- your phone: LDPC data + polar control channels
- the closing arguments run billions of times a second

::: narration
Step back and look at the whole chart — sixty-one years in one picture. Nineteen forty-eight: the wall is proven to be reachable, location exact, route unknown. The decades of structure — Hamming, Reed–Solomon, convolutional-plus-Viterbi — close the gap steadily, then stall, a stubborn few decibels short, long enough for the field to call the remainder unreachable. Then the modern burst: turbo in ninety-three, by belief and iteration; LDPC rediscovered in ninety-six, vindicating a thirty-five-year-old thesis; polar in two thousand nine, with the full proof. The promissory note Shannon signed is, for the workhorse channels of engineering, paid in full. And the payoff is not historical — it's in your pocket. A five-G phone uses LDPC codes for its data channels and polar codes for its control channels, executing the closing arguments of this sixty-year story billions of times per second, so routinely that nobody ever thinks of it.
:::

---
## Recap: the race

- existence 1948 → locate 1950 → algebra → belief → proof 2009
- the wall was reachable; reaching took 61 years
- both theorems now true *and implemented*
- next: where the theory escaped to

::: narration
Fourth checkpoint, briskly. Shannon proved in nineteen forty-eight that codes achieving capacity exist, by an argument that named none. Hamming opened the constructive era within two years by making errors locatable, not just detectable. The algebraic decades — Reed–Solomon's polynomials, Viterbi's cheapest path — built civilization-grade infrastructure, flew to Neptune, and survived a million scratched CDs, while still falling measurably short of the wall. The iterative revolution — turbo's conversing decoders, Gallager's resurrected LDPC — closed to within a whisper by trading algebraic guarantees for probabilistic belief-passing, and Arıkan's polar codes finished the job with proof in hand in two thousand nine. The two great theorems are now not just true but *implemented*. What remains is the strangest part of the story: what happened when the concepts escaped communication entirely — into the price of a bet, the heat of a computation, and the loss function of every neural network you've ever used.
:::

---
## Act V — one string, not an ensemble

- Shannon's H needs a distribution
- one object: K(x) = **shortest program** printing x
- alternating million: a two-line loop
- patternless: no program beats `print x`
- language choice shifts K only by a constant

::: narration
Act five: the escapes — first, a foundational one. Shannon's entropy is a property of a source, a probability distribution; it has nothing to say about an individual object. Yet surely the single string of a million alternating zero-ones is simpler than a million coin flips — no ensemble required. In the nineteen sixties, Ray Solomonoff, Andrei Kolmogorov, and Gregory Chaitin — independently, in three countries — found the right formalization: define the complexity of a string as the length of the shortest computer program that outputs it. The alternating string is a two-line loop regardless of its length — complexity tiny. A truly patternless string admits no program meaningfully shorter than print, followed by the string itself, quoted in full. The choice of programming language shifts the measure only by a constant, so the definition is robust — and where Shannon measured the uncertainty of what a source *might say*, Kolmogorov measures the irreducible description of what *is*.
:::

---
## Randomness defined — at a price

- random **=** incompressible — no shorter description
- structural: about the object, not its origin
- the twist: K is **uncomputable** (halting problem)
- simple is provable · random never is
- almost every string is random; none certifiably

::: narration
This buys something philosophers had wanted for centuries: a definition of randomness that doesn't lean on ignorance or chance. A string is random precisely when it is incompressible — when no description of it is shorter than the thing itself, when there is no pattern to exploit because there is no pattern. Randomness becomes a structural property of the object, not a statement about how it was produced. Then comes the twist that gives the field its flavor: Kolmogorov complexity is uncomputable. No algorithm can, in general, take a string and return its shortest program — the halting problem stands in the way, since you cannot survey all short programs without knowing which ones run forever. The asymmetry is delicious: to show a string is simple, just exhibit a short program; but to certify it random, you'd have to rule out every short program at once, which provably cannot be done. Almost every string is random; no particular string can ever be proved to be.
:::

---
## Believing wrongly has a price

$$\text{wasted bits} = \mathrm{KL}(p \| q) = \sum_x p(x)\log_2\frac{p(x)}{q(x)}$$

- build the code for q · the world runs p
- short codewords idle, long ones fire
- overpayment = $\mathrm{KL}(p\|q)$, **exactly**
- not an analogy — a derivation
- the bit-price of false belief

::: narration
Now an escape with a thoroughly practical destiny — and watch how it falls straight out of Act Two. Suppose you build an optimal code for a source you believe in: codeword lengths matched to your distribution, q — minus log of q for each symbol, the Act Two recipe. But reality follows a different distribution, p. Your sunny-city code gets shipped to a rainy city: short codewords sit idle on events that rarely come, long ones fire constantly. The average cost is now p-weighted lengths built from q — and the overpayment, your average length minus the true entropy of p, works out to exactly the sum of p log p-over-q. That quantity is the Kullback–Leibler divergence, introduced in nineteen fifty-one, the fundamental measure of how far one distribution is from another. The coding story isn't an analogy — it's a derivation: KL divergence *is* the bit-price of believing q in a world that runs on p.
:::

---
## Every neural net pays it

$$\text{cross-entropy } = H(p) + \mathrm{KL}(p\|q)$$

- the loss beneath ~all of modern ML
- cross-entropy = $H(\text{data}) + \mathrm{KL}(\text{model}\|\text{world})$
- gradient descent = reclaiming wasted bits
- a language model *is* a compressor — loss in bits/token
- 1948 → every training run on earth

::: narration
Here is why that bookkeeping matters far beyond coding: it is the loss function of the modern world. Train a classifier, or a language model predicting its next token, and the loss minimized at every step is almost invariably cross-entropy — the average of minus log q, the model's surprise at the truth. Decompose it and the meaning surfaces: cross-entropy equals the entropy of the data, the part no model can remove, plus the KL divergence from the model's beliefs to reality, the removable part. So gradient descent on cross-entropy is, literally, minimizing the wasted bits of the previous slide — sculpting q toward the world's p, one correction at a time. A language model that predicts text well is, by the source coding theorem, exactly a compressor of text; the loss curves on a training dashboard are denominated in bits per token. The line from Shannon's nineteen forty-eight question to every deep-learning run on earth is not a metaphor. It is the same quantity, still being minimized.
:::

---
## Compression with a purpose

- a learner shouldn't keep everything
- compress the input ↔ preserve the **label** info
- one trade-off, one knob — Tishby, 1999
- contentious lens on deep nets
- learning = compression with a purpose

::: narration
One refinement of that idea deserves a slide, because it reframes learning itself. Compression as we built it is indiscriminate: preserve everything, every bit sacred. But a learner doesn't want everything — a face-recognizer should keep what identifies the person and discard the lighting. Naftali Tishby and colleagues formalized this in nineteen ninety-nine as the information bottleneck: find a representation of the input that is as compressed as possible — minimal mutual information with the raw input — while preserving as much mutual information as possible with the thing you care about, the label. Compression and prediction become two arms of a single trade-off, tunable by one knob. The framework has been proposed, contentiously, as a lens on why deep networks generalize — layers as progressive bottlenecks, squeezing out nuisance while keeping signal. The debate continues, but the framing has stuck: learning is compression with a purpose — keeping the bits that matter about something else.
:::

---
## Information has a dollar value

- noisy tips: bet how much?
- ruin at both extremes — bet a fixed **fraction**
- max growth rate = **mutual information** of the tip
- bits convert to compound interest
- Shannon & Thorp: Vegas, then the markets

::: narration
The escape into money is the field's most charming, and it began as pure play. John Kelly, another Bell Labs physicist, asked in nineteen fifty-six: suppose you receive advance tips about race outcomes over a noisy channel — a private wire that's right more often than wrong. How should you bet? Bet nothing and the tips are wasted; bet everything and the first wrong tip ruins you. Kelly proved the growth-optimal strategy bets a fixed fraction of your bankroll, sized precisely by your informational edge — and then the punchline that earns this slide its place: the maximum exponential growth rate of your wealth equals the mutual information between the tips and the outcomes. Bits convert to compound interest at a fixed exchange rate; a half-bit-per-race channel is worth exactly a certain doubling rate, no more. Shannon and Ed Thorp took the criterion to Las Vegas and then to the markets, where Kelly sizing became a quiet institution. Information theory, it turns out, prices knowledge.
:::

---
## Entropy as honesty

- partial knowledge → which full distribution?
- choose **maximum entropy** — anything else overclaims
- honesty, formalized
- stat mech reread as inference (Boltzmann via Bayes)

::: narration
The next escape runs through the foundations of inference. Edwin Jaynes, in nineteen fifty-seven, turned entropy from a measure into a principle. The problem: you know a few facts about a system — an average energy, a few moments — and must commit to a full probability distribution. Which one? Jaynes's answer: the distribution with maximum entropy among all those consistent with what you know. The argument is about intellectual honesty rather than physics: of all consistent distributions, the max-entropy one is maximally noncommittal — any other choice has lower entropy, meaning it encodes *more* certainty than your evidence licenses, smuggling in claims you cannot back. The audacious part was rereading statistical mechanics itself this way: the canonical distributions of Boltzmann and Gibbs fall out as maximum-entropy inferences given energy constraints — thermodynamics as honest reasoning under ignorance rather than a fact about molecular chaos. Boltzmann's formula and Shannon's, joined for a deeper reason than resemblance.
:::

---
## Information is physical

$$E_{\text{erase one bit}} \ge kT \ln 2$$

- erasing one bit ≥ $kT\ln 2$ of heat — always
- two states forced into one: possibility must go *somewhere*
- computing can be free · **forgetting** cannot
- bits ↔ joules: the quip stops being a joke

::: narration
And then the escape into physics proper — the result that ties the deck's opening anecdote into a knot. Rolf Landauer of IBM proved in nineteen sixty-one that erasing one bit of information has an unavoidable minimum energy cost: k T log two, dissipated as heat — about three zeptojoules at room temperature. The reason is counting. A bit that could be zero or one occupies two distinguishable physical states; erasing it — forcing it to a known state regardless of what it was — compresses two possibilities into one. But physics conserves possibility-counting: phase-space volume cannot be destroyed, only exported. So the lost alternative must be pushed into the thermal jostling of the environment — which is to say, released as entropy, as heat. The startling corollary, developed by Charles Bennett: computation itself can in principle be done reversibly, for free. Only *forgetting* is necessarily costly. Information is not metaphorically physical. It has an exchange rate with energy, and the von Neumann quip stops being a joke.
:::

---
## Maxwell's demon, finally exorcised

<div class="viz">
<svg viewBox="0 0 760 240">
<rect class="cell" x="60" y="40" width="280" height="150" rx="6"/>
<rect class="cell" x="420" y="40" width="280" height="150" rx="6"/>
<rect class="node danger" x="345" y="85" width="70" height="60" rx="8"/><text class="lbl" x="380" y="115">demon</text>
<text class="cap" x="200" y="30">fast molecules</text><text class="cap" x="560" y="30">slow molecules</text>
<rect class="cell sel m-in" style="--i:1" x="300" y="208" width="26" height="22"/>
<rect class="cell sel m-in" style="--i:2" x="330" y="208" width="26" height="22"/>
<rect class="cell sel m-in" style="--i:3" x="360" y="208" width="26" height="22"/>
<rect class="cell sel m-in" style="--i:4" x="390" y="208" width="26" height="22"/>
<rect class="cell sel m-in" style="--i:5" x="420" y="208" width="26" height="22"/>
<text class="cap" x="540" y="224">…its memory fills — and erasing it pays the bill</text>
</svg>
</div>

- 1867: a doorkeeper sorts molecules — second law dies?
- measurement can be made free — **memory** can't
- Bennett, 1982: the erasure pays the bill, exactly
- the demon drowns in its own notes

::: narration
Landauer's principle settled a ghost story that had haunted physics since eighteen sixty-seven. Maxwell's demon: a tiny intelligence guards a trapdoor between two gas chambers, letting fast molecules pass one way and slow ones the other. Heat flows cold-to-hot, entropy falls, the second law of thermodynamics dies — using nothing but observation and good timing. Generations of attempted exorcisms failed; even the cost of the demon's *measurements* could be engineered away. Charles Bennett supplied the resolution in nineteen eighty-two, and it's an information-theoretic one: to sort, the demon must *record* what it sees — fast, slow, fast — and its memory is a physical system that fills. To run forever, the demon must eventually erase, and Landauer's toll on that erasure, k T log two per bit, restores every joule of entropy the sorting removed, with the books balancing exactly. The second law survives because *information storage is physical*. The demon doesn't fail at sorting molecules; it drowns in its own notes.
:::

---
## The quantum turn

- a qubit holds a continuum — measurement yields **one bit** (Holevo)
- **no-cloning**, 1982: no copies, even in principle
- but every classical code begins by copying…
- the rules of information mutate with the physics

::: narration
The last escape opens a field too large for this deck, so consider this a doorway rather than a tour. When the carrier of information is a quantum system, the rules change beneath your feet. A qubit can sit in a superposition — a continuum of possible states, not just zero or one — yet Holevo's theorem delivers the humbling bound: measure it and you extract at most one classical bit. Infinite description, finite extraction. Stranger still is the no-cloning theorem of Wootters and Zurek: an unknown quantum state cannot be copied, even in principle. Notice what that breaks — every classical coding strategy in this deck, from triple repetition to Reed–Solomon, begins by copying or spreading information redundantly. Quantum information cannot be protected that way. That such information *can* nonetheless be protected — that there is a quantum theory of error correction at all — was a genuine shock, and it's the reason quantum computing is an engineering program rather than a dream.
:::

---
## Quantum information theory

- the entropy: $S(\rho)$ — von Neumann, 1927(!)
- Schumacher, 1995: compress to S — the **qubit** earns its name
- Shor & Steane: protection via *entanglement*
- correlations carry what no particle holds
- same theorem-shapes, stranger substrate

::: narration
The quantum field recapitulated Shannon's program with uncanny fidelity, about fifty years on. The entropy: von Neumann's S of rho — defined for quantum states in nineteen twenty-seven, decades before Shannon, another wink from the entropy gods — plays exactly the role of H. The source coding theorem: Benjamin Schumacher proved in nineteen ninety-five that quantum states compress down to their von Neumann entropy in qubits, the result that made "qubit" a unit and not just a word. The error correction: Peter Shor and Andrew Steane showed that entangling a fragile state across many physical qubits protects it — encoding information in correlations no single particle carries, so the environment's prying disturbs no readable copy, and the no-cloning barrier is sidestepped rather than broken. And entanglement itself became what entropy made uncertainty: a measured, budgeted, spendable resource. Same questions, same theorem-shapes, stranger substrate — the strongest evidence yet that Shannon found something deeper than engineering.
:::

---
## Recap: the escapes

- one object: K · belief: KL → **cross-entropy**
- bets: Kelly · inference: max-ent
- heat: Landauer · quantum: rebuilt wholesale
- not applications — the same quantities, *found in place*

::: narration
Fifth checkpoint — count the escapes. Kolmogorov complexity carried information from ensembles to individual objects, and bought a definition of randomness at the price of computability. KL divergence priced false belief in bits, and through cross-entropy became the loss function under nearly all of machine learning. Kelly converted mutual information into compound interest; Jaynes turned maximum entropy into the grammar of honest inference and reread thermodynamics through it. Landauer and Bennett bound bits to joules and finally paid off Maxwell's demon — with the demon's own memory. And the quantum turn showed the whole framework rebuilding itself on stranger physics, theorem by parallel theorem. Notice what these have in common: none is an *application* in the loose, bandwagon sense Shannon warned against. Each is the same small family of quantities — entropy, relative entropy, mutual information — discovered to have been already present in the structure of another field. That pattern demands an explanation, and the closing act offers one.
:::

---
## The price of the theory

- everything here began by refusing "meaning"
- the blindness **is** the universality
- but the excluded question never dissolved
- why does the snow report *matter*?
- a complete account still owes an answer

::: narration
Coda. Begin by paying, one last time, the bill from slide five. Everything in this deck — the theorems, the codes, the escapes — became possible the moment Hartley and Shannon agreed not to ask what messages mean. The renunciation wasn't a footnote; it was the founding act, and its fingerprints are on every result. It is also exactly why the theory is universal: a mathematics blind to content applies indifferently to weather reports, genomes, bets, and qubits, because it never looks at the part where they differ. But the excluded question did not dissolve — and Shannon never claimed it had. Why does the snow report *matter* in a way the entropy can't see? What makes a signal *about* the weather at all? The misconception slide in Act One warned against confusing the measure with meaning. The honest closing move is to admit the converse: a complete account of information owes an answer to the meaning question, and Shannon's theory, by design, is not where it lives.
:::

---
## The return of meaning

- Dretske, 1981: aboutness from reliable correlation
- the misrepresentation problem bites back
- Floridi: semantic info = well-formed · meaningful · **true**
- the refusal now supplies the sharpest tools
- the renunciation was a loan

::: narration
And philosophy did come collecting. Fred Dretske's nineteen eighty-one Knowledge and the Flow of Information made the boldest attempt to build meaning *out of* Shannon's materials: a signal carries the information that the weather is snow when the conditional probability of snow, given the signal, is one — and belief, even knowledge, might just be a system's capacity to be driven by such correlations. Aboutness, naturalized through reliable covariation. The program hit honest trouble — misrepresentation is hard to reconstruct from correlation alone, since a signal that can be wrong has, by definition, imperfect statistics — and the repair industry around that problem is still active. Luciano Floridi's school takes another route: define semantic information outright as well-formed, meaningful, and truthful data, and rebuild epistemology atop it. No verdicts here — only the observation that fits this deck: the field founded on refusing the meaning question now supplies the sharpest tools anyone has for asking it. The renunciation, it turns out, was a loan.
:::

---
## The whole arc

- renounce → derive → two walls, one tool
- a debt signed 1948, paid 2009
- escapes: bets · heat · learning · qubits · meaning
- less a theory applied than a **vein struck**

::: narration
The arc, one last time, end to end. A renunciation: information as selection, meaning set aside. A derivation: surprise forced to be minus log p by three innocent requirements, entropy its average — one point seven five bits a day for a small sunny city. A pair of walls, proved with one tool: typical sequences let you compress to the entropy and no further, and let you signal through noise up to capacity and no faster — point five three bits per use of a channel that lies one time in ten. A debt: the codes exist, said the proof, and showed none — and Hamming, Reed, Solomon, Viterbi, Berrou, Gallager, and Arıkan spent sixty-one years paying it, finishing with a proof in two thousand nine and shipping the result in every phone on earth. And an expansion: the same few quantities surfacing in gambling, thermodynamics, machine learning, quantum mechanics, and the philosophy of mind — less like a theory being applied than like a vein of something real, struck in nineteen forty-eight, still being mined.
:::

---
## One paper, seventy years

> "There are very few times in history when one person founds an entire field, asks all the right questions, and answers most of them." 

- installed a field: definitions, limits, reachability
- then built juggling machines and a mechanical mouse
- deflated his own bandwagon
- 2009: promise kept · today: still mining

::: narration
Close on the founding document itself, because its shape remains singular in the history of science. One paper, in a telephone company's technical journal, that did not advance a field but installed one — definitions, measures, two limit theorems, and the proof that the limits were reachable — then handed posterity a half-century of work in the form of a single unconstructive existence proof. Shannon himself stayed characteristically unimpressed by the cult that formed around him; he built juggling machines and a mechanical mouse, wrote the Bandwagon memo deflating his own admirers, and left the field he created when it stopped amusing him. The field repaid him by being even bigger than the bandwagon riders dreamed — not because entropy explains art or society, but because surprise, compression, and the price of certainty turned out to be load-bearing concepts in any universe that computes, communicates, or learns. Seventy years on, the mining continues. That is the history of information theory — so far.
:::



