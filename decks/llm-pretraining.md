# Pretraining an LLM

---
## Pretraining an LLM

- from random weights to readable English
- Raschka, *Build a Large Language Model (From Scratch)*, ch. 5
- a loss for language → a training loop → sampling → OpenAI's weights

::: narration
This is the chapter where the model learns to talk. The previous deck built a complete GPT-2 architecture that generated confident gibberish, because its one hundred sixty-three million parameters were random numbers. Following chapter five of Sebastian Raschka's Build a Large Language Model, this deck covers pretraining end to end: first defining a numerical measure of how bad the model's text is — the cross-entropy loss — then building the training loop that grinds that loss down, then the decoding strategies of temperature and top-k sampling that make generated text less robotic, then saving and restoring weights. And at the end, a shortcut past weeks of compute: loading OpenAI's actual pretrained GPT-2 weights into the model built by hand, and watching it produce real English.
:::

---
<!-- .slide: class="divider" -->
### Part I
## A loss for language

::: narration
Part one answers the question every training process starts with: what, numerically, does it mean for generated text to be wrong? The answer builds in small steps — from token probabilities, through logarithms, to a single number called the cross-entropy loss — and each step is computed by hand before PyTorch's built-in function takes over.
:::

---
## The setup, slightly shrunk

```python
GPT_CONFIG_124M = {
    "vocab_size": 50257,
    "context_length": 256,   # was 1,024
    "emb_dim": 768,
    "n_heads": 12,
    "n_layers": 12,
    "drop_rate": 0.1,
    "qkv_bias": False
}
```

- one change from chapter 4: context 1,024 → **256**
- cheaper training on a laptop · restored later for the real weights

::: narration
The model is the GPTModel class from the previous chapter, with exactly one configuration change: the context length drops from one thousand twenty-four tokens to two hundred fifty-six. Shorter contexts mean smaller tensors and cheaper gradients, which is what makes it possible to train this model on an ordinary laptop in minutes rather than hours. It's a temporary concession — at the end of the chapter, when OpenAI's pretrained weights arrive, the setting goes back up to the full one thousand twenty-four they were trained with. The dropout rate stays at ten percent, though the book notes that training LLMs without dropout at all is increasingly common.
:::

---
## Two small helpers

```python
def text_to_token_ids(text, tokenizer):
    encoded = tokenizer.encode(text,
        allowed_special={'<|endoftext|>'})
    return torch.tensor(encoded).unsqueeze(0)

def token_ids_to_text(token_ids, tokenizer):
    return tokenizer.decode(token_ids.squeeze(0).tolist())
```

- text ⇄ token IDs, with the batch dimension handled
- `unsqueeze(0)` adds it · `squeeze(0)` removes it

::: narration
Two utility functions smooth over a conversion that happens constantly from here on: turning text into a tensor of token IDs and back. The encoder wraps the tiktoken tokenizer and then unsqueezes a batch dimension onto the front, because the model expects batches even when there's only one sequence. The decoder squeezes that dimension back off and detokenizes. They're trivial, but they remove a whole class of shape bugs, and they make every experiment in the chapter read as one line: encode, generate, decode. With the plumbing in place, the first thing to do is listen to what the untrained model has to say.
:::

---
## The round trip

<div class="viz wide">
<svg viewBox="0 0 560 150">
<defs><marker id="arrRT" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="118" y1="60" x2="146" y2="60" marker-end="url(#arrRT)"/>
<line class="edge" x1="248" y1="60" x2="276" y2="60" marker-end="url(#arrRT)"/>
<line class="edge" x1="380" y1="60" x2="408" y2="60" marker-end="url(#arrRT)"/>
<rect class="node muted" x="20" y="36" width="98" height="48" rx="6"/><text class="lbl sm" x="69" y="60">text in</text>
<rect class="node" x="148" y="36" width="100" height="48" rx="6"/><text class="lbl sm" x="198" y="54">token IDs</text><text class="lbl mono sm" x="198" y="72">[1, 4]</text>
<rect class="node accent" x="278" y="36" width="102" height="48" rx="6"/><text class="lbl on-fill sm" x="329" y="54">GPT → logits</text><text class="lbl on-fill mono sm" x="329" y="72">[1, 4, 50257]</text>
<rect class="node good" x="410" y="36" width="130" height="48" rx="6"/><text class="lbl sm" x="475" y="54">IDs → text out</text><text class="lbl mono sm" x="475" y="72">decode</text>
<text class="cap" x="285" y="125">tokenizer in → model → tokenizer out: every generation, every loss</text>
</svg>
</div>

- encode → forward → decode: the cycle beneath everything
- the loss will attach to the middle arrow
- the same three steps at train and inference time

::: narration
It helps to fix the full round trip in mind, because both generation and training attach to it. Text enters through the tokenizer and becomes a row of token IDs. The model maps those IDs to logits — one vocabulary-wide vector of scores per input position. And the tokenizer's decoder turns chosen token IDs back into readable text. Generation runs this cycle in a loop, appending as it goes. Evaluation, the business of this part, attaches to the middle arrow: it never decodes anything, but instead asks how the logits distribute their belief over what the next token should be. Same pipeline, two uses — one produces text, the other produces a grade.
:::

---
## Baseline: the untrained voice

```text
Input:  "Every effort moves you"

Output: "Every effort moves you rentingetic wasn?
         refres RexMeCHicular stren"
```

- structurally a sentence · semantically noise
- "coherent" needs a **number**, not a feeling

::: narration
Prompted with Every effort moves you, the untrained model continues: rentingetic wasn question mark refres RexMeCHicular stren. It's noise — but notice that calling it noise is a human judgment. To train a model, that judgment has to become a number: a quantity that is large when the output is garbage, small when it's good, and differentiable, so that every weight in the network can be nudged in the direction that shrinks it. That number is the loss, and constructing it is the real work of this part. The construction starts from an idea simpler than it sounds: a model is good when it assigns high probability to the text that actually comes next.
:::

---
## Inputs and targets: shift by one

```python
inputs  = torch.tensor([[16833, 3626, 6100],   # every effort moves
                        [40,    1107, 588 ]])  # I really like

targets = torch.tensor([[3626, 6100, 345  ],   # effort moves you
                        [1107, 588,  11311]])  # really like chocolate
```

- targets = the same text, one position later
- every position is a next-word exam
- no labels needed — the text grades itself

::: narration
Training data for a language model is beautifully cheap to make: the targets are just the inputs shifted one position forward. For the text every effort moves you, the input tokens are every, effort, moves, and the targets are effort, moves, you — at each position, the right answer is simply the next word of the original text. This is why it's called pretraining on unlabeled data. No human ever annotates anything; running text grades itself, and every position in every sentence of every document becomes an exam question. Here the working example is two tiny three-token sequences, small enough to trace every number through the loss computation by hand.
:::

---
## What the model believes

```python
with torch.no_grad():
    logits = model(inputs)
probas = torch.softmax(logits, dim=-1)
print(probas.shape)
# torch.Size([2, 3, 50257])
```

- softmax over the vocabulary, at every position
- a full probability distribution per token
- the question: how much weight lands on the **correct** next token?

::: narration
Run the inputs through the model and apply softmax over the last dimension, and the logits become probabilities: a tensor of shape two by three by fifty thousand two hundred fifty-seven. For each of the three positions in each of the two sequences, the model publishes a complete probability distribution over its vocabulary — its honest belief about what comes next. Evaluating the model is now a lookup, not a judgment call: go to each position, find the entry corresponding to the true next token from the targets tensor, and read off how much probability the model gave it. A good model piles probability on the right answers. This one, being untrained, does not.
:::

---
## Argmax says: wrong

