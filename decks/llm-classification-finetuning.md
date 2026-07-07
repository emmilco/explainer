# Fine-Tuning for Classification

---
## Fine-Tuning for Classification

- a pretrained GPT-2 becomes a spam detector
- Raschka, *Build a Large Language Model (From Scratch)*, ch. 6
- dataset → head swap → selective training → 96% on unseen text

::: narration
This deck covers the first act of fine-tuning: taking the pretrained GPT-2 assembled over the last two chapters and turning it into a text classifier, following chapter six of Sebastian Raschka's Build a Large Language Model. The concrete task is spam detection — deciding whether a text message is spam or not — and the recipe generalizes to any classification problem. The plan has three stages: prepare a labeled dataset of spam and legitimate messages; perform surgery on the model, swapping its fifty-thousand-way language head for a two-way classification head and choosing which layers to train; then fine-tune, evaluate, and ship a classifier that gets about ninety-six percent of unseen messages right after five minutes of training on a laptop. Along the way, one elegant question carries the chapter: which token's output do you actually classify with, and why?
:::

---
<!-- .slide: class="divider" -->
### Part I
## Two ways to fine-tune

::: narration
Part one draws the map. Fine-tuning comes in two main flavors — instruction fine-tuning and classification fine-tuning — and they produce different kinds of model. Knowing which one a problem calls for is the first real design decision of applied LLM work.
:::

---
## Classification, the perennial task

- map an input to one of N predefined labels
- spam / not spam · sports / politics / tech · benign / malignant
- older than LLMs — images, audio, medicine
- the LLM twist: the input is language, understood deeply

::: narration
Classification is the oldest job description in machine learning: given an input, assign it one label from a predefined set. Spam or not spam. A news article as sports, politics, or technology. A plant species from a photo; a tumor as benign or malignant from a scan. Nothing about the task is specific to language models — what the LLM brings to it is the quality of the input representation. A classical spam filter counted suspicious words; a fine-tuned language model reads the message with everything a hundred twenty-four million pretrained parameters know about English — sarcasm, urgency, the smell of a scam — and classifies from that understanding. Same old task, dramatically better eyes.
:::

---
## Instruction vs. classification

