# Healthcare Interoperability: DICOM, FHIR, HL7 and the Wire Formats of Medicine

---
## The wire formats of medicine

- a patient's data lives in **dozens of systems** — registration, lab, pharmacy, imaging, billing, the EHR
- built by different vendors, in different decades, on different assumptions — none meant to interoperate
- the bridges: **HL7 v2/v3** · **CDA** · **FHIR** · **DICOM** · **DICOMweb**
- the job: exchange data **reliably, safely, and without re-keying** at every boundary

::: narration
A single patient generates data across an astonishing number of systems: the registration desk, the lab, the pharmacy, the imaging department, the cardiology suite, the billing office, and the electronic health record that nominally ties them together. Almost none of these systems were built by the same vendor, in the same decade, with the same assumptions. Healthcare interoperability is the discipline of making them exchange information anyway — reliably, safely, and without a human retyping everything at each boundary. This is a tour of the standards that make that exchange possible. By the end you should have a solid mental map: what each standard is for, how they fit together, where the seams are, and why a field this important is still, in twenty twenty-six, only partway to the seamless picture everyone wants.
:::

---
## Why this is genuinely hard

- **no greenfield** — 50 years of legacy that can't be switched off (lives depend on uptime)
- **safety-critical** — a field dropped in translation can be a wrong dose or a missed allergy
- **semantics, not syntax** — agreeing on shape is easy; "potassium 5.1" *means* which units, range, specimen?
- **every site is bespoke** — local codes, custom interfaces, historical compromises
- a standard has to survive all of this — at once, forever

::: narration
It helps to start with why this problem resists the obvious solution of "just use a modern API." First, there is no greenfield. Hospitals run software that is decades old and cannot be turned off, because lives depend on it being available every minute. Second, the stakes are unforgiving: a field silently dropped in translation is not a cosmetic bug, it can be a wrong medication dose or a missed allergy. Third, and most subtly, the hard part is rarely syntax — it is semantics. Getting two systems to agree on the shape of a message is easy compared to getting them to agree on what a value means: which units, which reference range, which code system, which version of which terminology. And finally, every hospital is effectively a bespoke deployment, with its own interfaces, its own local codes, its own historical compromises. A standard has to survive all of that.
:::

---
<!-- .slide: class="compact" -->
## The map of the territory

<div class="viz wide">
<svg viewBox="0 0 1080 300">
<defs><marker id="arrMap" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<text class="tag" x="270" y="24">clinical &amp; administrative data</text>
<text class="tag" x="820" y="24">imaging</text>
<line class="edge ghost" x1="540" y1="40" x2="540" y2="280"/>
<rect class="node" x="60" y="48" width="160" height="56" rx="7"/><text class="lbl" x="140" y="76">HL7 v2</text>
<rect class="node" x="60" y="124" width="160" height="56" rx="7"/><text class="lbl" x="140" y="152">v3 / CDA</text>
<rect class="node accent" x="290" y="86" width="180" height="64" rx="8"/><text class="lbl on-fill" x="380" y="118">FHIR</text>
<rect class="node muted" x="290" y="186" width="180" height="50" rx="7"/><text class="lbl" x="380" y="211">terminologies</text>
<rect class="node muted" x="60" y="200" width="160" height="50" rx="7"/><text class="lbl" x="140" y="225">IHE / XDS</text>
<rect class="node plum" x="620" y="86" width="180" height="64" rx="8"/><text class="lbl on-fill" x="710" y="118">DICOM</text>
<rect class="node good" x="860" y="86" width="170" height="64" rx="8"/><text class="lbl" x="945" y="118">DICOMweb</text>
<rect class="node muted" x="620" y="200" width="410" height="50" rx="7"/><text class="lbl" x="825" y="225">PACS · modalities · viewers</text>
<line class="edge" x1="220" y1="132" x2="290" y2="118" marker-end="url(#arrMap)"/>
<line class="edge" x1="220" y1="76" x2="290" y2="104" marker-end="url(#arrMap)"/>
<line class="edge accent" x1="800" y1="118" x2="860" y2="118" marker-end="url(#arrMap)"/>
<line class="edge ghost" x1="470" y1="118" x2="620" y2="118" marker-end="url(#arrMap)"/>
<text class="cap" x="545" y="138">FHIR ImagingStudy</text>
</svg>
</div>

- **left** — clinical & administrative data: HL7 v2, v3/CDA, FHIR at the center
- **right** — imaging: DICOM and its web face DICOMweb
- **underneath** — terminologies (meaning) and IHE profiles (wiring)
- the seam between worlds is bridged by FHIR **`ImagingStudy`**
- two worlds, evolved apart, now converging at the center

::: narration
Here is the whole landscape on one diagram, and it is worth fixing in your mind before we go deeper. On the left is the world of clinical and administrative data — admissions, lab results, medications, problems, encounters. That world is served by HL7's family of standards: the old workhorse version two, the more ambitious version three and its surviving document format C-D-A, and the modern web-native standard F-H-I-R at the center. On the right is the world of medical imaging, governed almost entirely by DICOM, with its newer web face DICOMweb. Underneath everything sit the terminologies — the shared code systems that give values meaning — and the integration profiles from a body called I-H-E that say how to wire the pieces together. The dashed line in the middle is the seam between the two worlds, and the bridge across it is a FHIR resource called ImagingStudy. Keep this picture; everything that follows is a zoom into one box.
:::

---
## Two lineages, one patient

- **HL7** (1987): born from hospital admin & lab messaging — events and records
- **DICOM** (1985): born from radiology & device makers — pixels and acquisition
- different problems → different shapes (DICOM is as much about *devices* as data)
- evolved in parallel for ~30 years, different constituencies
- they meet at the **patient** (same person in both), and now on the **network**

::: narration
Why two separate worlds at all? It is largely an accident of history and constituency. HL7 emerged in nineteen eighty-seven from the people who needed to move admissions, transfers, discharges, and lab results between hospital information systems — fundamentally a messaging problem about events and records. DICOM emerged a couple of years earlier from radiologists and imaging-device manufacturers, who had a completely different problem: how to get a pixel-perfect image off a CT scanner from one vendor and onto a workstation from another, with all the acquisition parameters intact. Different problems produced different shapes — DICOM is as much about devices and pixels as it is about data. The two lineages evolved in parallel for thirty years. They have always met at the patient, who is the same person in both systems, and they increasingly meet on the network, which is the convergence story we will end on.
:::

---
## HL7 the organization vs HL7 the standards

- **HL7** = Health Level Seven International, the standards *body* (not one product)
- "Level Seven" → the **application layer** of the OSI model (meaning, not wires)
- publishes four distinct technologies: **v2** · **v3** · **CDA** · **FHIR**
- v2 and FHIR share almost nothing but a publisher
- so "we use HL7" always begs the question: **which one?**

::: narration
A common early confusion is worth clearing up immediately. "HL7" names both an organization and several of its products. Health Level Seven International is a standards-development body, and the "level seven" is a nod to the seventh, application layer of the old O-S-I networking model — the layer concerned with the meaning of what is exchanged, not the wires underneath. Over its life this one organization has published four quite different technologies: version two, the pipe-delimited messaging standard; version three, an ambitious model-driven redesign; C-D-A, a document standard that came out of version three; and F-H-I-R, the modern resource-and-REST standard. So when someone says "we use HL7," the only correct response is "which one?" — because version two and FHIR have almost nothing in common beyond their publisher.
:::

---
## HL7 v2: the pipe-and-hat workhorse

```
MSH|^~\&|LAB|MainHosp|EHR|MainHosp|20260618093000||ORU^R01|MSG00001|P|2.5.1
PID|1||100457^^^MRN||DOE^JANE^A||19850212|F
OBR|1||ORD789|2951-2^Sodium^LN
OBX|1|NM|2951-2^Sodium^LN||139|mmol/L|136-145|N|||F
```

- still carries the **majority of live clinical messaging** worldwide
- delimiters declared in `MSH`: `|` field · `^` component · `~` repeat (+ escape, subcomponent)
- `MSH` = who/what/when · `PID` = identity · `OBR` = the order · `OBX` = the result
- the example: a **sodium of 139 mmol/L**, range 136–145, flagged normal

::: narration
This is HL7 version two, and despite being the oldest thing we will look at, it is still the single most widely deployed clinical data standard on earth — the majority of real-time messaging inside hospitals today is still version two. Its look is unmistakable: lines of text carved up by pipes and carets. Each line is a segment with a three-letter code. M-S-H is the message header, saying who sent what, when, and what kind of message it is. P-I-D carries patient identity. O-B-R is an observation request — here, a sodium test. O-B-X is the result itself: a numeric value of one hundred thirty-nine millimoles per liter, with its reference range and a flag saying it is normal. The delimiters are fixed and declared right at the top of M-S-H: pipe separates fields, caret separates components within a field, and the rest handle repetition and escaping. Once your eye adjusts, it is surprisingly readable.
:::

---
## Anatomy of a v2 message

<div class="viz wide">
<svg viewBox="0 0 1080 260">
<rect class="node accent" x="40" y="40" width="120" height="44" rx="6"/><text class="lbl on-fill" x="100" y="62">MSH</text>
<rect class="node" x="40" y="96" width="120" height="44" rx="6"/><text class="lbl" x="100" y="118">PID</text>
<rect class="node" x="40" y="152" width="120" height="44" rx="6"/><text class="lbl" x="100" y="174">OBR</text>
<rect class="node good" x="40" y="208" width="120" height="44" rx="6"/><text class="lbl" x="100" y="230">OBX</text>
<text class="cap left" x="200" y="66" style="text-anchor:start">message = ordered list of segments</text>
<text class="code" x="200" y="128">OBX | 1 | NM | 2951-2^Sodium^LN | | 139 | mmol/L | ...</text>
<line class="edge" x1="232" y1="150" x2="232" y2="170"/>
<text class="cap left" x="200" y="200" style="text-anchor:start">field 3 = "2951-2^Sodium^LN"  →  components split by ^</text>
<text class="code" x="200" y="232">2951-2  ·  Sodium  ·  LN  (code · text · system)</text>
</svg>
</div>

- a strict **positional** grammar — no field names on the wire, only positions
- position *is* meaning: `OBX-3` = identifier, `OBX-5` = value; one stray `|` shifts everything
- the coded triplet `2951-2^Sodium^LN` = **code · text · system** (echoes up into FHIR)

::: narration
The grammar of version two is a strict positional hierarchy, and understanding it is most of understanding the standard. A message is an ordered list of segments. Each segment is a list of fields separated by pipes. Each field can be divided into components by carets, and components into subcomponents by ampersands, and a field can repeat using the tilde. Crucially, position is meaning — the third field of O-B-X is always the observation identifier, the fifth is always the value. There are no field names on the wire, only positions, which makes the format compact but utterly unforgiving: insert a stray pipe and every field after it shifts and is now misread. Within that one field "twenty-nine fifty-one dash two, caret, Sodium, caret, L-N," the components encode a coded concept — the code, its human-readable text, and the code system it came from, which here is LOINC. That coded-concept triplet is a pattern you will see echoed all the way up into FHIR.
:::

---
<!-- .slide: class="compact" -->
## Trigger events and the ACK loop

<div class="viz">
<svg viewBox="0 0 560 250">
<defs><marker id="arrAck" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#1A3F70"/></marker></defs>
<rect class="node accent" x="60" y="20" width="140" height="36" rx="5"/><text class="lbl on-fill" x="130" y="38">sending app</text>
<rect class="node" x="360" y="20" width="140" height="36" rx="5"/><text class="lbl" x="430" y="38">receiving app</text>
<line class="edge ghost" x1="130" y1="56" x2="130" y2="230"/>
<line class="edge ghost" x1="430" y1="56" x2="430" y2="230"/>
<line class="edge accent" x1="130" y1="92" x2="430" y2="108" marker-end="url(#arrAck)"/><text class="cap" x="280" y="86">ADT^A01 (admit)</text>
<line class="edge" x1="430" y1="160" x2="130" y2="176" marker-end="url(#arrAck)"/><text class="cap" x="280" y="154">ACK^A01 (AA / AE / AR)</text>
<circle class="token accent" r="5"><animateMotion dur="3.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.4;0.5;0.9;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1" keyPoints="0;0.5;0.5;1;1" path="M130,92 L430,108 L430,160 L130,176"/></circle>
</svg>
</div>

- **event-driven**: a real-world event triggers a message (`ADT^A01` = admit)
- message type + trigger event travel together (`ORU^R01` = observation result)
- receiver replies **ACK** — accept (AA) · error (AE) · reject (AR)
- the big families: **ADT** (admit/transfer/discharge) · **ORU** (results) · **ORM** (orders) · **SIU** (scheduling)
- point-to-point and acknowledged — the hospital's nervous system

::: narration
Version two is event-driven. Something happens in the real world — a patient is admitted, a result is finalized, an order is placed — and that event triggers a message. The message type and a trigger-event code travel together: A-D-T caret A-zero-one means "admit a patient," O-R-U caret R-zero-one means "here is an observation result." The big message families are worth memorizing: A-D-T for admissions, transfers, and discharges, the heartbeat of any hospital; O-R-U for results; O-R-M and its successors for orders; S-I-U for scheduling. Communication is point-to-point and acknowledged: the receiver sends back an A-C-K saying it accepted the message, found an error, or rejected it outright. That simple request-acknowledge loop, multiplied across thousands of interfaces, is the nervous system of the hospital.
:::

