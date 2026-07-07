# GPT from Scratch: The Architecture

---
## GPT from Scratch: The Architecture

- a 124M-parameter GPT-2, every module coded by hand
- Raschka, *Build a Large Language Model (From Scratch)*, ch. 4
- config → building blocks → full model → generated text

::: narration
This is a walk through the complete architecture of a GPT model, built from scratch, following chapter four of Sebastian Raschka's Build a Large Language Model. The destination is a working 124-million-parameter replica of the smallest GPT-2: every module implemented by hand in PyTorch, from a seven-line configuration dictionary to a model that generates text token by token. One piece is assumed from the previous chapter — the masked multi-head attention module — and everything else gets built here: layer normalization, the GELU activation, the feed-forward network, shortcut connections, the transformer block, and the full model that stacks them. By the end, the model will generate text. It will be gibberish, and the reason why is itself the punchline of the chapter.
:::

---
<!-- .slide: class="divider" -->
### Part I
## The blueprint

::: narration
Part one is the blueprint. Before implementing any component, it pays to see the whole shape of the thing: what a GPT is, what configuration defines it, how data flows in and out, and the order in which the pieces will be built. The strategy of the chapter is top-down — first a placeholder model that shows the skeleton, then each organ implemented for real.
:::

---
## Where this sits: the three stages