```python
token_ids = torch.argmax(probas, dim=-1, keepdim=True)

# Targets batch 1:  " effort moves you"
# Outputs batch 1:  " Armed heNetflix"
```

- decode the model's best guesses next to the truth
- "effort moves you" vs **"Armed heNetflix"**
- zero overlap — and now it can be scored

::: narration
Before scoring with probabilities, a blunter comparison: apply argmax to the probability tensor to get the model's single best guess at every position, and decode those guesses next to the targets. Where the truth reads effort moves you, the untrained model offers Armed heNetflix. Not one position matches. This is the same gibberish as before, but now displayed in the exact shape training will use — a predicted token versus a correct token, position by position. The argmax view is too coarse to train on, though: a guess is either right or wrong, with no gradient in between. The probabilities behind those guesses are where the trainable signal lives.
:::

---
## The verdict of the numbers

- text 1 target probabilities: **7.5e-5 · 3.1e-5 · 1.2e-5**
- text 2: **1.0e-5 · 5.7e-5 · 4.8e-6**
- random chance: 1 / 50,257 ≈ **2e-5**
- training's whole job: push these values up

::: narration
The probabilities the untrained model assigns to the correct next tokens are minuscule: around seven in a hundred thousand for the first, three in a hundred thousand for the second, and so on down to under five in a million. For calibration, pure random guessing over a fifty-thousand-token vocabulary would put about two in a hundred thousand on each answer — and these numbers hover right around that chance level, exactly what random weights should produce. This gives training its one-sentence job description: adjust the weights so that the probability at the correct positions goes up. Everything else — the loss function, backpropagation, the optimizer — is machinery for doing precisely that, at scale, for every position in the corpus.
:::

---
## How the weights will move

- backpropagation: the standard recipe for deep networks
- needs a **loss** — one number measuring "how far off"
- gradients of the loss flow backward through every layer
- each weight nudged the way that shrinks the loss

::: narration
A quick word on the machinery that will consume this loss, because it explains the requirements. Training updates weights by backpropagation: compute a loss at the output, then let calculus carry its gradient backward through every layer, so that each of the hundred sixty-three million weights learns which direction locally reduces the loss. The procedure imposes two demands. The measure of quality must be a single number — you can't differentiate a paragraph of criticism — and it must be differentiable, connected to the weights by smooth operations. Probabilities from a softmax satisfy both. That is really why text quality becomes arithmetic on probabilities: not because it's natural, but because that's the shape backpropagation can use.
:::

---
## From probabilities to one number

<div class="viz wide">
<svg viewBox="0 0 560 150">
<defs><marker id="arrLS" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="140" y1="60" x2="168" y2="60" marker-end="url(#arrLS)"/>
<line class="edge" x1="282" y1="60" x2="310" y2="60" marker-end="url(#arrLS)"/>
<line class="edge" x1="412" y1="60" x2="440" y2="60" marker-end="url(#arrLS)"/>
<rect class="node" x="30" y="36" width="110" height="48" rx="6"/><text class="lbl sm" x="85" y="54">target</text><text class="lbl sm" x="85" y="70">probabilities</text>
<rect class="node" x="170" y="36" width="112" height="48" rx="6"/><text class="lbl sm" x="226" y="54">log of each</text><text class="lbl mono sm" x="226" y="72">−9.5 … −12.3</text>
<rect class="node" x="312" y="36" width="100" height="48" rx="6"/><text class="lbl sm" x="362" y="54">average</text><text class="lbl mono sm" x="362" y="72">−10.79</text>
<rect class="node accent" x="442" y="36" width="100" height="48" rx="6"/><text class="lbl on-fill sm" x="492" y="54">negate</text><text class="lbl on-fill mono sm" x="492" y="72">10.79</text>
<text class="cap" x="280" y="125">log → average → negate: the cross-entropy recipe</text>
</svg>
</div>

- logs tame tiny numbers — and make products into sums
- average over all positions · flip the sign
- the result: a loss to **minimize**

::: narration
Turning six tiny probabilities into one trainable number takes three steps. First, take the logarithm of each — partly because optimization behaves far better on log scale, where numbers like ten to the minus five become manageable values like minus nine or minus twelve. Second, average the logs across all positions, condensing them into a single score: here, minus ten point seven nine. Third, negate it. That sign flip is pure convention — deep learning frameworks minimize things, so instead of pushing the average log probability up toward zero, training pushes its negative down toward zero. The resulting quantity, positive ten point seven nine for this model, is the negative average log probability — better known by another name.
:::

---
## The intermediate numbers

```python
log_probas = torch.log(torch.cat(
    (target_probas_1, target_probas_2)))
# tensor([ -9.5042, -10.3796, -11.3677,
#         -11.4798,  -9.7764, -12.2561])

avg_log_probas = torch.mean(log_probas)
# tensor(-10.7940)
```

- six probabilities → six logs → one mean
- −10.79: the average log probability
- negate it, and the loss is born: **10.7940**

::: narration
Here are the actual intermediate values, worth seeing once in the flesh. The six target probabilities, each around ten to the minus five, become six logarithms between roughly minus nine and a half and minus twelve and a quarter — awkward exponents transformed into comfortable, comparable magnitudes. Their mean is minus ten point seven nine four zero. Multiply by minus one, and that's the loss: positive ten point seven nine four zero, a number that shrinks toward zero as the model piles probability onto correct tokens. Every step so far was three or four characters of PyTorch. The next slide shows the one-liner that does it all — after one piece of tensor bookkeeping.
:::

---
## Two tensors, flattened

```python
print(logits.shape)   # torch.Size([2, 3, 50257])
print(targets.shape)  # torch.Size([2, 3])

logits_flat = logits.flatten(0, 1)   # [6, 50257]
targets_flat = targets.flatten()     # [6]
```

- cross_entropy wants rows, not batches
- merge batch × position into one axis
- 6 predictions, 6 correct answers — shape ready

::: narration
One piece of bookkeeping stands between the tensors and PyTorch's loss function. The logits arrive as batch by position by vocabulary — two by three by fifty thousand two fifty-seven — and the targets as batch by position. Cross entropy's interface is flatter: it wants a simple list of predictions and a matching list of answers. Flattening the first two dimensions together produces six rows of fifty thousand scores and six target IDs. Nothing is lost in the merge; for a language model every position is an independent prediction anyway, so batch and position were only ever organizational. Six exam questions, six answer keys, shapes aligned.
:::

---
## Its famous name: cross entropy

```python
loss = torch.nn.functional.cross_entropy(
    logits.flatten(0, 1),   # [6, 50257]
    targets.flatten()       # [6]
)
# tensor(10.7940)
```

- one built-in = all the steps: softmax, lookup, log, average, negate
- takes raw **logits**, not probabilities
- flatten batch × position into rows first

::: narration
The quantity just built by hand is the cross-entropy loss, one of the most used measures in machine learning — formally, a measure of the distance between two probability distributions, here the model's predicted distribution and the true one where all the mass sits on the correct token. PyTorch ships it as a single function, and it performs every step internally: the softmax, the target lookup, the logarithm, the averaging, the negation. Two practical notes. It wants raw logits, not probabilities — it applies its own softmax, in a numerically safer way. And it expects flat inputs, so batch and position dimensions get flattened together first: six rows of fifty thousand scores, six target IDs. The result matches the hand computation exactly: ten point seven nine four zero.
:::

---
## Perplexity, the readable twin

$$\mathrm{perplexity} = e^{\mathrm{loss}} = e^{10.7940} \approx 48{,}725$$

- "the model is choosing among ~48,725 tokens"
- a trained model's perplexity: a handful
- same information as the loss — human units