---
## MLLP and the interface engine

<div class="viz wide">
<svg viewBox="0 0 1080 240">
<defs><marker id="arrIE" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<rect class="node" x="40" y="40" width="120" height="48" rx="6"/><text class="lbl" x="100" y="64">Lab</text>
<rect class="node" x="40" y="110" width="120" height="48" rx="6"/><text class="lbl" x="100" y="134">Radiology</text>
<rect class="node" x="40" y="180" width="120" height="48" rx="6"/><text class="lbl" x="100" y="204">Pharmacy</text>
<rect class="node accent" x="420" y="96" width="220" height="76" rx="8"/><text class="lbl on-fill" x="530" y="128">interface engine</text>
<text class="cap" x="530" y="152" fill="#DCE6F1">route · transform · filter</text>
<rect class="node good" x="900" y="60" width="140" height="48" rx="6"/><text class="lbl" x="970" y="84">EHR</text>
<rect class="node good" x="900" y="150" width="140" height="48" rx="6"/><text class="lbl" x="970" y="174">Billing</text>
<line class="edge" x1="160" y1="64" x2="420" y2="120" marker-end="url(#arrIE)"/>
<line class="edge" x1="160" y1="134" x2="420" y2="134" marker-end="url(#arrIE)"/>
<line class="edge" x1="160" y1="204" x2="420" y2="148" marker-end="url(#arrIE)"/>
<line class="edge" x1="640" y1="124" x2="900" y2="84" marker-end="url(#arrIE)"/>
<line class="edge" x1="640" y1="144" x2="900" y2="174" marker-end="url(#arrIE)"/>
</svg>
</div>

- transport: **MLLP** — start byte + end byte over a raw TCP socket, nothing more
- no built-in encryption, auth, or retry — just framing
- the **interface engine** (Mirth, Rhapsody, Cloverleaf) is the hub: route · transform · filter
- turns an N×N tangle of point-to-point links into **connect-once**
- where institutional knowledge — and institutional pain — actually lives

::: narration
Two pieces of infrastructure make version two work in practice. The first is the transport, and it is almost comically minimal: Minimal Lower Layer Protocol, M-L-L-P, which does nothing more than wrap each message in a start byte and an end byte and push it down a raw T-C-P socket. No encryption, no authentication, no built-in retry — just framing. The second piece is what makes the whole thing manageable: the interface engine, products like Mirth, Rhapsody, and Cloverleaf. Without it, connecting N systems to each other is an N-squared tangle of bespoke point-to-point links. The engine sits in the middle as a hub: every system connects to it once, and it routes messages, transforms them between each system's quirks, filters them, and patches up the inevitable nonconformance. In a real hospital, the interface engine is where the institutional knowledge — and the institutional pain — actually lives.
:::

---
## v2's strengths and its sins

| strength | sin |
|---|---|
| ubiquitous, proven, simple to parse | optionality: almost every field is optional |
| compact on the wire | "Z-segments" — local custom extensions |
| human-readable | no real conformance; every site differs |
| event model fits hospital workflow | weak typing, version drift (2.1 → 2.9) |

- bottom line: **"we support v2" tells you little** about whether two systems will actually interoperate
- the gap optionality leaves is exactly what FHIR's profiles set out to close

::: narration
Version two's strengths are real and explain its staying power: it is everywhere, it is battle-tested, it is trivial to parse with a few string splits, it is compact, and its event model genuinely fits how hospitals work. But its sins are equally real and explain why FHIR exists. The deepest sin is optionality — the standard makes almost every field optional, so two systems can both be perfectly "conformant" and still be unable to exchange a usable message. Sites paper over gaps with so-called Z-segments, locally invented segments outside the standard, which means real interfaces are full of custom extensions no outsider can interpret. There is no strong notion of conformance you can test against, the typing is weak, and a long lineage of versions from two-point-one through two-point-nine has accumulated drift. The result is a standard where "we support HL7 v2" tells you remarkably little about whether two systems will actually interoperate.
:::

---
## HL7 v3: the ambitious redesign that mostly didn't land

- **RIM** — a single abstract Reference Information Model for *all* of healthcare
- model-driven, rigorously typed, expressed in verbose XML
- every message formally derived from the common model — ambiguity solved on paper
- in practice: too complex, too abstract, cost rarely justified the benefit
- the cautionary tale: **a standard nobody can afford to implement helps no one**

::: narration
The HL7 community knew version two's weaknesses, and in the late nineteen-nineties set out to fix them properly. The result was version three, built around the Reference Information Model, or R-I-M — a single, abstract, object-oriented model meant to describe all of healthcare, from which every specific message would be formally derived. It was model-driven, rigorously typed, and expressed in verbose XML. On paper it solved version two's ambiguity: everything had a precise, traceable meaning rooted in the common model. In practice it largely failed to displace version two. It was extraordinarily complex, the abstraction was hard for ordinary developers to apply, and the cost of implementing it rarely justified the benefit when version two, for all its flaws, already worked. Version three is the cautionary tale that hangs over this whole field: theoretical rigor does not automatically win, and a standard nobody can afford to implement helps no one.
:::

---
## CDA: the one v3 success

```xml
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1"
        displayName="Summarization of Episode Note"/>
  <recordTarget><patientRole>...</patientRole></recordTarget>
  <component><structuredBody>
    <section><!-- Problems, Medications, Allergies... --></section>
  </structuredBody></component>
</ClinicalDocument>
```

- a **document**, not a message: a discharge summary, a referral, a progress note
- the defining idea: human-readable **narrative** + machine-readable **entries**, meant to agree
- **C-CDA** = Consolidated CDA, the constrained US template library
- the backbone of Meaningful Use for years; still moves in huge volume
- the "download my health summary" file behind many patient portals

::: narration
Version three did leave one durable success: the Clinical Document Architecture, C-D-A. Instead of modeling a transient message about an event, C-D-A models a persistent document — a discharge summary, a referral letter, a progress note — the kinds of artifacts clinicians already think in. Its defining idea is a dual nature: every C-D-A document carries a human-readable narrative that a clinician can simply read, alongside machine-readable structured entries that software can parse, with the two meant to agree. In the United States this was specialized into Consolidated C-D-A, or C-C-D-A, a library of templates for specific document types that became the backbone of the government's Meaningful Use program for years. If you have ever clicked "download my health summary" from a patient portal and gotten a clunky but complete document, you have very likely met C-C-D-A. It is verbose and template-heavy, but it works, and enormous volumes of it still move daily.
:::

---
## What CDA taught FHIR

- from **v2**: keep the pragmatism and resource-level granularity
- from **CDA**: keep documents as a unit, and the narrative + structure duality
- from **v3's failure**: drop full RIM purity — it was too heavy to implement
- the heretical bet: **being easy for web developers beats being theoretically complete**
- that bet is why FHIR finally got traction

::: narration
The lineage matters because FHIR is, in large part, a deliberate reaction to everything we have just covered. From version two, FHIR kept the pragmatism and the event-and-resource granularity. From C-D-A, it kept two genuinely good ideas: that a document is a useful unit of exchange, and that pairing human-readable narrative with machine-readable structure is worth doing — every FHIR resource can carry exactly that narrative. But from version three's failure, FHIR drew the decisive lesson: the full R-I-M-derived, model-purist approach was too heavy, and developer ergonomics are not a luxury, they are the thing that determines whether a standard gets implemented at all. So FHIR made a bet that the previous generation would have considered almost heretical — that being easy and familiar for ordinary web developers was more important than being theoretically complete. That bet is why we are spending the next dozen slides on it.
:::

---
## FHIR: the premise

- **F**ast **H**ealthcare **I**nteroperability **R**esources (pronounced "fire")
- data model: **Resources** — modular, named, typed objects (`Patient`, `Observation`, `Encounter`)
- API: plain **REST** over HTTP — `GET` a Patient, `POST` an Observation — JSON or XML
- philosophy: standardize the **80%** everyone uses, **extend** for the long tail
- familiar tech + modest per-resource ambition + real escape hatches

::: narration
FHIR — spelled F-H-I-R, pronounced "fire" — stands for Fast Healthcare Interoperability Resources, and it is the standard most new healthcare software is built around today. Its premise is refreshingly ordinary by the standards of modern software, which is precisely the point. The data model is a set of Resources: modular, named, strongly typed objects like Patient, Observation, MedicationRequest, and Encounter, each representing one coherent concept. The interface is plain REST over HTTP — you GET a Patient, you POST an Observation — with payloads in either JSON or XML, and JSON is what most people use. And the guiding philosophy is the eighty-twenty rule: rather than trying to model every possible case up front like version three did, FHIR standardizes the roughly eighty percent of data elements that nearly everyone uses, and provides a disciplined extension mechanism for the long tail. Familiar technology, modest ambitions per resource, real escape hatches. That combination is what finally got traction.
:::

---
## FHIR maturity: where we are in 2026

<div class="viz wide">
<svg viewBox="0 0 1080 200">
<line class="axis" x1="60" y1="120" x2="1020" y2="120"/>
<circle class="node muted" cx="120" cy="120" r="10"/><text class="cap" x="120" y="100">DSTU1</text><text class="tag" x="120" y="150">2014</text>
<circle class="node muted" cx="280" cy="120" r="10"/><text class="cap" x="280" y="100">DSTU2</text><text class="tag" x="280" y="150">2015</text>
<circle class="node" cx="440" cy="120" r="10"/><text class="cap" x="440" y="100">STU3</text><text class="tag" x="440" y="150">2017</text>
<circle class="node accent" cx="600" cy="120" r="14"/><text class="cap" x="600" y="96">R4</text><text class="tag" x="600" y="150">2019 · the baseline</text>
<circle class="node good" cx="780" cy="120" r="12"/><text class="cap" x="780" y="100">R5</text><text class="tag" x="780" y="150">2023</text>
<circle class="node warn" cx="940" cy="120" r="10"/><text class="cap" x="940" y="100">R6</text><text class="tag" x="940" y="150">ballot</text>
</svg>
</div>

- **R4 (2019)** is the de-facto baseline — regulation points here; key parts are *Normative*
- **R5 (2023)** adds topic-based subscriptions, refines resources — adoption trails R4
- **R6** in ballot — not something to build on yet
- FHIR does **not** version as a monolith: each resource carries an **FMM** grade (0–5 + Normative)
- always check the maturity of the *specific* resource you depend on

::: narration
"Up to date" matters here, so let us place ourselves precisely on FHIR's timeline. The early drafts, D-S-T-U one and two, are historical. S-T-U three from twenty seventeen saw real pilots. Release four, from twenty nineteen, is the one that matters most: it is the de-facto baseline of the entire ecosystem, the version that government regulation points at, and the version most production systems run today — partly because key parts of it reached "Normative" status, meaning a stability commitment. Release five landed in twenty twenty-three, refining many resources and bringing a much better subscription model, but adoption trails R4 because the regulatory floor has not moved. Release six is in ballot as we speak and is not something to build on yet. One more thing to internalize: FHIR does not version as a monolith. Each resource carries a Maturity Model grade from zero to five, plus Normative, so within a single release some resources are rock-solid and others are still experimental. Always check the maturity of the specific resource you depend on.
:::

---
<!-- .slide: class="compact" -->
## Anatomy of a Resource

```json
{
  "resourceType": "Observation",
  "id": "bp-1",
  "status": "final",
  "code": { "coding": [{ "system": "http://loinc.org",
                          "code": "85354-9", "display": "Blood pressure" }] },
  "subject": { "reference": "Patient/100457" },
  "effectiveDateTime": "2026-06-18T09:30:00Z",
  "valueQuantity": { "value": 128, "unit": "mmHg",
                     "system": "http://unitsofmeasure.org", "code": "mm[Hg]" }
}
```

- every resource: `resourceType` · `id` · `meta` (version/profile) · optional `text` narrative
- typed fields; `status` from a fixed list; `code` as a coded concept → LOINC
- `subject` is a **reference** to another resource (the Patient) by relative URL
- `valueQuantity` carries the number **+ unit + UCUM code** → machine-comparable
- self-describing and legible to any web developer — the whole design thesis

::: narration
This is a FHIR resource in the flesh — an Observation recording a blood pressure. Notice the anatomy, because every resource shares it. There is a resourceType naming what this is, an id identifying this instance, and although not shown here, a meta block carrying versioning and profile information, plus an optional text element holding that human-readable narrative inherited in spirit from C-D-A. Then come the typed fields. status is a coded value from a fixed list. code says what was measured, expressed as a coded concept pointing at LOINC — the same code-text-system pattern we saw buried in version two, now first-class and explicit. subject is a reference to another resource, the Patient, by relative URL. And valueQuantity carries not just the number one hundred twenty-eight but its unit and the formal U-C-U-M code for millimeters of mercury, so the measurement is machine-comparable. Clean, self-describing, and immediately legible to any web developer — that legibility is the whole design thesis.
:::

---
<!-- .slide: class="compact" -->
## References and the resource graph

