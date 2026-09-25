# Script style guide — EPM palace walk

## Who is listening
A philosophically literate listener who wants a rigorous, disciplined treatment — a graduate
seminar on the book. Do not simplify for a beginner; do not assume they have read the book.
Make the connections a seminar leader would make (Brandom, McDowell, Rorty, and the historical
targets and allies named in the map), where they illuminate the argument — not as name-dropping.

## What the narration must do
- Reconstruct the argument precisely: name the thesis, the premises, the move, and what it costs
  or buys. When Sellars distinguishes two things, keep them distinguished in your prose.
- Track the dialectic: who holds the view under attack, what the objection is, what survives.
- Mark interpretive disputes as disputes ("Brandom reads this as …; McDowell resists …").
- Keep promissory notes visible: when Sellars defers something, say where it gets paid off.
- Weight by the map: spend words on the load-bearing sections; move briskly over transitions.

## Accuracy rules (hard)
- Quotations from Sellars must be verbatim from the section files you are given. Introduce them
  so a listener hears they are quotations ("In Sellars' words: …"). Use them sparingly — a few
  per unit, for the load-bearing sentences.
- Secondary literature: paraphrase and attribute. Do not put words in quotation marks for
  Brandom, McDowell, Rorty, or anyone else unless the map supplies the exact wording. Do not
  invent titles, dates, or page numbers; if unsure of a title, attribute the view to the person
  without naming the work.
- Do not attribute to Sellars claims he doesn't make in the text.

## Spoken prose (it will be read aloud by a TTS voice)
- Write for the ear: full sentences, clear topic sentences, moderate length. No bullet lists,
  headings inside narration, tables, parentheses-heavy asides, or footnotes.
- No symbols or notation: write "if and only if," "x looks red to S," "phi," "section thirty-six."
  Spell out section numbers as words.
- Mentioned words and sentences: introduce them in speech ("the sentence 'This is green'").
- No filler, no rhetorical questions stacked for effect, no "let's dive in," no praise of the
  listener, no "as you can see." Never refer to the walk, the landscape, images, or stops.
- Continuous voice across units: first person plural is fine ("we now have …"), sparingly.

## Output format
Write one markdown file per unit at the path you are given. Structure:

```
# U<n> · <title>

::: narration
<paragraph>

<paragraph>
:::

::: stop
image: <what the image shows — one concrete, searchable description>
source_hint: <e.g. "Wikimedia Commons portrait", "public-domain engraving", "photograph">
keyword: <1–3 words that will appear in the landscape>
:::

::: narration
…
:::
```

- Narration blocks alternate with stop blocks. A stop marks the point in the narration where the
  walker reaches that image; place one roughly every 120–170 spoken words (≈ one a minute), at a
  natural joint in the argument.
- Images: memorable, concrete, and loosely associated with what is being discussed at that
  point — portraits of the philosophers named, objects from Sellars' examples (a necktie, a
  thermometer, a tomato, Cleopatra's Needle, a balloon, a tortoise under an elephant, an
  ouroboros), places, artworks, historical photographs. Prefer things likely to exist as
  public-domain images. Make adjacent stops visually distinct from each other.
- The narration must never mention or explain the images; the association is passive.
- Keywords: short, precise terms of art or names the listener should anchor ("inconsistent
  triad", "endorsement", "space of reasons", "Jones").
- Hit the unit's word budget within ±10%. Report the final word count at the end of your
  response (not in the file).