::: narration
Cross entropy has a more interpretable twin: perplexity, which is just e raised to the loss. For this untrained model, e to the ten point seven nine is about forty-eight thousand seven hundred twenty-five — and the interpretation is lovely. Perplexity is the effective size of the choice the model faces: this model is as uncertain as if it were picking uniformly among roughly forty-eight thousand seven hundred tokens, nearly its whole fifty-thousand-token vocabulary. A well-trained model might have single-digit perplexity — as confused as a choice among a handful of words. Loss and perplexity carry the same information; perplexity just speaks in vocabulary sizes instead of nats, which makes progress tangible.
:::

---
<!-- .slide: class="divider" -->
### Part II
## Data, and what it costs

::: narration
Part two prepares the training data — a single short story, deliberately tiny — and splits it into training and validation portions. It also pauses on a sidebar worth taking seriously: what pretraining costs when the dataset is not tiny.
:::

---
## The whole corpus: one short story

- Edith Wharton, *The Verdict* — public domain
- **20,479** characters · **5,145** tokens
- absurdly small, deliberately: minutes on a laptop
- the pipeline is the lesson — it scales unchanged

::: narration
The training corpus is a single Edith Wharton short story, The Verdict — public domain, so no licensing worries — totaling twenty thousand four hundred seventy-nine characters, or five thousand one hundred forty-five tokens after byte-pair encoding. As training data for a hundred-million-parameter model, that is comically small, and the book is upfront about it: the point is educational. A corpus this size trains in about five minutes on a laptop, which means every experiment can actually be run. The pipeline itself — loaders, loss, loop — is identical to what a serious pretraining run would use; only the data volume changes. For readers who want the real thing, the book points to a supplementary sixty-thousand-book Project Gutenberg setup.
:::

---
## What the real thing costs

- Llama 2 **7B**: 184,320 A100 GPU-hours
- 2 **trillion** training tokens
- ≈ **$690,000** of cloud compute
- pretraining is for institutions — fine-tuning is for everyone

::: narration
The sidebar on cost deserves its own slide, because it frames the whole economics of working with LLMs. Training Llama 2's seven-billion-parameter model — a modest size by frontier standards — took one hundred eighty-four thousand three hundred twenty hours of A100 GPU time, chewing through two trillion tokens. At the cloud rates the book quotes, that's roughly six hundred ninety thousand dollars for one pretraining run of one model size. This is why loading pretrained weights, the finale of this chapter, isn't a shortcut for the lazy — it's how the entire field operates. Institutions pretrain; everyone else builds on the result. The chapters after this one, on fine-tuning, are the practical payoff of that division of labor.
:::

---
## Ninety-ten split

```python
train_ratio = 0.90
split_idx = int(train_ratio * len(text_data))
train_data = text_data[:split_idx]
val_data = text_data[split_idx:]
```

- train on 90% · hold out 10% the model never trains on
- validation loss = the honesty check
- memorization shows up as a gap between the two

::: narration
Before training, the text splits in two: the first ninety percent becomes training data, the final ten percent becomes validation data the model never trains on. The reason is honesty. Training loss measures how well the model fits text it has already seen — a number the model can flatter by memorizing. Validation loss asks the question that matters: how well does the model predict text it has never encountered? As long as both fall together, the model is genuinely learning the language. The moment training loss keeps improving while validation loss stalls, the model has stopped learning English and started memorizing Wharton — a failure mode this tiny corpus will demonstrate vividly within a few slides.
:::

---
## Batches on tap

```python
train_loader = create_dataloader_v1(
    train_data, batch_size=2,
    max_length=GPT_CONFIG_124M["context_length"],  # 256
    stride=GPT_CONFIG_124M["context_length"],
    drop_last=True, shuffle=True)
```

- the chapter-2 loader, reused: chunk · shift · batch
- 9 training batches, 1 validation batch — each `[2, 256]`
- targets built in: inputs shifted by one

::: narration
The data loader is reused from chapter two, and it does three things: slices the token stream into chunks of two hundred fifty-six, pairs each chunk with its shift-by-one target, and serves them shuffled in batches of two. With stride equal to the window length, chunks don't overlap. On this corpus that yields nine training batches and a single validation batch, each a two-by-two-fifty-six tensor of inputs with matching targets. Batch size two is tiny — real LLM training uses batches in the thousands — but it fits a laptop, and nothing structural changes with scale. The loss machinery from part one can now be pointed at an entire loader instead of a toy tensor: average the batch losses, and you have the loss for a whole dataset.
:::

---
## Checking the loaders

```python
for x, y in train_loader:
    print(x.shape, y.shape)
# torch.Size([2, 256]) torch.Size([2, 256])
# ... nine times

# Validation loader:
# torch.Size([2, 256]) torch.Size([2, 256])
```

- 9 training batches · 1 validation batch
- inputs and targets: same shape, shifted content
- thirty seconds of checking, hours of debugging saved

::: narration
A quick sanity pass before training: iterate both loaders and print every batch's shapes. Nine training batches arrive, each a two-by-two-fifty-six input tensor with an identically shaped target tensor — same shape because the targets are the same tokens shifted one position, as chapter two's loader arranged. The validation split, at ten percent of an already tiny corpus, yields exactly one batch. The habit being modeled here is worth naming: before any training run, walk the data pipeline end to end and look at the shapes. It costs thirty seconds, and it catches the class of bug — silent misalignment between inputs and targets — that otherwise surfaces as a mysteriously unlearnable model hours later.
:::

---
## The starting line

```python
with torch.no_grad():
    train_loss = calc_loss_loader(train_loader, model, device)
    val_loss = calc_loss_loader(val_loader, model, device)
# Training loss:   10.98758347829183
# Validation loss: 10.98110580444336
```

- both ≈ 10.99 — chance level, as predicted
- train ≈ val: the model knows neither set
- everything is in place: data, loss, baseline

::: narration
Two small utilities — one computing the cross entropy of a single batch, one averaging that over a loader — measure the starting line. Training loss: ten point nine nine. Validation loss: ten point nine eight. Two things to read off. The values sit almost exactly at the log of the vocabulary size, which is what pure guessing predicts — the model knows nothing, quantitatively confirmed. And the two numbers are nearly identical, which makes sense: a model that knows nothing is equally ignorant of text it has and hasn't seen. Data, loss function, and baseline are all in place. What remains is the loop that makes these numbers fall.
:::

---
<!-- .slide: class="divider" -->
### Part III
## The training loop

::: narration
Part three is the heart of the chapter: the pretraining loop itself. It is a standard PyTorch training loop — epochs over batches, gradients, optimizer steps — instrumented with two eyes: periodic loss evaluation, and a sample of generated text after every epoch, so you can literally watch the model learn to write.
:::

---
## The shape of the loop