<div class="viz wide">
<svg viewBox="0 0 1080 280">
<defs><marker id="arrRef" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<circle class="node accent" cx="540" cy="60" r="40"/><text class="lbl on-fill" x="540" y="60">Patient</text>
<circle class="node" cx="240" cy="180" r="38"/><text class="lbl" x="240" y="180">Encounter</text>
<circle class="node" cx="480" cy="200" r="38"/><text class="lbl sm" x="480" y="200">Observation</text>
<circle class="node" cx="720" cy="200" r="38"/><text class="lbl sm" x="720" y="200">Condition</text>
<circle class="node" cx="930" cy="160" r="38"/><text class="lbl sm" x="930" y="160">Medication<tspan x="930" dy="16">Request</tspan></text>
<line class="edge" x1="270" y1="148" x2="510" y2="92" marker-end="url(#arrRef)"/>
<line class="edge" x1="490" y1="166" x2="525" y2="98" marker-end="url(#arrRef)"/>
<line class="edge" x1="710" y1="166" x2="560" y2="96" marker-end="url(#arrRef)"/>
<line class="edge" x1="905" y1="128" x2="575" y2="78" marker-end="url(#arrRef)"/>
<text class="cap" x="540" y="265">resources reference each other → a graph centered on the patient</text>
</svg>
</div>

- resources **reference** one another → a graph, not one giant nested document
- usually by URL (`Patient/100457`) → each resource stays small and independently retrievable
- **contained** (inline, no independent existence) vs **referenced** (by URL)
- the patient is the hub; the record is the web of resources pointing inward — why FHIR feels like the web

::: narration
The single most important structural idea in FHIR is that resources reference one another, forming a graph rather than one giant nested document. An Observation points at the Patient it concerns and the Encounter during which it was taken; a Condition points at the same Patient; a MedicationRequest points there too. The patient sits at the hub, and the clinical record is the web of resources pointing inward. References are usually by U-R-L — "Patient slash one hundred thousand four fifty-seven" — so each resource stays small and independently retrievable. When a fragment has no independent existence, like a one-off dosage detail, it can instead be contained, inlined directly inside its parent. This graph structure is what lets a client fetch exactly the slice it needs and assemble the rest on demand, and it is the deep reason FHIR feels like the web rather than like a document format.
:::

---
## Datatypes and the terminology binding

- primitives: `string`, `dateTime`, `boolean`, `decimal`, `uri` ...
- complex: `Quantity` (value+unit) · `Reference` (link) · `Period` · `HumanName`
- **CodeableConcept** = one or more codings (code + system) + free-text fallback
- the universal way to say "this field holds a concept from a controlled vocabulary"
- a field's **binding** = which value set, and how strictly (`required` → `example`)
- binding strength is where real-world interoperability is won or lost

::: narration
FHIR's types come in two layers. The primitives are unremarkable — strings, booleans, decimals, date-times, U-R-Is. The complex types are where the domain modeling lives, and a handful recur constantly: Quantity for a value-with-unit, Reference for a link, Period for a time span, HumanName for the genuinely hard problem of representing a person's name across cultures. But the most important complex type is CodeableConcept, which packages one or more codings — each a code plus the system it came from — together with a free-text fallback. It is the universal way FHIR says "this field holds a concept from a controlled vocabulary." And attached to each such field is a binding: a declaration of which value set of codes is permitted and how strictly, ranging from "required, you must use exactly these" down to "example, here is a suggestion." That binding strength is where a lot of real-world interoperability is won or lost, and it is the bridge to the terminology layer we will reach shortly.
:::

---
## The RESTful API

| verb | path | meaning |
|---|---|---|
| GET | `/Patient/100457` | read one resource |
| GET | `/Patient/100457/_history/2` | read a specific version |
| POST | `/Observation` | create |
| PUT | `/Patient/100457` | update |
| GET | `/Observation?subject=Patient/100457&code=85354-9` | search |

- resources are **web** resources: predictable URLs, HTTP verbs, ordinary status codes
- read · version-aware read (`vread`) · create · update · delete · search
- every change retained and addressable via `_history`; conditional create/update prevent duplicates
- the surface is deliberately *boring* — that's the feature

::: narration
Because resources are modeled as web resources, the API is exactly what a web developer would guess. To read a patient, you GET slash Patient slash their id. To read an earlier version of that patient, you GET the same path with underscore-history and a version number — every change is retained and addressable. You create with POST, update with PUT, and the server hands back ordinary HTTP status codes you already understand. Searching is just a GET with query parameters: give me the blood-pressure Observations for this patient, and you express it as subject equals the patient and code equals the LOINC code. There is genuine sophistication underneath — version-aware reads, full history, conditional creates and updates that prevent duplicates — but the surface is deliberately boring. That boringness is a feature. It means the millions of developers who already know HTTP do not have to learn a bespoke protocol to start moving health data.
:::

---
## Search: the part that gets deep

- typed search params per resource: `token` · `reference` · `date` · `quantity` · `string`
- modifiers & prefixes: `?date=ge2026-01-01` · `?name:contains=ann` · `?value=gt5`
- `_include` / `_revinclude` — pull referenced resources along in one round trip
- **chaining** across references: `?subject.name=Doe`
- paging for large result sets · `_filter` for complex boolean logic
- mastering search is most of mastering FHIR as a consumer

::: narration
Search is where FHIR's apparent simplicity reveals real depth, and it is worth a moment because it is where most of an integrator's time actually goes. Every resource defines a set of typed search parameters, each with rules appropriate to its type — a date parameter accepts prefixes like "greater-than-or-equal," a quantity parameter understands units and comparisons, a string parameter supports modifiers like "contains" or "exact." Because the data is a graph, plain filtering is not enough, so FHIR adds underscore-include and underscore-revinclude to pull referenced resources along in a single round trip — fetch the Observations and their Patient together — and chaining, which lets you filter across a reference, like all Observations whose subject's name is Doe. There is paging for large result sets and an underscore-filter parameter for genuinely complex boolean logic. Mastering search is most of mastering FHIR as a consumer, and it rewards study far more than the basic CRUD does.
:::

---
## Bundles: many resources, one payload

<div class="viz narrow">
<svg viewBox="0 0 560 250">
<rect class="node muted" x="160" y="20" width="240" height="210" rx="10"/>
<text class="cap" x="280" y="44">Bundle</text>
<rect class="node accent" x="190" y="60" width="180" height="34" rx="5"/><text class="lbl on-fill" x="280" y="77">Patient</text>
<rect class="node" x="190" y="104" width="180" height="34" rx="5"/><text class="lbl" x="280" y="121">Observation</text>
<rect class="node" x="190" y="148" width="180" height="34" rx="5"/><text class="lbl" x="280" y="165">Observation</text>
<rect class="node good" x="190" y="192" width="180" height="34" rx="5"/><text class="lbl" x="280" y="209">Condition</text>
</svg>
</div>