<div class="viz wide">
<svg viewBox="0 0 560 170">
<defs><marker id="arrS3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="170" y1="70" x2="220" y2="70" marker-end="url(#arrS3)"/>
<line class="edge" x1="380" y1="70" x2="430" y2="70" marker-end="url(#arrS3)"/>
<rect class="node accent" x="30" y="42" width="140" height="56" rx="7"/>
<text class="lbl on-fill" x="100" y="63">build the</text><text class="lbl on-fill" x="100" y="80">architecture</text>
<rect class="node" x="222" y="42" width="156" height="56" rx="7"/>
<text class="lbl" x="300" y="63">pretrain on</text><text class="lbl" x="300" y="80">unlabeled text</text>
<rect class="node muted" x="432" y="42" width="110" height="56" rx="7"/>
<text class="lbl" x="487" y="63">fine-tune</text><text class="lbl" x="487" y="80">for tasks</text>
<text class="tag" x="100" y="125">this deck</text>
<text class="tag" x="300" y="125">chapter 5</text>
<text class="tag" x="487" y="125">chapters 6–7</text>
</svg>
</div>

- stage 1: data · attention · **architecture** — building an LLM
- stage 2: pretraining → a foundation model
- stage 3: fine-tuning → classifier, assistant

::: narration
The book builds a large language model in three stages. Stage one is construction: preparing data, implementing attention, and — the subject here — assembling the architecture itself. Stage two takes that architecture and pretrains it on unlabeled text, producing what's called a foundation model. Stage three adapts the foundation model to specific jobs by fine-tuning: a text classifier in one chapter, an instruction-following assistant in another. This deck lives entirely inside stage one, at the step where the attention mechanism already exists and the rest of the model gets built around it. Everything that follows — training loops, loss curves, downstream tasks — depends on getting this skeleton right.
:::

---
## What a GPT is

- **g**enerative **p**re-trained **t**ransformer
- a next-token machine — one word at a time
- large, but built from a few repeated parts
- deep stack of identical transformer blocks

::: narration
GPT stands for generative pretrained transformer, and functionally it is a next-token machine: given a sequence of words, it produces a guess at the single word that comes next, and text generation is just that guess applied over and over. The intimidating thing about these models is their size, not their design. Despite hundreds of millions or billions of parameters, the architecture is less complicated than you might expect, because most of it is one component — the transformer block — repeated many times. Understand one block, and you understand ninety percent of the model. The rest is plumbing: how tokens get in, and how a prediction comes out.
:::

---
## The silhouette

<div class="viz narrow">
<svg viewBox="0 0 300 300">
<defs><marker id="arrSil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="150" y1="258" x2="150" y2="238" marker-end="url(#arrSil)"/>
<line class="edge" x1="150" y1="204" x2="150" y2="184" marker-end="url(#arrSil)"/>
<line class="edge" x1="150" y1="118" x2="150" y2="98" marker-end="url(#arrSil)"/>
<line class="edge" x1="150" y1="64" x2="150" y2="44" marker-end="url(#arrSil)"/>
<rect class="node muted" x="75" y="260" width="150" height="32" rx="6"/><text class="lbl" x="150" y="276">tokenized text</text>
<rect class="node" x="75" y="206" width="150" height="32" rx="6"/><text class="lbl" x="150" y="222">embedding layers</text>
<rect class="node accent" x="60" y="120" width="180" height="64" rx="8"/>
<text class="lbl on-fill" x="150" y="144">transformer block</text>
<text class="lbl on-fill sm" x="150" y="164">masked attention inside</text>
<rect class="node" x="75" y="66" width="150" height="32" rx="6"/><text class="lbl" x="150" y="82">output layers</text>
<text class="cap" x="150" y="24">next-token logits</text>
<text class="olbl" x="262" y="152">× 12</text>
</svg>
</div>

- text in at the bottom · logits out at the top
- embeddings → transformer blocks → output head
- attention already built — everything else is this chapter

::: narration
Here is the whole model in silhouette. At the bottom, tokenized text enters. Embedding layers turn token IDs into vectors. Then comes the heart of the model: the transformer block, containing the masked multi-head attention module, repeated twelve times in the smallest GPT-2. At the top, output layers convert the final vectors into a score for every word in the vocabulary — the logits for the next token. The attention module inside the block was implemented in the previous chapter and is treated as a finished part. What this chapter supplies is everything around it: the normalization layers, the feed-forward network, the wiring that makes a block, and the embedding and output machinery that makes the stack a model.
:::

---
## Parameters, precisely

$$2048 \times 2048 = 4{,}194{,}304$$

- a parameter = one trainable weight
- adjusted by training to minimize a loss
- a single 2,048 × 2,048 layer: 4.2M of them
- "124M" counts every such entry in the model

::: narration
Before counting millions of parameters, it helps to fix what the word means. A parameter is a single trainable weight of the network: one number that training is allowed to adjust in order to reduce the loss. They accumulate fast. A single neural network layer represented by a two-thousand-forty-eight by two-thousand-forty-eight weight matrix contains over four million parameters on its own — one per matrix entry. When a model is described as having 124 million parameters, that is the total count of every entry in every weight matrix and bias vector that training can touch. Size, in other words, is mostly a statement about how many knobs the optimizer gets to turn.
:::

---
## The entire spec: seven lines

```python
GPT_CONFIG_124M = {
    "vocab_size": 50257,     # BPE vocabulary
    "context_length": 1024,  # max tokens in
    "emb_dim": 768,          # token vector width
    "n_heads": 12,           # attention heads
    "n_layers": 12,          # transformer blocks
    "drop_rate": 0.1,        # dropout
    "qkv_bias": False        # bias in QKV projections
}
```

- one dictionary defines the whole model

::: narration
The entire architecture is specified by a Python dictionary with seven entries. Vocabulary size, context length, embedding dimension, the number of attention heads, the number of layers, a dropout rate, and a flag for whether the attention projections carry bias terms. Every class built in this chapter takes this dictionary as its configuration, which means scaling the model up later is a matter of editing these numbers, not rewriting code. There is something clarifying about this: strip away the tensor algebra, and a GPT is seven design decisions. The next slide reads through what each one means.
:::

---
## Reading the config

- **50,257** — the BPE tokenizer's vocabulary
- **1,024** — the most tokens the model can see at once
- **768** — each token becomes a 768-dimensional vector
- **12 × 12** — twelve heads per block, twelve blocks
- **0.1** — ten percent dropout · **no** QKV bias, per modern practice

::: narration
Fifty thousand two hundred fifty-seven is the vocabulary of the byte-pair-encoding tokenizer that GPT-2 uses — every token ID the model can consume or emit. One thousand twenty-four is the context length: the maximum number of tokens the model can attend over in one pass, set by the size of the positional embedding table. Seven hundred sixty-eight is the embedding dimension — the width of the vector that represents each token throughout the network. Twelve attention heads run in parallel inside each block, and twelve blocks stack on top of each other. Dropout of ten percent randomly silences units during training to prevent overfitting. And the query-key-value projections skip their bias terms, following the norm of modern LLMs — though that flag returns later, when compatibility with OpenAI's released weights matters.
:::

---
## Why GPT-2 and not GPT-3

| | GPT-2 | GPT-3 |
|---|---|---|
| parameters | 124M – 1.5B | 175B |
| architecture | transformer blocks | the same, scaled |
| weights | **public** | not released |
| runs on | a laptop | a GPU cluster |

- same fundamental design — scale is the difference

::: narration
The chapter targets GPT-2 rather than GPT-3, and the reasons are practical rather than architectural. Fundamentally, GPT-3 is the same design — the same transformer blocks — scaled from one and a half billion parameters to one hundred seventy-five billion and trained on more data. But OpenAI released GPT-2's pretrained weights publicly, which the book later loads into this very implementation, while GPT-3's weights were never released. And scale has consequences: GPT-2 runs comfortably on a laptop, whereas by one estimate it would take 355 years to train GPT-3 on a single datacenter GPU. For learning how these models actually work, the small public one is strictly the better teacher.
:::

---
## Start with a skeleton

```python
class DummyGPTModel(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
        self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
        self.drop_emb = nn.Dropout(cfg["drop_rate"])
        self.trf_blocks = nn.Sequential(
            *[DummyTransformerBlock(cfg) for _ in range(cfg["n_layers"])])
        self.final_norm = DummyLayerNorm(cfg["emb_dim"])
        self.out_head = nn.Linear(cfg["emb_dim"], cfg["vocab_size"], bias=False)
```

- placeholders where the real parts will go · big picture first

::: narration
The build starts top-down, with a dummy model. It has the true skeleton — token embeddings, positional embeddings, dropout, a sequential stack of transformer blocks, a final normalization, and a linear output head — but the transformer block and the layer norm are placeholder classes that just pass their input through unchanged. This is a deliberate pedagogical move: the skeleton is already runnable, so you can push real data through it and confirm the shapes and the data flow before a single interesting computation exists. Each placeholder then gets replaced by a real implementation, one per section, until the dummy model has become the genuine article.
:::

---
## Feed it two sentences

```python
tokenizer = tiktoken.get_encoding("gpt2")
batch = torch.stack([
    torch.tensor(tokenizer.encode("Every effort moves you")),
    torch.tensor(tokenizer.encode("Every day holds a")),
])
# tensor([[6109, 3626, 6100,  345],
#         [6109, 1110, 6622,  257]])
```

- tiktoken BPE → token IDs · two texts, four tokens each
- same first word → same first ID: 6109

::: narration
To exercise the skeleton, the chapter tokenizes a tiny batch of two sentences: Every effort moves you, and Every day holds a. The tiktoken library provides the same byte-pair-encoding tokenizer GPT-2 was trained with, and it maps each text to four token IDs. Stacked together they form a two-by-four tensor — batch size two, four tokens per row. One detail worth noticing: both sentences begin with the word Every, and both rows begin with token 6109. The tokenizer is a pure lookup — same text, same ID, every time. This little batch becomes the running example for the whole chapter; it will be pushed through every module as it gets built.
:::

---
## What goes in, what comes out

<div class="viz wide">
<svg viewBox="0 0 560 150">
<defs><marker id="arrIO" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="128" y1="70" x2="158" y2="70" marker-end="url(#arrIO)"/>
<line class="edge" x1="278" y1="70" x2="308" y2="70" marker-end="url(#arrIO)"/>
<line class="edge" x1="400" y1="70" x2="430" y2="70" marker-end="url(#arrIO)"/>
<rect class="node muted" x="20" y="46" width="108" height="48" rx="6"/>
<text class="lbl sm" x="74" y="64">"Every effort</text><text class="lbl sm" x="74" y="80">moves you"</text>
<rect class="node" x="160" y="46" width="118" height="48" rx="6"/>
<text class="lbl mono" x="219" y="70">[2, 4]</text>
<rect class="node accent" x="310" y="42" width="90" height="56" rx="8"/>
<text class="lbl on-fill" x="355" y="70">GPT</text>
<rect class="node good" x="432" y="46" width="118" height="48" rx="6"/>
<text class="lbl mono" x="491" y="70">[2, 4, 50257]</text>
<text class="tag" x="74" y="120">text</text>
<text class="tag" x="219" y="120">token IDs</text>
<text class="tag" x="491" y="120">logits</text>
</svg>
</div>

- in: a `[batch, tokens]` grid of IDs
- out: a `[batch, tokens, vocab]` grid of scores
- one 50,257-wide vector **per input token**

::: narration
Even with placeholder internals, the dummy model already answers the most basic question: what are the input and output shapes? In goes the two-by-four tensor of token IDs. Out comes a tensor of shape two by four by fifty thousand two hundred fifty-seven. Read that carefully: for every one of the four input tokens, in each of the two sequences, the model emits a vector as wide as the entire vocabulary. Each entry of that vector is a raw score — a logit — for one possible next token. The model doesn't produce one prediction per sentence; it produces a full next-token distribution at every position at once, a fact that will matter enormously when training arrives in the next chapter.
:::

---
## The build order

<div class="viz wide">
<svg viewBox="0 0 560 210">
<line class="edge" x1="110" y1="150" x2="180" y2="105" />
<line class="edge" x1="250" y1="150" x2="255" y2="120" />
<line class="edge" x1="390" y1="150" x2="330" y2="105" />
<line class="edge" x1="500" y1="150" x2="345" y2="100" />
<line class="edge strong" x1="280" y1="88" x2="280" y2="58" />
<rect class="node muted" x="215" y="150" width="130" height="34" rx="6"/><text class="lbl" x="280" y="167">1 · GPT backbone</text>
<rect class="node" x="40" y="118" width="140" height="34" rx="6"/><text class="lbl" x="110" y="135">2 · layer norm</text>
<rect class="node" x="190" y="88" width="180" height="34" rx="6"/><text class="lbl" x="280" y="105">3–4 · GELU + feed fwd</text>
<rect class="node" x="380" y="118" width="150" height="34" rx="6"/><text class="lbl" x="455" y="135">5 · shortcuts</text>
<rect class="node warn" x="190" y="26" width="180" height="34" rx="6"/><text class="lbl" x="280" y="43">6 · transformer block</text>
<text class="cap" x="280" y="205">7 · final GPT = backbone + 12 × block</text>
</svg>
</div>

- backbone first, then four components, then assembly
- each part testable alone before it joins the block

::: narration
The chapter's build order is a small dependency graph. First the backbone — the dummy model just shown, establishing the skeleton. Then four independent components: layer normalization, the GELU activation, the feed-forward network that uses it, and shortcut connections. Component six is the transformer block, which is nothing but those four parts wired around the existing attention module. And component seven is the final GPT architecture: the backbone with its placeholders swapped for twelve real blocks. The virtue of this order is that every piece is small enough to implement and sanity-check on its own — each one gets built, run on toy input, and verified before it's composed into anything larger.
:::

---
<!-- .slide: class="divider" -->
### Part II
## Layer normalization

::: narration
Part two builds the first real component: layer normalization. It is the least glamorous piece of the model and one of the most important, because without it, networks this deep are simply hard to train. The section develops it from a five-line idea into a PyTorch module with two trainable parameters.
:::

---
## Why deep nets fight back

- gradients guide every weight update
- through many layers they **vanish** — or explode
- unstable dynamics → the network stops learning
- the fix: keep each layer's outputs in a standard range

::: narration
Training a deep network means computing gradients — the signals that say which direction each weight should move — and passing them backward through every layer. The trouble is that these signals compound multiplicatively as they travel. Through many layers they can shrink toward zero, the vanishing gradient problem, or blow up toward infinity, the exploding one. Either way, training becomes unstable: early layers barely learn, or the whole thing diverges. Layer normalization attacks the problem at its source by keeping each layer's outputs in a standard, predictable range, so that neither the activations nor the gradients that flow back through them drift into extreme territory.
:::

---
## The idea in one line

$$\hat{x} = \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}}$$

- subtract the mean, divide by the standard deviation
- result: mean 0, variance 1 — for **every token vector**
- applied across the embedding dimension

::: narration
The mechanism is one line of arithmetic. Take a vector of activations, subtract its mean, and divide by the square root of its variance — with a tiny epsilon added so the division can never hit zero. The result has mean zero and variance one, no matter what scale the raw activations arrived at. In a GPT, this recipe is applied independently to every token's vector, across its seven hundred sixty-eight embedding dimensions. Each token gets recentered and rescaled on its own, every time it passes through a normalization layer. That per-token independence turns out to be the property that distinguishes layer norm from its older cousin, batch norm — a comparison coming shortly.
:::

---
## Watch it happen