<div class="viz">
<svg viewBox="0 0 460 240">
<defs><marker id="arrTL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="120" y1="60" x2="165" y2="60" marker-end="url(#arrTL)"/>
<line class="edge" x1="285" y1="60" x2="330" y2="60" marker-end="url(#arrTL)"/>
<line class="edge" x1="390" y1="84" x2="390" y2="120" marker-end="url(#arrTL)"/>
<line class="edge" x1="330" y1="145" x2="285" y2="145" marker-end="url(#arrTL)"/>
<line class="edge" x1="165" y1="145" x2="120" y2="145" marker-end="url(#arrTL)"/>
<path class="edge ghost" d="M65,120 C40,100 40,84 65,80" fill="none" marker-end="url(#arrTL)"/>
<rect class="node" x="20" y="36" width="100" height="48" rx="6"/><text class="lbl sm" x="70" y="54">zero the</text><text class="lbl sm" x="70" y="70">gradients</text>
<rect class="node accent" x="167" y="36" width="118" height="48" rx="6"/><text class="lbl on-fill sm" x="226" y="54">loss on</text><text class="lbl on-fill sm" x="226" y="70">this batch</text>
<rect class="node" x="332" y="36" width="116" height="48" rx="6"/><text class="lbl sm" x="390" y="54">backward:</text><text class="lbl sm" x="390" y="70">gradients</text>
<rect class="node good" x="332" y="121" width="116" height="48" rx="6"/><text class="lbl sm" x="390" y="139">optimizer</text><text class="lbl sm" x="390" y="155">step</text>
<rect class="node muted" x="120" y="121" width="165" height="48" rx="6"/><text class="lbl sm" x="202" y="139">track losses ·</text><text class="lbl sm" x="202" y="155">sample some text</text>
<text class="cap" x="230" y="215">per batch, per epoch — repeat until the loss stops falling</text>
</svg>
</div>

- zero grads → loss → backward → step
- the standard PyTorch cycle, nothing LLM-specific
- plus two monitoring habits: losses and samples

::: narration
The loop's shape is the standard deep-learning cycle, and it's worth seeing that there is nothing exotic about it. For each batch in each epoch: reset the gradients from the previous step so they don't accumulate; compute the loss on the current batch — the cross entropy from part one; call backward, which backpropagates and fills every parameter's gradient; and let the optimizer take a step, nudging all one hundred sixty-three million weights downhill. Wrapped around that core are two monitoring habits: every few steps, evaluate the loss on both training and validation sets; and after every epoch, generate a sample of text. The numbers say whether the model is learning; the samples say what it's learning.
:::

---
## train_model_simple

```python
for epoch in range(num_epochs):
    model.train()
    for input_batch, target_batch in train_loader:
        optimizer.zero_grad()
        loss = calc_loss_batch(
            input_batch, target_batch, model, device)
        loss.backward()
        optimizer.step()
        tokens_seen += input_batch.numel()
        global_step += 1
        if global_step % eval_freq == 0:
            train_loss, val_loss = evaluate_model(...)
    generate_and_print_sample(model, tokenizer, device, start_context)
```

- the whole pretraining function — deliberately minimal

::: narration
Here is the training function, deliberately kept minimal — the book saves refinements like learning-rate warm-up, cosine annealing, and gradient clipping for an appendix. The structure is exactly the cycle from the previous slide, with bookkeeping: a counter of tokens seen, a global step, and every five steps a call to evaluate model, which switches to eval mode, measures both losses without gradient tracking, and switches back. After each epoch, generate and print sample decodes fifty tokens from a fixed prompt, giving a qualitative pulse to accompany the quantitative one. One habit worth stealing: model dot train and model dot eval bracket everything, because dropout must be on when learning and off when measuring.
:::

---
## The two watchers

```python
def evaluate_model(model, train_loader, val_loader,
                   device, eval_iter):
    model.eval()
    with torch.no_grad():
        train_loss = calc_loss_loader(
            train_loader, model, device, num_batches=eval_iter)
        val_loss = calc_loss_loader(
            val_loader, model, device, num_batches=eval_iter)
    model.train()
    return train_loss, val_loss
```

- eval mode + no_grad: honest, cheap measurement
- and its sibling prints a 50-token sample per epoch
- numbers for the trend, prose for the vibe

::: narration
The two monitoring helpers deserve a look because they encode good hygiene. Evaluate model wraps its loss measurements in two protections: eval mode, so dropout doesn't randomly perturb the numbers, and no-grad, so the measurement doesn't waste memory building gradient graphs — then flips the model back to train mode before returning. Its sibling, generate and print sample, runs the greedy generator for fifty tokens from a fixed prompt after each epoch and prints the result on one line. Together they give training two kinds of eyes: the losses quantify progress and expose overfitting; the samples reveal texture the numbers can't — what kind of wrong the model currently is, in its own words.
:::

---
## The optimizer: AdamW

```python
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=0.0004, weight_decay=0.1)
```

- Adam + a better-behaved weight decay
- decay penalizes large weights → less overfitting
- the standard choice for training LLMs

::: narration
The optimizer is AdamW, and the name unpacks meaningfully. Adam is the workhorse adaptive optimizer of deep learning, maintaining per-parameter learning-rate adjustments based on the history of each weight's gradients. The W stands for its improved handling of weight decay — a regularization pressure that continuously shrinks weights toward zero, penalizing complexity and discouraging overfitting. Adam's original formulation entangled that decay with its adaptive machinery in a subtly broken way; AdamW decouples them, which yields better regularization and generalization in practice. That combination has made AdamW the default choice for training LLMs. Here it runs with a learning rate of four ten-thousandths and a weight decay of zero point one.
:::

---
## Ten epochs, five minutes

```text
Ep 1 (Step 000000): Train loss 9.781, Val loss 9.933
Ep 2 (Step 000015): Train loss 5.961, Val loss 6.616
...
Ep 9 (Step 000080): Train loss 0.541, Val loss 6.393
Ep 10 (Step 000085): Train loss 0.391, Val loss 6.452
```

- train: 9.78 → **0.39** · val: 9.93 → **6.45**
- one number plummets, the other stalls
- both facts matter

::: narration
Ten epochs take about five minutes on a laptop, and the printed losses tell a two-part story. The training loss collapses — from nine point seven eight to zero point three nine, a model that has very nearly perfected next-token prediction on its training text. The validation loss falls fast at first, from nine point nine three down to the mid-sixes, and then stops, ending at six point four five. Both facts matter. The collapse proves the machinery works: loss, gradients, optimizer, all of it. The stall is a diagnosis — and reading it correctly is the subject of the next two slides, starting with what the model's own words reveal.
:::

---
## Watching it learn to write

```text
epoch 1:  "Every effort moves you,,,,,,,,,,,,."
epoch 2:  "Every effort moves you, and, and, and, and, and..."
epoch 9:  "Every effort moves you?"  "Yes--quite insensible
          to the irony. She wanted him vindicated--and by me!"
```

- commas → stopwords → grammar
- fluency emerges in stages, fast
- but the epoch-9 text has a secret

::: narration
The per-epoch samples make the loss curve visceral. After one epoch, the model has learned exactly one thing: commas are common. Every effort moves you, comma comma comma. After two, it discovers high-frequency words and chants and, and, and. By epoch nine it writes grammatical, punctuated, even literary English — quote, Yes, quite insensible to the irony. She wanted him vindicated, and by me, unquote. Watching fluency assemble itself in stages — punctuation, then stopwords, then syntax, then style — is pretraining's most seductive demo. But that epoch-nine sentence has a secret, and the validation loss already told you what it is: the model didn't compose that text.
:::

---
## The confession: memorization

<div class="viz">
<svg viewBox="0 0 460 210">
<line class="axis" x1="45" y1="170" x2="430" y2="170"/>
<line class="axis" x1="45" y1="20" x2="45" y2="170"/>
<path class="edge danger" d="M50,25 L90,60 C140,105 200,120 260,132 C320,144 380,152 425,158" fill="none"/>
<path class="edge accent" d="M50,22 L90,55 C130,88 170,96 220,99 C290,103 370,100 425,103" fill="none"/>
<text class="cap danger" x="330" y="140">train → 0.39</text>
<text class="cap accent" x="330" y="86">validation → 6.45</text>
<text class="tag" x="237" y="195">epochs 1 → 10</text>
</svg>
</div>

- curves diverge after epoch ~2: **overfitting**
- epoch-9 sample = verbatim Wharton, findable in the file
- expected: tiny corpus, many epochs · real runs: huge corpus, ~one epoch

::: narration
Plot the two losses together and the diagnosis is unmistakable: they fall together for about two epochs and then split, training loss diving while validation flattens. The model is overfitting — and in a language model, overfitting has a concrete face: memorization. Search the training file for that beautiful epoch-nine sentence and you'll find it, verbatim. The model reproduced Wharton; it didn't imitate her. The book is careful to frame this as expected rather than alarming: five thousand tokens recycled for ten epochs practically mandates memorization. Production pretraining inverts the ratio — vastly more text than the model could ever memorize, often seen only once. The failure mode is still worth knowing by sight; the divergence pattern looks the same at every scale.
:::

---
<!-- .slide: class="divider" -->
### Part IV
## Decoding: controlled randomness

::: narration
Part four turns from training the model to sampling from it. Greedy decoding — always taking the single most likely token — is deterministic and dull, and it replays memorized text word for word. Two techniques, temperature scaling and top-k sampling, put a controlled amount of chance into the choice.
:::

---
## The problem with greedy

- argmax: same prompt → same text, **every time**
- our model replays its memorized passage verbatim
- variety requires giving other tokens a chance
- replace the argmax with a draw

::: narration
Greedy decoding has one virtue and two flaws. The virtue is determinism: identical prompts produce identical continuations, which is exactly right for testing. The first flaw is the same fact viewed from the user's side — the model has one thing to say per prompt, forever. The second flaw is on display in this very model: greedy decoding walks straight down the highest-probability path, which for an overfit model is the memorized training passage, reproduced word for word. The fix is philosophically small and practically large: stop always taking the maximum, and instead draw the next token at random, in proportion to the probabilities the model already computes. The model's beliefs stay in charge — chance just gets a vote.
:::

---
## Exhibit A: the replay

```python
token_ids = generate_text_simple(model=model,
    idx=text_to_token_ids("Every effort moves you", tokenizer),
    max_new_tokens=25, context_size=256)

# "Every effort moves you know," was one of the
#  axioms he laid down across the Sevres and
#  silver of an exquisitely appointed lun
```

- word-for-word Wharton, every single run
- greedy + overfit model = a tape recorder
- the case for randomness, in one output

::: narration
Exhibit A for the prosecution. Ask the trained model to continue Every effort moves you with greedy decoding, and it produces: quote, was one of the axioms he laid down across the Sevres and silver of an exquisitely appointed lun — cut off mid-word at the token budget. Run it again: the identical output, every time. This is a sentence from The Verdict, replayed from memory. Two culprits conspire: the model is overfit, so the memorized continuation towers above alternatives at each step, and greedy decoding guarantees the tallest candidate always wins. The second culprit is the fixable one here — which is exactly what sampling is for.
:::

---
## A toy vocabulary to see it

```python
vocab = {"closer": 0, "every": 1, "effort": 2,
         "forward": 3, "inches": 4, "moves": 5,
         "pizza": 6, "toward": 7, "you": 8}

next_token_logits = torch.tensor(
    [4.51, 0.89, -1.90, 6.75, 1.63,
     -1.62, -1.89, 6.28, 1.79])
```

- nine words · context: "every effort moves you"
- three strong candidates: **forward** (6.75) · **toward** (6.28) · **closer** (4.51)
- argmax says: forward, always

::: narration
To make sampling visible, the book shrinks the world to a nine-word vocabulary and one hand-written logit vector — the model's supposed beliefs about what follows every effort moves you. Three candidates dominate: forward at six point seven five, toward at six point two eight, closer at four point five one; everything else trails far behind. Argmax picks forward, and would pick it a thousand times out of a thousand. The alternative is torch dot multinomial: convert logits to probabilities via softmax, then sample from that distribution. Most draws will still say forward — it holds the most probability — but not every draw. Ask for a thousand samples, and the shape of the model's actual uncertainty becomes visible.
:::

---
## Swap argmax for a draw

```python
probas = torch.softmax(next_token_logits, dim=0)

next_token_id = torch.argmax(probas).item()
# "forward" — every single time

torch.manual_seed(123)
next_token_id = torch.multinomial(
    probas, num_samples=1).item()
# "forward" — this time
```

- `multinomial`: sample in proportion to probability
- the favorite usually wins, not always
- one function call changes the philosophy

::: narration
The code change is one function. Argmax over the probabilities returns index three, forward, deterministically. Torch dot multinomial instead treats the probability vector as a weighted lottery and draws one ticket — on this first seeded draw it also lands on forward, which is the point in miniature: sampling is not chaos, the favorite still usually wins. But usually is the operative word. Where argmax collapses the model's whole belief distribution to its peak, multinomial honors the distribution — a token holding thirty percent of the probability wins roughly three draws in ten. The philosophical shift is small to write and large in effect, as a thousand repeated draws are about to show.
:::

---
## What a thousand draws look like

<div class="viz">
<svg viewBox="0 0 460 220">
<line class="axis" x1="50" y1="170" x2="430" y2="170"/>
<rect class="track" x="70" y="40" width="56" height="130" rx="3"/>
<rect class="bar" x="70" y="160" width="56" height="10" rx="3"/>
<rect class="track" x="160" y="40" width="56" height="130" rx="3"/>
<rect class="bar accent" x="160" y="52" width="56" height="118" rx="3"/>
<rect class="track" x="250" y="40" width="56" height="130" rx="3"/>
<rect class="bar" x="250" y="100" width="56" height="70" rx="3"/>
<rect class="track" x="340" y="40" width="56" height="130" rx="3"/>
<rect class="bar muted" x="340" y="169" width="56" height="1" rx="1"/>
<text class="tag" x="98" y="190">closer</text><text class="tag" x="188" y="190">forward</text><text class="tag" x="278" y="190">toward</text><text class="tag" x="368" y="190">others</text>
<text class="cap" x="98" y="150">73</text><text class="cap accent" x="188" y="42">582</text><text class="cap" x="278" y="90">343</text><text class="cap" x="368" y="160">2</text>
</svg>
</div>

- 582 × forward · 343 × toward · 73 × closer · 2 × inches
- the favorite usually wins — but not always
- "every effort moves you toward" now happens

::: narration
Sampling a thousand times from the toy distribution: forward wins five hundred eighty-two draws, toward three hundred forty-three, closer seventy-three, and inches sneaks in twice. This is the essence of multinomial sampling — the ranking the model believes in still dominates outcomes, but the alternatives get airtime in proportion to their plausibility. Text generated this way sometimes reads every effort moves you toward, or you closer, instead of the same continuation eternally. And crucially, the randomness is honest: it reflects the model's own uncertainty rather than overriding it. The next question is whether that uncertainty can be tuned — made sharper or looser on demand. It can, with a single division.
:::

---
## Temperature: one knob

```python
def softmax_with_temperature(logits, temperature):
    return torch.softmax(logits / temperature, dim=0)
```

- divide the logits by T before softmax — that's all
- T < 1: sharper, more confident
- T > 1: flatter, more adventurous
- T = 1: the model's raw beliefs

::: narration
Temperature scaling sounds technical and is one line: divide the logits by a positive number T before the softmax. The consequences fan out from how softmax exaggerates differences. Dividing by a T below one stretches the gaps between logits, so the softmax sharpens — probability concentrates on the favorite, and sampling behaves nearly like argmax. Dividing by a T above one compresses the gaps, flattening the distribution so underdogs are drawn more often. T equal to one leaves the model's beliefs untouched. One knob, then, spans the whole spectrum from deterministic and safe to diverse and risky — and the next slide shows the same nine-word distribution at three settings of it.
:::

---
## The same beliefs at three temperatures

<div class="viz wide">
<svg viewBox="0 0 560 210">
<line class="axis" x1="30" y1="160" x2="180" y2="160"/>
<rect class="bar accent" x="55" y="25" width="30" height="135" rx="2"/>
<rect class="bar" x="95" y="152" width="30" height="8" rx="2"/>
<rect class="bar" x="135" y="157" width="30" height="3" rx="2"/>
<text class="tag" x="105" y="182">T = 0.1 — near argmax</text>
<line class="axis" x1="215" y1="160" x2="365" y2="160"/>
<rect class="bar accent" x="240" y="76" width="30" height="84" rx="2"/>
<rect class="bar" x="280" y="110" width="30" height="50" rx="2"/>
<rect class="bar" x="320" y="146" width="30" height="14" rx="2"/>
<text class="tag" x="290" y="182">T = 1 — the raw model</text>
<line class="axis" x1="400" y1="160" x2="550" y2="160"/>
<rect class="bar accent" x="425" y="125" width="30" height="35" rx="2"/>
<rect class="bar" x="465" y="132" width="30" height="28" rx="2"/>
<rect class="bar warn" x="505" y="143" width="30" height="17" rx="2"/>
<text class="tag" x="475" y="182">T = 5 — nearly uniform</text>
<text class="cap" x="290" y="205">bars: forward · toward · the rest</text>
</svg>
</div>

- T = 0.1: forward ≈ always · T = 1: forward ≈ 60%
- T = 5: "every effort moves you **pizza**" ~4% of the time
- diversity and nonsense arrive together

::: narration
Plotting the toy distribution at three temperatures makes the trade explicit. At temperature zero point one, virtually all probability piles onto forward — sampling becomes argmax with extra steps. At temperature one, forward holds about sixty percent, toward and closer keep honest shares. At temperature five, the distribution flattens toward uniform, and genuinely bad tokens enter play: the book calculates that every effort moves you pizza now occurs about four percent of the time. That is the essential bargain of temperature — diversity and nonsense arrive together, by the same mechanism. Which raises an obvious wish: keep the looseness of high temperature, but somehow fence out the pizza. That fence is top-k sampling.
:::

---
## Top-k: fence out the absurd

<div class="viz wide">
<svg viewBox="0 0 560 170">
<defs><marker id="arrTK" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="180" y1="60" x2="215" y2="60" marker-end="url(#arrTK)"/>
<line class="edge" x1="385" y1="60" x2="420" y2="60" marker-end="url(#arrTK)"/>
<rect class="node" x="30" y="30" width="150" height="60" rx="6"/>
<text class="lbl sm" x="105" y="52">9 logits</text><text class="lbl mono sm" x="105" y="72">4.51 … 6.75 … 6.28</text>
<rect class="node warn" x="217" y="30" width="168" height="60" rx="6"/>
<text class="lbl sm" x="301" y="52">keep top k = 3</text><text class="lbl mono sm" x="301" y="72">rest → −inf</text>
<rect class="node good" x="422" y="30" width="118" height="60" rx="6"/>
<text class="lbl sm" x="481" y="52">softmax</text><text class="lbl mono sm" x="481" y="72">.06 · .58 · .36</text>
<text class="cap" x="285" y="135">−inf becomes probability zero — outsiders can never be drawn</text>
</svg>
</div>

- keep the k highest logits, mask the rest to −inf
- softmax turns −inf into exactly **0**
- sampling stays free — inside the shortlist

::: narration
Top-k sampling restricts the draw to a shortlist. Find the k largest logits — here k is three, keeping forward, toward, and closer — and overwrite every other logit with negative infinity. That choice of sentinel is elegant: e to the negative infinity is zero, so after softmax the masked tokens hold exactly zero probability, and the surviving three renormalize to about fifty-eight, thirty-six, and six percent. Careful readers will recognize the move — it's the same negative-infinity masking trick the causal attention mask used in chapter three. Inside the shortlist, sampling and temperature operate freely; outside it, pizza simply cannot happen. Diversity where the model is credible, a hard fence where it isn't.
:::

---
## Top-k in three lines

```python
top_logits, top_pos = torch.topk(next_token_logits, 3)
# Top logits: tensor([6.7500, 6.2800, 4.5100])
# Top positions: tensor([3, 7, 0])

new_logits = torch.where(
    condition=next_token_logits < top_logits[-1],
    input=torch.tensor(float('-inf')),
    other=next_token_logits)
```

- `topk` finds the shortlist and its threshold
- `where`: below the cutoff → −inf, else keep
- vectorized — no loop over the vocabulary

::: narration
The implementation is three tensor operations. Torch dot topk returns the k largest logits and their positions — here six point seven five, six point two eight, and four point five one at positions three, seven, and zero. The smallest of those, the last element of the top logits, becomes the admission threshold. Then torch dot where applies the fence in one vectorized sweep: every logit below the threshold is replaced with negative infinity, everything at or above it passes through untouched. No Python loop ever touches the fifty-thousand-entry vocabulary; the whole mask is one broadcast comparison. Softmax then does its part, turning the negative infinities into exact zeros.
:::

---
## The final generate function

```python
def generate(model, idx, max_new_tokens, context_size,
             temperature=0.0, top_k=None, eos_id=None):
    for _ in range(max_new_tokens):
        ...
        if top_k is not None:                # 1. shortlist
            logits = mask_below_topk(logits, top_k)
        if temperature > 0.0:                # 2. scale + sample
            probs = torch.softmax(logits / temperature, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
        else:                                # greedy fallback
            idx_next = torch.argmax(logits, dim=-1, keepdim=True)
        if idx_next == eos_id: break         # 3. early stop
        idx = torch.cat((idx, idx_next), dim=1)
    return idx
```

::: narration
The chapter's final generate function composes everything: the same crop-and-forward loop as before, then top-k masking if requested, then temperature scaling and a multinomial draw — with temperature zero falling back to plain argmax, preserving the old greedy behavior as a special case. An optional end-of-sequence ID lets generation stop early when the model emits it. Run with top-k of twenty-five and temperature one point four, the once-repetitive model now produces: Every effort moves you stand to work on surprise, a one of us had gone with random. Imperfect English — the underlying model is still tiny and overfit — but visibly not the memorized passage. The sampler is doing its job; the model's ceiling is the next problem.
:::

---
## Dialing it back to deterministic

- `temperature=0.0` → the argmax branch: pure greedy
- `top_k=1` → a shortlist of one: greedy by another road
- reproducibility on demand, same function
- diversity is now a setting, not an architecture

::: narration
A closing exercise from the book is worth internalizing: how do you make the new generate function deterministic again? Two independent roads lead back. Setting temperature to zero routes around sampling entirely — the code falls through to its argmax branch, classic greedy decoding. Alternatively, top-k of one fences the shortlist down to a single candidate, so even the multinomial draw has no choice to make. Either way, the same prompt yields the same text on every run, which is what you want for tests and comparisons. The deeper point: determinism versus diversity is no longer a property of the code you wrote — it's a dial on one function, chosen per call.
:::

---
<!-- .slide: class="divider" -->
### Part V
## Save it before you lose it

::: narration
Part five is short and practical: weights that took compute to earn should survive the Python session that earned them. Saving and loading is two lines each — with one subtlety about the optimizer.
:::

---
## state_dict, both directions

```python
torch.save(model.state_dict(), "model.pth")

model = GPTModel(GPT_CONFIG_124M)
model.load_state_dict(
    torch.load("model.pth", map_location=device))
model.eval()
```

- the state_dict maps each layer to its tensors
- rebuild the architecture, pour the weights back in
- `eval()` after loading — dropout off for inference

::: narration
PyTorch's recommended persistence route is the state dict: a dictionary mapping every layer to its parameter tensors. Torch dot save writes it to disk; loading means constructing a fresh GPTModel — the architecture is code, not data, so it isn't saved — and pouring the tensors back in with load state dict. The map-location argument keeps checkpoints portable across CPU and GPU machines. And the habit worth keeping: call model dot eval after loading for inference, so dropout doesn't randomly damage the computation. One thing this snippet does not preserve, though, is the optimizer — and if the plan is to continue training rather than just use the model, that omission costs real quality.
:::

---
## Don't forget the optimizer

```python
torch.save({
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
}, "model_and_optimizer.pth")
```

- AdamW carries per-parameter history
- resume without it → suboptimal learning, maybe divergence
- checkpoint = model **and** optimizer, for any training pause

::: narration
AdamW is an adaptive optimizer: for every one of the model's parameters it maintains running statistics of past gradients, and those statistics are what make its per-parameter learning rates work. Resume training from bare model weights and that history resets to zero — the optimizer relearns its adjustments from scratch, and the model may learn suboptimally or even fail to converge properly. The fix is to checkpoint both dictionaries together: model state and optimizer state in one file. Restore both, call model dot train, and training continues as if never interrupted. The rule of thumb: saving for inference, model alone is fine; pausing training, always save the pair.
:::

---
<!-- .slide: class="divider" -->
### Part VI
## Borrowing OpenAI's weights

::: narration
Part six is the payoff. Instead of spending months and a fortune pretraining properly, the chapter downloads the weights OpenAI released for GPT-2 and threads them, tensor by tensor, into the model built from scratch. If every mapping is right, the homemade architecture speaks fluent English on the first try.
:::

---
## Why this works at all

- OpenAI released GPT-2's trained weights publicly
- our architecture is a faithful GPT-2 replica
- same shapes → the tensors can drop in
- the from-scratch model meets the real thing

::: narration
This move only works because of two facts, one generous and one earned. The generous fact: OpenAI publicly released the trained weights of every GPT-2 size, which is why this book chose GPT-2 in the first place — the six-hundred-thousand-dollar artifact is free to download. The earned fact: the architecture built across the last two chapters is a faithful replica — same embedding tables, same block structure, same dimensions. Faithful enough that OpenAI's tensors can drop into its slots. And the exercise is more than a shortcut: making foreign weights actually work in your own implementation is the sternest possible test that your architecture is what you think it is. A single wrong mapping and the output is garbage.
:::

---
## The download: seven files

```text
checkpoint                      77 KB
encoder.json                  1.04 MB   # tokenizer
hparams.json                    90  B   # settings
model.ckpt.data-00000-of-00001 498 MB   # the weights
model.ckpt.index              5.21 KB
model.ckpt.meta                471 KB
vocab.bpe                      456 KB   # tokenizer
```

- via the book's `gpt_download.py` helper
- TensorFlow-era checkpoint — hence the extra tooling
- `hparams.json` matches our config dict

::: narration
A helper script from the book's repository fetches seven files for the 124-million-parameter model. The heart of it is the checkpoint data file — four hundred ninety-eight megabytes of trained weights, which squares with the six-hundred-megabyte float32 estimate from the architecture chapter. Encoder dot json and vocab dot bpe are the tokenizer's soul: the byte-pair vocabulary and merges. And hparams dot json is a pleasing moment of recognition — n vocab fifty thousand two fifty-seven, n embd seven sixty-eight, n head twelve, n layer twelve: the same numbers as the hand-written config dictionary, arriving from the source. One wrinkle: OpenAI saved these in TensorFlow's checkpoint format, so loading them in Python briefly requires TensorFlow installed alongside PyTorch.
:::

---
## Inside the checkpoint

```python
print("Settings:", settings)
# {'n_vocab': 50257, 'n_ctx': 1024, 'n_embd': 768,
#  'n_head': 12, 'n_layer': 12}

print(params["wte"].shape)
# (50257, 768)
```

- `settings`: OpenAI's config — our dict, their spelling
- `params`: the actual tensors, keyed by layer
- `wte`, 50257 × 768: the token embedding, exactly as expected

::: narration
Loading the download yields two dictionaries. Settings is OpenAI's hyperparameter record, and reading it feels like meeting a pen pal: n vocab fifty thousand two fifty-seven, n ctx one thousand twenty-four, n embd seven sixty-eight, twelve heads, twelve layers — the hand-written config dictionary with different key names. Params holds the substance: the actual weight tensors, nested by block and layer. Pull out wte, the token embedding, and its shape reads fifty thousand two fifty-seven by seven hundred sixty-eight — precisely the shape of the embedding table the from-scratch model allocates. Every tensor about to be transferred can be inspected this way, which is exactly how mapping mistakes get diagnosed.
:::

---
## Matching the originals' settings

```python
NEW_CONFIG = GPT_CONFIG_124M.copy()
NEW_CONFIG.update({"context_length": 1024})
NEW_CONFIG.update({"qkv_bias": True})
gpt = GPTModel(NEW_CONFIG)
```

- context back to 1,024 — what the weights were trained for
- `qkv_bias=True` — GPT-2 used bias in the QKV projections
- pretrained weights dictate the config, not preference

::: narration
Two configuration edits reconcile the from-scratch defaults with history. The context length returns to one thousand twenty-four — the training-friendly two fifty-six would leave the positional embedding table the wrong size for the pretrained one. And qkv bias flips to true: modern LLMs skip bias vectors in the attention projections, and the book's default follows that practice, but GPT-2 was trained with them, so the slots must exist for the weights to land in. There's a small lesson in both edits: when adopting pretrained weights, their training-time architecture is law. Preference and best practice yield to whatever shape the tensors actually have.
:::

---
## Four sizes, one dictionary

```python
model_configs = {
    "gpt2-small (124M)":  {"emb_dim": 768,  "n_layers": 12, "n_heads": 12},
    "gpt2-medium (355M)": {"emb_dim": 1024, "n_layers": 24, "n_heads": 16},
    "gpt2-large (774M)":  {"emb_dim": 1280, "n_layers": 36, "n_heads": 20},
    "gpt2-xl (1558M)":    {"emb_dim": 1600, "n_layers": 48, "n_heads": 25},
}
NEW_CONFIG.update(model_configs["gpt2-small (124M)"])
```

- every released size, three numbers apart
- the loading code below is size-agnostic
- swap the key, load a 1.5B model

::: narration
Before the weights transfer, one small dictionary catalogs the entire GPT-2 family: each released size differs only in embedding width, layer count, and head count. Updating the config with one entry selects the model. What makes this slide more than bookkeeping is what it implies about the code that follows: the loading function walks whatever blocks exist and matches whatever dimensions it finds, so it is size-agnostic by construction. Swap the dictionary key from small to XL, re-download, and the same dozen lines thread a one-and-a-half-billion-parameter model into the same class. The architecture chapter promised that scale was configuration, not code — here that promise gets kept.
:::

---
## assign: trust, but verify

```python
def assign(left, right):
    if left.shape != right.shape:
        raise ValueError(
            f"Shape mismatch. Left: {left.shape}, "
            f"Right: {right.shape}")
    return torch.nn.Parameter(torch.tensor(right))
```

- every transfer passes through a shape check
- naming took guesswork — shapes catch the slips
- fail loudly beats fail weirdly

::: narration
Every single tensor transfer runs through a four-line utility called assign, which does one thing: refuse to proceed if the destination and source shapes disagree. It earns its keep because the mapping work is genuinely error-prone — the author admits the load function took a lot of guesswork, since OpenAI's naming conventions differ from the book's. The shape check converts silent catastrophes into loud, located errors: a mismatch raises immediately, naming both shapes. It can't catch everything — two same-shaped tensors swapped would sail through — but for that class of error there's a second detector waiting at the end: a model with even one wrong mapping can't produce coherent text.
:::

---
## Threading the weights

```python
def load_weights_into_gpt(gpt, params):
    gpt.pos_emb.weight = assign(gpt.pos_emb.weight, params['wpe'])
    gpt.tok_emb.weight = assign(gpt.tok_emb.weight, params['wte'])
    for b in range(len(params["blocks"])):
        q_w, k_w, v_w = np.split(
            (params["blocks"][b]["attn"]["c_attn"])["w"], 3, axis=-1)
        gpt.trf_blocks[b].att.W_query.weight = assign(..., q_w.T)
        # ... keys, values, biases, out_proj,
        # ... ff layers, both norms
    gpt.final_norm.scale = assign(gpt.final_norm.scale, params["g"])
    gpt.out_head.weight = assign(gpt.out_head.weight, params["wte"])
```

- OpenAI fused Q, K, V into one matrix → split in three
- transposes where the conventions differ

::: narration
The loading function is long but rhythmic: for every one of the twelve blocks, map each of OpenAI's tensors onto the corresponding module attribute. Two translation quirks do most of the work. OpenAI stored the query, key, and value projections fused into a single matrix called c attn, so numpy's split carves it into three equal parts — and several matrices need transposing, because the two implementations disagree on orientation conventions. Then the embeddings, the feed-forward weights, both layer norms' scale and shift per block, and the final norm. The last line holds one detail worth pausing on — the output head is assigned from wte, the token embedding matrix. That's not a typo.
:::

---
## Where the guesswork lived

- OpenAI's names: `c_attn`, `c_proj`, `c_fc`, `ln_1`, `g`, `b`
- ours: `W_query`, `out_proj`, `ff.layers`, `norm1.scale`
- no schema connects them — only inspection and inference
- two safety nets: shape checks now, coherence check later

::: narration
An honest aside the book makes explicitly: constructing this mapping took a lot of guesswork. OpenAI's checkpoint speaks its own dialect — c attn for the fused attention projection, c proj for output projections, ln one with g and b for a norm's scale and shift. The from-scratch model speaks another: W query, out proj, norm one dot scale. Nothing formal connects the two vocabularies; the translation came from inspecting shapes, reading the original code, and inferring roles. That's the realistic texture of interoperability work in machine learning. It's also why the two safety nets matter so much — assign's shape check catches mismatched tensors at transfer time, and the fluency test at the end catches whatever slips through.
:::

---
## Weight tying, witnessed

```python
gpt.out_head.weight = assign(
    gpt.out_head.weight, params["wte"])   # wte again!
```

- the same tensor that filled `tok_emb`
- OpenAI's GPT-2 tied embedding and output — there **is** no separate head
- chapter 4's 163M-vs-124M puzzle, resolved in the wild

::: narration
The final assignment reuses wte — the very tensor that already filled the token embedding — as the output head's weights. This is weight tying, met in the architecture chapter as an accounting curiosity, now witnessed in the wild: OpenAI's released checkpoint simply contains no separate output-projection matrix, because the original GPT-2 reused the embedding for both jobs. That's precisely why the from-scratch model counts one hundred sixty-three million parameters against GPT-2's advertised one twenty-four. The book's implementation keeps the layers separate — better training behavior when you fine-tune later — and just initializes both from the same source. One tensor, two roles, mystery closed.
:::

---
## The moment of transfer

```python
load_weights_into_gpt(gpt, params)
gpt.to(device)
```

- two lines: thread every tensor, move to hardware
- twelve blocks × a dozen tensors each, plus embeddings and norms
- the from-scratch model now carries six figures of compute

::: narration
The actual transfer is anticlimactic by design: call the loading function, move the model to the compute device. Under those two lines, roughly a hundred fifty tensor assignments execute — twelve blocks, each receiving split query, key, and value weights and biases, an output projection, two feed-forward matrices with biases, and two layer norms' worth of scale and shift, plus the embeddings at the bottom and the tied output head at the top. Every one passed through the shape check. The object that emerges is philosophically pleasing: the architecture is entirely the book's, built line by line from nothing — and the knowledge inside it is OpenAI's, distilled from a training run no individual could afford.
:::

---
## First words with real weights

```python
token_ids = generate(model=gpt,
    idx=text_to_token_ids("Every effort moves you", tokenizer),
    max_new_tokens=25, context_size=NEW_CONFIG["context_length"],
    top_k=50, temperature=1.5)

# "Every effort moves you toward finding an ideal new way
#  to practice something! What makes us want to be on top
#  of that?"
```

- coherent English, first try
- the strongest possible end-to-end test — one slip = word salad
- the same prompt that once produced "rentingetic wasn"

::: narration
The verification is the output itself. Same prompt as the chapter opened with — Every effort moves you — but now through the hand-built architecture carrying OpenAI's weights, sampled with top-k fifty and temperature one point five. The continuation: toward finding an ideal new way to practice something! What makes us want to be on top of that? Grammatical, fluent, sensible English. And as a test, this is brutal by design: hundreds of tensor mappings across twelve blocks, where any single transposition error, swapped tensor, or missed bias would cascade into gibberish. Coherent text is the signature at the bottom of the proof. The architecture from chapter four is genuinely GPT-2 — demonstrated by speaking with its voice.
:::

---
## The same door opens wider

- 124M loaded here · 355M, 774M, 1,558M available the same way
- one `model_configs` dict per size — same class, same loader
- chapter 6 fine-tunes these weights into a classifier
- chapter 7: into an instruction follower

::: narration
The door just opened is wider than one model. OpenAI released all four GPT-2 sizes, and the loading path works for each — a small dictionary maps each size name to its embedding width, depth, and head count, and the same GPTModel class and the same loading function do the rest. The book leaves the larger sizes as an exercise, and they slot in without a code change. More importantly, these pretrained weights are the raw material for everything that follows: the next chapter starts from exactly this loaded model and fine-tunes it into a spam classifier, and the chapter after teaches it to follow instructions. Pretraining, borrowed or earned, is the foundation — the rest of the book builds on it.
:::

---
<!-- .slide: class="statement" -->
Training is compression: a corpus distilled into weights.

::: narration
A closing thought worth keeping. Everything in this chapter was, in one way or another, compression. The loss measured how surprised the weights were by the corpus; training squeezed that surprise out, token by token, until five thousand tokens of Wharton lived — a little too literally — inside a hundred million parameters. OpenAI's checkpoint is the same story at scale: the statistical shape of a vast swath of internet text, distilled into four hundred ninety-eight megabytes you can download over lunch. A language model is a corpus compressed into weights. Fine-tuning, up next, is the art of reshaping that compression toward a job.
:::

---
## What we built

- **cross-entropy loss** — text quality as one differentiable number
- **perplexity** 48,725 → the untrained model, quantified
- **train_model_simple** — 9.78 → 0.39 in ten epochs, overfitting diagnosed
- **temperature + top-k** — the modern `generate` function
- **checkpointing** — model and optimizer state
- **OpenAI's GPT-2 weights** — loaded, verified, speaking

::: narration
The inventory. A loss function that turns text quality into one differentiable number, built by hand and then replaced by PyTorch's cross entropy, with perplexity as its readable twin. A minimal but complete pretraining loop that took the model from chance-level loss to near-zero on its training text — and a correctly diagnosed case of overfitting via the validation curve and verbatim memorization. A generation function with temperature and top-k, turning one deterministic voice into a tunable distribution. Checkpointing that preserves both model and optimizer. And the finale: OpenAI's pretrained weights threaded into the from-scratch architecture, verified the only way that matters — by fluent output.
:::

---
## Next: from generalist to specialist

- chapter 6: fine-tuning for classification
- the pretrained model + a small labeled dataset
- swap the output head · train a little · measure accuracy
- spam detection as the worked example

::: narration
The foundation model is built and loaded; next comes making it useful for a specific task. Chapter six fine-tunes these pretrained weights into a text classifier — the worked example is spam detection. The recipe previews the whole discipline of transfer learning: keep the pretrained network that already understands English, replace its fifty-thousand-way output head with a tiny two-way one, train briefly on a small labeled dataset, and measure accuracy rather than perplexity. It's the first demonstration of why pretraining is worth its enormous cost: all of that borrowed linguistic knowledge transfers to a new job for pennies.
:::