- a container resource holding many resources; the `type` field sets its meaning:
- **searchset** (a page of results) · **transaction** (atomic write) · **batch** (non-atomic)
- **document** — a frozen, self-contained unit (FHIR's answer to CDA)
- **message** — resources wrapped for v2-style event messaging

::: narration
Often you need to move many resources together, and the container for that is the Bundle — itself a resource, holding a list of others. The Bundle's type field changes its meaning entirely. A searchset Bundle is what a search returns: a page of matching resources plus links to the next page. A transaction Bundle is an atomic write — the server applies every entry or none, giving you all-or-nothing semantics across multiple resources, which matters when a clinical fact spans several of them. A batch Bundle is the same idea without the atomicity. A document Bundle freezes a set of resources into a signed, persistent unit — this is how FHIR reconstructs C-D-A's document concept on top of resources. And a message Bundle wraps resources for event-driven, version-two-style messaging. So one container type quietly spans bulk reads, atomic writes, documents, and messaging, depending on a single field.
:::

---
## Profiling and conformance

- base resources are deliberately loose — one `Patient` must fit the whole world
- a **profile** (`StructureDefinition`) constrains the base: required fields, narrower cardinality, fixed value sets
- an **Implementation Guide** bundles profiles + value sets + narrative rules — versioned, publishable
- a server's **CapabilityStatement** declares which resources, operations & search params it supports
- the decisive difference from v2: conformance is now **specifiable and testable**

::: narration
Here FHIR confronts the exact problem that sank version two — too much optionality — but with a tool version two lacked. The base resources are intentionally permissive, because a single Patient resource has to fit every country, payer, and care setting on the planet. You make them useful for a specific context by writing a profile, formally a StructureDefinition, which constrains the base: marking fields required, narrowing cardinalities, binding a field to a specific value set, forbidding what does not apply. Profiles are bundled, along with the value sets and narrative rules they depend on, into an Implementation Guide — a publishable, versioned package that defines interoperability for one domain or jurisdiction. And every FHIR server publishes a CapabilityStatement, a machine-readable declaration of which resources, operations, and search parameters it actually supports. The difference from version two is decisive: conformance is now something you can specify precisely and test against automatically, rather than discover by trial and error.
:::

---
## Extensions done right

```json
"extension": [{
  "url": "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
  "valueAddress": { "city": "Chicago", "country": "US" }
}]
```

- the disciplined **escape valve** for the 20% not in the base resource
- any resource or element can carry extensions
- each is identified by a **URL** that resolves to a formal definition: meaning + exact datatype
- because the definition is machine-readable, an extension **validates** like a core field
- same impulse as v2's Z-segments, but a stranger's software can actually understand it

::: narration
The eighty-twenty philosophy only works if there is a disciplined way to handle the other twenty percent, and that is the extension. Any resource or element can carry extensions, but unlike version two's anonymous Z-segments, a FHIR extension is not a free-for-all. Each one is identified by a U-R-L that resolves to a formal definition stating what the extension means and exactly which datatype its value must be. Here, a patient's birthplace — not a field in the base Patient resource — is added as an extension whose U-R-L points at its published definition and whose value is a structured Address. Because the definition is machine-readable, an extension can be validated just like a core field, and any system that recognizes the U-R-L knows precisely how to interpret it. This is the same impulse as version two's Z-segments — handle the local need the standard did not anticipate — but disciplined into something a stranger's software can actually understand. It is one of FHIR's quietest but most important design wins.
:::

---
## Operations: the RPC escape hatch

- REST covers CRUD beautifully; some things just aren't shaped like CRUD
- **operations** = named RPC endpoints layered onto REST, prefixed `$`
- `$everything` — a patient's entire record in one Bundle
- `$expand` — compute a value set's full membership · `$validate` — check against a profile
- `$lookup` — a code's details · `$match` — probabilistic patient identity matching
- the pragmatic admission that not everything is CRUD

::: narration
REST handles creating, reading, updating, and deleting beautifully, but some operations simply are not shaped like manipulating a single resource, and forcing them into REST would be a contortion. For those, FHIR provides operations — named, dollar-sign-prefixed endpoints that are really remote procedure calls layered onto the RESTful API. Patient-slash-id-slash-dollar-everything returns a patient's entire record in one Bundle, something no single GET expresses. ValueSet-dollar-expand asks a terminology server to compute the full list of codes a value set contains. Dollar-validate checks a resource against a profile. Dollar-lookup retrieves the details of a code, and dollar-match runs probabilistic patient identity matching. Operations are the pragmatic acknowledgment that not everything is C-R-U-D, and rather than pretend otherwise, FHIR gives the non-C-R-U-D work a clean, consistent, discoverable home. You will reach for them more often than the purist in you expects.
:::

---
## SMART on FHIR: apps that plug into the EHR

<div class="viz wide">
<svg viewBox="0 0 1080 260">
<defs><marker id="arrSm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#1A3F70"/></marker></defs>
<rect class="node" x="40" y="100" width="150" height="60" rx="7"/><text class="lbl" x="115" y="130">3rd-party app</text>
<rect class="node accent" x="320" y="100" width="170" height="60" rx="8"/><text class="lbl on-fill" x="405" y="124">Authorization</text><text class="cap" x="405" y="146" fill="#DCE6F1">OAuth2 / OIDC</text>
<rect class="node good" x="640" y="100" width="170" height="60" rx="8"/><text class="lbl" x="725" y="130">FHIR server</text>
<rect class="node muted" x="900" y="100" width="150" height="60" rx="7"/><text class="lbl" x="975" y="130">EHR data</text>
<line class="edge accent" x1="190" y1="130" x2="320" y2="130" marker-end="url(#arrSm)"/><text class="cap" x="255" y="116">launch</text>
<line class="edge" x1="490" y1="130" x2="640" y2="130" marker-end="url(#arrSm)"/><text class="cap" x="565" y="116">access token + scopes</text>
<line class="edge" x1="810" y1="130" x2="900" y2="130" marker-end="url(#arrSm)"/>
<text class="cap" x="540" y="210">one app, written once, runs against any conformant EHR</text>
</svg>
</div>

- **OAuth2 + OpenID Connect** layered on FHIR — the standard authz for third-party apps
- write to the SMART spec **once** → the app runs against any conformant EHR
- **EHR launch** (opened in the chart, context flows automatically) vs **standalone launch**
- the app receives an **access token + scopes** bounding what it may read/write
- **App Launch 2.x** is current — the foundation of the clinical app ecosystem

::: narration
A bare FHIR server answers the question "how do I get the data," but not "how does a third-party app get permission to, on behalf of this clinician and for this patient, securely." SMART on FHIR answers that by layering the established web standards OAuth two and OpenID Connect on top of FHIR. The payoff is enormous: an app developer writes against the SMART specification once, and the app can then launch inside any conformant electronic health record. There are two launch flows. In an E-H-R launch, the clinician opens the app from within a patient's chart and the context — which patient, which encounter — flows automatically to the app. In a standalone launch, the user starts at the app and selects context themselves. Either way the app receives an access token carrying a set of scopes that bound exactly what it may read or write. The current generation is App Launch two-point-x, and it is the foundation of the entire third-party clinical app ecosystem.
:::

---
## SMART scopes v2

- a scope names a **context · resource type · permissions**
- v1 was coarse: `patient/Observation.read`, `user/*.read`
- v2 verbs are finer — `c`/`r`/`u`/`d`/`s` (e.g. `.rs` = read + search, no delete)
- **granular scopes** carry a query: `patient/Observation.rs?category=laboratory` → labs only
- `fhirContext` passes richer launch context — including *which imaging study is open*
- how an imaging app gets exactly the slice it needs, nothing more

::: narration
The scopes are worth one more slide, because they are how the principle of least privilege actually gets enforced against health data. A scope names a context, a resource type, and a set of permissions. The first generation was coarse: "patient slash Observation dot read" meant the app could read every Observation for the patient in context, and "user slash star" meant everything the logged-in user could see. Scopes version two refined this in two ways. The verbs became finer-grained — separate flags for create, read, update, delete, and search, so an app can be granted search without delete. And critically, scopes became granular, able to carry a query that narrows them: "patient slash Observation, read and search, where category equals laboratory" grants access to lab results only, not the patient's every recorded observation. Alongside this, a fhirContext mechanism lets the launch pass richer context than just the patient — including, relevant to us, which imaging study is open. Granular scopes are how an imaging app can be given exactly the slice it needs and nothing more.
:::

---
<!-- .slide: class="compact" -->
## CDS Hooks: decision support at the point of care

<div class="viz wide">
<svg viewBox="0 0 1080 220">
<defs><marker id="arrCds" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<rect class="node accent" x="60" y="80" width="180" height="60" rx="8"/><text class="lbl on-fill" x="150" y="104">EHR</text><text class="cap" x="150" y="126" fill="#DCE6F1">clinician acts</text>
<rect class="node" x="450" y="80" width="180" height="60" rx="8"/><text class="lbl" x="540" y="110">CDS service</text>
<rect class="node good" x="840" y="80" width="180" height="60" rx="8"/><text class="lbl" x="930" y="104">cards</text><text class="cap" x="930" y="126">advice · links · actions</text>
<line class="edge" x1="240" y1="100" x2="450" y2="100" marker-end="url(#arrCds)"/><text class="cap" x="345" y="86">hook fires</text>
<line class="edge good" x1="630" y1="120" x2="840" y2="120" marker-end="url(#arrCds)"/><text class="cap" x="735" y="148">returns</text>
</svg>
</div>

- lighter than launching a whole app — intelligence woven into the workflow
- a **hook** fires on a workflow event: `patient-view` (chart opened), `order-select` (med chosen)
- the EHR calls out to external decision-support service(s) with context
- each returns **cards**: a warning, a guideline reminder, a relevant cost, a one-click suggestion
- knowledge lives in an external, independently-maintained service — the EHR just renders cards

::: narration
SMART on FHIR launches whole applications, but sometimes you want lighter-weight intelligence woven directly into the clinician's workflow, surfacing exactly when a decision is being made. That is CDS Hooks. The model is event-driven: the electronic health record exposes named hooks for moments in the workflow — the clinician opens a chart, that is patient-view; the clinician selects a medication to order, that is order-select. When a hook fires, the E-H-R calls out to one or more external decision-support services, passing relevant context. Each service responds with cards: small, structured pieces of guidance — a warning about a drug interaction, a reminder of a guideline, a relevant cost, sometimes a one-click suggestion the clinician can accept to modify the order directly. It is a clean separation: the knowledge lives in an external, independently maintained service, while the E-H-R just renders cards at the right moment. For getting current medical knowledge to the bedside without rebuilding the E-H-R, it is the standard mechanism.
:::

---
## Bulk Data: FHIR at population scale

```
GET [base]/Group/[id]/$export?_type=Patient,Observation
  → 202 Accepted, Content-Location: <status URL>
  → poll → NDJSON files, one resource per line
```

- the REST API is per-resource; research & analytics need **millions** at once
- a.k.a. **Flat FHIR** — `$export` against a whole `Group`
- async: `202 Accepted` → poll a status URL → server assembles in the background
- result: **NDJSON** files (one resource per line) — ideal for streaming into a warehouse
- **SMART Backend Services** auth: app authenticates as itself, no human in the loop
- underpins modern research pipelines *and* regulatory reporting

::: narration
The RESTful API is perfect for the interactive case — one clinician, one patient, a handful of resources. It is hopeless for the analytic case — give me every lab result for two hundred thousand patients to train a model or report to a public-health agency. Fetching those one resource at a time would melt the server. The answer is the Bulk Data specification, sometimes called Flat FHIR. You issue a dollar-export against a whole group of patients, the server returns immediately with "two-oh-two accepted" and a status U-R-L, you poll that U-R-L while the server assembles the data in the background, and you are finally handed a set of N-D-J-S-O-N files — newline-delimited JSON, one resource per line — ideal for streaming into a data warehouse. Because no human is sitting in the loop, authorization uses the SMART Backend Services flow: the app authenticates as itself with a signed assertion, no interactive login. Bulk Data is how FHIR reaches population scale, and it underpins both modern research pipelines and a growing body of regulatory reporting.
:::

---
## Subscriptions: push instead of poll

- by default FHIR is **pull**: a client asks, the server answers
- the old subscription mechanism was limited and awkward
- **R5 topic-based** is the one to learn — the release genuinely matters here
- `SubscriptionTopic` (server-defined) = *what* event fires · `Subscription` = a client's standing request
- delivered over a **channel**: REST-hook (HTTP callback), websocket, email
- topic/subscription split: the server optimizes events; many clients share a topic

::: narration
By default FHIR is pull: a client asks, the server answers. But many workflows need the opposite — tell me the moment a new result arrives, rather than having me poll every thirty seconds forever. Subscriptions provide that push, and this is an area where the release you target genuinely matters. The older mechanism was limited and awkward. Release five introduced a cleaner, topic-based model that is the right one to learn. A SubscriptionTopic is a server-defined definition of an event worth subscribing to — say, "a new final lab result for a patient." A Subscription is a client's standing request to be notified when that topic fires, delivered over a channel the client chooses: an H-T-T-P callback, a websocket, even email. The separation of topic from subscription is the key improvement: the server controls and optimizes what events exist, while many clients can subscribe to the same well-defined topic. For event-driven integrations, this is FHIR finally doing what the old version-two A-D-T feed did, but over modern transports.
:::

---
## US Core, USCDI, and Implementation Guides

- two conformant servers can still model the same fact differently — IGs close that gap
- **USCDI**: the government-maintained list of *data elements* every certified system must exchange (v4/v5 current)
- **US Core**: the FHIR IG that says *how* — the exact profiles, value sets, required search params
- USCDI = **what data**; US Core = **how, in FHIR** — not optional for the US market
- mirrored globally: AU Base, UK Core, and many national cores adapting base FHIR to local law

::: narration
A bare FHIR server is necessary but not sufficient for real-world interoperability, because two conformant servers can still model the same fact differently. Implementation Guides close that gap, and in the United States the load-bearing one is US Core. To understand it you need its partner, the United States Core Data for Interoperability, U-S-C-D-I: a government-maintained list of the specific data elements every certified system must be able to exchange — patient demographics, problems, medications, allergies, lab results, and steadily more, growing version by version with versions four and five current. U-S-C-D-I says what data; US Core says how, in FHIR — it is the Implementation Guide that pins down the exact profiles, value sets, and required search parameters that make U-S-C-D-I actually exchangeable. If you build clinical software for the U-S market, US Core is not optional, it is the floor you build on. And the pattern is global: Australia, the U-K, and many others maintain their own national core guides, each adapting base FHIR to local law and terminology.
:::

---
## IPS: the international patient summary

- a standardized, **cross-border** summary of a patient
- minimal but clinically sufficient: problems, meds, allergies, results, immunizations
- designed for **unplanned & cross-border care** — leans on international (not national) codes
- a FHIR **document** Bundle (with a parallel CDA representation)
- the **"unconscious tourist"**: the irreducible facts a stranger's ED would need, readable anywhere

::: narration
National guides solve interoperability within a country, but people travel, and a patient who collapses abroad needs their essential history available to clinicians who use a different language, a different system, and different national codes. The International Patient Summary, I-P-S, is the standardized answer. It defines a minimal but clinically sufficient summary — active problems, current medications, allergies, key results, immunizations — designed specifically for unplanned and cross-border care. It is built as a FHIR document Bundle, that frozen, self-contained form of FHIR we met earlier, with a parallel C-D-A representation for systems still in that world, and it leans hard on international rather than national terminologies so it can be understood anywhere. The guiding scenario, often called the unconscious-tourist case, is a good one to hold in mind: what is the irreducible set of facts a stranger's emergency department would need, expressed so that any conformant system on earth can read it. I-P-S is that set.
:::

---
## When you still reach for v2 or CDA

| need | reach for |
|---|---|
| real-time ADT, orders, results inside a hospital | **HL7 v2** |
| a signed, persistent clinical document | **CDA / FHIR document** |
| modern app, API, mobile, analytics | **FHIR** |
| population export | **FHIR Bulk Data** |

- FHIR is winning, but it has *not* replaced the others — they run side by side
- the honest picture: a **v2 backbone** underneath, **C-CDA** for records exchange, a **FHIR surface** on top
- knowing which tool fits which job beats betting everything on the newest one

::: narration
It would be a mistake to leave this part thinking FHIR has swept the others away. It has not, and a seasoned integrator runs all of them simultaneously. For high-volume, real-time messaging inside a hospital's four walls — admissions, orders, results — version two is still the incumbent and will be for years, because it works and ripping it out has no business case. For a signed, legally persistent clinical document, you reach for C-D-A or a FHIR document Bundle. FHIR is the right choice for anything new and outward-facing: APIs, mobile apps, patient access, analytics, and the regulatory mandates increasingly require it. And for moving populations of data, FHIR Bulk Data. The honest picture of a modern health system is a layered one: a version-two backbone humming underneath, C-C-D-A documents flowing for exchange and records requests, and a growing FHIR surface on top exposed to apps and partners. Knowing which tool fits which job is more valuable than betting everything on the newest one.
:::

---
## Why codes matter: the semantic layer

- syntax gets two systems to *parse* the same message — the easy 90%
- **semantics** gets them to *mean* the same thing — the brutal 10%
- "sodium" — serum or urine? which method? which units? which reference range?
- a human resolves it from context; software cannot, unless meaning is **explicit**
- controlled vocabularies assign each concept a precise, unambiguous **code**
- without that layer, all the structure degenerates into well-formatted strings

::: narration
We have repeatedly bumped into coded concepts, and now we confront them directly, because this is where interoperability is actually hard. Agreeing on syntax — the shape of a message — is the easy ninety percent. The brutal ten percent is semantics: getting two systems to mean the same thing by the same data. Consider the word "sodium." Is it sodium in blood serum or in urine? Measured by which method? Reported in which units, against which reference range? A human clinician resolves this instantly from context; software cannot, unless the meaning is carried explicitly. That is the entire job of the terminology layer. Shared, controlled vocabularies assign a precise, unambiguous code to each clinical concept, so that "sodium" becomes a specific identifier that means exactly one thing everywhere it appears. Without that layer, all the beautiful structure of FHIR or version two degenerates into well-formatted strings that no two systems can safely compare. The codes are not a detail; they are the substance.
:::

---
## The big code systems

| system | domain |
|---|---|
| **SNOMED CT** | clinical concepts: diagnoses, findings, procedures |
| **LOINC** | lab tests & observations: what was measured |
| **ICD-10 / ICD-11** | diagnoses for billing & statistics |
| **RxNorm** | medications (US) |
| **UCUM** | units of measure |
| **CPT** | procedures for billing (US) |

- **SNOMED** = clinical meaning · **ICD** = billing/statistics — often the *same fact* carries both
- a recurring subtlety: different consumers need different lenses on one observation

::: narration
A handful of vocabularies carry most of the weight, and knowing which does what is essential literacy. SNOMED C-T is the giant — a richly structured ontology of clinical concepts, hundreds of thousands of them, covering diagnoses, findings, procedures, and their relationships; it is the vocabulary for saying what is clinically true about a patient. LOINC names observations and lab tests — it answers "what was measured," which is exactly the ambiguity in our sodium example. I-C-D, in its tenth and now eleventh revisions, codes diagnoses primarily for billing and national statistics, a coarser and more administrative lens than SNOMED. RxNorm normalizes medications in the U-S. U-C-U-M, the Unified Code for Units of Measure, gives units a computable form so "millimeters of mercury" is a code, not a guess. And C-P-T codes procedures for U-S billing. A recurring subtlety: the same clinical fact often carries several codes at once — a SNOMED concept for clinical meaning and an I-C-D code for billing — because different consumers need different lenses on it.
:::

---
<!-- .slide: class="compact" -->
## Value sets and the terminology server

<div class="viz wide">
<svg viewBox="0 0 1080 220">
<defs><marker id="arrTx" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<rect class="node muted" x="40" y="70" width="200" height="80" rx="8"/><text class="lbl" x="140" y="100">code systems</text><text class="cap" x="140" y="124">SNOMED · LOINC · ICD</text>
<rect class="node accent" x="340" y="60" width="180" height="100" rx="8"/><text class="lbl on-fill" x="430" y="96">ValueSet</text><text class="cap" x="430" y="120" fill="#DCE6F1">a chosen subset</text>
<rect class="node good" x="640" y="70" width="200" height="80" rx="8"/><text class="lbl" x="740" y="100">terminology server</text>
<rect class="node" x="920" y="70" width="130" height="80" rx="8"/><text class="lbl sm" x="985" y="100">$expand</text><text class="lbl sm" x="985" y="124">$validate</text>
<line class="edge" x1="240" y1="110" x2="340" y2="110" marker-end="url(#arrTx)"/>
<line class="edge" x1="520" y1="110" x2="640" y2="110" marker-end="url(#arrTx)"/>
<line class="edge" x1="840" y1="110" x2="920" y2="110" marker-end="url(#arrTx)"/>
</svg>
</div>

- a **CodeSystem** is the vocabulary itself (all of LOINC, with meanings)
- a **ValueSet** is a curated subset for a purpose — fields bind to *value sets*, not whole systems
- a **terminology server** answers live: `$expand` (full membership) · `$validate-code` · `$translate`
- these vocabularies are huge, hierarchical, versioned → **query at runtime**, don't embed
- treating terminology as an external **service** is a mark of having actually built FHIR systems

::: narration
Two FHIR concepts operationalize all this. A CodeSystem is the vocabulary itself — the full set of LOINC codes, say, with their meanings. A ValueSet is a curated selection drawn from one or more code systems for a particular purpose: "the codes allowed in this field," "the value set of acceptable specimen types." Resource fields bind to value sets, not to whole code systems, which is how a field can permit exactly the right concepts and no others. The crucial insight for a builder is that terminology is a service, not a static table you ship and forget. A terminology server answers live operations: dollar-expand computes the full membership of a value set, including everything implied by SNOMED's hierarchy; dollar-validate-code checks whether a given code is permitted; dollar-translate maps a code from one system to another. These vocabularies are huge, hierarchical, and versioned, so you query them at runtime rather than embedding them. Treating terminology as an external service you call is one of the marks of someone who has actually built FHIR systems rather than just read about them.
:::

---
## IHE: profiles that wire the standards together

- standards leave too many options; two conformant systems still can't connect → **IHE** removes the choices
- **IHE** = Integrating the Healthcare Enterprise — it doesn't invent standards, it *combines* them
- an **Integration Profile** names the **actors**, the **transactions**, and exactly which options to use
- **XDS** — registry/repository for cross-enterprise document sharing (e.g. C-CDA)
- **PIX/PDQ** — match a patient's many identifiers across systems · **XCA** — sharing across regions
- the unglamorous connective tissue that turns standards into deployed networks

::: narration
There is a gap between a standard and a working system, and it is exactly the gap version two fell into: a standard offers so many options that two conformant implementations still cannot connect. Integrating the Healthcare Enterprise, I-H-E, exists to close that gap. I-H-E does not invent new standards; it writes integration profiles that nail down precisely how existing standards — HL7, DICOM, and others — combine to solve a concrete real-world problem. A profile names the actors, the transactions between them, and exactly which options of which standards to use, removing the optionality that kills interoperability. The foundational ones to know: X-D-S, Cross-Enterprise Document Sharing, defines a registry-and-repository architecture for sharing documents like C-C-D-As across organizations. P-I-X and P-D-Q handle the perennial problem of matching a patient's many identifiers across systems. And X-C-A extends sharing across whole communities and regions. I-H-E is the unglamorous connective tissue that turns standards into deployed networks.
:::

---
## IHE in imaging: the workflow profiles

- **SWF** (Scheduled Workflow): order → worklist → acquire → store → report
- choreographs HL7 v2 *and* DICOM into one defined dance
- domain-specific profiles incl. **Echo (ECHO)** & **OB/GYN ultrasound**
- **MHD** — the XDS document-sharing model, re-expressed over a **FHIR API**
- where HL7 and DICOM are formally stitched together

::: narration
Several I-H-E profiles matter specifically for imaging, and they are where the HL7 and DICOM worlds get explicitly stitched together rather than just coexisting. The Scheduled Workflow profile choreographs the entire radiology pipeline: an order placed in the hospital system flows to a modality worklist, the device acquires the images, stores them to the archive, and the report flows back — coordinating version-two messages and DICOM transactions in one defined dance. For our purposes, note that I-H-E publishes domain-specific workflow profiles, including ones for echocardiography and for obstetric and gynecologic ultrasound, that adapt this choreography to those specialties' particular acquisition and reporting needs. And a newer profile, M-H-D, Mobile access to Health Documents, re-expresses the old X-D-S document-sharing model over a FHIR API — a concrete example of the whole field's drift toward FHIR as the common surface. I-H-E is, in effect, the place the two lineages we started with are formally introduced to each other.
:::

---
## DICOM: not just a file format

- **D**igital **I**maging and **Co**mmunications in **M**edicine
- **four things at once**: data model + file format + network protocol + workflow
- the `.dcm` file is the *least* of it — historically an afterthought
- governs the whole chain: scanner → archive (PACS/VNA) → viewer → report
- ~20+ parts, revised by **supplements** — how it keeps absorbing new modalities

::: narration
Now we cross the seam into imaging, and the first thing to unlearn is the idea that DICOM is merely a file format. People meet DICOM as a dot-d-c-m file and assume that is the whole story; it is a small fraction of it. DICOM — Digital Imaging and Communications in Medicine — is simultaneously a data model for what an image and its context are, a file format for storing them, a network protocol for moving them between devices, and a workflow model for the imaging process itself. It governs the entire chain: the scanner that acquires, the archive that stores, the workstation that displays, and the system that reports. It is a sprawling standard of more than twenty parts, continuously revised through supplements rather than big-bang releases, which is how it keeps absorbing new modalities and techniques. Understanding DICOM means understanding four things at once — a model, a file, a protocol, and a workflow — and the file is the least of them. For an ultrasound engineer it is the substrate beneath everything you build.
:::

---
<!-- .slide: class="compact" -->
## The DICOM information model

<div class="viz">
<svg viewBox="0 0 560 280">
<line class="edge" x1="280" y1="58" x2="280" y2="92"/>
<line class="edge" x1="280" y1="134" x2="180" y2="168"/>
<line class="edge" x1="280" y1="134" x2="380" y2="168"/>
<line class="edge" x1="180" y1="210" x2="140" y2="244"/>
<line class="edge" x1="180" y1="210" x2="220" y2="244"/>
<line class="edge" x1="380" y1="210" x2="380" y2="244"/>
<rect class="node accent" x="200" y="22" width="160" height="40" rx="6"/><text class="lbl on-fill" x="280" y="42">Patient</text>
<rect class="node" x="200" y="96" width="160" height="40" rx="6"/><text class="lbl" x="280" y="116">Study</text>
<rect class="node" x="110" y="172" width="140" height="40" rx="6"/><text class="lbl" x="180" y="192">Series</text>
<rect class="node" x="310" y="172" width="140" height="40" rx="6"/><text class="lbl" x="380" y="192">Series</text>
<rect class="node muted" x="96" y="246" width="88" height="34" rx="5"/><text class="lbl sm" x="140" y="263">Instance</text>
<rect class="node muted" x="190" y="246" width="88" height="34" rx="5"/><text class="lbl sm" x="234" y="263">Instance</text>
<rect class="node muted" x="336" y="246" width="88" height="34" rx="5"/><text class="lbl sm" x="380" y="263">Instance</text>
</svg>
</div>

- **Patient → Study → Series → Instance** — every query and viewer is organized around it
- **Study** = one imaging exam (one visit to the US suite, one CT pass)
- **Series** = one coherent acquisition within it (one probe + preset; one MR sequence)
- **Instance** = the atomic stored object: an image, a cine loop, an SR, a segmentation
- each level carries its own **UID** — "three series, forty instances" now has a precise shape

::: narration
At DICOM's core is a four-level hierarchy that you must internalize, because every query, every storage operation, every viewer is organized around it. At the top is the Patient. A patient has Studies, where a Study is one imaging exam — one visit to the ultrasound suite, one trip through the C-T scanner. A study contains Series, where a Series is one coherent acquisition within the exam — in ultrasound, perhaps one probe and preset producing a set of related captures; in M-R, one pulse sequence. And a series contains Instances, where an instance is the atomic stored object: classically a single image, but just as often a multi-frame cine loop, a structured report, or a segmentation. Patient, Study, Series, Instance — four levels, each with its own unique identifier. When you hear someone say a study "has three series and forty instances," you now know exactly the shape they are describing, and this hierarchy is the spine of everything DICOM does.
:::

---
## IODs, SOP Classes, and SOP Instances

- **IOD** (Information Object Definition): the *schema* — what attributes a kind of object must/may have
- there's an IOD for *US Image*, *US Multi-frame Image*, *SR*, *Segmentation* ...
- **SOP Class**: an IOD + the services allowed on it (store, query, retrieve) — each with a UID
- devices declare what they handle by **listing SOP Classes**
- **SOP Instance**: one concrete object, with its own globally unique UID
- the model always tracks: a **real-world thing** ⇄ its **faithful data representation**

::: narration
DICOM's object model has its own vocabulary, and three terms unlock it. An Information Object Definition, or I-O-D, is a schema — it defines exactly what attributes a particular kind of object must and may have. There is an I-O-D for an Ultrasound Image, another for an Ultrasound Multi-frame Image, another for a structured report, and so on. A Service-Object Pair Class, almost always shortened to SOP Class, marries an I-O-D to the set of services you can perform on it — storing it, querying it, retrieving it. Each SOP Class has a unique identifier, and when a device says what it can handle, it does so by listing SOP Classes. Finally, a SOP Instance is one concrete object — one actual ultrasound image with its own globally unique identifier. The relationship the model is always tracking is the one between a real-world thing, like the image a sonographer just captured, and its faithful data representation. Schema, schema-plus-services, and a concrete instance: I-O-D, SOP Class, SOP Instance.
:::

---
## The data set: elements, tags, and VRs

```
(0010,0010) PN  "DOE^JANE^A"         # Patient's Name
(0010,0020) LO  "100457"             # Patient ID
(0008,0060) CS  "US"                 # Modality = Ultrasound
(0020,000D) UI  "1.2.840...4567"     # Study Instance UID
(7FE0,0010) OW  <pixel data>         # the actual pixels
```

- a DICOM object = a **flat list of data elements** (much like a v2 message in spirit)
- each element: **tag** `(group,element)` · **VR** (2-letter type) · value
- the **tag** is the key; the **data dictionary** fixes its meaning for every vendor
- VRs: `PN` person name · `CS` coded string · `UI` unique id · `OW` pixel words
- the pixels `(7FE0,0010)` are just **one more element** in the same list as the patient's name

::: narration
Open up a DICOM object and you find something strikingly similar in spirit to a version-two message: a flat list of data elements. Each element has three parts. First, a tag — a pair of hexadecimal numbers, a group and an element, like zero-zero-ten comma zero-zero-ten for the patient's name. The tag is the key, and the standard's data dictionary assigns a fixed meaning to every standard tag, so any DICOM system knows that tag means "patient's name" regardless of vendor. Second, a Value Representation, or V-R — a two-letter code giving the data type: P-N for a person name, C-S for a coded string, U-I for a unique identifier, O-W for the words of pixel data. Third, the value itself. Notice the last element here, tag seven-F-E-zero comma zero-zero-ten: that is the pixel data, the actual image, sitting as just one more element in the same flat list as the patient's name. Everything — identity, acquisition settings, and pixels alike — lives in this one uniform structure of tag, type, value.
:::

---
## Transfer syntaxes: how the bytes are encoded

| concern | options |
|---|---|
| VR encoding | explicit VR · implicit VR |
| byte order | little-endian · big-endian |
| pixel compression | uncompressed · JPEG · JPEG 2000 · JPEG-LS · RLE · **HTJ2K** |

- a **transfer syntax** = a UID naming exactly one encoding (VR mode + byte order + pixel compression)
- negotiated between two systems **before** any transfer; both must support it
- HTJ2K (high-throughput JPEG 2000) is increasingly important for web delivery
- **lossless vs lossy is a clinical decision**, not a formatting footnote
- which transfer syntaxes a device offers is real engineering — esp. for ultrasound cine

::: narration
A DICOM object's abstract content is one thing; how its bytes are actually laid out is another, and that is the transfer syntax. A transfer syntax is a unique identifier that names exactly one encoding, pinning down three choices. First, whether each element carries its V-R explicitly on the wire or leaves it implicit to be looked up in the dictionary. Second, the byte order, little-endian or the now-rare big-endian. Third, and most consequential, how the pixel data is compressed: not at all, or with one of several schemes — baseline and lossless JPEG, JPEG two-thousand, JPEG-L-S, simple run-length encoding, and the newer high-throughput JPEG two-thousand, H-T-J-2-K, increasingly important for web delivery. Before any two systems exchange an object they negotiate a transfer syntax both support. The lossless-versus-lossy distinction is not academic for you: compressing an ultrasound cine with a lossy scheme trades storage and bandwidth against diagnostic fidelity, and which transfer syntaxes a device offers is a real clinical and engineering decision, not a formatting footnote.
:::

---
## Pixel data and how an image is described

- pixels are raw numbers; a cluster of tags tells you how to read them
- `Rows`/`Columns` (size) · `Bits Stored` (depth) · `Samples Per Pixel` (gray vs color)
- **Photometric Interpretation** = the color model: `MONOCHROME2` · `RGB` · **`YBR_FULL_422`**
- get it wrong → inverted grayscale or garbled color
- **windowing** (center/width) maps stored values → display brightness
- `YBR` matters for ultrasound — back to it shortly

::: narration
The pixel data element holds raw numbers; on their own they are meaningless, and a cluster of accompanying tags tells you how to turn them into a picture. The dimensions come from Rows and Columns. Bits Allocated and Bits Stored say how big each pixel value is. Samples Per Pixel distinguishes grayscale from color. The pivotal tag is Photometric Interpretation, which declares the color model: MONOCHROME2 for ordinary grayscale where higher means brighter, R-G-B for full color, PALETTE_COLOR for indexed color, and — importantly for ultrasound — Y-B-R variants like Y-B-R-FULL-four-twenty-two, a luminance-chrominance encoding that ultrasound and other video-derived modalities use heavily. Get the photometric interpretation wrong and your grayscale renders inverted or your color comes out garbled. Finally, for grayscale images, Window Center and Window Width define the contrast mapping from stored values to display brightness — the digital equivalent of the knobs that decide which slice of the value range you actually see. We will return to ultrasound's particular use of these very shortly.
:::

---
## The Part 10 file: the "DICOM file" you actually see

<div class="viz wide">
<svg viewBox="0 0 1080 180">
<rect class="node muted" x="40" y="60" width="170" height="60" rx="6"/><text class="lbl sm" x="125" y="84">128-byte</text><text class="lbl sm" x="125" y="104">preamble</text>
<rect class="node" x="220" y="60" width="120" height="60" rx="6"/><text class="lbl sm" x="280" y="90">"DICM"</text>
<rect class="node accent" x="350" y="60" width="260" height="60" rx="6"/><text class="lbl on-fill" x="480" y="84">File Meta Info</text><text class="cap" x="480" y="104" fill="#DCE6F1">transfer syntax, SOP class UID</text>
<rect class="node good" x="620" y="60" width="420" height="60" rx="6"/><text class="lbl" x="830" y="84">Data Set</text><text class="cap" x="830" y="104">all the elements + pixel data</text>
</svg>
</div>

- **128-byte preamble** (often zeros) + magic `"DICM"` + **File Meta Info** + **Data Set**
- the meta header declares the **transfer syntax** + SOP Class/instance UIDs of the rest
- the data set is that flat list of elements, ending in pixel data
- the file is essentially a way to write *one transferred object* to disk
- the saying: **"DICOM is a network protocol that happens to have a file format"** — so, the network

::: narration
The thing most people call "a DICOM file" is defined by Part ten of the standard, and its structure is simple once you see it. It opens with a one-hundred-twenty-eight-byte preamble, often all zeros, historically there so the file could masquerade as another format. Then four magic bytes, D-I-C-M, confirming what this is. Then the File Meta Information — a small header that, crucially, declares the transfer syntax used to encode everything that follows, along with the SOP Class and instance identifiers. And finally the data set itself: that flat list of elements, ending in the pixel data. The reason this feels almost like an afterthought in the standard is historical and revealing — DICOM was a network protocol first, and the file format is essentially a way to write one transferred object to disk. The old saying captures it exactly: DICOM is a network protocol that happens to have a file format, not the other way around. Which brings us to the network.
:::

---
<!-- .slide: class="compact" -->
## DICOM networking: DIMSE and associations

<div class="viz">
<svg viewBox="0 0 560 250">
<defs><marker id="arrDim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#1A3F70"/></marker></defs>
<rect class="node accent" x="50" y="20" width="150" height="40" rx="5"/><text class="lbl on-fill" x="125" y="40">modality (SCU)</text>
<rect class="node" x="360" y="20" width="150" height="40" rx="5"/><text class="lbl" x="435" y="40">PACS (SCP)</text>
<line class="edge ghost" x1="125" y1="60" x2="125" y2="230"/>
<line class="edge ghost" x1="435" y1="60" x2="435" y2="230"/>
<line class="edge accent" x1="125" y1="92" x2="435" y2="92" marker-end="url(#arrDim)"/><text class="cap" x="280" y="84">A-ASSOCIATE (negotiate)</text>
<line class="edge" x1="125" y1="140" x2="435" y2="140" marker-end="url(#arrDim)"/><text class="cap" x="280" y="132">C-STORE (send image)</text>
<line class="edge" x1="435" y1="188" x2="125" y2="188" marker-end="url(#arrDim)"/><text class="cap" x="280" y="180">C-STORE response</text>
</svg>
</div>

- **DIMSE** = the DICOM Message Service Element, over TCP — predates the web, still everywhere
- before any data moves, the two devices negotiate an **association** (a session)
- each device has an **AE Title** (its name on the DICOM network)
- a **presentation context** pairs a SOP Class with the transfer syntaxes it can use — only agreed combos flow
- **SCU** (Service Class User = client) requests; **SCP** (Provider = server) fulfills
- negotiation-first design is exactly why DICOM is configured **device by device**

::: narration
Traditional DICOM networking is its own world, predating the web and still running in every imaging department. Communication happens through the DICOM Message Service Element, DIMSE, over T-C-P. Before any data moves, the two devices establish an association — a negotiated session. Each device has an Application Entity title, its name on the DICOM network, and during association setup they exchange presentation contexts. A presentation context is the heart of the negotiation: it pairs a SOP Class the initiator wants to use — say, storing ultrasound images — with the transfer syntaxes it can encode them in, and the responder accepts the combinations it supports. Only the agreed combinations can then be used. The roles have names: the Service Class User, S-C-U, is the client making the request; the Service Class Provider, S-C-P, is the server fulfilling it. So a scanner acting as an S-C-U associates with the archive acting as an S-C-P, they agree on what and how, and only then do images flow. This negotiation-first design is exactly why DICOM connectivity is configured device by device.
:::

---
## The DIMSE services

| service | does |
|---|---|
| **C-STORE** | send an object to a peer (push) |
| **C-FIND** | query for studies/series/instances |
| **C-MOVE** | ask a peer to send matching objects elsewhere |
| **C-GET** | retrieve matching objects on the same association |
| **C-ECHO** | "ping" — verify connectivity (first thing you run to debug) |

- **C-MOVE** sends to a destination named by **AE Title** — a perennial config headache; **C-GET** avoids it
- **MPPS** (Modality Performed Procedure Step) reports an exam started/finished
- **Storage Commitment** — the archive confirms durable custody before the modality deletes its copy

::: narration
Within an association, a small set of DIMSE services does all the real work, and their names are part of the everyday vocabulary of imaging IT. C-STORE pushes an object to a peer — this is how a modality sends its images to the archive. C-FIND is the query: ask the archive what studies match this patient or date, and it answers at the patient, study, series, or instance level. C-MOVE is the classic and slightly counterintuitive retrieve: you ask the archive to send the matching objects, but to a destination named by its A-E title, which is why C-MOVE configuration is a perennial source of headaches. C-GET retrieves over the same association, sidestepping that. And C-ECHO is simply a ping to verify two devices can talk — the first thing anyone runs when debugging connectivity. Two related services round it out: Modality Performed Procedure Step, M-P-P-S, reports that an exam has started or finished, and Storage Commitment lets a modality confirm the archive has taken durable responsibility for an object before the modality deletes its own copy.
:::

---
## The actors: a day in the imaging department

<div class="viz wide">
<svg viewBox="0 0 1080 230">
<defs><marker id="arrAct" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<rect class="node" x="30" y="90" width="150" height="56" rx="7"/><text class="lbl sm" x="105" y="112">order (HL7 v2)</text><text class="cap" x="105" y="132">RIS / EHR</text>
<rect class="node accent" x="240" y="90" width="150" height="56" rx="7"/><text class="lbl on-fill" x="315" y="118">Worklist (MWL)</text>
<rect class="node plum" x="450" y="90" width="150" height="56" rx="7"/><text class="lbl on-fill" x="525" y="118">Modality</text>
<rect class="node good" x="660" y="90" width="150" height="56" rx="7"/><text class="lbl" x="735" y="118">PACS / VNA</text>
<rect class="node" x="870" y="90" width="180" height="56" rx="7"/><text class="lbl sm" x="960" y="112">Viewer + Report</text>
<line class="edge" x1="180" y1="118" x2="240" y2="118" marker-end="url(#arrAct)"/>
<line class="edge" x1="390" y1="118" x2="450" y2="118" marker-end="url(#arrAct)"/>
<line class="edge" x1="600" y1="118" x2="660" y2="118" marker-end="url(#arrAct)"/>
<line class="edge" x1="810" y1="118" x2="870" y2="118" marker-end="url(#arrAct)"/>
<circle class="token" r="6"><animateMotion dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.25;0.45;0.5;0.7;0.75;0.95;1" keySplines="0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1;0.65 0 0.35 1;0 0 1 1" keyPoints="0;0.25;0.25;0.5;0.5;0.75;0.75;1;1" path="M105,170 L315,170 L525,170 L735,170 L960,170"/></circle>
</svg>
</div>

- it starts *outside* DICOM: an order placed as an **HL7 v2** message (the two worlds meeting)
- the order populates the **Modality Worklist** (MWL)
- the device queries MWL → pulls patient identity + study details onto the scanner
- **no retyping** a name or MRN — no typos that orphan a study
- acquire → **C-STORE** to PACS/VNA → viewer reads → report flows back to the record
- the next part is where ultrasound — especially handheld — strains exactly this chain

::: narration
Let us put the actors together into the workflow you will live inside. It begins outside DICOM: an order is placed in the radiology or hospital information system, typically as a version-two message — the two worlds meeting again. That order populates a Modality Worklist, and this is the unsung hero of imaging workflow. When the sonographer sits down at the machine, the device queries the worklist and pulls the patient's identity and the study details directly onto the scanner — no retyping a name, no transcribing a medical record number, no typos that orphan a study. The sonographer acquires, and the device C-STOREs the resulting images to the P-A-C-S or the vendor-neutral archive. A radiologist or cardiologist then opens the study in a viewer, interprets it, and a report flows back to the record. Hold this chain in mind, because the next part is about exactly where ultrasound, and especially handheld ultrasound, strains it — particularly that worklist step that everything downstream depends on.
:::

---
## Beyond images: SR, SEG, and friends

- because pixels are just one optional element, DICOM stores far more than images
- **Structured Report (SR)**: *no pixels* — a tree of coded findings & measurements
- **Segmentation (SEG)** — which voxels are the lesion · **Parametric Maps** — per-pixel values (e.g. elasticity)
- whole families of **RT** (radiotherapy) objects
- **encapsulated** PDF / CDA / STL — wrap a foreign document so it rides the same archive
- unifying idea: *anything* tied to the exam can be a DICOM object — for US, the **SR is where value lives**

::: narration
Because DICOM objects are just data sets with pixel data as one optional element, the standard stores far more than images, and this matters enormously for ultrasound. The Structured Report, S-R, is a DICOM object that carries no pixels at all but instead a tree of coded findings and measurements — a formal, machine-readable record of what was measured and concluded, with every concept tied to a code. Segmentation objects, S-E-G, store labeled regions — which voxels are the lesion. Parametric maps store per-pixel computed values like elasticity. There are whole families of radiotherapy objects. And encapsulation lets you wrap a foreign document — a P-D-F, a C-D-A, even a three-D model — inside a DICOM object so it can ride the same archive and network as everything else. The unifying idea is powerful: anything related to the imaging exam, whether pixels, measurements, or documents, can be a DICOM object, identified and managed the same way. For ultrasound, the structured report in particular is where the clinical value often lives.
:::

---
## UIDs: the identifier backbone

- every Study, Series, Instance, SOP Class carries a globally unique **UID**
- unique across *all* institutions and *all* time — not just within one archive
- format: a dotted numeric string rooted in a registered **org root** → uniqueness is structural, not luck
- UIDs are the **join keys** of imaging: same-series grouping, report ↔ image links, study ↔ patient
- **coercion**: correcting wrong-patient acquisitions while preserving UID relationships
- mishandled UIDs are behind a surprising share of imaging-IT incidents — handle with respect

::: narration
Holding the entire imaging world together is a single mechanism: the Unique Identifier, or U-I-D. Every study, every series, every instance, and every SOP Class carries a U-I-D, and these are globally unique — guaranteed unique across all institutions and all time, not just within one archive. The format is a dotted string of numbers, rooted in an organizational root that a vendor or institution registers, so uniqueness is structural rather than a matter of luck. U-I-Ds are the join keys of imaging: they are how a viewer knows two instances belong to the same series, how a report references the exact images it describes, how a study retrieved years later is matched to its patient. Because they are so load-bearing, correcting them is delicate work. When images are acquired under the wrong patient — a real and dangerous event — fixing it means coercing identifiers and demographics in a controlled way that preserves the U-I-D relationships while repairing the identity. Mishandled U-I-Ds are behind a surprising share of imaging-IT incidents, so treat them with respect.
:::

---
## Now: ultrasound in DICOM

- US is the modality that **least resembles** "a tidy stack of slices"
- CT/MR produce orderly cross-sections — a lot of software quietly assumes that shape
- US is **cine, real-time, color-flow, calibrated, measurement-laden**, increasingly handheld
- the consequence: generic viewers & pipelines routinely **mishandle** ultrasound
- the next five slides — cine, regions, color, SR, POCUS — are where this overview earns its keep for *you*

::: narration
We now turn to ultrasound specifically, and the framing to carry in is that ultrasound is the modality that least resembles the mental model most DICOM tooling was built around. C-T and M-R produce orderly stacks of cross-sectional slices, and a great deal of software quietly assumes that shape. Ultrasound does not fit it. Ultrasound is cine by nature, real-time, full of color-flow and spectral displays, with measurements and calibration woven directly into the images, and a workflow that increasingly happens on handheld devices far from any radiology department. The consequence, which you have probably already lived, is that generic DICOM viewers and pipelines routinely mishandle ultrasound — misreading its color, ignoring its calibration, flattening its loops. The next five slides are the ones most directly relevant to building or integrating ultrasound systems: the cine reality, region calibration, color and photometric interpretation, structured reporting, and the point-of-care workflow. These are where a general healthcare-interoperability overview earns its keep for an ultrasound engineer.
:::

---
## US IODs and the cine reality

- three IODs: **US Image** (one frame) · **US Multi-frame Image** (a cine loop) · **Enhanced US Volume** (3D/4D)
- multi-frame: **one instance = many frames + a frame rate** + timing metadata
- the key difference: CT stacks frames across **space**; US stacks them across **time** — a movie, not a volume
- often **ECG-gated** in echo, so frames align to cardiac phase
- **compression-on-motion**: a lossy codec shrinks a loop hugely but trades fidelity in the moving structures clinicians watch
- choosing the cine encoding is a real engineering decision with clinical weight

::: narration
Ultrasound has its own information-object definitions, and they encode the modality's distinctive nature. The basic US Image I-O-D holds a single frame. The US Multi-frame Image I-O-D holds a cine loop — one instance containing many frames together with the timing that relates them, including a frame rate. This is the crucial conceptual difference: where a C-T series stacks frames across space, an ultrasound multi-frame instance stacks them across time. The frames are a movie, not a volume, and the temporal metadata — frame times, the cardiac phase in echo where acquisition is often E-C-G-gated so frames align to the heartbeat — is essential to interpreting them correctly. There is also an Enhanced US Volume I-O-D for true three-D and four-D acquisitions. And because loops are large, compression matters acutely: applying a lossy, motion-oriented codec to a cine shrinks it dramatically but trades away fidelity in exactly the moving structures clinicians are watching. Choosing how to encode ultrasound cine is a real engineering decision with clinical weight, not a default to accept blindly.
:::

---
## Region calibration: the most US-specific construct

```
(0018,6011) Sequence of Ultrasound Regions
  ├─ Region (spatial, B-mode):  pixels ↔ cm, both axes
  ├─ Region (Doppler spectral): x → seconds, y → cm/s
  └─ Region (M-mode):           x → seconds, y → cm
       RegionLocation min/max  ·  PhysicalUnits  ·  PhysicalDelta
```

- **the one US-specific thing to remember** — no real analog in other modalities
- one image, several **independently calibrated** regions at once (own axes, units, scale)
- B-mode: pixels ↔ cm · Doppler spectral: x ↔ seconds, y ↔ cm/s
- turns a distance drawn on screen into a real measurement
- ignore it → software silently reports pixels as cm. **Honor the regions.**

::: narration
If you remember one ultrasound-specific thing from this entire overview, make it this. The Sequence of Ultrasound Regions, tag zero-zero-eighteen comma sixty-eleven, is the construct that makes ultrasound measurements meaningful, and it has no real analog in other modalities. A single ultrasound image frequently displays several distinct regions at once — a B-mode anatomical image in one part of the screen, a Doppler spectral trace in another, perhaps an M-mode strip below. Each of these is its own calibrated region with its own physical mapping. For the B-mode region, the sequence tells you how pixels translate to centimeters along each axis. For the Doppler spectral region, the horizontal axis maps to seconds and the vertical to centimeters per second of velocity. Each region carries its location on the image, its physical units, and the physical delta per pixel. This is what lets software convert a distance drawn on screen into a real measurement. A viewer or an A-I model that ignores this sequence does not fail loudly — it silently produces numbers that are simply wrong, because it is measuring in pixels and reporting them as centimeters. Honor the regions.
:::

---
## Color Doppler and photometric interpretation

- plain B-mode: grayscale `MONOCHROME2` — as most software expects
- color flow → true color: `RGB` or often **`YBR_FULL_422`** (from US's video lineage)
- **not decoration**: hue & saturation encode flow **direction and speed**
- misread the tag → inverted flow direction or a mangled velocity scale
- much tooling assumes "DICOM = grayscale" — reading YBR right is a **core US requirement**

::: narration
Color is the next place generic tooling stumbles on ultrasound. A plain B-mode image is grayscale, MONOCHROME2, and behaves the way most software expects. But the moment you turn on color flow Doppler, the image carries true color — encoded as R-G-B, or very often as one of the Y-B-R luminance-chrominance forms like Y-B-R-FULL-four-twenty-two that ultrasound inherits from its video lineage, complete with chroma subsampling to save space. The color is not decoration: in color-flow imaging, hue and saturation encode the direction and speed of blood flow, so a tool that misreads the photometric interpretation can literally invert the apparent direction of flow or mangle the velocity scale. Software written with a tacit assumption that DICOM images are grayscale — and a surprising amount of it carries that assumption — will misrender ultrasound color studies in ways that range from cosmetically wrong to clinically dangerous. Correctly reading the Photometric Interpretation tag and decoding Y-B-R properly is, for ultrasound, not an edge case but a core requirement.
:::

---
<!-- .slide: class="compact" -->
## US structured reporting and measurements

<div class="viz wide">
<svg viewBox="0 0 1080 220">
<defs><marker id="arrSr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<rect class="node plum" x="40" y="80" width="180" height="60" rx="8"/><text class="lbl on-fill" x="130" y="104">measurement</text><text class="cap" x="130" y="126" fill="#fff">on the machine</text>
<rect class="node accent" x="320" y="80" width="200" height="60" rx="8"/><text class="lbl on-fill" x="420" y="104">DICOM SR</text><text class="cap" x="420" y="126" fill="#DCE6F1">TID 5000 / 5200 ...</text>
<rect class="node good" x="620" y="80" width="180" height="60" rx="8"/><text class="lbl" x="710" y="110">reporting system</text>
<rect class="node" x="900" y="80" width="150" height="60" rx="8"/><text class="lbl sm" x="975" y="104">structured</text><text class="lbl sm" x="975" y="124">report</text>
<line class="edge" x1="220" y1="110" x2="320" y2="110" marker-end="url(#arrSr)"/>
<line class="edge" x1="520" y1="110" x2="620" y2="110" marker-end="url(#arrSr)"/>
<line class="edge" x1="800" y1="110" x2="900" y2="110" marker-end="url(#arrSr)"/>
</svg>
</div>

- where US diverges hardest from radiology — often the picture is *not* the point, the **measurements** are
- standardized SR templates: **OB/GYN TID 5000**-series · **adult echo TID 5200** · vascular & more
- a measurement made on the machine travels downstream as a **discrete, coded value** (femur length = concept + number + units)
- not text burned into pixels where no software can reach it
- lets reporting systems auto-populate, **trend across exams**, and feed analytics
- mastering the relevant TID templates is often more valuable than anything about the images themselves

::: narration
This is where ultrasound diverges most sharply from radiology, and where a great deal of ultrasound's clinical value actually lives. In many ultrasound exams the point is not the picture, it is the measurements — fetal biometry in obstetrics, ejection fraction and chamber dimensions in echo, peak velocities and stenosis grades in vascular studies. DICOM Structured Reporting carries these as coded, structured data using standardized templates: the T-I-D five-thousand series for obstetric and gynecologic measurements, the T-I-D fifty-two-hundred family for adult echocardiography, and others for vascular and beyond. The significance is that a measurement made on the ultrasound machine travels downstream as a discrete, coded value — femur length is this concept, with this number, these units — rather than as text burned into the pixels where no software can reach it. That lets a cardiology or obstetric reporting system automatically populate its report, trend values across exams, and feed analytics. If you build ultrasound systems, mastering the relevant T-I-D templates is often more valuable than anything to do with the images themselves, because structured measurements are what the rest of the enterprise consumes.
:::

---
<!-- .slide: class="compact" -->
## POCUS: ultrasound off the radiology grid

- handheld & pocket devices — Butterfly, Philips Lumify, Clarius, GE Vscan — move US out of radiology to the bedside
- mobility breaks the tidy workflow at its most important point: often **no Modality Worklist**
- without MWL feeding verified identity → the clinician associates the patient **by hand or after the fact**
- → downstream **reconciliation** problem; cloud upload adds another hop and trust boundary
- **burned-in PHI**: identifiers & annotations live *in the pixels* → de-id means detecting/redacting text in the image
- POCUS is where US interoperability is most actively **unsolved** — and where a lot of engineering is rightly going now

::: narration
Finally, the workflow reality that is reshaping ultrasound faster than anything else: point-of-care ultrasound, POCUS. Handheld and pocket devices — Butterfly, Philips Lumify, Clarius, G-E's Vscan — have moved ultrasound out of the radiology department and into the emergency bay, the clinic, the bedside, even the field. That mobility breaks the tidy workflow we walked through earlier at its most important point: these devices frequently operate with no Modality Worklist available. Without the worklist feeding verified patient identity onto the device, the clinician associates the study to a patient by hand, or after the fact, which means downstream systems face a reconciliation problem — matching ad-hoc captures to the right patient record. These devices typically upload to the cloud, adding another hop and another trust boundary. And ultrasound has an acute privacy wrinkle: patient identifiers and annotations are often burned directly into the pixel data, visible on screen, so de-identifying an ultrasound study is not just scrubbing tags — it is detecting and redacting text inside the image itself, a genuinely harder, pixel-domain problem. POCUS is where ultrasound interoperability is most actively unsolved, and where a lot of engineering effort is rightly going right now.
:::

---
## DICOMweb: DICOM meets HTTP

- the **same DICOM data model**, given a RESTful HTTP face — what a study is doesn't change, how you move it does
- no more associations, presentation contexts, AE titles — just ordinary HTTP requests
- three core services: **WADO-RS** (retrieve) · **QIDO-RS** (query) · **STOW-RS** (store)
- payoff mirrors FHIR's: **zero-footprint browser viewers**, cloud-native archives, any web dev can call it
- how imaging escapes device-by-device DIMSE config and joins the ordinary web — increasingly how new US systems are built

::: narration
We now cross into the convergence story, and it begins by giving DICOM the same web makeover FHIR gave clinical data. DICOMweb is the family of RESTful H-T-T-P services over the DICOM data model. It does not change what a study or an instance is; it changes how you move them. Instead of negotiating associations, presentation contexts, and A-E titles in the DIMSE way, you make ordinary H-T-T-P requests and get back DICOM objects or JSON metadata. There are three core services whose names are clunky but worth knowing: WADO-R-S for retrieving, QIDO-R-S for querying, and STOW-R-S for storing. The payoff mirrors FHIR's exactly: zero-footprint browser-based viewers that need no installed fat client, cloud-native archives, and an API any web developer can call. DICOMweb is how imaging escapes the configured-device-by-device world of DIMSE and joins the ordinary web, and it is increasingly how new ultrasound and enterprise-imaging systems are built.
:::

---
## WADO-RS, QIDO-RS, STOW-RS

| service | verb | does |
|---|---|---|
| **QIDO-RS** | GET | query: find studies/series/instances matching params |
| **WADO-RS** | GET | retrieve: instances, frames, metadata, rendered images |
| **STOW-RS** | POST | store: send new instances to the archive |

```
GET /studies?PatientID=100457              # QIDO: search
GET /studies/{uid}/series/{uid}/metadata   # WADO: metadata as JSON
GET /studies/{uid}/.../frames/1            # WADO: just one frame
```

- maps onto the DIMSE ops you know: **QIDO ≈ C-FIND · WADO ≈ C-MOVE/C-GET · STOW ≈ C-STORE**
- WADO granularity is a gift for US — pull **one frame** of a long cine, or a server-rendered JPEG, without the whole loop

::: narration
The three services map cleanly onto the DIMSE operations you already met, which makes them easy to learn. QIDO-R-S — Query based on I-D for D-I-C-O-M Objects — is the web version of C-FIND: a GET with query parameters that returns matching studies, series, or instances as JSON. WADO-R-S — Web Access to D-I-C-O-M Objects, the R-S for RESTful — is retrieval, the web version of C-MOVE and C-GET, and it is pleasingly granular: you can fetch a whole study, or just one series, or just the metadata without the pixels, or even a single frame out of a multi-frame loop, or a server-rendered J-P-E-G for quick display. That granularity is a real gift for ultrasound, where you might want one frame out of a long cine without dragging down the entire loop. STOW-R-S — Store Over the Web — is the web version of C-STORE, a POST that sends new instances to the archive. Query, retrieve, store: the same three verbs as classic DICOM, now plain HTTP. If you know C-FIND, C-MOVE, and C-STORE, you already understand DICOMweb's shape.
:::

---
## DICOMweb data formats

- metadata as **DICOM JSON** — tag `(0008,0060)` → JSON key `"00080060"`
- bulk pixels: **multipart** or deferred **bulkdata URIs** (metadata cheap, pixels later)
- rendered **consumer formats**: JPEG/PNG frame, MP4 cine — no DICOM decode needed
- throughline: keep the data model intact, meet web clients in native formats

::: narration
A few format details make DICOMweb concrete. Metadata comes back as DICOM JSON, a direct JSON encoding of the same data elements you already know — the tag zero-zero-zero-eight comma zero-zero-sixty simply becomes the JSON key "zero-zero-zero-eight-zero-zero-sixty," with the V-R and value alongside. So nothing about the data model changes; only its serialization does. Bulk pixel data, which you do not always want inline, is delivered either in multipart H-T-T-P responses or referenced by bulkdata U-R-Is you fetch separately — letting a client pull metadata cheaply and defer the heavy pixels. And for display convenience, WADO can hand back ordinary consumer formats: a J-P-E-G or P-N-G of a frame, or an M-P-4 of a cine loop, rendered server-side so a browser can show ultrasound video without decoding DICOM at all. The throughline is that DICOMweb keeps the DICOM data model intact while meeting web clients in the formats they natively speak, which is exactly what lets modern browser viewers exist.
:::

---
## The bridge: FHIR ImagingStudy

<div class="viz wide">
<svg viewBox="0 0 1080 240">
<defs><marker id="arrBr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<text class="tag" x="240" y="28">clinical record (FHIR)</text>
<text class="tag" x="840" y="28">image archive (DICOM)</text>
<line class="edge ghost" x1="540" y1="44" x2="540" y2="220"/>
<circle class="node accent" cx="180" cy="120" r="44"/><text class="lbl on-fill" x="180" y="120">Patient</text>
<rect class="node" x="320" y="92" width="170" height="56" rx="8"/><text class="lbl sm" x="405" y="114">ImagingStudy</text><text class="cap" x="405" y="134">a reference</text>
<rect class="node good" x="700" y="60" width="170" height="56" rx="7"/><text class="lbl sm" x="785" y="88">Study (DICOM)</text>
<rect class="node plum" x="700" y="140" width="320" height="56" rx="7"/><text class="lbl sm" x="860" y="168">pixels via WADO-RS</text>
<line class="edge" x1="224" y1="120" x2="320" y2="120" marker-end="url(#arrBr)"/>
<line class="edge ghost" x1="490" y1="116" x2="700" y2="92" marker-end="url(#arrBr)"/>
<line class="edge ghost" x1="490" y1="128" x2="700" y2="160" marker-end="url(#arrBr)"/>
</svg>
</div>

- FHIR `ImagingStudy` **points at** DICOM — it does **not** copy pixels into FHIR
- carries the **study/series UIDs, modality, counts, and the WADO endpoint**
- `ImagingSelection` references a specific image, frame, or region of interest
- **FHIR for record + pointer; DICOM/DICOMweb for pixels** — where the field is converging

::: narration
Now we can make the seam from the very first map concrete. The FHIR resource ImagingStudy is the bridge between the clinical record and the image archive, and the essential thing about it is what it does not do: it does not copy the pixels into FHIR. Instead it acts as a lightweight reference. An ImagingStudy lives in the FHIR world, points at the patient like any other resource, and carries the metadata needed to find and describe the imaging exam — the DICOM study and series U-I-Ds, the modality, the number of series and instances, and crucially the WADO endpoint where the actual images can be retrieved by DICOMweb. So the clinical record holds a small, queryable FHIR resource saying "this patient has an ultrasound study, here is what it is and where its pixels live," while the heavy imaging data stays in the imaging archive where it belongs. A companion resource, ImagingSelection, lets you reference something more specific — a particular image, a particular frame of a cine, even a region of interest. This division of labor — FHIR for the record and the pointer, DICOM and DICOMweb for the pixels — is the architecture the whole field is converging on.
:::

---
<!-- .slide: class="compact" -->
## A modern imaging stack, end to end

<div class="viz wide">
<svg viewBox="0 0 1080 240">
<defs><marker id="arrMod" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<rect class="node plum" x="30" y="96" width="150" height="56" rx="7"/><text class="lbl on-fill" x="105" y="124">US device</text>
<rect class="node good" x="230" y="96" width="180" height="56" rx="7"/><text class="lbl sm" x="320" y="118">DICOMweb archive</text><text class="cap" x="320" y="138">STOW-RS in</text>
<rect class="node accent" x="470" y="50" width="170" height="56" rx="7"/><text class="lbl on-fill" x="555" y="78">FHIR server</text><text class="cap" x="555" y="98" fill="#DCE6F1">ImagingStudy</text>
<rect class="node" x="470" y="146" width="170" height="56" rx="7"/><text class="lbl sm" x="555" y="178">browser viewer</text>
<rect class="node muted" x="710" y="96" width="160" height="56" rx="7"/><text class="lbl sm" x="790" y="124">OHIF / Cornerstone</text>
<rect class="node" x="910" y="96" width="150" height="56" rx="7"/><text class="lbl sm" x="985" y="124">clinician</text>
<line class="edge" x1="180" y1="124" x2="230" y2="124" marker-end="url(#arrMod)"/>
<line class="edge" x1="410" y1="110" x2="470" y2="86" marker-end="url(#arrMod)"/>
<line class="edge" x1="410" y1="138" x2="470" y2="160" marker-end="url(#arrMod)"/>
<line class="edge" x1="640" y1="170" x2="710" y2="140" marker-end="url(#arrMod)"/>
<line class="edge" x1="870" y1="124" x2="910" y2="124" marker-end="url(#arrMod)"/>
</svg>
</div>

- device **STOW-RS** into a (often cloud-hosted) DICOMweb archive; FHIR `ImagingStudy` indexes it into the record
- **OHIF** (viewer app) on **Cornerstone.js** (rendering) pull pixels over **WADO-RS** — zero install, all in the browser
- **FHIRcast** — pub/sub to synchronize context across apps (select a patient in the EHR → the viewer follows)
- the imaging stack is now **web-native and composable** — assembled, not bought as one monolith
- for someone building US software today, these are the components you reach for

::: narration
Putting the modern pieces together: an ultrasound device acquires and stores via STOW-R-S into a DICOMweb-capable archive, which may be entirely cloud-hosted. A FHIR server holds the ImagingStudy resource that indexes the exam into the patient's record. A clinician opens a zero-footprint web viewer — and here the open-source ecosystem is genuinely mature: O-H-I-F as a full viewer application, built on the Cornerstone-dot-j-s rendering library, pulls pixels straight from the archive over WADO-R-S and renders them in the browser, no installed workstation required. To keep multiple applications in step — so that selecting a patient in the E-H-R drives the image viewer to the same patient — there is FHIRcast, a publish-subscribe protocol for synchronizing context across apps in real time. The headline is that the imaging stack has become web-native and composable in a way it simply was not a decade ago: standard HTTP services, open-source viewers, and FHIR indexing, assembled rather than bought as one monolith. For someone building ultrasound software today, these are the components you reach for.
:::

---
## AI in imaging: DICOM as substrate

- DICOM is the **substrate on both ends**, not something AI works around
- training: assemble cohorts via **QIDO/WADO**; ground-truth labels are themselves DICOM (SEG, SR)
- inference: write results back as **first-class DICOM objects** — region → SEG, measurements → SR, computed map → Parametric Map
- each carries its own **UIDs + provenance** (which algorithm) + references to the source study
- that discipline lets AI output flow through the same archive, viewers & reporting — trusted and auditable
- already concrete in US: automated **fetal biometry**, **EF estimation**, **view classification**

::: narration
Artificial intelligence has become central to imaging, and the important architectural point is that DICOM is the substrate on both ends, not a thing A-I works around. For training, you assemble cohorts by querying with QIDO-R-S and retrieving with WADO-R-S, and the ground-truth labels are themselves DICOM objects — segmentation objects marking structures, structured reports capturing measurements. For inference, a well-built model does not dump its output into a proprietary blob; it writes results back as first-class DICOM objects. A detected region becomes a Segmentation, a set of measurements becomes a Structured Report, a computed map becomes a Parametric Map, each carrying its own U-I-Ds, provenance about which algorithm produced it, and references linking it back to the source study. That discipline is what lets A-I results flow through the same archive, viewers, and reporting systems as everything else, and be trusted and audited. In ultrasound specifically this is already concrete: automated fetal biometry, automated ejection-fraction estimation, and view classification that labels which cardiac window a clip shows — all of it most useful when the output comes back as structured, coded DICOM rather than a number trapped in a vendor app.
:::

---
## Security, privacy, and regulation

- technical floor: **TLS** on the wire (recall raw MLLP/early DICOM had none); **OAuth2/SMART** for API access
- US law — **21st Century Cures Act**: created **information-blocking** rules; leans on **USCDI** (data floor) + **FHIR APIs** (access)
- **TEFCA** — the Trusted Exchange Framework; certified networks called **QHINs** form a nationwide backbone
- privacy regimes underneath: **HIPAA** (US) · **GDPR** (EU) — real penalties
- the standards are the *how*; these frameworks are the *must* — and increasingly they **require** FHIR

::: narration
None of this lives outside the law, and a working engineer has to know the regulatory frame. On the technical side the expectations are now firm: T-L-S for everything on the wire — recall that raw M-L-L-P and early DICOM had none — and OAuth two with SMART for authorizing access to clinical and imaging APIs. On the legal side, in the United States the twenty-first Century Cures Act is the pivotal statute: it created information-blocking rules that prohibit improperly impeding the flow of electronic health information, and it leans on U-S-C-D-I as the mandated data floor and on FHIR-based APIs as the required means of access. Layered on top is T-E-F-C-A, the Trusted Exchange Framework, which through certified networks called Q-H-I-Ns is assembling a nationwide exchange backbone so that data can move between regions and organizations under common rules. And underneath it all sit the privacy regimes — HIPAA in the United States, G-D-P-R in Europe — governing how protected health information may be used and disclosed, and carrying real penalties. The standards we have covered are the how; these frameworks are the must, and increasingly they require exactly the FHIR and exchange capabilities we have walked through.
:::

---
## The state of play in 2026

- **FHIR** has won the argument about the future — but **v2** and **C-CDA** carry the bulk of live traffic, for years yet
- imaging on the same arc: **DICOMweb** + browser viewers ascendant, classic **DIMSE** still humming in departments
- the genuinely unfinished work no protocol alone solves: **semantic** interoperability — getting everyone to mean the same thing
- ultrasound's live frontier: trustworthy **POCUS** workflow, **pixel-domain de-id**, structured measurement **at scale**
- the plumbing is increasingly settled; the **meaning**, and US's messy edges, are where the work still is

::: narration
Step back and survey the field as it actually stands. FHIR has clearly won the argument about the future — it is where regulation, investment, and new development point — but it has emphatically not replaced the present, and version two and C-C-D-A still carry the bulk of live clinical traffic and will for years. Imaging is on the same arc: DICOMweb and browser-native viewers are ascendant, while classic DIMSE keeps humming inside imaging departments and will not vanish soon. The genuinely unfinished work, the part no new protocol alone solves, is semantic interoperability — getting everyone to mean the same thing with the same codes, which remains stubbornly hard and is where much of the real friction lives. And for ultrasound specifically, the live frontier is exactly the cluster we dwelt on: making point-of-care workflow trustworthy, solving pixel-domain de-identification, and getting structured measurements to flow at scale. The plumbing is increasingly settled; the meaning, and the messy edges where ultrasound lives, are where the work still is.
:::

---
## Recap and where to go deeper

- clinical: **HL7 v2** messaging · **CDA** documents · **FHIR** resources + REST + profiles
- **terminologies** (SNOMED/LOINC/ICD/RxNorm/UCUM) give meaning; **IHE** profiles remove ambiguity
- imaging: **DICOM** = model + file + protocol + workflow · **DICOMweb** for the web · **`ImagingStudy`** bridges them
- **ultrasound** specifics: cine as temporal stacks · regions `(0018,6011)` · YBR color · SR templates (TID 5000/5200) · POCUS
- go deeper: the specs are free & readable; sandboxes — public FHIR servers, **Synthea**, public DICOMweb, **OHIF** — let you try it all
- you now have the **foundation**; the rest is building on it

::: narration
To close, the map you should now carry. On the clinical side: version two for real-time messaging, C-D-A for documents, and FHIR — resources plus REST plus profiles — as the modern foundation, all of it made meaningful by shared terminologies and stitched together by I-H-E profiles. On the imaging side: DICOM as a complete world of data model, file format, network protocol, and workflow, with DICOMweb giving it a RESTful face, and FHIR's ImagingStudy bridging the two. And woven through, the ultrasound specifics that matter for your work: cine loops as temporal stacks, the all-important Sequence of Ultrasound Regions that calibrates measurements, the Y-B-R color encodings that trip up grayscale tooling, the structured-report templates that carry the clinical numbers, and the point-of-care workflow that strains every assumption the older standards baked in. To go deeper, the specifications themselves are freely available and surprisingly readable, and there are open sandboxes — public FHIR servers, synthetic-data generators, public DICOMweb endpoints, and the O-H-I-F viewer — where you can try every one of these ideas against real software. You now have the foundation; the rest is building on it.
:::