<div class="viz wide">
<svg viewBox="0 0 560 190">
<defs><marker id="arrLN" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="axis" x1="30" y1="130" x2="240" y2="130"/>
<rect class="bar muted" x="40" y="96" width="24" height="34"/>
<rect class="bar muted" x="72" y="78" width="24" height="52"/>
<rect class="bar muted" x="104" y="130" width="24" height="1"/>
<rect class="bar muted" x="136" y="97" width="24" height="33"/>
<rect class="bar muted" x="168" y="130" width="24" height="1"/>
<rect class="bar muted" x="200" y="130" width="24" height="1"/>
<line class="edge strong" x1="252" y1="100" x2="292" y2="100" marker-end="url(#arrLN)"/>
<line class="axis" x1="305" y1="100" x2="530" y2="100"/>
<rect class="bar good" x="315" y="55" width="24" height="45"/>
<rect class="bar good" x="347" y="0" width="24" height="100"/>
<rect class="bar danger" x="379" y="100" width="24" height="62"/>
<rect class="bar good" x="411" y="58" width="24" height="42"/>
<rect class="bar danger" x="443" y="100" width="24" height="62"/>
<rect class="bar danger" x="475" y="100" width="24" height="62"/>
<text class="cap" x="135" y="165">mean 0.13 · var 0.39</text>
<text class="cap good" x="420" y="165">mean 0.00 · var 1.00</text>
</svg>
</div>

- a real layer's outputs, before and after
- ReLU killed the negatives — normalization brings them back
- centered on zero, spread standardized

::: narration
The chapter makes this concrete with a toy layer: five inputs, six outputs, passed through a linear transformation and a ReLU. The raw outputs sit wherever they land — in the example, a mean of zero point one three and a variance of zero point three nine, with several values pinned to exactly zero where the ReLU clipped them. Apply the normalization, and the same six numbers are recentered and rescaled: mean zero point zero zero, variance one point zero zero, with genuine negative values reappearing below the axis. Nothing about the information in the vector has been destroyed — the values keep their relative pattern — but the scale is now standard, and every layer downstream can rely on receiving inputs in this range.
:::

---
## The bookkeeping: dim and keepdim

<div class="viz wide">
<svg viewBox="0 0 560 150">
<defs><marker id="arrKD" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#0F5D5D"/></marker></defs>
<rect class="cell sel" x="40" y="30" width="44" height="36"/><rect class="cell sel" x="86" y="30" width="44" height="36"/><rect class="cell sel" x="132" y="30" width="44" height="36"/><rect class="cell sel" x="178" y="30" width="44" height="36"/>
<rect class="cell off" x="40" y="68" width="44" height="36"/><rect class="cell off" x="86" y="68" width="44" height="36"/><rect class="cell off" x="132" y="68" width="44" height="36"/><rect class="cell off" x="178" y="68" width="44" height="36"/>
<line class="edge good" x1="230" y1="48" x2="280" y2="48" marker-end="url(#arrKD)"/>
<rect class="cell on" x="290" y="30" width="44" height="36"/>
<rect class="cell off" x="290" y="68" width="44" height="36"/>
<text class="cap" x="140" y="128">rows = tokens · columns = embedding dims</text>
<text class="cap good" x="392" y="48">one mean per row</text>
<text class="cap" x="392" y="86">shape kept 2-D</text>
</svg>
</div>

- `mean(dim=-1)` — statistics along the **last** axis
- last axis = embedding dim, whether the tensor is 2-D or 3-D
- `keepdim=True` — result stays broadcastable

::: narration
Two PyTorch details carry the implementation. First, the dim argument: computing the mean with dim equals minus one takes the statistic along the last axis of the tensor. For a two-dimensional matrix of tokens by embedding values, that yields one mean per token row — exactly the per-token treatment layer norm wants. And because minus one always names the last axis, the same code works untouched when the tensors become three-dimensional with a batch in front. Second, keepdim equals true: it makes the reduced tensor keep its dimensionality — a column of means rather than a flat list — so that subtracting it from the original broadcasts cleanly instead of throwing a shape error. Small flags, but they are the difference between code that generalizes and code that breaks the moment a batch dimension appears.
:::

---
## LayerNorm, the module

```python
class LayerNorm(nn.Module):
    def __init__(self, emb_dim):
        super().__init__()
        self.eps = 1e-5
        self.scale = nn.Parameter(torch.ones(emb_dim))
        self.shift = nn.Parameter(torch.zeros(emb_dim))

    def forward(self, x):
        mean = x.mean(dim=-1, keepdim=True)
        var = x.var(dim=-1, keepdim=True, unbiased=False)
        norm_x = (x - mean) / torch.sqrt(var + self.eps)
        return self.scale * norm_x + self.shift
```

::: narration
Here is the finished module, and it is pleasingly small. The forward pass is the one-liner from before: subtract the mean, divide by the square root of the variance plus epsilon. What's new are two trainable parameters, scale and shift — one seven-hundred-sixty-eight-wide vector of ones and one of zeros. After normalizing to mean zero and variance one, the module multiplies by scale and adds shift. That gives training an escape hatch: if the strict zero-one standardization ever hurts the model on its task, the optimizer can learn to stretch or recenter each dimension as it sees fit. Normalization sets a sensible default; the parameters let the data overrule it.
:::

---
## Three fine points

- $\epsilon = 10^{-5}$ — never divide by zero
- `scale`, `shift` — learned, per embedding dimension
- `unbiased=False` — divide by $n$, not $n-1$
- matches the original GPT-2 · negligible at $n = 768$

::: narration
Three details reward a closer look. Epsilon, at ten to the minus five, exists purely for numerical safety: if a token vector ever had near-zero variance, the division would explode without it. The scale and shift parameters are per-dimension, so training can treat each of the seven hundred sixty-eight embedding channels differently. And the variance is computed with unbiased set to false, meaning it divides by n rather than n minus one — skipping the textbook Bessel correction. That choice isn't statistical carelessness; it matches TensorFlow's default behavior, which the original GPT-2 was trained with, and the book keeps it for compatibility with the pretrained weights loaded later. With seven hundred sixty-eight dimensions in the denominator, the difference is practically invisible anyway.
:::

---
## Layer norm vs. batch norm

<div class="viz wide">
<svg viewBox="0 0 560 170">
<rect class="cell sel" x="40" y="30" width="40" height="32"/><rect class="cell sel" x="82" y="30" width="40" height="32"/><rect class="cell sel" x="124" y="30" width="40" height="32"/><rect class="cell sel" x="166" y="30" width="40" height="32"/>
<rect class="cell off" x="40" y="64" width="40" height="32"/><rect class="cell off" x="82" y="64" width="40" height="32"/><rect class="cell off" x="124" y="64" width="40" height="32"/><rect class="cell off" x="166" y="64" width="40" height="32"/>
<rect class="cell off" x="40" y="98" width="40" height="32"/><rect class="cell off" x="82" y="98" width="40" height="32"/><rect class="cell off" x="124" y="98" width="40" height="32"/><rect class="cell off" x="166" y="98" width="40" height="32"/>
<text class="cap" x="123" y="150">LayerNorm: across one row</text>
<rect class="cell off" x="330" y="30" width="40" height="32"/><rect class="cell hot" x="372" y="30" width="40" height="32"/><rect class="cell off" x="414" y="30" width="40" height="32"/><rect class="cell off" x="456" y="30" width="40" height="32"/>
<rect class="cell off" x="330" y="64" width="40" height="32"/><rect class="cell hot" x="372" y="64" width="40" height="32"/><rect class="cell off" x="414" y="64" width="40" height="32"/><rect class="cell off" x="456" y="64" width="40" height="32"/>
<rect class="cell off" x="330" y="98" width="40" height="32"/><rect class="cell hot" x="372" y="98" width="40" height="32"/><rect class="cell off" x="414" y="98" width="40" height="32"/><rect class="cell off" x="456" y="98" width="40" height="32"/>
<text class="cap" x="413" y="150">BatchNorm: across the batch</text>
</svg>
</div>

- layer norm: per example, across features — batch-size independent
- batch norm: per feature, across the batch
- LLMs need freedom in batch size · distributed training

::: narration
If you know batch normalization from earlier deep learning, the contrast is worth thirty seconds. Batch norm normalizes each feature across all the examples in a batch — a column-wise operation that ties every example's statistics to whoever else happens to share the batch. Layer norm turns the operation ninety degrees: each example is normalized across its own features, independently of every other example. For large language models that independence is decisive. Batch sizes vary with hardware and memory pressure, sometimes down to a single sequence at inference time, and training is often sharded across many devices where computing batch-wide statistics would mean synchronizing them. Layer norm needs none of that — each token vector carries everything required to normalize itself.
:::