<div class="viz wide">
<svg viewBox="0 0 560 200">
<defs><marker id="arrIC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="180" y1="55" x2="220" y2="55" marker-end="url(#arrIC)"/>
<line class="edge" x1="330" y1="55" x2="370" y2="55" marker-end="url(#arrIC)"/>
<line class="edge" x1="180" y1="145" x2="220" y2="145" marker-end="url(#arrIC)"/>
<line class="edge" x1="330" y1="145" x2="370" y2="145" marker-end="url(#arrIC)"/>
<rect class="node muted" x="20" y="30" width="160" height="50" rx="6"/>
<text class="lbl sm" x="100" y="49">"Translate into German:</text><text class="lbl sm" x="100" y="66">The quick brown fox…"</text>
<rect class="node accent" x="222" y="30" width="108" height="50" rx="7"/><text class="lbl on-fill" x="276" y="55">LLM</text>
<rect class="node good" x="372" y="30" width="168" height="50" rx="6"/>
<text class="lbl sm" x="456" y="49">"Der schnelle braune</text><text class="lbl sm" x="456" y="66">Fuchs…" — any text</text>
<rect class="node muted" x="20" y="120" width="160" height="50" rx="6"/>
<text class="lbl sm" x="100" y="139">"You are a winner…</text><text class="lbl sm" x="100" y="156">claim your award"</text>
<rect class="node accent" x="222" y="120" width="108" height="50" rx="7"/><text class="lbl on-fill" x="276" y="145">LLM</text>
<rect class="node warn" x="372" y="120" width="168" height="50" rx="6"/>
<text class="lbl" x="456" y="145">"spam" — one of 2 labels</text>
<text class="tag" x="100" y="192">instruction-tuned</text>
<text class="tag" x="456" y="192">classification-tuned</text>
</svg>
</div>

- instruction tuning: follow arbitrary prompts, answer in free text
- classification tuning: map any input to one of **N fixed labels**
- specialized beats general — when the job is specialized

::: narration
The two flavors differ in what the finished model can say. An instruction-fine-tuned model is a generalist: trained on many tasks phrased as natural-language instructions, it can translate a sentence, answer a question, or judge whether a text is spam when asked politely — responding in free text. A classification-fine-tuned model is a specialist: it maps any input to exactly one of a fixed set of labels it saw during training — spam or not spam, and nothing else. It cannot translate, summarize, or explain itself; it can only choose. That restriction is a feature. The same trade-off runs through all of machine learning: a specialized model is generally easier to build, cheaper to train, and more reliable at its one job than a generalist is at any particular job.
:::

---
## The specialist's confinement

- a classification-tuned model answers from its label set — **only**
- ask it anything: the reply is "spam" or "not spam"
- no explanations, no other tasks, no exceptions
- confinement is the price of reliability

::: narration
One consequence of classification fine-tuning deserves to be stated starkly: the finished model is confined to its label set, permanently. Show it a scam message, it says spam. Show it a dinner invitation, it says not spam. Show it a request to translate German poetry — it will still say spam or not spam, because those are the only two things it can say. It has no channel for explanations, confidence caveats, or side tasks. For a production spam filter this confinement is exactly right: the system downstream wants one bit, reliably, and a model that can only emit that bit can't wander off script. The moment the job needs flexibility, though, you've outgrown the tool — that's what the next chapter is for.
:::

---
## Choosing the right approach

- classification: fixed categories · spam, sentiment, topic
- instruction: varied tasks, complex prompts, interaction
- instruction tuning demands **more data and compute**
- classification: less of both — bounded scope

::: narration
The book's guidance on choosing is refreshingly economic. Reach for classification fine-tuning when the job is precise categorization into predefined classes — spam detection, sentiment analysis, routing tickets by topic. Reach for instruction fine-tuning when the model must handle a variety of tasks expressed as natural-language requests, where flexibility and interaction quality are the product. The costs differ accordingly: instruction tuning needs larger datasets and considerably more compute, because teaching general helpfulness is a broader target than teaching one decision boundary. Classification tuning is modest on both counts, with the corresponding limitation — the model is forever confined to the classes it trained on. This chapter takes the cheap, sharp path; the next chapter pays for the general one.
:::

---
## The ten-step route

- **stage 1 — data:** download · preprocess · loaders
- **stage 2 — model:** initialize · load weights · modify · eval utilities
- **stage 3 — tune & use:** fine-tune · evaluate · classify new text
- the same skeleton as every applied-ML project

::: narration
The chapter organizes itself as a ten-step route through three stages, and the shape is worth noticing because it's the shape of nearly every applied machine-learning project. Stage one is entirely about data: download a labeled dataset, preprocess it into a clean, balanced form, and wrap it in loaders that serve batches. Stage two is model setup: initialize the architecture, load pretrained weights into it, modify it for the new task, and implement the evaluation utilities. Stage three is the payoff: fine-tune, evaluate on held-out data, and use the model on genuinely new text. Nothing about this outline is LLM-specific — which is the quiet lesson. Fine-tuning a language model is a normal supervised-learning project that happens to start from an unusually knowledgeable initialization.
:::

---
<!-- .slide: class="divider" -->
### Part II
## The dataset

::: narration
Part two prepares the raw material: a public dataset of real text messages, labeled spam or legitimate. It arrives lopsided and leaves balanced, numeric, and split three ways — the unglamorous work that determines whether the accuracy numbers at the end mean anything.
:::

---
## Fetch and unzip

```python
def download_and_unzip_spam_data(
        url, zip_path, extracted_path, data_file_path):
    if data_file_path.exists():
        print(f"{data_file_path} already exists."
              " Skipping download.")
        return
    with urllib.request.urlopen(url) as response:
        with open(zip_path, "wb") as out_file:
            out_file.write(response.read())
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extracted_path)
```

- standard-library only: urllib + zipfile
- idempotent — skips if the file already exists
- ends as a tab-separated file of label–text pairs

::: narration
The download helper is deliberately boring, which is its virtue: pure standard library, no dependencies. It checks whether the data file already exists and skips the network entirely if so — the idempotence that makes re-running a notebook painless — otherwise fetches the zip archive from the UCI repository, extracts it, and renames the result to a dot-t-s-v file, since the data inside is tab-separated. Small habits worth copying in any data project: guard against re-downloading, keep raw data in its original form, and do the fetching in code rather than by hand, so the whole pipeline reproduces from nothing.
:::

---
## Five thousand text messages

```python
url = ("https://archive.ics.uci.edu/static/"
       "public/228/sms+spam+collection.zip")

df = pd.read_csv(data_file_path, sep="\t",
    header=None, names=["Label", "Text"])
# 5572 rows × 2 columns
```

- the UCI SMS Spam Collection · real phone messages
- one label, one text per row: "ham" or "spam"
- "Go until jurong point…" vs "Free entry in 2 a wkly comp…"

::: narration
The raw material is the SMS Spam Collection from the UCI Machine Learning Repository: five thousand five hundred seventy-two real text messages, each labeled either spam or ham — ham being the traditional term for legitimate mail. A small download-and-unzip helper fetches it, and pandas reads the tab-separated file into a two-column table of labels and texts. The texts have the true texture of the medium: ham messages like Go until jurong point, crazy, available only in bugis; spam like Free entry in two a weekly comp to win FA Cup final tickets. Real data, real typos, real scams — which is exactly what a classifier needs to see if it's going to work on messages nobody curated.
:::

---
## Count the labels first

```python
print(df["Label"].value_counts())
# Label
# ham     4825
# spam     747
```

- one line, before anything else
- the shape of the data decides the plan
- 87% of messages are legitimate

::: narration
Before modeling, one line of pandas: count the values in the label column. Four thousand eight hundred twenty-five ham, seven hundred forty-seven spam. This is the first thing to do with any labeled dataset, every time, because the label distribution silently controls everything downstream — what accuracy means, what the model will find easy to exploit, whether the training signal is drowned by the majority class. Here the count reveals that eighty-seven percent of messages are legitimate, and that fact drives the entire next move. Thirty characters of code, and the difference between an evaluation you can trust and one that flatters a lazy model.
:::

---
## The imbalance problem

<div class="viz">
<svg viewBox="0 0 460 210">
<line class="axis" x1="50" y1="170" x2="420" y2="170"/>
<rect class="track" x="80" y="30" width="70" height="140" rx="3"/>
<rect class="bar" x="80" y="30" width="70" height="140" rx="3"/>
<rect class="track" x="190" y="30" width="70" height="140" rx="3"/>
<rect class="bar danger" x="190" y="148" width="70" height="22" rx="3"/>
<text class="tag" x="115" y="192">ham: 4,825</text>
<text class="tag" x="225" y="192">spam: 747</text>
<text class="cap" x="345" y="95">predict "ham" always:</text>
<text class="cap danger" x="345" y="115">87% accurate, useless</text>
</svg>
</div>

- 4,825 ham vs 747 spam — 6.5 : 1
- a lazy model scores 87% by always saying "ham"
- accuracy is meaningless until classes are comparable

::: narration
Counting the labels exposes a problem: four thousand eight hundred twenty-five ham messages versus seven hundred forty-seven spam — a six-and-a-half-to-one imbalance. Imbalance poisons the most natural metric. A model that learns nothing except to answer ham for everything would score about eighty-seven percent accuracy on this data while catching zero spam — a number that looks respectable and means nothing. Class imbalance is one of the eternal practical nuisances of machine learning, with a literature of remedies. The book chooses the simplest one, which also happens to shrink the dataset conveniently for fast fine-tuning: undersampling the majority class.
:::

---
## Balance by undersampling

```python
def create_balanced_dataset(df):
    num_spam = df[df["Label"] == "spam"].shape[0]
    ham_subset = df[df["Label"] == "ham"].sample(
        num_spam, random_state=123)
    return pd.concat([
        ham_subset, df[df["Label"] == "spam"]])

balanced_df["Label"] = balanced_df["Label"].map(
    {"ham": 0, "spam": 1})
```

- keep all 747 spam · sample 747 ham to match
- 1,494 messages, fifty-fifty
- labels become integers: ham → 0, spam → 1

::: narration
The balancing move: keep every one of the seven hundred forty-seven spam messages, and randomly sample exactly seven hundred forty-seven ham messages to stand against them — a fixed random seed making the draw reproducible. The result is a compact, perfectly balanced dataset of one thousand four hundred ninety-four messages, where fifty percent accuracy means guessing and anything above it means learning. Then the string labels become integers: ham is zero, spam is one. The book draws a nice parallel here — this is the same move as converting text into token IDs, just with a vocabulary of two instead of fifty thousand. Models don't consume words, ever; even the answer categories have to become numbers.
:::

---
## Roads not taken

- undersampling: simple, but discards 4,078 ham messages
- alternatives exist: oversample the minority, class weights
- beyond this book's scope — appendix B has pointers
- simplicity chosen deliberately, for speed and clarity

::: narration
Undersampling is the simplest cure for imbalance, and honesty requires noting its cost: over four thousand legitimate messages — real training signal — get discarded. The book acknowledges the alternatives: oversampling the minority class by duplication or synthesis, weighting the loss so rare-class errors cost more, and other techniques from a substantial literature, with pointers in an appendix for readers who want them. The choice of the simple road is deliberate and defensible here — the goal is a fast, clear demonstration of fine-tuning mechanics, and fifteen hundred balanced examples serve that better than five thousand skewed ones. In production, with accuracy on the line, the discarded data would deserve a second look.
:::

---
## Three-way split

- **70%** train · **10%** validation · **20%** test
- shuffle first, then slice · saved as three CSV files
- validation steers choices during development
- test stays untouched until the very end

::: narration
The balanced dataset splits three ways: seventy percent for training, ten percent for validation, twenty percent for testing, shuffled before slicing and saved as three CSV files for reuse. The three-way split encodes a discipline about honesty. Training data teaches the model. Validation data steers development — it's what you consult while choosing epochs and learning rates, so the model indirectly adapts to it over time. Test data answers only the final question, once, at the end: how good is this thing on text it has never influenced? Keeping those roles separate is what makes the closing accuracy number trustworthy — a distinction that will visibly matter when the final scores come in.
:::

---
## random_split

```python
def random_split(df, train_frac, validation_frac):
    df = df.sample(frac=1, random_state=123
        ).reset_index(drop=True)
    train_end = int(len(df) * train_frac)
    validation_end = train_end + int(
        len(df) * validation_frac)
    return (df[:train_end],
            df[train_end:validation_end],
            df[validation_end:])
```

- shuffle the whole frame, then slice by fractions
- test set = whatever remains after 0.7 + 0.1
- seeded: the same split, every run

::: narration
The splitting function is worth reading for its two quiet correctness details. First, it shuffles the entire data frame before slicing — sample with fraction one is the pandas idiom for a full shuffle — because slicing an unshuffled frame would put all of one class in one split whenever the source file is sorted. Second, it's seeded, so every run of the notebook produces the identical split; results stay comparable across sessions. The fractions are passed for training and validation, and the test set is simply the remainder — twenty percent, by implication. Three CSV files come out, and the raw dataset never needs touching again.
:::

---
<!-- .slide: class="divider" -->
### Part III
## Batching ragged text

::: narration
Part three solves a problem pretraining never had: real messages come in wildly different lengths, and tensors demand rectangles. The answer is padding — plus a small Dataset class that tokenizes once and serves uniform rows forever.
:::

---
## The rectangle problem

- pretraining sliced one long text into equal chunks
- messages are ragged: five tokens to over a hundred
- a batch must be a rectangle — two options:
- **truncate** all to the shortest, or **pad** all to the longest

::: narration
During pretraining, batching was free: one continuous text stream, sliced into identical two-hundred-fifty-six-token windows. Independent text messages break that convenience — one message is five tokens, the next is a hundred and ten, and a tensor batch has to be rectangular. Two options exist. Truncating everything to the shortest message is computationally cheapest and informationally brutal — most of most messages would be discarded, and with them the evidence of spamminess. Padding everything to the longest message preserves every word at the cost of some wasted computation on filler. The book pads. The interesting question is what to pad with — and the answer reuses an old friend.
:::

---
## Verifying the pad token

```python
tokenizer = tiktoken.get_encoding("gpt2")
print(tokenizer.encode("<|endoftext|>",
    allowed_special={"<|endoftext|>"}))
# [50256]
```

- the claim: end-of-text is token 50256
- one encode call confirms it
- trust, then verify — even the small facts

::: narration
The padding scheme leans on one specific integer — that the end-of-text marker is token ID fifty thousand two hundred fifty-six — and rather than asking readers to take that on faith, the book verifies it: encode the marker string, with the flag that permits special tokens, and the tokenizer answers with a one-element list containing exactly that ID. It's a two-line check that models a habit worth having. Magic numbers migrate between tokenizer versions and vocabularies; a claim about one costs nothing to confirm and corrupts everything silently when wrong. Here the check passes, and the padding code gets its constant with a clean conscience.
:::

---
## Padding, pictured

<div class="viz wide">
<svg viewBox="0 0 560 190">
<rect class="cell on" x="40" y="20" width="52" height="34"/><rect class="cell on" x="94" y="20" width="52" height="34"/><rect class="cell on" x="148" y="20" width="52" height="34"/><rect class="cell on" x="202" y="20" width="52" height="34"/><rect class="cell off" x="256" y="20" width="52" height="34"/><rect class="cell off" x="310" y="20" width="52" height="34"/><rect class="cell off" x="364" y="20" width="52" height="34"/><rect class="cell off" x="418" y="20" width="52" height="34"/>
<rect class="cell on" x="40" y="58" width="52" height="34"/><rect class="cell on" x="94" y="58" width="52" height="34"/><rect class="cell on" x="148" y="58" width="52" height="34"/><rect class="cell on" x="202" y="58" width="52" height="34"/><rect class="cell on" x="256" y="58" width="52" height="34"/><rect class="cell off" x="310" y="58" width="52" height="34"/><rect class="cell off" x="364" y="58" width="52" height="34"/><rect class="cell off" x="418" y="58" width="52" height="34"/>
<rect class="cell on" x="40" y="96" width="52" height="34"/><rect class="cell on" x="94" y="96" width="52" height="34"/><rect class="cell on" x="148" y="96" width="52" height="34"/><rect class="cell on" x="202" y="96" width="52" height="34"/><rect class="cell on" x="256" y="96" width="52" height="34"/><rect class="cell on" x="310" y="96" width="52" height="34"/><rect class="cell on" x="364" y="96" width="52" height="34"/><rect class="cell on" x="418" y="96" width="52" height="34"/>
<text class="cap" x="280" y="155">green: message tokens · pale: 50256 padding, out to the longest row</text>
<text class="olbl" x="510" y="37">padded</text>
<text class="olbl" x="510" y="75">padded</text>
<text class="olbl" x="510" y="113">longest</text>
</svg>
</div>

- pad token: `<|endoftext|>`, ID **50256**
- appended as token IDs, not as text
- every row reaches the longest message's length: **120**

::: narration
The padding token is the tokenizer's own end-of-text marker — token ID fifty thousand two hundred fifty-six, the same special token that separated documents during GPT-2's pretraining, now moonlighting as filler. Padding happens in ID space, not text space: after each message is tokenized, the ID fifty-two fifty-six is appended however many times it takes to reach the length of the dataset's longest message, which turns out to be one hundred twenty tokens — a natural ceiling for text messages. Short messages get lots of filler, the longest gets none, and every row of the batch ends up exactly as wide as every other. Whether the model gets confused by the filler is a fair question — held for a few slides, because the answer falls out of the classification design itself.
:::

---
## SpamDataset

```python
class SpamDataset(Dataset):
    def __init__(self, csv_file, tokenizer,
                 max_length=None, pad_token_id=50256):
        self.data = pd.read_csv(csv_file)
        self.encoded_texts = [
            tokenizer.encode(text)
            for text in self.data["Text"]]
        ...
    def __getitem__(self, index):
        return (torch.tensor(self.encoded_texts[index]),
                torch.tensor(self.data.iloc[index]["Label"]))
```

- tokenize **once**, up front — then serve tensors
- pads to the longest sequence, or truncates to `max_length`
- returns (token IDs, label) pairs

::: narration
The SpamDataset class packages the whole preparation behind PyTorch's Dataset interface. On construction it reads a CSV, tokenizes every message once — pretokenizing up front rather than re-encoding on every access — finds the longest sequence if no maximum is given, truncates anything over the cap, and pads everything else with the end-of-text ID. Afterward, indexing into it returns a ready pair of tensors: the padded token IDs and the integer label. One subtlety in how the three splits use it: the training set defines the max length of one hundred twenty, and the validation and test sets are constructed to that same length, so every split serves identically shaped rows and no information about the test set ever leaks into a design choice.
:::

---
## The max_length dial

```python
train_dataset = SpamDataset(csv_file="train.csv",
    max_length=None, tokenizer=tokenizer)
print(train_dataset.max_length)   # 120

val_dataset = SpamDataset(csv_file="validation.csv",
    max_length=train_dataset.max_length,
    tokenizer=tokenizer)
```

- `None` → discover the longest: 120 tokens
- val and test built to the **training** length
- anything longer gets truncated to fit

::: narration
The max-length parameter has a small protocol around it. The training set passes none, which tells the dataset to discover its own ceiling — the longest training message, one hundred twenty tokens. The validation and test sets are then constructed to that same number, with any longer message truncated to fit, so all three splits serve identically shaped tensors. The direction of the dependency matters: the training set defines the geometry, and the evaluation sets conform to it — never the reverse, because letting test data influence any construction decision is the small beginning of leakage. And if a future dataset ran long, the model's own hard ceiling applies: nothing can exceed the thousand-twenty-four-token context.
:::

---
## Loaders, counted

```python
train_loader = DataLoader(dataset=train_dataset,
    batch_size=8, shuffle=True, drop_last=True)

# Input batch:  torch.Size([8, 120])
# Label batch:  torch.Size([8])
# 130 training · 19 validation · 38 test batches
```

- eight messages per batch, 120 tokens each
- the target is now a **label**, not shifted text
- the supervised-learning shape

::: narration
Wrapping the datasets in loaders finishes the pipeline: batches of eight, shuffled for training, the last partial batch dropped to keep shapes uniform. A quick verification pass prints the geometry — inputs of eight by one hundred twenty, labels of eight — and the batch counts: one hundred thirty for training, nineteen for validation, thirty-eight for test. Compare this to pretraining's shape and the deep change is visible in the target tensor. There, targets were the input shifted by one — the model learned to continue text. Here the target is a single integer per message — the model must learn to judge text. Same inputs, same architecture ahead; a completely different question being graded.
:::

---
## Exercise: pad to the full context

- alternative: pad everything to 1,024, the model's maximum
- eight times the tokens per batch — mostly filler
- exercise 6.1: try it, measure the accuracy effect
- geometry choices are experiments, not doctrine

::: narration
Before leaving the data, the book poses its first exercise: instead of padding to the longest message, pad everything to the model's full one-thousand-twenty-four-token context and observe what happens to predictive performance. It's a real question, not busywork. Padding to a hundred twenty is an optimization — eight times less computation per batch than the full window — but does the extra filler hurt, help, or wash out? The classification design gives a reason for a hypothesis: the verdict reads from the last real token's position either way. But hypotheses about neural networks have a humbling track record, which is the exercise's real lesson — geometry choices are cheap experiments, so run them rather than argue them.
:::

---
<!-- .slide: class="divider" -->
### Part IV
## Surgery on the model

::: narration
Part four modifies the patient. The pretrained GPT-2 is loaded and verified, then operated on: its language-modeling head is replaced with a two-way classification head, and all but a chosen few layers are frozen. The cuts are small and each one is deliberate.
:::

---
## Load, and verify the pulse

```python
BASE_CONFIG = {"vocab_size": 50257, "context_length": 1024,
               "drop_rate": 0.0, "qkv_bias": True}
BASE_CONFIG.update(model_configs["gpt2-small (124M)"])

model = GPTModel(BASE_CONFIG)
load_weights_into_gpt(model, params)

# "Every effort moves you forward.
#  The first step is to understand the importance
#  of your work"
```

- chapter 5's loading path, reused verbatim
- dropout 0 · qkv_bias on · full 1,024 context
- coherent completion = weights landed correctly

::: narration
Model setup reuses chapter five's machinery verbatim: the base configuration — now with dropout at zero, biases on, and the full one-thousand-twenty-four context — the size table, the downloader, and the weight-loading function. Before any surgery, a pulse check: prompt the loaded model with Every effort moves you and it continues, forward. The first step is to understand the importance of your work. Coherent English, which certifies the weights are in place — the same end-to-end verification trick as before, worth running every single time a model is loaded, because every step that follows silently depends on it. With the patient confirmed healthy, the first experiment is to see whether it can already do the job untrained.
:::

---
## Can it already classify? No.

```text
Prompt:  "Is the following text 'spam'? Answer with
          'yes' or 'no': 'You are a winner you have
          been specially selected to receive...'"

Output:  "The following text 'spam'? Answer with
          'yes' or 'no': 'You are a winner..."
```

- the pretrained model just echoes the prompt
- it can continue text — it cannot **follow instructions**
- pretraining ≠ obedience · hence fine-tuning

::: narration
An honest baseline: ask the pretrained model directly. The prompt spells out the task — is the following text spam, answer with yes or no — followed by an obvious scam message. The model's response is to echo the question back, slightly mangled. No yes, no no, no judgment. This failure is worth savoring because it locates exactly what pretraining does and doesn't buy. The model can continue text with fluent plausibility — that's what next-token training teaches. It has no idea that a question printed above a colon is a request it should satisfy. Instruction following is a separate, trained skill — chapter seven's subject. This chapter takes the other road entirely: don't teach it to answer; rewire it so its output is the answer.
:::

---
## Know what you're cutting

```python
print(model)
# GPTModel(
#   (tok_emb): Embedding(50257, 768)
#   (trf_blocks): Sequential(
#     ...
#     (11): TransformerBlock(...)
#   )
#   (final_norm): LayerNorm()
#   (out_head): Linear(in_features=768,
#       out_features=50257, bias=False)
# )
```

- print the model before operating on it
- the head is right there: 768 → 50,257
- chapter 4's architecture, listed by PyTorch itself

::: narration
Before replacing anything, print the model. PyTorch renders any module as a readable tree, and the output is chapter four's architecture reflected back: the token and positional embeddings, twelve numbered transformer blocks with their attention and feed-forward internals, the final layer norm, and — the surgical target — out head, a linear layer from seven hundred sixty-eight features to fifty thousand two hundred fifty-seven, no bias. Printing first is more than ceremony. The swap that follows addresses the head by attribute name, and this listing is where that name and its exact dimensions are confirmed rather than assumed. Look, then cut.
:::

---
## The head swap

<div class="viz wide">
<svg viewBox="0 0 560 200">
<line class="edge ghost" x1="120" y1="130" x2="55" y2="50"/>
<line class="edge ghost" x1="120" y1="130" x2="90" y2="50"/>
<line class="edge ghost" x1="120" y1="130" x2="125" y2="50"/>
<line class="edge ghost" x1="120" y1="130" x2="160" y2="50"/>
<line class="edge ghost" x1="120" y1="130" x2="195" y2="50"/>
<line class="edge accent" x1="420" y1="130" x2="385" y2="50"/>
<line class="edge accent" x1="420" y1="130" x2="455" y2="50"/>
<circle class="node muted" cx="55" cy="40" r="11"/><circle class="node muted" cx="90" cy="40" r="11"/><circle class="node muted" cx="125" cy="40" r="11"/><circle class="node muted" cx="160" cy="40" r="11"/><circle class="node muted" cx="195" cy="40" r="11"/>
<circle class="node good" cx="385" cy="40" r="14"/><circle class="node warn" cx="455" cy="40" r="14"/>
<rect class="node" x="70" y="130" width="100" height="36" rx="6"/><text class="lbl sm" x="120" y="148">768 features</text>
<rect class="node" x="370" y="130" width="100" height="36" rx="6"/><text class="lbl sm" x="420" y="148">768 features</text>
<text class="olbl" x="125" y="14">… 50,257 vocabulary scores</text>
<text class="olbl" x="420" y="14">not-spam · spam</text>
<text class="tag" x="120" y="188">before: language head</text>
<text class="tag" x="420" y="188">after: classification head</text>
</svg>
</div>

```python
model.out_head = torch.nn.Linear(
    in_features=BASE_CONFIG["emb_dim"], out_features=2)
```

- one line replaces 50,257 outputs with 2

::: narration
The operation itself is one line. The model's output head — the linear layer mapping seven hundred sixty-eight features onto fifty thousand two hundred fifty-seven vocabulary scores — is replaced by a fresh linear layer mapping the same seven hundred sixty-eight features onto two outputs: a score for not-spam and a score for spam. Everything beneath the head is untouched: the embeddings, all twelve transformer blocks, the final norm — the entire language-understanding machine remains. What changes is only the final projection, the part that turns understanding into an answer. The new layer arrives randomly initialized, knowing nothing; its education is what the fine-tuning run will provide. First, though, two design questions: why two outputs rather than one, and which parts of the old machine should be allowed to learn?
:::

---
## Why two nodes, not one

- binary tasks technically need one output
- but one node → a different loss function
- two nodes → the same `cross_entropy` as pretraining
- and the code generalizes: three classes = three nodes

::: narration
A binary decision technically needs only a single output — one score, thresholded. The book deliberately uses two, and gives its reasons. With one node you'd switch loss functions, to a binary cross-entropy formulation with its own conventions; with one node per class, the exact same cross-entropy machinery from pretraining applies unchanged — the loss that compared fifty thousand scores against a correct token now compares two scores against a correct label, with literally the same function call. And the pattern generalizes for free: a three-way problem — classifying news as technology, sports, or politics, say — is the same code with out features equal to three. One design choice, two dividends: reuse and generality.
:::

---
## Freeze, then thaw selectively

```python
for param in model.parameters():
    param.requires_grad = False        # freeze everything

model.out_head = torch.nn.Linear(768, 2)   # trainable by birth

for param in model.trf_blocks[-1].parameters():
    param.requires_grad = True         # last block
for param in model.final_norm.parameters():
    param.requires_grad = True         # final norm
```

- freeze all → new head + last block + final norm thaw
- three trainable islands in a frozen model

::: narration
Now the training plan, expressed in requires-grad flags. First, freeze everything: every parameter in the model is marked untrainable, protecting the pretrained knowledge wholesale. The new output head, created after the freeze, is trainable by default — a fresh layer is born with requires grad set to true. Then two regions thaw deliberately: the last transformer block, and the final layer norm that feeds the head. The result is a model that is mostly ice with three trainable islands — head, final block, final norm — a tiny fraction of the one hundred twenty-four million parameters. Why those regions and not more, or fewer, is a question with actual empirical content, and it gets the next slide to itself.
:::

---
## How the freeze actually works

- `requires_grad = False` — backprop skips the parameter
- a **new** layer is born with `requires_grad = True`
- the optimizer can hold all params; frozen ones never get gradients
- knowledge preserved by flag, not by copying

::: narration
The freezing mechanism deserves a beat of precision, because it's all done with one boolean per tensor. Setting requires-grad to false tells autograd not to compute gradients for that parameter — backpropagation simply doesn't visit it, and no optimizer step can move it. A freshly constructed layer arrives with the flag set to true, which is why the new head is trainable without any explicit blessing — creation order does the work. And note what this means for the optimizer: it can be handed the full parameter list, frozen tensors included, because parameters that never receive gradients never change. The pretrained knowledge isn't copied to safety anywhere; it's protected in place by a flag.
:::

---
## Why the last layers

- lower layers: general language — grammar, structure, meaning
- upper layers: task-flavored, specific features
- head alone works · + last block measurably better
- fewer trainable params → faster, cheaper fine-tuning

::: narration
The freeze pattern encodes a widely observed fact about deep language models: depth stratifies generality. The lower layers capture basic linguistic structure — syntax, word identity, broad semantics — machinery useful for any task, exactly what should be preserved. The upper layers build more task-flavored, specific representations, which are the right ones to bend toward spam detection. The book is empirical about it: training only the new head is technically sufficient, but experiments found that also fine-tuning the last transformer block noticeably improves performance, so that's the configuration used, with deeper exploration deferred to an appendix and an exercise inviting a full-model comparison. And there's a bonus dividend: with so few trainable parameters, each training step is meaningfully cheaper.
:::

---
## Exercise: thaw everything

- exercise 6.2: fine-tune **all** layers, compare
- more capacity to adapt — more compute, more overfitting risk
- appendix B: experiments on which layers to tune
- the freeze pattern is a dial, not a law

::: narration
The companion exercise runs the other direction: unfreeze the entire model and fine-tune all one hundred twenty-four million parameters, then compare against the selective recipe. The trade-offs are real on both sides — a fully thawed model has more room to adapt to the task, at the price of longer training steps and a greater appetite for overfitting when the dataset is only fifteen hundred messages. The book's chosen pattern — head, last block, final norm — is presented as an empirically good default, with an appendix of experiments on the question, not as doctrine. The freeze boundary is a dial every fine-tuning project gets to set for itself, trading compute and data volume against adaptation depth.
:::

---
## The output changed shape

```python
inputs = tokenizer.encode("Do you have time")
# inputs: tensor([[5211,  345,  423,  640]])   [1, 4]

with torch.no_grad():
    outputs = model(inputs)
# tensor([[[-1.5854,  0.9904],
#          [-3.7235,  7.4548],
#          [-2.2661,  6.6049],
#          [-3.5983,  3.9902]]])              [1, 4, 2]
```

- four tokens in → four **rows of two** out
- every position now scores spam vs not-spam
- but only one row is worth reading…

::: narration
Feed the modified model a four-token message — do you have time — and the output shape tells the story of the surgery: one by four by two, where the old model would have produced one by four by fifty thousand two hundred fifty-seven. Four rows, one per input token, each now holding just two numbers — a not-spam score and a spam score at every position. Which raises the chapter's most instructive question. The task needs one verdict for the whole message, and the model offers four. Which row is the verdict? The answer isn't a convention or a shrug — it follows necessarily from something built into the architecture back in chapter three.
:::

---
<!-- .slide: class="divider" -->
### Part V
## The last token, and how to score it

::: narration
Part five settles which token speaks for the message — a question the causal attention mask answers definitively — and then builds the two measuring instruments for fine-tuning: classification accuracy for humans, and cross-entropy loss for the optimizer.
:::

---
## The mask decides

<div class="viz">
<svg viewBox="0 0 460 240">
<rect class="cell on" x="110" y="20" width="46" height="40"/><rect class="cell off" x="158" y="20" width="46" height="40"/><rect class="cell off" x="206" y="20" width="46" height="40"/><rect class="cell off" x="254" y="20" width="46" height="40"/>
<rect class="cell on" x="110" y="62" width="46" height="40"/><rect class="cell on" x="158" y="62" width="46" height="40"/><rect class="cell off" x="206" y="62" width="46" height="40"/><rect class="cell off" x="254" y="62" width="46" height="40"/>
<rect class="cell on" x="110" y="104" width="46" height="40"/><rect class="cell on" x="158" y="104" width="46" height="40"/><rect class="cell on" x="206" y="104" width="46" height="40"/><rect class="cell off" x="254" y="104" width="46" height="40"/>
<rect class="cell sel" x="110" y="146" width="46" height="40"/><rect class="cell sel" x="158" y="146" width="46" height="40"/><rect class="cell sel" x="206" y="146" width="46" height="40"/><rect class="cell sel" x="254" y="146" width="46" height="40"/>
<text class="olbl" x="80" y="40">Do</text><text class="olbl" x="80" y="82">you</text><text class="olbl" x="80" y="124">have</text><text class="olbl" x="80" y="166">time</text>
<text class="cap" x="230" y="215">rows: what each token may attend to — only the last row spans it all</text>
</svg>
</div>

- causal mask: each token sees itself and the past only
- token 1 saw one word · the **last token saw everything**
- the last output is the only whole-message summary

::: narration
Recall the causal attention mask: in a GPT, every token may attend only to itself and the tokens before it — never ahead. Lay the attention pattern out as a triangle and the answer to which row speaks for the message becomes geometry. The first token's output was computed seeing one word. The second saw two. Only the final token's output was computed with access to every token in the message — it is, structurally, the only position whose representation can summarize the whole input. So classification reads exactly one row: outputs at position minus one. Every other row is discarded — including, pleasingly, every padding position, which resolves the earlier worry about filler tokens. And this isn't dogma: the book's exercise invites fine-tuning on the first token instead, to watch the accuracy collapse for yourself.
:::

---
## Exercise: classify from the first token

- exercise 6.3: fine-tune reading position **0** instead of −1
- the first token saw exactly one word
- accuracy drops measurably — geometry is destiny
- the cheapest way to *feel* the causal mask

::: narration
The mask argument is clean enough that the book invites you to test it: exercise six point three says rerun the whole fine-tuning pipeline, but classify from the first token's output instead of the last. The first token's representation was computed while attending to exactly one word — itself. However much fine-tuning polishes it, the information about the other hundred-plus tokens of the message physically is not there, and the predictive performance drops accordingly. It's the cheapest possible way to feel an architectural fact as a number: one index change, one rerun, and the causal mask's meaning shows up directly in the accuracy column.
:::

---
## From two logits to a verdict

```python
logits = outputs[:, -1, :]        # last token only
label = torch.argmax(logits)
print("Class label:", label.item())
# Class label: 1
```

- larger of two numbers wins — softmax optional, as ever
- 0 = not spam · 1 = spam
- this untrained head says "spam" to "Do you have time"

::: narration
Converting the chosen row into a verdict reuses the oldest move in the book: argmax. Slice the last position's two logits; whichever is larger names the class — index zero for not-spam, index one for spam. As with text generation, softmax is optional for prediction since it never changes which value is largest, so the code skips straight from logits to argmax. Running this on do you have time, the surgically modified but untrained model announces: class one, spam. Which is wrong, and expected — the new head is still random numbers. The wrongness needs quantifying across a whole dataset, and that instrument is classification accuracy.
:::

---
## The accuracy meter

```python
def calc_accuracy_loader(data_loader, model, device,
                         num_batches=None):
    model.eval()
    correct, examples = 0, 0
    for input_batch, target_batch in data_loader:
        with torch.no_grad():
            logits = model(input_batch)[:, -1, :]
        predicted = torch.argmax(logits, dim=-1)
        examples += predicted.shape[0]
        correct += (predicted == target_batch).sum().item()
    return correct / examples
```

- argmax the last token, batch-wide · count the matches
- the human-readable score: fraction correct

::: narration
The accuracy function walks a data loader, and for each batch does exactly the last-token argmax — vectorized across the batch — then counts how many predictions equal the labels, returning the fraction correct at the end. Eval mode and no-grad wrap the measurement, the same honesty hygiene as always: no dropout noise, no wasted gradient bookkeeping. An optional num-batches cap allows quick estimates from a subset during training rather than paying for the full dataset at every checkpoint. This is the number humans care about — the probability the classifier is right about a message. The optimizer, however, cannot use it, for a reason that decides what gets minimized instead.
:::

---
## The starting line: a coin flip

- training accuracy: **46.25%**
- validation accuracy: **45.00%**
- test accuracy: **48.75%**
- balanced classes → 50% is zero knowledge · we're at zero

::: narration
Measured on ten batches from each split, the untrained classifier scores forty-six and a quarter percent on training data, forty-five on validation, forty-eight and three quarters on test. Against balanced classes, fifty percent is what a coin scores — so all three numbers say the same thing: zero knowledge, exactly as expected from a random head. It's worth appreciating what this baseline buys. Because the dataset was balanced back in part two, these numbers are interpretable at a glance, and every point above fifty from here on is genuine learned signal. On an unbalanced set, this same model could have scored eighty-seven percent while knowing nothing.
:::

---
## What the optimizer minimizes

```python
def calc_loss_batch(input_batch, target_batch, model, device):
    logits = model(input_batch)[:, -1, :]   # last token
    loss = torch.nn.functional.cross_entropy(
        logits, target_batch)
    return loss

# initial: train 2.453 · val 2.583 · test 2.322
```

- accuracy isn't differentiable — no gradient in a step function
- cross entropy on the last token's 2 logits is
- same loss as pretraining, narrowed to one position

::: narration
Accuracy can't drive training: a prediction flips from wrong to right in a discrete jump, and a step function has no useful gradient. So the optimizer minimizes cross entropy as a differentiable proxy — push probability toward the correct class, and accuracy follows. The batch-loss function is the pretraining one with a single edit: instead of comparing logits at every position against fifty thousand possible tokens, it takes only the last position's two logits against the label. Same function call, new slice. Initial losses land around two and a half across all three splits — the starting height the training run now has to grind down.
:::

---
<!-- .slide: class="divider" -->
### Part VI
## The fine-tuning run

::: narration
Part six runs the training. The loop is the pretraining loop with two lines' difference, the run takes five minutes on a laptop, and the curves that come out of it are what healthy learning looks like — a pointed contrast to the overfitting seen in chapter five.
:::

---
## The same loop, re-aimed

```python
def train_classifier_simple(model, train_loader, val_loader,
        optimizer, device, num_epochs, eval_freq, eval_iter):
    ...
    for epoch in range(num_epochs):
        model.train()
        for input_batch, target_batch in train_loader:
            optimizer.zero_grad()
            loss = calc_loss_batch(...)
            loss.backward()
            optimizer.step()
            examples_seen += input_batch.shape[0]   # new
        train_acc = calc_accuracy_loader(...)        # new
```

- zero → loss → backward → step: unchanged
- tracks **examples** seen, reports **accuracy** per epoch
- fine-tuning = pretraining with a different scoreboard

::: narration
Here is the most reassuring slide in the chapter: the fine-tuning function is the pretraining function. The inner cycle — zero the gradients, compute the loss, backpropagate, step the optimizer — is identical, and only the instrumentation differs: it counts training examples seen rather than tokens, since messages are the natural unit now, and after each epoch it computes classification accuracy on both splits instead of printing a text sample. That's the entire delta. Fine-tuning is not a new kind of training; it is training, pointed at a new loss, starting from weights that already know the language. Everything learned about loops in chapter five transfers wholesale.
:::

---
## The watcher, unchanged

```python
def evaluate_model(model, train_loader, val_loader,
                   device, eval_iter):
    model.eval()
    with torch.no_grad():
        train_loss = calc_loss_loader(
            train_loader, model, device,
            num_batches=eval_iter)
        val_loss = calc_loss_loader(...)
    model.train()
    return train_loss, val_loss
```

- byte-for-byte the pretraining version
- eval mode · no_grad · restore train mode
- the utilities transfer because the loss slot did

::: narration
The evaluation helper is literally the pretraining one, unchanged — eval mode on, measure both losses without gradients over a capped number of batches, flip back to train mode, return the pair. It transfers because the design let it: the only task-specific logic anywhere is inside calc-loss-batch, which slices the last token and compares two logits. Everything built on top of that slot — the loader-averaging function, the evaluator, the training loop — is task-blind plumbing. That's a software lesson as much as a machine-learning one: get the interfaces right, and switching from language modeling to classification touches one function instead of five.
:::

---
## Five epochs, five minutes

```python
optimizer = torch.optim.AdamW(
    model.parameters(), lr=5e-5, weight_decay=0.1)
num_epochs = 5

# Training completed in 5.65 minutes.
```

- AdamW again · a gentler learning rate: 5e-5
- only the thawed islands actually update
- M3 MacBook Air: ~6 min · single GPU: under 30 s

::: narration
The run configuration: AdamW again, weight decay of zero point one again, but a gentler learning rate — five times ten to the minus five, roughly a tenth of pretraining's. That's characteristic of fine-tuning: the pretrained weights are already good, so updates should nudge rather than shove. Note that the optimizer is handed all the model's parameters, but the freeze from part four means gradients only flow into the thawed islands — the head, the last block, the final norm — so that's all it ever updates. Five epochs over the roughly thousand training messages completes in five point six five minutes on an M3 MacBook Air, or under half a minute on a data-center GPU. Fine-tuning's affordability, demonstrated by wall clock.
:::

---
## The scoreboard, epoch by epoch

```text
Ep 1: Train loss 2.153 → 0.523 | acc 70.00% / 72.50%
Ep 2:            0.561 → 0.409 | acc 82.50% / 85.00%
Ep 3:            0.333 → 0.340 | acc 90.00% / 90.00%
Ep 4:            0.136 → 0.222 | acc 100.00% / 97.50%
Ep 5:            0.207 → 0.083 | acc 100.00% / 97.50%
```

- one epoch in: already 70% — pretraining pays immediately
- steady climb to the high nineties by epoch four
- train and validation move together

::: narration
The scoreboard tells a rapid story. One epoch in, accuracy has jumped from coin-flip to seventy percent — the pretrained representations are so useful that a thousand examples and one pass already extract most of the task. By epoch three, ninety percent on both splits; by four, the training subset saturates at a hundred while validation holds at ninety-seven and a half. And throughout, the two columns move together — training and validation improving in lockstep rather than splitting apart. That lockstep is the signature to remember, because the last time a training run appeared in this book, the two curves told a very different story.
:::

---
## Healthy curves, this time

<div class="viz">
<svg viewBox="0 0 460 210">
<line class="axis" x1="45" y1="170" x2="430" y2="170"/>
<line class="axis" x1="45" y1="20" x2="45" y2="170"/>
<path class="edge accent" d="M50,30 L85,95 C120,140 180,148 240,152 C300,156 370,158 425,161" fill="none"/>
<path class="edge good" d="M50,25 L85,90 C120,135 180,144 240,150 C300,155 370,159 425,164" fill="none"/>
<text class="cap accent" x="150" y="120">train</text>
<text class="cap good" x="150" y="90">validation</text>
<text class="tag" x="237" y="195">epochs 1 → 5 · loss: 2.4 → ~0.1</text>
</svg>
</div>

- both losses fall together, no widening gap
- minimal overfitting — enough data for the trainable params
- chapter 5's diverging curves: the contrast to remember

::: narration
Plotted, the two loss curves drop steeply through the first epoch and glide down together toward zero, nearly on top of each other the whole way — no gap opening, no validation plateau. Recall chapter five's plot, where training loss dove to zero point four while validation stalled at six and a half: that was a model memorizing a tiny corpus. This is the healthy picture, and the difference is proportion. Here, roughly a thousand training examples discipline a small set of trainable parameters — the frozen majority of the network can't overfit because it can't move at all. The freeze that saved computation also acts as regularization. Five epochs is judged right by exactly this plot: no early divergence, validation still improving to the end.
:::

---
## Choosing the number of epochs

- no universal answer — the loss plot decides
- overfitting after early epochs → train less
- validation still falling at the end → train more
- here: five, and validation is near zero — right-sized

::: narration
Why five epochs? The book's sidebar gives the honest answer: there is no universal number, and the loss plot is the instrument that sets it. If the curves show validation loss stalling or rising while training loss keeps falling after the first couple of epochs, the run is overfitting — use fewer. If the validation trendline is still clearly descending when training ends, the model is undertrained — use more. Five is offered as a sensible starting point for a task of this size, and in this concrete case the plot ratifies it: no early divergence, and validation loss closing on zero by the finish. The general habit: pick a default, plot, adjust — the curve outranks the convention.
:::

---
## The accuracy curves agree

<div class="viz">
<svg viewBox="0 0 460 200">
<line class="axis" x1="45" y1="160" x2="430" y2="160"/>
<line class="axis" x1="45" y1="20" x2="45" y2="160"/>
<path class="edge accent" d="M50,120 L120,88 C180,62 240,45 310,30 L425,25" fill="none"/>
<path class="edge good" d="M50,110 L120,82 C180,60 240,48 310,38 L425,36" fill="none"/>
<text class="cap accent" x="330" y="16">train → 1.00</text>
<text class="cap good" x="335" y="55">validation → .975</text>
<text class="tag" x="237" y="185">epochs 1 → 5 · accuracy 0.70 → ~1.0</text>
</svg>
</div>

- same plotting helper, accuracy instead of loss
- both climb together, plateau near the top
- two views, one verdict: learning generalized

::: narration
The same plotting helper, pointed at the accuracy histories instead of the losses, draws the confirming picture: both curves climb steeply through the early epochs and plateau near the ceiling, training touching a hundred percent while validation levels just below it, the two hugging each other the whole way. Loss curves and accuracy curves are two projections of the same run, and it's good practice to inspect both — loss is what the optimizer sees and moves smoothly, accuracy is what the application cares about and moves in steps. When both tell the same story, as here — rapid learning, close generalization, no divergence — the run is trustworthy from either angle.
:::

---
## Estimates vs. the full count

- during training: accuracy from **5 batches** — `eval_iter=5`
- quick pulse checks, cheap enough to run often
- the final numbers: every batch, all three splits
- estimate while working, count when it matters

::: narration
One methodological detail separates the numbers seen during training from the final ones. The per-epoch accuracies printed by the loop were estimated from just five batches — the eval-iter setting — because full-dataset evaluation at every checkpoint would spend more time measuring than training. Those estimates are noisy but cheap, perfect for steering. The final evaluation drops the cap and scores every example in all three splits, which is why its numbers are the citable ones. The distinction generalizes to any experimental work: use fast approximate measurements to navigate, and pay for the precise measurement once, at the moment the number will be written down.
:::

---
## Final marks, full datasets

- training accuracy: **97.21%**
- validation accuracy: **97.32%**
- test accuracy: **95.67%**
- val > test, slightly — and that's normal

::: narration
The final evaluation drops the batch caps and scores every example in all three splits. Training: ninety-seven point two one percent. Validation: ninety-seven point three two. Test: ninety-five point six seven. Two readings. First, train and test nearly coincide, confirming minimal overfitting — the model works on messages it never saw. Second, validation runs slightly above test, and the book flags this as a normal, instructive pattern: development involves tuning choices — epochs, learning rate — against the validation set, so the model comes to fit it a little better than truly fresh data. The test number is the honest one, which is precisely why it was kept in a vault until now. From a coin flip to ninety-six percent, in five laptop-minutes.
:::

---
## Reading the small gap

- val 97.32 vs test 95.67 — a 1.65-point gap
- development tuned choices **against** validation
- shrink it with more dropout or weight decay, if needed
- the test number is the one to publish

::: narration
The one-and-two-thirds-point gap between validation and test accuracy gets a short diagnosis from the book. During development, choices — the epoch count, the learning rate, judgments made from the loss plot — were steered by validation performance, so the model has been indirectly fit to the validation set in a way the test set never experienced. The gap is that indirect fitting, made visible. It's small and normal here, and if it needed shrinking, the levers are the regularization knobs: raise the dropout rate or the optimizer's weight decay. The lasting rule is about reporting: the test number, insulated from every development decision, is the one that goes in the write-up.
:::

---
<!-- .slide: class="divider" -->
### Part VII
## Shipping the classifier

::: narration
Part seven turns the fine-tuned model into a usable tool: one function that takes a raw string and returns spam or not spam, a test drive on fresh messages, and a saved checkpoint so the five minutes of training never need repeating.
:::

---
## classify_review

```python
def classify_review(text, model, tokenizer, device,
                    max_length=None, pad_token_id=50256):
    model.eval()
    input_ids = tokenizer.encode(text)
    input_ids = input_ids[:min(
        max_length, model.pos_emb.weight.shape[0])]
    input_ids += [pad_token_id] * (max_length - len(input_ids))
    input_tensor = torch.tensor(input_ids).unsqueeze(0)
    with torch.no_grad():
        logits = model(input_tensor)[:, -1, :]
    predicted = torch.argmax(logits, dim=-1).item()
    return "spam" if predicted == 1 else "not spam"
```

- the whole pipeline in one function: encode · truncate · pad · predict

::: narration
The deployment function compresses the entire chapter into a dozen lines. Take a raw string; encode it with the tokenizer; truncate if it exceeds either the requested maximum or the model's supported context, read off the positional embedding table; pad with the end-of-text ID out to the training length, so inference sees exactly the geometry fine-tuning saw; add the batch dimension; run the model without gradients; argmax the last token's two logits; and translate the winning index back into a human word — spam or not spam. Every preprocessing decision from the dataset class is faithfully mirrored here, which is the unglamorous discipline that makes deployed models behave like their test scores promised.
:::

---
## Two fresh messages

```text
"You are a winner you have been specially
 selected to receive $1000 cash or a $2000 award."
                                        → spam

"Hey, just wanted to check if we're still on
 for dinner tonight? Let me know!"
                                        → not spam
```

- both correct, on text the model never saw
- the pretrained echo-machine now renders verdicts

::: narration
The test drive: two messages written fresh. The first — you are a winner, specially selected to receive a thousand dollars cash — comes back spam. The second — hey, just wanted to check if we're still on for dinner tonight — comes back not spam. Both correct. It's worth remembering where this model stood at the start of the chapter: shown the very same winner message with explicit instructions to answer yes or no, it could only echo the prompt back. The capability didn't come from clever prompting — it came from changing two layers and showing it fifteen hundred examples. Specialization, surgically installed.
:::

---
## Keep the weights

```python
torch.save(model.state_dict(), "review_classifier.pth")

model_state_dict = torch.load(
    "review_classifier.pth", map_location=device)
model.load_state_dict(model_state_dict)
```

- the standard state_dict save, one classifier file
- reload into the modified architecture — head and all
- train once, classify forever

::: narration
Last housekeeping: persist the result. The standard state-dict save writes the fine-tuned weights — including the new two-way head and the adjusted final block — to a single file. Reloading requires constructing the same modified architecture first, head swap and all, then pouring the state back in; the checkpoint stores tensors, not code. With that, the five minutes of fine-tuning never need to happen again: any future session loads the classifier and serves verdicts immediately. A complete supervised project, end to end — data, surgery, training, evaluation, deployment — on top of a foundation model built and pretrained entirely from scratch.
:::

---
<!-- .slide: class="statement" -->
Fine-tuning doesn't teach the model language. It teaches it a job.

::: narration
The chapter in one sentence: fine-tuning doesn't teach the model language — it teaches it a job. Every linguistic capability the classifier uses was already in the pretrained weights: the tokenizer's vocabulary, the embeddings, eleven of the twelve frozen transformer blocks. What five minutes of fine-tuning added was vanishingly small by parameter count — a two-output head and one thawed block — and transformative by function: understanding got an opinion. That asymmetry, oceanic general knowledge steered by a sliver of task-specific training, is the central economic fact of modern applied machine learning, and every fine-tuning project after this one is a variation on it.
:::

---
## What we built

- **balanced dataset** — 747 + 747 messages, 70/10/20 split
- **SpamDataset + loaders** — padded to 120 with token 50256
- **head swap** — `Linear(768, 2)` · freeze all, thaw last block + norm
- **last-token classification** — the causal mask's gift
- **five epochs** — 46% → **95.67%** test accuracy
- **classify_review** — raw string in, verdict out

::: narration
The inventory. A balanced spam dataset — seven hundred forty-seven messages a side, split seventy-ten-twenty. A Dataset class that tokenizes once and pads everything to one hundred twenty tokens with the end-of-text ID. Model surgery: the language head replaced by a two-output linear layer, everything frozen except that head, the final transformer block, and the final norm. Classification read from the last token — the only position the causal mask allows to see the whole message. A five-epoch, five-minute fine-tuning run that took accuracy from a coin flip to ninety-five point seven percent on held-out test data. And a deployment function that turns raw strings into verdicts. The next chapter keeps the same pretrained foundation and asks for something much harder.
:::

---
## Next: teaching it to obey

- chapter 7: instruction fine-tuning
- the model that echoed prompts learns to **answer** them
- instruction–response pairs · a new batching problem
- and a harder question: how do you grade free text?

::: narration
Remember the failed experiment at the start of this chapter — the pretrained model that, asked point-blank whether a message was spam, could only parrot the question? Chapter seven addresses exactly that failure. Instruction fine-tuning trains the model on instruction-and-response pairs until it stops continuing prompts and starts satisfying them — the step that separates a text predictor from an assistant. The engineering brings new puzzles: batching variable-length instruction dialogues requires custom collation and masking, and evaluation gets genuinely philosophical — a classifier's answer is right or wrong, but how do you grade a freely written response? The answer to that one involves enlisting another, larger language model as the judge.
:::
