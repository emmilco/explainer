
## Attempt — 2026-06-04 mermaid label clipping
Hypothesis: residual ~1-char right-edge clip on mermaid node labels is FOUT —
mermaid measures box width against fallback font before Source Sans 3 loads.
Tried: gated renderSlideDiagrams on document.fonts.ready before mermaid.run.
Outcome: clip UNCHANGED across slides 4/28/65. FOUT ruled out as the cause.
Learning: fonts were already loaded at render time; the foreignObject label box
is genuinely sized narrower than the htmlLabels text renders. Next: htmlLabels:false
(native SVG <text>, sized via getComputedTextLength — exact, no foreignObject clip).
Kept the fonts.ready gate anyway: harmless, prevents FOUT clip on cold loads.

## Attempt — 2026-06-04 mermaid label clipping (resolved)
Hypothesis: htmlLabels:false makes mermaid use native SVG <text> sized via
getComputedTextLength (exact) instead of foreignObject (clips wider rendered font).
Tried: flowchart htmlLabels:true -> false; re-rendered DDIA.
Outcome: clipping GONE on all 5 diagrams incl. multi-line schema-evolution (slide 27)
and unbundling (66). Boxes sized exactly to text; explicit line-breaks still wrap.
0/69 overflow. RESOLVED.

## Attempt — 2026-06-04 vocabulary conversion: text-anchor override
Hypothesis: left-aligned text in a .viz svg can be set with the text-anchor="start"
attribute on a .lbl/.cap element.
Tried: text-anchor="start" attribute on JSON (dm) and annotation captions (dirty).
Outcome: FAILED — text rendered centered, overlapping adjacent node boxes. Cause:
.lbl/.cap set text-anchor:middle in CSS, and a CSS property beats a presentation
attribute (lower specificity). Fix: inline style="text-anchor:start" (inline style
beats class CSS). Learning: any per-element override of a vocab text property must
use inline style=, not the SVG presentation attribute. Motivates a left-aligned
text class in the vocabulary (see proposed additions).