---
## Where it will sit

- **before** the attention module
- **before** the feed-forward network
- once more, **after** the final block
- the pre-LayerNorm arrangement — details in Part V

::: narration
Layer normalization appears three ways in the finished model. Inside every transformer block it runs twice: once immediately before the attention module, and once immediately before the feed-forward network. Then, after the last of the twelve blocks, one final normalization cleans up the output before the model's prediction head. Placing the normalization before each sublayer rather than after is called the pre-LayerNorm arrangement, and it's one of the quiet differences between GPT-2 and the original transformer paper. Why that ordering matters for training is a story for the transformer block section — for now, the module is built, tested, and ready to be placed.
:::

---
<!-- .slide: class="divider" -->
### Part III
## GELU and the feed-forward network

::: narration
Part three builds the second and third components: the GELU activation function, and the small feed-forward network that uses it. This is the part of the transformer block that does its thinking one position at a time — and the place where most of the model's parameters actually live.
:::

---
## Beyond ReLU

- ReLU: $\max(0, x)$ — simple, but a hard corner at zero
- negative inputs → output 0, gradient 0
- LLMs prefer smooth gates: **GELU**, SwiGLU
- GPT-2 uses GELU throughout

::: narration
The classic activation function in deep learning is ReLU: pass positives through, clamp negatives to zero. It is cheap and effective, but it has a hard corner at zero, and everything to the left of that corner is flat — a negative input produces zero output and, worse, zero gradient, so a unit that drifts negative stops learning entirely. Modern language models almost universally swap ReLU for smoother alternatives. The two notable ones are GELU, the Gaussian error linear unit, and SwiGLU, a sigmoid-gated variant used in more recent architectures. GPT-2 uses GELU, so that's what gets built here.
:::

---
## GELU, defined

$$\mathrm{GELU}(x) = x \cdot \Phi(x)$$

$$\approx 0.5 \cdot x \cdot \left(1 + \tanh\left[\sqrt{2/\pi}\cdot(x + 0.044715\cdot x^3)\right]\right)$$

- $\Phi$: the Gaussian cumulative distribution
- in practice: the cheap tanh approximation
- found by curve fitting — and GPT-2 was trained with it

::: narration
GELU has a clean definition: the input times the cumulative distribution function of the standard Gaussian, evaluated at that input. Intuitively, each value is scaled by the probability that a standard normal variable falls below it — large positives pass through almost untouched, large negatives are crushed toward zero, and the transition between the two is gradual rather than abrupt. Computing the exact Gaussian CDF is relatively expensive, so practice substitutes a tanh-based approximation, with its oddly specific constant zero point zero four four seven one five discovered by curve fitting. That approximation isn't a corner being cut in this book — the original GPT-2 was itself trained with it, so implementing the approximation is implementing the real thing.
:::

---
## The shape of the gate

<div class="viz">
<svg viewBox="0 0 460 210">
<line class="axis" x1="30" y1="160" x2="440" y2="160"/>
<line class="axis" x1="235" y1="20" x2="235" y2="195"/>
<path class="edge danger" d="M30,160 L235,160 L440,62" fill="none"/>
<path class="edge good" d="M30,161 L100,161 C160,163 190,172 215,168 C230,165 240,157 265,146 C310,124 380,88 440,60" fill="none"/>
<text class="cap danger" x="90" y="140">ReLU: dead flat</text>
<text class="cap good" x="330" y="180">GELU: smooth, a slight dip</text>
</svg>
</div>

- nearly ReLU from a distance — different where it counts
- smooth everywhere · no corner
- small negative outputs, non-zero gradient, dip near $x = -0.75$

::: narration
Plot the two functions side by side and from a distance they look like siblings: flat-ish on the left, linear on the right. The differences live up close. ReLU has its sharp corner at zero and is exactly flat for every negative input. GELU is smooth everywhere — no corner, no kink — and to the left of zero it is not quite flat: it dips slightly below the axis, bottoming out around minus zero point seven five, and carries a small but genuinely non-zero slope for almost all negative values. That means a neuron receiving negative input still passes a little signal and still receives a little gradient. It contributes less than a positive neuron, but it never falls out of the learning process altogether.
:::

---
## Why smoothness pays

- optimization prefers surfaces without corners
- negative units keep a gradient — no dead neurons
- more nuanced updates in very deep networks
- a small change with compounding returns over 12 blocks

::: narration
Why should such a small change to one scalar function matter? Two reasons. First, optimization: gradient descent navigates the loss surface more gracefully when the functions composing it are smooth, and ReLU's corner can make that navigation jumpier, especially in very deep or architecturally complex networks. Second, the dead-neuron problem: with ReLU, a unit whose inputs go negative contributes nothing and learns nothing; with GELU, it keeps a faint voice and a faint gradient, so it can recover. Each effect is modest at the scale of one activation. But this function runs billions of times across twelve blocks and thousands of hidden units, and small improvements to training dynamics compound at that scale.
:::

---
## The FeedForward module

```python
class FeedForward(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(cfg["emb_dim"], 4 * cfg["emb_dim"]),
            GELU(),
            nn.Linear(4 * cfg["emb_dim"], cfg["emb_dim"]),
        )

    def forward(self, x):
        return self.layers(x)
```

- linear up · GELU · linear down — that's the whole thing

::: narration
With GELU in hand, the feed-forward network is three lines of architecture: a linear layer up, the GELU gate, and a linear layer back down. The first projection expands each token's vector from seven hundred sixty-eight dimensions to four times that — three thousand seventy-two. The GELU applies its smooth nonlinearity element by element. The second projection compresses back to the original seven hundred sixty-eight. Note what this module does not do: it never mixes information between tokens. Every position is transformed by the same little network, independently and in parallel. Whatever cross-token communication the model needs is attention's job; this module is where each position gets processed on its own.
:::

---
## Expand, gate, contract

<div class="viz">
<svg viewBox="0 0 460 200">
<rect class="track" x="60" y="30" width="340" height="26" rx="4"/>
<rect class="bar" x="175" y="30" width="110" height="26" rx="4"/>
<rect class="track" x="60" y="87" width="340" height="26" rx="4"/>
<rect class="bar warn" x="30" y="87" width="400" height="26" rx="4"/>
<rect class="track" x="60" y="144" width="340" height="26" rx="4"/>
<rect class="bar" x="175" y="144" width="110" height="26" rx="4"/>
<text class="olbl" x="130" y="43">768</text>
<text class="olbl" x="130" y="100">3,072 — GELU applied here</text>
<text class="olbl" x="130" y="157">768</text>
</svg>
</div>

- 4× wider inside than outside
- a roomier space to compute in, then compress
- in-shape = out-shape → blocks can stack

::: narration
The geometry of the module is expand, gate, contract. Inside, each token temporarily lives in a representation four times wider than its usual embedding — three thousand seventy-two dimensions instead of seven hundred sixty-eight. That expansion gives the network a roomier space in which to compute: more directions in which to separate patterns before the nonlinearity picks which combinations survive. Then the contraction folds the result back to the original width. Because the module's output shape exactly matches its input shape, it composes freely — blocks can stack without any dimension bookkeeping between them. And this unassuming sandwich is where the model keeps most of its capacity: the two projection matrices here hold roughly twice the parameters of the attention module beside them.
:::

---
## Sanity check the shapes

```python
ffn = FeedForward(GPT_CONFIG_124M)
x = torch.rand(2, 3, 768)
out = ffn(x)
print(out.shape)
# torch.Size([2, 3, 768])
```

- batch 2 · 3 tokens · 768 dims — in and out
- position-wise: every token transformed identically

::: narration
As with every component, the module gets a shape test before joining the model. A random tensor with batch size two, three tokens, and seven hundred sixty-eight dimensions goes in; the output comes back with exactly the same shape. This is the invariant that matters — the feed-forward network is a shape-preserving transformation, applied position-wise. Under the hood each of those six token vectors made the round trip through three thousand seventy-two dimensions and back, but from the outside the module is a black box that respects the tensor's geometry. Two components remain before the block can be assembled.
:::

---
<!-- .slide: class="divider" -->
### Part IV
## Shortcut connections

::: narration
Part four is the shortest component and the one with the most dramatic demonstration: shortcut connections, also called skip or residual connections. They are a wiring pattern, not a layer — and the chapter proves with a five-layer experiment that they are the difference between gradients that survive and gradients that vanish.
:::

---
## The problem, measured

<div class="viz wide">
<svg viewBox="0 0 560 180">
<line class="axis" x1="40" y1="130" x2="530" y2="130"/>
<rect class="bar danger" x="60" y="128" width="52" height="2"/>
<rect class="bar danger" x="156" y="129" width="52" height="1"/>
<rect class="bar danger" x="252" y="127" width="52" height="3"/>
<rect class="bar danger" x="348" y="124" width="52" height="6"/>
<rect class="bar danger" x="444" y="108" width="52" height="22"/>
<text class="tag" x="86" y="150">layer 1</text><text class="tag" x="182" y="150">layer 2</text><text class="tag" x="278" y="150">layer 3</text><text class="tag" x="374" y="150">layer 4</text><text class="tag" x="470" y="150">layer 5</text>
<text class="cap" x="86" y="98">0.0002</text><text class="cap" x="182" y="98">0.0001</text><text class="cap" x="278" y="98">0.0007</text><text class="cap" x="374" y="98">0.0013</text><text class="cap" x="470" y="98">0.0050</text>
<text class="cap danger" x="285" y="172">mean gradient per layer — a plain 5-layer stack</text>
</svg>
</div>

- gradients shrink layer by layer, back to front
- earliest layer: 25× weaker than the last
- deep stack → early layers barely learn

::: narration
The chapter doesn't just assert the vanishing gradient problem — it builds a five-layer network and measures it. Each layer is a small linear transformation with a GELU, and after one backward pass, the code prints the mean absolute gradient at every layer. The numbers tell the story: the last layer sees a gradient around zero point zero zero five, and by the first layer it has withered to zero point zero zero zero two — twenty-five times weaker. Gradients shrink as they propagate backward, layer by layer. In a five-layer toy that's an inconvenience; in a network dozens of layers deep, the early layers would receive almost no learning signal at all.
:::

---
## The fix: add the input back

<div class="viz">
<svg viewBox="0 0 460 180">
<defs><marker id="arrSC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="80" y1="100" x2="155" y2="100" marker-end="url(#arrSC)"/>
<line class="edge" x1="285" y1="100" x2="330" y2="100" marker-end="url(#arrSC)"/>
<line class="edge" x1="376" y1="100" x2="430" y2="100" marker-end="url(#arrSC)"/>
<path class="edge good" d="M60,88 C90,20 300,20 350,84" fill="none" marker-end="url(#arrSC)"/>
<circle class="node" cx="60" cy="100" r="20"/><text class="lbl sm" x="60" y="100">x</text>
<rect class="node accent" x="157" y="76" width="128" height="48" rx="7"/><text class="lbl on-fill" x="221" y="100">layer(x)</text>
<circle class="node good" cx="353" cy="100" r="22"/><text class="lbl" x="353" y="100">+</text>
<text class="cap good" x="205" y="36">the shortcut: x skips ahead</text>
<text class="olbl" x="430" y="125">x + layer(x)</text>
</svg>
</div>

- output = layer's answer **plus** the original input
- gradient gets a bypass around every layer
- born in ResNets, for computer vision

::: narration
The fix is almost embarrassingly simple: add the layer's input to its output. Instead of passing along just the layer's transformation, pass the transformation plus the original x. Drawn as a diagram, the input takes two routes — through the layer, and around it via a shortcut that rejoins at an addition. The consequence for training is what matters: during the backward pass, the gradient flowing through that addition splits, and one copy travels the shortcut untouched by the layer's weights. Every layer acquires a bypass, so the signal can reach the earliest layers without being ground down at every step. The idea was born in residual networks for computer vision, where it first made very deep architectures trainable, and transformers inherited it wholesale.
:::

---
## In code: one conditional

```python
def forward(self, x):
    for layer in self.layers:
        layer_output = layer(x)
        if self.use_shortcut and x.shape == layer_output.shape:
            x = x + layer_output
        else:
            x = layer_output
    return x
```

- `x + layer_output` — the entire mechanism
- only legal when shapes match
- in GPT, blocks preserve shape → always applicable

::: narration
In code, the entire mechanism is one addition guarded by one condition. The experimental network walks through its layers, and where shortcuts are enabled it sets x to x plus the layer output — with the caveat that the addition is only legal when the input and output shapes match, since you cannot add tensors of different sizes. That caveat explains a design choice from earlier: the transformer block was engineered to preserve its input shape exactly, and this is why. Inside a GPT, every sublayer's output can always be added back to its input, so the shortcut applies everywhere, unconditionally.
:::

---
## The same experiment, with shortcuts

<div class="viz wide">
<svg viewBox="0 0 560 190">
<line class="axis" x1="40" y1="140" x2="530" y2="140"/>
<rect class="bar danger" x="58" y="138" width="30" height="2"/>
<rect class="bar good" x="92" y="122" width="30" height="18"/>
<rect class="bar danger" x="154" y="139" width="30" height="1"/>
<rect class="bar good" x="188" y="123" width="30" height="17"/>
<rect class="bar danger" x="250" y="139" width="30" height="1"/>
<rect class="bar good" x="284" y="113" width="30" height="27"/>
<rect class="bar danger" x="346" y="139" width="30" height="1"/>
<rect class="bar good" x="380" y="118" width="30" height="22"/>
<rect class="bar danger" x="442" y="138" width="30" height="2"/>
<rect class="bar good" x="476" y="30" width="30" height="110"/>
<text class="tag" x="89" y="160">layer 1</text><text class="tag" x="185" y="160">layer 2</text><text class="tag" x="281" y="160">layer 3</text><text class="tag" x="377" y="160">layer 4</text><text class="tag" x="473" y="160">layer 5</text>
<text class="cap good" x="107" y="108">0.22</text><text class="cap good" x="203" y="108">0.21</text><text class="cap good" x="299" y="100">0.33</text><text class="cap good" x="395" y="104">0.27</text><text class="cap good" x="491" y="18">1.33</text>
<text class="cap" x="285" y="184">red: without shortcuts · green: with — same network, same seed</text>
</svg>
</div>

- layer 1: 0.0002 → **0.22** — three orders of magnitude
- gradient stabilizes instead of decaying
- indispensable at LLM depth

::: narration
Rerun the identical five-layer experiment with shortcuts switched on, and the gradient landscape transforms. The first layer's mean gradient jumps from zero point zero zero zero two to zero point two two — three orders of magnitude stronger. And instead of decaying steadily toward the front of the network, the gradient stabilizes: the middle layers all sit around a healthy zero point two to zero point three, with the last layer largest at one point three three. Same architecture, same random seed, one addition per layer. At the depth of a real language model — twelve blocks here, forty-eight in the largest GPT-2, each containing multiple sublayers — this is not an optimization nicety. It's the load-bearing trick that makes training deep transformers possible at all.
:::

---
<!-- .slide: class="divider" -->
### Part V
## The transformer block

::: narration
Part five is the assembly. Layer normalization, GELU, the feed-forward network, shortcut connections — plus the attention module carried in from the previous chapter — now click together into the transformer block, the repeating unit that constitutes almost the entire model.
:::

---
## The block, wired

<div class="viz narrow">
<svg viewBox="0 0 320 330">
<defs><marker id="arrTB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="130" y1="310" x2="130" y2="292" marker-end="url(#arrTB)"/>
<line class="edge" x1="130" y1="262" x2="130" y2="244" marker-end="url(#arrTB)"/>
<line class="edge" x1="130" y1="214" x2="130" y2="196" marker-end="url(#arrTB)"/>
<line class="edge" x1="130" y1="176" x2="130" y2="158" marker-end="url(#arrTB)"/>
<line class="edge" x1="130" y1="138" x2="130" y2="120" marker-end="url(#arrTB)"/>
<line class="edge" x1="130" y1="90" x2="130" y2="72" marker-end="url(#arrTB)"/>
<line class="edge" x1="130" y1="42" x2="130" y2="24" marker-end="url(#arrTB)"/>
<path class="edge good" d="M130,305 C250,290 250,180 152,148" fill="none" marker-end="url(#arrTB)"/>
<path class="edge good" d="M130,160 C20,140 20,60 108,52" fill="none" marker-end="url(#arrTB)"/>
<rect class="node" x="70" y="264" width="120" height="28" rx="5"/><text class="lbl sm" x="130" y="278">LayerNorm 1</text>
<rect class="node accent" x="60" y="216" width="140" height="28" rx="5"/><text class="lbl on-fill sm" x="130" y="230">masked attention</text>
<rect class="node muted" x="80" y="178" width="100" height="18" rx="4"/><text class="lbl sm" x="130" y="187">dropout</text>
<circle class="node good" cx="130" cy="148" r="11"/><text class="lbl sm" x="130" y="148">+</text>
<rect class="node" x="70" y="92" width="120" height="28" rx="5"/><text class="lbl sm" x="130" y="106">LayerNorm 2</text>
<rect class="node warn" x="70" y="44" width="120" height="28" rx="5"/><text class="lbl sm" x="130" y="58">feed forward</text>
<circle class="node good" cx="130" cy="13" r="11"/><text class="lbl sm" x="130" y="13">+</text>
</svg>
</div>

- two sublayers: attention, then feed-forward
- each wrapped the same way: norm → work → dropout → **add**
- two shortcuts per block

::: narration
The block is two sublayers wrapped in identical scaffolding. First sublayer: normalize the incoming vectors, run masked multi-head attention, apply dropout, then add the original input back via a shortcut. Second sublayer: normalize again, run the feed-forward network, dropout again, and again add the input back. That's the entire block — norm, work, dropout, add, twice over. Attention and the feed-forward net do the actual computation; normalization keeps their inputs tame; dropout regularizes; and the two shortcuts keep gradients flowing. Notice the pattern is completely uniform. Once this wrapping is understood, the whole model reads as one idea applied repeatedly.
:::

---
## TransformerBlock in code

```python
def forward(self, x):
    shortcut = x
    x = self.norm1(x)
    x = self.att(x)
    x = self.drop_shortcut(x)
    x = x + shortcut          # shortcut 1

    shortcut = x
    x = self.norm2(x)
    x = self.ff(x)
    x = self.drop_shortcut(x)
    x = x + shortcut          # shortcut 2
    return x
```

::: narration
The forward pass reads exactly like the diagram. Stash the incoming tensor as the shortcut. Normalize, attend, drop out, and add the stash back. Then stash again, normalize, feed forward, drop out, add back, and return. The constructor, not shown, simply instantiates the parts from the configuration dictionary: a multi-head attention module with the embedding dimension, context length, head count, and bias flag from the config; the feed-forward module; two layer norms; and one dropout. Every hyperparameter flows in through that one dictionary. Ten lines of forward logic, and the hard-won components of the last three sections all find their place.
:::

---
## Pre-LayerNorm, deliberately

- GPT-2: normalize **before** each sublayer — *Pre-LN*
- the original transformer: after — *Post-LN*
- pre-LN trains more stably, without warm-up tricks
- the final extra norm cleans up after block 12

::: narration
One design choice in that code deserves its own slide: the normalization comes before each sublayer, not after. This is the pre-LayerNorm arrangement. The original transformer paper from 2017 did the opposite — attention first, then normalize — the post-LayerNorm scheme, which in practice often produces touchier training dynamics and historically leaned on careful learning-rate warm-up to converge. Placing the norm first means every sublayer receives standardized inputs and the shortcut path stays clean all the way through the network, which turns out to train more robustly. It's a quiet reminder that architecture is empirical: a change as small as reordering one operation measurably changes whether a deep model trains well.
:::

---
## Shape in, shape out

```python
x = torch.rand(2, 4, 768)
block = TransformerBlock(GPT_CONFIG_124M)
print(block(x).shape)
# torch.Size([2, 4, 768])
```

- `[2, 4, 768]` in → `[2, 4, 768]` out
- geometry preserved · **content** rewritten
- each output vector now carries context from the whole sequence

::: narration
Feed the block a random batch — two sequences, four tokens, seven hundred sixty-eight dimensions — and the output shape matches the input exactly. But don't mistake shape preservation for identity. Physically the tensor has the same geometry; semantically, every vector has been rewritten. Before the block, each position's vector described that token in isolation. After attention has mixed information across positions, each output vector is a context vector — a representation of its token as it sits within this particular sequence. Shape-in-equals-shape-out is what lets twelve of these stack without adapters; the rewriting inside is what each layer of that stack is for.
:::

---
## Two kinds of thinking

<div class="viz wide">
<svg viewBox="0 0 560 190">
<defs><marker id="arrDL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#1A3F70"/></marker></defs>
<circle class="node" cx="60" cy="60" r="16"/><circle class="node" cx="130" cy="60" r="16"/><circle class="node" cx="200" cy="60" r="16"/>
<line class="edge accent" x1="72" y1="72" x2="188" y2="74" marker-end="url(#arrDL)"/>
<line class="edge accent" x1="130" y1="76" x2="196" y2="70" marker-end="url(#arrDL)"/>
<line class="edge accent" x1="70" y1="70" x2="120" y2="70" marker-end="url(#arrDL)"/>
<text class="cap" x="130" y="130">attention: mixes **across** positions</text>
<circle class="node" cx="360" cy="90" r="16"/><circle class="node" cx="430" cy="90" r="16"/><circle class="node" cx="500" cy="90" r="16"/>
<line class="edge warn" x1="360" y1="66" x2="360" y2="40" marker-end="url(#arrDL)"/>
<line class="edge warn" x1="430" y1="66" x2="430" y2="40" marker-end="url(#arrDL)"/>
<line class="edge warn" x1="500" y1="66" x2="500" y2="40" marker-end="url(#arrDL)"/>
<text class="cap" x="430" y="130">feed-forward: transforms **each** position</text>
</svg>
</div>

- attention: relate tokens to each other
- FFN: process each token, independently, identically
- complementary — the pair is the block

::: narration
The block's two sublayers embody two complementary kinds of computation. Attention is horizontal: it looks across the sequence, letting each position gather information from the others — it's the only place in the entire model where tokens communicate. The feed-forward network is vertical: it transforms each position by itself, the same little network applied identically at every token, refining whatever representation attention just assembled. One mechanism relates; the other processes. Neither is sufficient alone — attention without the FFN can mix but barely transform, and the FFN without attention would treat text as a bag of unrelated tokens. Their alternation, twelve times over, is the model.
:::

---
<!-- .slide: class="divider" -->
### Part VI
## The full GPT model

::: narration
Part six assembles the final architecture. The dummy placeholders from part one get replaced with the real transformer block and the real layer norm, and what emerges is the complete GPT model — ready to have its parameters counted, its memory footprint measured, and its family of larger siblings mapped out.
:::

---
## The full stack

<div class="viz narrow">
<svg viewBox="0 0 320 330">
<defs><marker id="arrFS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="145" y1="310" x2="145" y2="296" marker-end="url(#arrFS)"/>
<line class="edge" x1="145" y1="266" x2="145" y2="252" marker-end="url(#arrFS)"/>
<line class="edge" x1="145" y1="232" x2="145" y2="218" marker-end="url(#arrFS)"/>
<line class="edge" x1="145" y1="148" x2="145" y2="134" marker-end="url(#arrFS)"/>
<line class="edge" x1="145" y1="104" x2="145" y2="90" marker-end="url(#arrFS)"/>
<line class="edge" x1="145" y1="60" x2="145" y2="46" marker-end="url(#arrFS)"/>
<rect class="node muted" x="85" y="268" width="120" height="28" rx="5"/><text class="lbl sm" x="145" y="282">token + position emb</text>
<rect class="node muted" x="95" y="234" width="100" height="18" rx="4"/><text class="lbl sm" x="145" y="243">dropout</text>
<rect class="node accent" x="70" y="150" width="150" height="68" rx="8"/>
<text class="lbl on-fill" x="145" y="178">transformer</text><text class="lbl on-fill" x="145" y="196">block</text>
<text class="olbl" x="250" y="184">× 12</text>
<rect class="node" x="85" y="106" width="120" height="28" rx="5"/><text class="lbl sm" x="145" y="120">final LayerNorm</text>
<rect class="node warn" x="85" y="62" width="120" height="28" rx="5"/><text class="lbl sm" x="145" y="76">linear head, no bias</text>
<text class="cap" x="145" y="30">logits: [batch, tokens, 50257]</text>
</svg>
</div>

- embed → dropout → 12 blocks → norm → project to vocab
- the head maps 768 dims onto 50,257 scores per token

::: narration
Here is the finished architecture, bottom to top. Token IDs are embedded twice — once by content through the token embedding table, once by position through the positional table — and the two vectors are summed, then lightly dropped out. The result flows through twelve transformer blocks in sequence, each one re-encoding every position with more context. A final layer normalization standardizes the last block's output. And a linear head with no bias projects each seven-hundred-sixty-eight-dimensional vector onto fifty thousand two hundred fifty-seven scores — one logit per vocabulary entry, at every position. Structurally, that's everything. The rest of this part is about what this stack costs: parameters, memory, and how the same code scales to the larger GPT-2s.
:::

---
## GPTModel in code

```python
class GPTModel(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
        self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
        self.drop_emb = nn.Dropout(cfg["drop_rate"])
        self.trf_blocks = nn.Sequential(
            *[TransformerBlock(cfg) for _ in range(cfg["n_layers"])])
        self.final_norm = LayerNorm(cfg["emb_dim"])
        self.out_head = nn.Linear(
            cfg["emb_dim"], cfg["vocab_size"], bias=False)
```

- the dummy skeleton, with every placeholder now real

::: narration
The real GPTModel class is the dummy from part one with its placeholders swapped out — literally the same skeleton, now with the genuine TransformerBlock and LayerNorm classes plugged in. The constructor builds the two embedding tables, the dropout, twelve transformer blocks unrolled into a sequential stack, the final norm, and the output head. The forward method, not shown here, is six lines: embed tokens, add positional embeddings, drop out, run the blocks, normalize, project to logits. Thanks to all the componentry being self-contained, the model that took a whole chapter to develop fits comfortably on one slide.
:::

---
## Depth is repetition

- 12 identical blocks, end to end — that's the 124M model
- GPT-2 XL: the same block, **48** times
- capacity scales by stacking, not redesign
- one class, any size — only the config changes

::: narration
It's worth pausing on how the model gets its depth: pure repetition. The 124-million-parameter GPT-2 is twelve copies of the identical block, laid end to end. The largest GPT-2, at one and a half billion parameters, uses the very same block forty-eight times, with wider embeddings. Nothing structurally new appears as these models grow — capacity scales by stacking and widening, not by redesign. That's also why the implementation needs exactly one model class: the difference between the smallest and largest GPT-2 is a handful of numbers in the configuration dictionary, a theme the family table will make concrete in a moment.
:::

---
## Count the parameters

```python
total_params = sum(p.numel() for p in model.parameters())
print(f"Total number of parameters: {total_params:,}")
# Total number of parameters: 163,009,536
```

- sum of `numel()` over every weight tensor
- **163 million** — for a "124M" model?

::: narration
With the model instantiated, one line of PyTorch counts every trainable value: sum the number of elements across all parameter tensors. The answer comes back one hundred sixty-three million, nine thousand five hundred thirty-six. Which is awkward, because this is supposed to be the famous 124-million-parameter GPT-2. The discrepancy isn't a bug in the code or the book's arithmetic — it's a genuine architectural difference between this implementation and the original, and resolving it introduces a concept called weight tying.
:::

---
## The missing 39 million: weight tying

- token embedding: shape `[50257, 768]`
- output head: shape `[50257, 768]` — identical
- original GPT-2 **reused** one matrix for both
- 163,009,536 − out_head = **124,412,160** ✓

::: narration
Print the shapes of the token embedding and the output head, and they match exactly: fifty thousand two hundred fifty-seven by seven hundred sixty-eight. One maps token IDs into vectors; the other maps vectors back onto token scores — mirror-image jobs. The original GPT-2 exploited that symmetry with weight tying: it used a single shared matrix for both roles. Subtract the output head's thirty-nine million parameters from our count and you land at one hundred twenty-four million, four hundred twelve thousand one hundred sixty — the advertised size, exactly. This implementation keeps the two matrices separate anyway: tying saves memory, but separate weights train better in the author's experience, and modern LLMs generally agree. The concept returns in chapter six, where loading OpenAI's tied weights requires knowing about it.
:::

---
## What 163M weighs

$$163{,}009{,}536 \times 4 \ \text{bytes} \approx 621.83 \ \text{MB}$$

- one float32 = 4 bytes
- 622 MB — for the **smallest** GPT-2
- and that is storage only: training multiplies it

::: narration
Parameters have a physical cost. Stored as standard 32-bit floats, four bytes each, the one hundred sixty-three million parameters occupy about six hundred twenty-two megabytes — and that's the smallest member of the GPT-2 family, the one built for laptops. The number is worth internalizing because it's only the entry fee: it counts just the weights at rest. Training adds gradients of the same size, optimizer state on top of that, and activations for every layer of every batch. The arithmetic of parameters-times-bytes, simple as it is, is the first tool for reasoning about what any given model actually demands from hardware.
:::

---
## The GPT-2 family

| model | params | emb dim | blocks | heads |
|---|---|---|---|---|
| small | 124M | 768 | 12 | 12 |
| medium | 345M | 1,024 | 24 | 16 |
| large | 762M | 1,280 | 36 | 20 |
| XL | 1,542M | 1,600 | 48 | 25 |

- same `GPTModel` class — only the config dict changes

::: narration
The GPT-2 family spans four sizes, and the table is the whole story. Small: one hundred twenty-four million parameters, embeddings seven hundred sixty-eight wide, twelve blocks, twelve heads. Medium grows to three hundred forty-five million with wider vectors and twice the depth. Large reaches seven hundred sixty-two million. And XL: one and a half billion parameters, sixteen-hundred-dimensional embeddings, forty-eight blocks, twenty-five heads. Every one of them is the identical GPTModel class built in this chapter — the book even poses instantiating the larger three as an exercise, because it requires editing nothing but the configuration dictionary. Architecture, it turns out, is the easy part to scale; the training data and compute are another matter.
:::

---
<!-- .slide: class="divider" -->
### Part VII
## Generating text

::: narration
Part seven closes the loop. The model emits logits; text generation is the machinery that turns logits back into words, one token at a time. A short greedy-decoding function is enough to make the untrained model speak — and what it says is the chapter's final lesson.
:::

---
## One token at a time

<div class="viz wide">
<svg viewBox="0 0 560 200">
<rect class="node muted" x="30" y="20" width="72" height="30" rx="5"/><rect class="node muted" x="106" y="20" width="36" height="30" rx="5"/><rect class="node muted" x="146" y="20" width="46" height="30" rx="5"/><rect class="node danger" x="196" y="20" width="36" height="30" rx="5"/>
<text class="lbl sm" x="66" y="35">Hello, I</text><text class="lbl sm" x="124" y="35">am</text><text class="lbl sm" x="169" y="35">…</text><text class="lbl sm" x="214" y="35">a</text>
<rect class="node muted" x="30" y="75" width="72" height="30" rx="5"/><rect class="node muted" x="106" y="75" width="36" height="30" rx="5"/><rect class="node muted" x="146" y="75" width="36" height="30" rx="5"/><rect class="node muted" x="186" y="75" width="46" height="30" rx="5"/><rect class="node danger" x="236" y="75" width="70" height="30" rx="5"/>
<text class="lbl sm" x="66" y="90">Hello, I</text><text class="lbl sm" x="124" y="90">am</text><text class="lbl sm" x="164" y="90">a</text><text class="lbl sm" x="209" y="90">…</text><text class="lbl sm" x="271" y="90">model</text>
<rect class="node muted" x="30" y="130" width="72" height="30" rx="5"/><rect class="node muted" x="106" y="130" width="36" height="30" rx="5"/><rect class="node muted" x="146" y="130" width="36" height="30" rx="5"/><rect class="node muted" x="186" y="130" width="70" height="30" rx="5"/><rect class="node muted" x="260" y="130" width="46" height="30" rx="5"/><rect class="node danger" x="310" y="130" width="66" height="30" rx="5"/>
<text class="lbl sm" x="66" y="145">Hello, I</text><text class="lbl sm" x="124" y="145">am</text><text class="lbl sm" x="164" y="145">a</text><text class="lbl sm" x="221" y="145">model</text><text class="lbl sm" x="283" y="145">…</text><text class="lbl sm" x="343" y="145">ready</text>
<text class="cap" x="280" y="190">each prediction is appended and fed back in</text>
</svg>
</div>

- predict → append → predict again
- the context grows with every round
- six rounds: "Hello, I am **a model ready to help.**"

::: narration
A language model generates text by iteration. Given the context Hello comma I am, it predicts one next token — say, the word a — and that token is appended to the context. The extended sequence goes back in, the model predicts again — model — and the loop continues, the input growing by one token each round. After six iterations, the running example has built Hello, I am a model ready to help. Nothing about the architecture changes during this: generation is the same forward pass, executed repeatedly, with the model's own outputs recycled as inputs. Every chatbot response you've ever watched appear word by word is this loop, running live.
:::

---
## Inside one step

<div class="viz wide">
<svg viewBox="0 0 560 170">
<defs><marker id="arrGS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="120" y1="60" x2="150" y2="60" marker-end="url(#arrGS)"/>
<line class="edge" x1="252" y1="60" x2="282" y2="60" marker-end="url(#arrGS)"/>
<line class="edge" x1="384" y1="60" x2="414" y2="60" marker-end="url(#arrGS)"/>
<rect class="node" x="20" y="36" width="100" height="48" rx="6"/><text class="lbl sm" x="70" y="54">logits of</text><text class="lbl sm" x="70" y="70">last position</text>
<rect class="node" x="152" y="36" width="100" height="48" rx="6"/><text class="lbl sm" x="202" y="60">softmax</text>
<rect class="node accent" x="284" y="36" width="100" height="48" rx="6"/><text class="lbl on-fill sm" x="334" y="60">argmax</text>
<rect class="node good" x="416" y="36" width="120" height="48" rx="6"/><text class="lbl sm" x="476" y="54">ID 257 → "a"</text><text class="lbl sm" x="476" y="70">append</text>
<text class="tag" x="70" y="115">50,257 scores</text>
<text class="tag" x="202" y="115">probabilities</text>
<text class="tag" x="334" y="115">pick the peak</text>
<text class="tag" x="476" y="115">decode + loop</text>
</svg>
</div>

- only the **last** position's logits matter for the next token
- softmax → probabilities · argmax → the winner's index
- index **is** the token ID → decode to text

::: narration
Zoom into a single step of that loop. The model outputs logits at every position, but for predicting what comes next, only the last position's vector matters — fifty thousand two hundred fifty-seven raw scores for the next token. Softmax converts those scores into a probability distribution. Argmax finds the index of the largest probability, and by construction that index is the token ID — in the running example, position two fifty-seven wins, which the tokenizer decodes as the word a. The new ID is appended to the input sequence, and the loop repeats. Score, normalize, pick, decode, append: five small operations between a trained matrix of numbers and readable language.
:::

---
## Greedy, and honest about it

- argmax = always take the single most likely token
- *greedy decoding* — deterministic, no variety
- softmax is monotonic → the softmax step is redundant
- kept for intuition · real sampling arrives with training

::: narration
Always picking the highest-scoring token is called greedy decoding. It's deterministic — the same context always yields the same continuation — which makes it perfect for testing and reproducibility, and rather flat for creative text. The chapter is also honest about a subtlety: the softmax step is technically redundant. Softmax is monotonic, meaning it preserves the ordering of its inputs, so the highest probability sits at exactly the same index as the highest raw logit — argmax on the logits would give the identical answer. The conversion is kept because seeing an explicit probability distribution builds the right intuition, and because the next chapter replaces greedy selection with genuine sampling from that distribution, where the probabilities stop being optional.
:::

---
## generate_text_simple

```python
def generate_text_simple(model, idx, max_new_tokens, context_size):
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -context_size:]
        with torch.no_grad():
            logits = model(idx_cond)
        logits = logits[:, -1, :]
        probas = torch.softmax(logits, dim=-1)
        idx_next = torch.argmax(probas, dim=-1, keepdim=True)
        idx = torch.cat((idx, idx_next), dim=1)
    return idx
```

- crop → forward → last row → pick → append → repeat

::: narration
The generation function is the loop made literal, eight lines long. Each iteration crops the running sequence to the model's context window, runs the forward pass — inside no-grad, since generation needs no gradients — takes the last position's logits, softmaxes them, argmaxes the result into a next-token ID, and concatenates that ID onto the sequence. After the requested number of new tokens, it returns the extended sequence, ready for the tokenizer to decode. Every piece of this chapter is now in play: the config defines the model, the model turns IDs into logits, and this function turns logits into language.
:::

---
## The crop, explained

- `idx[:, -context_size:]` — keep only the newest 1,024 tokens
- positional embeddings exist for 1,024 slots, no more
- older tokens fall out of view: a sliding window
- the model's hard horizon

::: narration
One line of the function deserves its own explanation: the crop. Before each forward pass, the sequence is sliced to its most recent context-size tokens — one thousand twenty-four for this model. The limit is physical, not stylistic: the positional embedding table has exactly one thousand twenty-four rows, so the model simply has no representation for a position beyond that. When a conversation or document outgrows the window, the oldest tokens slide out of view and the model proceeds as if they never existed. That sliding window is the model's hard horizon — and the reason context length is a headline specification when comparing language models.
:::

---
## Moment of truth

```python
model.eval()  # disable dropout for inference
out = generate_text_simple(
    model=model,
    idx=text_to_token_ids("Hello, I am", tokenizer),
    max_new_tokens=6,
    context_size=GPT_CONFIG_124M["context_length"])
print(token_ids_to_text(out, tokenizer))
# "Hello, I am Featureiman Byeswickattribute argue"
```

- eval mode: dropout off — inference must be deterministic
- six new tokens... and they are gibberish

::: narration
The moment of truth. The model is switched into eval mode — which disables dropout, a training-only behavior that would randomly corrupt inference — and the generation function is pointed at the prompt Hello comma I am, asked for six new tokens. The pipeline works flawlessly: encode, generate, decode. And the output reads: Hello, I am Featureiman Byeswickattribute argue. Perfect machinery, perfect nonsense. Every shape checks out, every module does its job, the loop appends real tokens from the real vocabulary — and the result is word salad.
:::

---
## Why the gibberish is good news

- the weights are **random** — the model has never seen text
- architecture supplies structure, not knowledge
- coherence is not in the wiring; it is learned
- next: pretraining, where the weights earn their values

::: narration
The gibberish is not a failure — it's the chapter's cleanest lesson. This model has the full GPT-2 architecture: correct attention, correct normalization, correct generation loop. What it lacks is training. Its one hundred sixty-three million parameters still hold their random initial values; it has never seen a sentence of actual text. Everything that makes a language model impressive — grammar, facts, coherence, style — lives in the values of the weights, not in the wiring between them. Architecture supplies the capacity to learn; the learning itself hasn't happened yet. Which sets up the next chapter precisely: pretraining, where a loss function, a dataset, and a training loop turn this beautifully structured random-number generator into something that can write.
:::

---
<!-- .slide: class="statement" -->
Architecture is capacity. Training is knowledge.

::: narration
If the chapter compresses to one sentence, it is this: architecture is capacity, training is knowledge. Everything built here — the normalization, the activations, the shortcuts, the blocks — determines what the model could learn, how deep the gradients can reach, how much context each prediction can draw on. None of it determines what the model knows. The same wiring that emitted gibberish today will, with trained weights, complete sentences, answer questions, and follow instructions. Keeping those two contributions separate in your head is the surest way to reason clearly about language models.
:::

---
## What we built

- **config** — 7 numbers defining GPT-2 small
- **LayerNorm** — stable activations, per token
- **GELU + FeedForward** — smooth gate, 4× expand-contract
- **shortcuts** — gradients that survive 12 blocks
- **TransformerBlock × 12 → GPTModel** — 163M params, 622 MB
- **generate_text_simple** — greedy decoding, token by token

::: narration
A complete inventory of the chapter. A seven-entry configuration dictionary specifying GPT-2 small. A layer normalization module that standardizes every token vector, with learned scale and shift. The GELU activation and the feed-forward network that expands each position fourfold and contracts it back. Shortcut connections, demonstrated to rescue gradients from vanishing across depth. The transformer block wiring all of it around masked multi-head attention — stacked twelve times, wrapped with embeddings and an output head, into a GPT model of one hundred sixty-three million parameters and six hundred twenty-two megabytes. And a greedy generation loop that lets the model speak. Every line of it written by hand, every module tested along the way.
:::

---
## Next: teach it to talk

- chapter 5: pretraining on unlabeled data
- a loss function for language · a training loop
- decoding with temperature and top-k
- and loading OpenAI's real GPT-2 weights

::: narration
The road continues in chapter five with pretraining. That means defining what it is for a next-token prediction to be wrong — the cross-entropy loss over exactly the logits this model produces — and building the loop that grinds that loss down over a real text corpus. It also means better generation: temperature scaling and top-k sampling to replace rigid greedy decoding with controlled randomness. And as a shortcut past weeks of compute, it means loading OpenAI's actual pretrained GPT-2 weights into this very implementation — at which point the architecture built in this deck stops producing gibberish and starts producing English.
:::
