# Fine-Tuning to Follow Instructions

---
## Fine-Tuning to Follow Instructions

- from text completion to obedience
- Raschka, *Build a Large Language Model (From Scratch)*, ch. 7
- instruction data → custom batching → fine-tune → judged by another LLM

::: narration
This is the final chapter of the journey, and the one that turns a language model into something recognizable as an assistant. Following chapter seven of Sebastian Raschka's Build a Large Language Model, the pretrained GPT-2 — which can complete text beautifully and follow instructions not at all — gets fine-tuned on eleven hundred instruction-and-response pairs until asking becomes a way of getting. The engineering en route is substantial: a prompt template, a custom batching pipeline with a clever masking trick built on the number minus one hundred, and a step up to the 355-million-parameter GPT-2 medium. And the chapter ends with a genuinely modern move: since free-text answers can't be graded by string comparison, an eight-billion-parameter Llama 3 running locally serves as the judge, scoring every response the fine-tuned model writes.
:::

---
<!-- .slide: class="divider" -->
### Part I
## From completion to obedience

::: narration
Part one frames the problem. A pretrained model is a text completer — hand it a fragment and it continues plausibly. That is close to useless the moment you want something done. The gap between completing text and following an instruction is exactly what this chapter's fine-tuning closes.
:::

---
## What instruction following looks like

```text
Convert 45 kilometers to meters.
        → 45 kilometers is 45000 meters.

Provide a synonym for 'bright.'
        → A synonym for 'bright' is 'radiant.'

Remove all passive voice: 'The song was
composed by the artist.'
        → The artist composed the song.
```

- instruction in, desired response out
- conversions, edits, questions, rewrites
- the shape behind every chatbot exchange

::: narration
The target behavior, in three examples from the book. Convert forty-five kilometers to meters — and the desired response is the answer, stated plainly. Provide a synonym for bright — radiant. Remove the passive voice from a sentence — the sentence, rewritten. Nothing exotic: small units of work, expressed in ordinary language, each with a response that actually performs the task rather than talking about it. This input-output shape — instruction in, completed task out — is the atom of every assistant interaction, and the training method that instills it is called instruction fine-tuning, or supervised instruction fine-tuning: supervised, because every training example explicitly pairs an instruction with the response it should produce.
:::

---
## Why pretraining isn't enough

- a pretrained LLM is a **completion** machine
- "Fix the grammar in this text" → it continues the text
- it treats requests as prose to extend, not tasks to do
- chapter 6 saw it: the model that echoed its prompt

::: narration
Why doesn't pretraining already produce this? Because next-token prediction teaches continuation, not compliance. A pretrained model shown fix the grammar in this text doesn't perceive a request — it perceives a string, and does the one thing it knows: extend the string plausibly. The classification chapter met this failure in the flesh, when a model asked point-blank whether a message was spam simply echoed the question back. Completion is the raw substrate; instruction following is a behavior pattern that has to be installed on top of it. The installation method is almost anticlimactic: show the model many examples of instructions followed by good responses, and train it — with the same next-token machinery as ever — to produce the response when it sees the instruction.
:::

---
## The nine-step route

- **stage 1 — dataset:** download & format · batch · loaders
- **stage 2 — fine-tune:** load pretrained LLM · train · inspect loss
- **stage 3 — evaluate:** extract responses · inspect · **score**
- the classification recipe, plus a harder final act

::: narration
The chapter's route map has nine steps across the familiar three stages. Stage one prepares the dataset: download and format the instruction data, solve the batching problem — much thornier here than before — and wrap it in loaders. Stage two fine-tunes: load a pretrained model, train it on the instruction data, and inspect the loss. Stage three evaluates, and this is where the route diverges from the classification chapter: extract the model's responses on held-out instructions, inspect them qualitatively, and then score them — which, for free text, turns out to require enlisting another language model entirely. Same skeleton as before, harder final act.
:::

---
<!-- .slide: class="divider" -->
### Part II
## The dataset and its costume

::: narration
Part two prepares eleven hundred instruction-response pairs, and dresses them in a prompt template — the fixed textual costume that tells the model where the instruction ends and its response should begin.
:::

---
## 1,100 instruction–response pairs

```python
data = download_and_load_file(file_path, url)
print(len(data))   # 1100

print(data[50])
# {'instruction': 'Identify the correct spelling
#                  of the following word.',
#  'input': 'Ocassion',
#  'output': "The correct spelling is 'Occasion.'"}
```

- a 204 KB JSON file, made for the book
- each entry: instruction · optional input · output
- small by industry standards — deliberately trainable in minutes

::: narration
The dataset is a JSON file of eleven hundred entries, created specifically for the book — a modest two hundred four kilobytes. Each entry is a dictionary with three fields: an instruction, like identify the correct spelling of the following word; an optional input providing material for the task, here the misspelled word Ocassion; and an output, the desired response — the correct spelling is Occasion. The three-field structure separates the task from its subject matter, which not every instruction needs: about a third of the entries have an empty input field, like what is an antonym of complicated, where the instruction stands alone. Eleven hundred examples is tiny next to the fifty-two thousand of the famous Alpaca dataset — a deliberate choice, keeping every run in this chapter laptop-sized.
:::

---
## When input is empty

```python
print(data[999])
# {'instruction': "What is an antonym of
#                  'complicated'?",
#  'input': '',
#  'output': "An antonym of 'complicated'
#             is 'simple'."}
```

- roughly a third of entries need no material
- the question **is** the task
- the formatter must cope with both shapes

::: narration
A second sample entry shows the dataset's other shape. What is an antonym of complicated carries an empty input field — the instruction is self-contained, needing no material to operate on. Roughly a third of the eleven hundred entries look like this, and the split makes sense once you notice the two kinds of task in the wild: transformations, which need a subject — fix this sentence, spell this word — and questions, which are their own subject. Any formatting machinery has to handle both gracefully, which is exactly the conditional the format-input function will carry: an input section that appears when there's input, and vanishes without a trace when there isn't.
:::

---
## Prompt styles: the costume

```text
Alpaca style:                    Phi-3 style:

Below is an instruction that     <|user|>
describes a task. Write a        Identify the correct
response that appropriately      spelling of 'Ocassion'.
completes the request.
                                 <|assistant|>
### Instruction:                 The correct spelling
Identify the correct...          is 'Occasion'.

### Input:
Ocassion

### Response:
The correct spelling is...
```

- a fixed template wraps every example
- Alpaca: verbose sections · Phi-3: terse role tokens
- the book uses Alpaca — the style that defined the approach

::: narration
Before training, every entry gets dressed in a prompt template — a fixed textual structure marking which part is the instruction and where the response begins. Two well-known styles illustrate the space. The Alpaca style opens with a preamble — below is an instruction that describes a task — followed by labeled sections for instruction, input, and response. The Phi-3 style, from Microsoft, is terser: special user and assistant role tokens, nothing else. The choice is consequential because the model learns the costume along with the content: at inference time, requests must arrive in the same dress. The book adopts Alpaca style, both for its historical role in defining open instruction tuning and its popularity — and poses trying Phi-3 as an exercise, with the interesting question of whether the terser format changes response quality.
:::

---
## format_input

```python
def format_input(entry):
    instruction_text = (
        f"Below is an instruction that describes a task. "
        f"Write a response that appropriately completes "
        f"the request."
        f"\n\n### Instruction:\n{entry['instruction']}"
    )
    input_text = (
        f"\n\n### Input:\n{entry['input']}"
        if entry["input"] else ""
    )
    return instruction_text + input_text
```

- entry dict in → Alpaca-formatted prompt out
- the Input section vanishes when input is empty
- the response section gets appended separately

::: narration
The template lives in one function: format-input takes an entry dictionary and returns the Alpaca-style prompt — preamble, instruction section, and an input section that is conditionally included, disappearing entirely for entries whose input field is empty rather than leaving an awkward vacant heading. Note what it deliberately does not include: the response. During training, the response text gets appended after this formatted prompt, so the model learns the sequence prompt-then-answer; during inference, the prompt ends where the response section begins, and the model's continuation is the answer. One function, used at every stage from dataset construction to final evaluation — the costume applied identically everywhere, which is precisely the point of having it.
:::

---
## The finished costume

```text
Below is an instruction that describes a task.
Write a response that appropriately completes
the request.

### Instruction:
Identify the correct spelling of the following word.

### Input:
Ocassion

### Response:
The correct spelling is 'Occasion.'
```

- preamble · instruction · input · response — one training document
- during training the model sees all of it
- at inference, everything above Response is the prompt

::: narration
Here is entry fifty, fully dressed: the preamble sentence, the instruction section asking for the correct spelling, the input section carrying the misspelled Ocassion, and the response section with the answer. This entire block, as one string, is what the model trains on — learning, token by token, to produce text shaped exactly like this. The inference-time contract falls straight out of the format: present everything down through the empty Response heading, and the model, having learned that answers live below that heading, generates one. The template is simultaneously the training format and the user interface — one structure, two duties.
:::

---
## Exercise: swap the costume

- exercise 7.1: refit everything in Phi-3 style
- `<|user|>` and `<|assistant|>` tokens, no preamble
- shorter prompts — faster training and inference
- does response quality change? measure, don't guess

::: narration
The first exercise of the chapter is to redo the fine-tuning in Phi-3 style — the terse format with user and assistant role tokens replacing the whole Alpaca apparatus of preamble and section headings. It's a genuinely interesting experiment, not make-work. The Phi-3 costume is dramatically shorter, which means fewer tokens per example, which means faster training and cheaper inference — real savings at scale. The open question is whether the verbose preamble earns anything: does spelling out below is an instruction, write a response actually help a model this size understand its job, or is it ritual? The exercise's answer comes the only trustworthy way — by running both and comparing scores.
:::

---
## Split: 85 / 5 / 10

```python
train_portion = int(len(data) * 0.85)   # 935
test_portion = int(len(data) * 0.1)     # 110
val_portion = len(data) - train_portion - test_portion  # 55

# Training set length: 935
# Validation set length: 55
# Test set length: 110
```

- 935 to train · 55 to steer · 110 to judge
- test gets the bigger evaluation share this time
- the same three-way honesty as always

::: narration
The split gives eighty-five percent to training — nine hundred thirty-five examples — five percent to validation, and ten percent to test. Compared to the classification chapter's seventy-ten-twenty, more goes to training and the evaluation shares shrink, with test taking the larger evaluation slice at one hundred ten examples. The proportions reflect the economics of the task: instruction following is harder to learn than a binary decision, so training data is precious, while the final evaluation — which will involve generating and scoring free text, response by response — is expensive enough that one hundred ten examples is already a meaningful bill. The roles remain the ones they always were: train teaches, validation steers, test judges once at the end.
:::

---
<!-- .slide: class="divider" -->
### Part III
## Batching, the hard way

::: narration
Part three is the engineering heart of the chapter: a custom collate function that pads each batch to its own length, builds shifted targets, and then quietly deploys the number minus one hundred to make the loss function ignore the padding. Five substeps, each earning its place.
:::

---
## Why the default collate won't do

- a collate function merges samples into one batch tensor
- chapter 6 padded the **whole dataset** to one length
- smarter: pad each **batch** to its own longest member
- plus: build targets, mask padding — custom work

::: narration
When a PyTorch data loader assembles individual samples into a batch, a collate function does the merging — and the default one just stacks tensors, which requires them to already share a shape. The classification chapter satisfied that by padding every message in the entire dataset to one global length. Here the book gets more sophisticated on three fronts at once. Padding happens per batch, to the longest member of that batch only, so a batch of short instructions wastes no computation on a global worst case. Targets — the shifted-by-one sequences that pretraining-style training needs — get built inside the collate function. And padding tokens get masked out of the loss with a special placeholder. Three jobs, one custom function, developed in careful drafts.
:::

---
## The five substeps

- **2.1** format with the Alpaca template
- **2.2** tokenize the formatted text
- **2.3** pad each batch to its longest, with token 50256
- **2.4** targets = inputs shifted +1, plus one end-of-text
- **2.5** replace extra padding in targets with **−100**

::: narration
The batching pipeline, laid out as five substeps. First, each entry is formatted with the Alpaca template, response included — the full text the model should learn. Second, that text is tokenized into IDs. Third, within each batch, shorter sequences are padded with the end-of-text token, fifty thousand two hundred fifty-six, to match the batch's longest. Fourth, target sequences are built: the inputs shifted one position leftward, with an end-of-text token appended — the same next-token setup as pretraining. And fifth, the strange one: in the targets, all but the first padding token get replaced by minus one hundred, a placeholder that will make the loss function skip them entirely. The first two substeps live in a small dataset class; the rest belong to the collate function.
:::

---
## InstructionDataset

```python
class InstructionDataset(Dataset):
    def __init__(self, data, tokenizer):
        self.data = data
        self.encoded_texts = []
        for entry in data:
            instruction_plus_input = format_input(entry)
            response_text = (
                f"\n\n### Response:\n{entry['output']}")
            full_text = instruction_plus_input + response_text
            self.encoded_texts.append(
                tokenizer.encode(full_text))

    def __getitem__(self, index):
        return self.encoded_texts[index]
```

- prompt + response concatenated, tokenized once
- returns raw token lists — collate does the rest

::: narration
The dataset class handles substeps one and two, and stops there deliberately. On construction it walks the data, builds each entry's full text — the formatted prompt plus a response section carrying the output — and tokenizes everything up front, the same pretokenization pattern as the spam dataset. But where the spam dataset returned neat fixed-size tensors, this one hands back raw, ragged token lists of whatever length each example happens to be. That's a division of labor: the dataset knows about individual examples, but padding depends on which examples share a batch, and only the collate function sees a batch. Ragged lists out of the dataset, rectangles out of the collate.
:::

---
## Draft one: pad and stack

```python
def custom_collate_draft_1(batch, pad_token_id=50256,
                           device="cpu"):
    batch_max_length = max(len(item)+1 for item in batch)
    inputs_lst = []
    for item in batch:
        new_item = item.copy()
        new_item += [pad_token_id]
        padded = (new_item + [pad_token_id] *
            (batch_max_length - len(new_item)))
        inputs = torch.tensor(padded[:-1])
        inputs_lst.append(inputs)
    return torch.stack(inputs_lst).to(device)

# [[0, 1, 2, 3, 4],
#  [5, 6, 50256, 50256, 50256],
#  [7, 8, 9, 50256, 50256]]
```

- find the batch's longest · pad everyone to match

::: narration
The collate function gets built in three drafts, and draft one does the padding. Find the longest sequence in the batch — plus one, for reasons the next draft reveals — then pad every sequence with end-of-text tokens to that length and stack the results into a single tensor. Tested on a toy batch of three lists with five, two, and three tokens, the output shows the mechanics plainly: the five-token list unchanged, the others topped up with fifty-two fifty-sixes. Note the odd little dance of appending one pad token and then trimming the last position off the inputs — a placeholder step that looks pointless until targets enter the picture.
:::

---
## Draft two: add the targets

```python
padded = (new_item + [pad_token_id] *
    (batch_max_length - len(new_item)))
inputs = torch.tensor(padded[:-1])    # drop last
targets = torch.tensor(padded[1:])    # shift +1

# inputs:  [0, 1, 2, 3, 4]
# targets: [1, 2, 3, 4, 50256]
```

- targets = the same tokens, one step ahead
- the appended end-of-text lands in the target
- pretraining's shift, rebuilt inside collate

::: narration
Draft two adds the training targets, and the earlier dance resolves. Each padded sequence, which had one extra end-of-text appended, gets sliced twice: everything but the last token becomes the inputs, everything but the first becomes the targets. The result is the pretraining relationship exactly — at every position, the target is the next token — with one nice consequence of the append: the final real token's target is an end-of-text. That teaches the model to emit end-of-text when its answer is done, which is how generation will later know where to stop. Inputs and targets, both stacked into batch tensors, both returned. One problem remains: the targets are full of padding tokens the model shouldn't be graded on.
:::

---
## Inputs and targets, aligned

<div class="viz wide">
<svg viewBox="0 0 560 190">
<rect class="cell on" x="60" y="30" width="72" height="40"/><rect class="cell on" x="134" y="30" width="72" height="40"/><rect class="cell on" x="208" y="30" width="72" height="40"/><rect class="cell on" x="282" y="30" width="72" height="40"/><rect class="cell on" x="356" y="30" width="72" height="40"/>
<rect class="cell on" x="60" y="110" width="72" height="40"/><rect class="cell on" x="134" y="110" width="72" height="40"/><rect class="cell on" x="208" y="110" width="72" height="40"/><rect class="cell on" x="282" y="110" width="72" height="40"/><rect class="cell sel" x="356" y="110" width="72" height="40"/>
<text class="lbl mono sm" x="96" y="50">0</text><text class="lbl mono sm" x="170" y="50">1</text><text class="lbl mono sm" x="244" y="50">2</text><text class="lbl mono sm" x="318" y="50">3</text><text class="lbl mono sm" x="392" y="50">4</text>
<text class="lbl mono sm" x="96" y="130">1</text><text class="lbl mono sm" x="170" y="130">2</text><text class="lbl mono sm" x="244" y="130">3</text><text class="lbl mono sm" x="318" y="130">4</text><text class="lbl mono sm" x="392" y="130">50256</text>
<text class="olbl" x="30" y="50">in</text>
<text class="olbl" x="30" y="130">out</text>
<text class="cap" x="290" y="175">each target is its input's next token · the appended end-of-text closes the row</text>
</svg>
</div>

- same alignment as pretraining, rebuilt per batch
- the first input token appears in no target
- the last target is the stop signal

::: narration
The alignment, drawn out for one toy sequence. The input row holds tokens zero through four; the target row holds one through four, then the appended end-of-text. Read any column vertically and you get one training fact: seeing token zero, predict token one; seeing tokens zero-through-three, predict four; and at the end — having seen everything — predict end-of-text. It is precisely pretraining's shift-by-one, reconstructed inside the collate function per batch. Two edge details fall out of the slicing: the first input token appears in no target, since nothing predicts it, and the appended end-of-text exists only in the target row — the stop signal the model learns to emit but never conditions on mid-answer.
:::

---
## The −100 trick

```python
logits_2 = torch.tensor([[-1.0, 1.0],
                         [-0.5, 1.5],
                         [-0.5, 1.5]])
targets_2 = torch.tensor([0, 1, 1])
# loss: 0.7936

targets_3 = torch.tensor([0, 1, -100])
# loss: 1.1269
# loss_1 == loss_3: tensor(True)
```

- a target of −100 makes that position **vanish** from the loss
- `cross_entropy(..., ignore_index=-100)` — PyTorch's default
- the three-token loss equals the two-token loss exactly

::: narration
Here is the trick, demonstrated rather than asserted. Take three toy predictions with targets zero, one, one: the loss is some number. Replace the third target with minus one hundred, and the loss comes out exactly equal to the loss computed over just the first two positions — the third position vanished from the calculation entirely. No magic: PyTorch's cross entropy has an ignore-index argument whose default value is, precisely, minus one hundred. Any position whose target carries that value contributes nothing to the loss and nothing to the gradients. So the collate function's final move is to stamp minus one hundred over the padding positions in the targets, and the model is never trained to predict filler.
:::

---
## Only −100 is magic

- swap −100 for any other out-of-range ID → an **error**
- the exemption is a designed contract, not a loophole
- `ignore_index=-100`: PyTorch's documented default
- the collate function and the loss shake hands on it

::: narration
A skeptical reader might try replacing minus one hundred with some other unused number — and the book notes what happens: an error. Class indices must be valid, or be the one designated ignore value; there is nothing generically special about negative targets. Minus one hundred works because PyTorch's cross entropy declares it, by documented default, as the ignore index — a deliberate contract between whoever prepares the targets and the loss function that consumes them. That's worth internalizing as an interface fact rather than a trick: the collate function isn't exploiting a loophole, it's speaking a documented protocol. And like any protocol value, it can be changed — ignore-index is an argument — as long as both sides agree.
:::

---
## Keep one, mask the rest

```python
mask = targets == pad_token_id
indices = torch.nonzero(mask).squeeze()
if indices.numel() > 1:
    targets[indices[1:]] = ignore_index   # -100

# targets: [1, 2, 3, 4, 50256]
#          [6, 50256, -100, -100, -100]
#          [8, 9, 50256, -100, -100]
```

- the **first** end-of-text in each target survives
- the model must learn to say "I'm done"
- everything after it: invisible to the loss

::: narration
One nuance elevates the masking from mechanical to thoughtful: not every padding token gets masked. In each target sequence, the first end-of-text survives with its real ID, and only the repetitions after it become minus one hundred. The surviving one is the stop signal — the position where the model, having produced its full answer, should emit end-of-text. Mask that too, and the model would never learn to finish; generation would ramble until the token budget ran out. So the final collate function computes a mask of padding positions, keeps the first, and stamps out the rest — teaching exactly one lesson per token: answer tokens teach the answer, one end-of-text teaches when to stop, and pure filler teaches nothing.
:::

---
## The final collate function

```python
def custom_collate_fn(batch, pad_token_id=50256,
        ignore_index=-100, allowed_max_length=None,
        device="cpu"):
    batch_max_length = max(len(item)+1 for item in batch)
    inputs_lst, targets_lst = [], []
    for item in batch:
        new_item = item.copy() + [pad_token_id]
        padded = new_item + [pad_token_id] * (
            batch_max_length - len(new_item))
        inputs = torch.tensor(padded[:-1])
        targets = torch.tensor(padded[1:])
        mask = targets == pad_token_id
        indices = torch.nonzero(mask).squeeze()
        if indices.numel() > 1:
            targets[indices[1:]] = ignore_index
        if allowed_max_length is not None:
            inputs = inputs[:allowed_max_length]
            targets = targets[:allowed_max_length]
        ...
    return inputs_tensor, targets_tensor
```

::: narration
The finished collate function, all drafts merged. Per batch: find the longest sequence plus one; for each item, append one end-of-text, pad to the batch maximum, slice off the last token for inputs and the first for targets; build a boolean mask of padding positions in the targets and overwrite all but the first with the ignore index; optionally truncate both tensors to an allowed maximum length, protecting the model's context window against oversized data; then stack everything and ship it to the device. Some twenty lines, and every one traceable to a decision made earlier in this part — which is what good pipeline code looks like: no mystery lines, each with a slide of rationale behind it.
:::

---
## Proof in the tensors

```python
inputs, targets = custom_collate_fn(batch)
# inputs:
# [[ 0,     1,     2,     3,     4],
#  [ 5,     6, 50256, 50256, 50256],
#  [ 7,     8,     9, 50256, 50256]]
# targets:
# [[ 1,     2,     3,     4, 50256],
#  [ 6, 50256,  -100,  -100,  -100],
#  [ 8,     9, 50256,  -100,  -100]]
```

- every rule, visible at once: shift, pad, keep-one, mask
- row 2: one real transition, one stop lesson, three blanks
- ready for cross entropy, no further ceremony

::: narration
Run the toy batch through the finished function and every rule is visible in the printout. The inputs: three rows padded to five with end-of-text tokens. The targets: each row shifted by one; the first row — which needed no padding — ending in its single appended end-of-text; the shorter rows each keeping exactly one fifty-two fifty-six as their stop lesson, with every repetition after it stamped minus one hundred. Read the second row alone and the whole design is there in five numbers: one genuine next-token transition, one learn-to-stop position, three positions the loss will never see. These tensors feed cross entropy directly — no further ceremony required.
:::

---
## Should the instruction be masked too?

- same trick could hide the **prompt** tokens from the loss
- train only on response tokens — less prompt memorization
- researchers are split · Shi et al. 2024: **not** masking can help
- the book doesn't mask — and leaves it as an exercise

::: narration
The minus-one-hundred mechanism opens a design door the book walks up to and deliberately past. The same masking could hide the instruction and input tokens from the loss, training the model only on response tokens — a common practice, with the argument that it focuses learning on generation quality and avoids memorizing boilerplate prompts. But the evidence is genuinely mixed: the book cites a twenty-twenty-four paper by Shi and colleagues, Instruction Tuning With Loss Over Instructions, showing that not masking can benefit performance. So the book trains on everything, keeps the recipe simple, and hands the comparison to the reader as an exercise. A small window into the field's honest texture — some knobs have no settled setting, and the practitioners' answer is: measure it.
:::

---
<!-- .slide: class="divider" -->
### Part IV
## Loaders, and a bigger patient

::: narration
Part four plugs the custom collate into real data loaders — with a device-placement trick along the way — and then loads the model to be tuned. Not the familiar small GPT-2 this time: instruction following demands the 355-million-parameter medium.
:::

---
## Freezing the collate's settings

```python
from functools import partial

device = torch.device("cuda" if torch.cuda.is_available()
                      else "cpu")

customized_collate_fn = partial(
    custom_collate_fn,
    device=device,
    allowed_max_length=1024)
```

- `partial`: pre-fill arguments, get a new function
- tensors land on the GPU **inside** collate — off the training path
- capped at 1,024: the model's context limit

::: narration
Two practical touches before the loaders. The collate function takes a device and an optional length cap, but a data loader calls its collate with just the batch — so functools partial pre-fills those arguments, producing a customized function with the settings frozen in. The device choice is sneakier than it looks: moving tensors to the GPU inside the collate function means the transfer happens in the data-loading path, potentially in background workers, rather than stalling the training loop — a small systems optimization hiding in a data pipeline. And the allowed max length of one thousand twenty-four enforces the model's context ceiling, future-proofing the pipeline against datasets with entries longer than GPT-2 can see.
:::

---
## Batches of different shapes

```python
train_loader = DataLoader(train_dataset, batch_size=8,
    collate_fn=customized_collate_fn,
    shuffle=True, drop_last=True)

# torch.Size([8, 61]) torch.Size([8, 61])
# torch.Size([8, 76]) torch.Size([8, 76])
# torch.Size([8, 73]) torch.Size([8, 73])
```

- 8 examples per batch — but 61, then 76, then 73 tokens wide
- per-batch padding, visibly at work
- inputs and targets always share a shape

::: narration
Wire the dataset and the customized collate into loaders, print the batch shapes, and the per-batch padding strategy shows itself: eight by sixty-one, then eight by seventy-six, then eight by seventy-three. Every batch is rectangular — inputs and targets always matching — but different batches have different widths, each exactly as wide as its own longest member. Compare with the classification loader, where every batch was locked to the global one hundred twenty. Over a training run, the savings compound: batches of short instructions process quickly instead of dragging a dataset-wide worst case through every step. The data pipeline is done — time to meet the model.
:::

---
## A bigger model: GPT-2 medium

```python
CHOOSE_MODEL = "gpt2-medium (355M)"
BASE_CONFIG.update(model_configs[CHOOSE_MODEL])
# emb_dim 1024 · 24 layers · 16 heads

model = GPTModel(BASE_CONFIG)
load_weights_into_gpt(model, params)   # 1.42 GB download
```

- 355M parameters: 1,024-wide, 24 blocks, 16 heads
- the 124M model is **too limited** for instruction following
- same class, same loader — one config key changed

::: narration
For the first time in the book, the small GPT-2 gets benched. Instruction following demands more than the 124-million-parameter model can deliver — smaller models lack the capacity to learn the intricate patterns high-quality instruction responses require — so this chapter loads GPT-2 medium: three hundred fifty-five million parameters, embeddings a thousand twenty-four wide, twenty-four transformer blocks, sixteen heads, a one-point-four-gigabyte download. And the infrastructure investment of the earlier chapters pays off exactly as promised: switching sizes is one dictionary key. Same GPTModel class, same weight-loading function, same everything — the code was written size-agnostic, and now that generality earns its keep. A hardware sidebar offers comfort for anyone whose laptop groans: the small model remains a working fallback.
:::

---
## Baseline: the eloquent failure

```text
### Instruction:
Convert the active sentence to passive:
'The chef cooks the meal every day.'

--- pretrained model's response: ---

### Response:
The chef cooks the meal every day.

### Instruction:
Convert the active sentence to passive: 'The chef...
```

- it copies the sentence, unconverted
- then hallucinates a fresh Instruction section
- it learned the costume's shape, not its meaning

::: narration
Before fine-tuning, the ritual baseline — and this one is eloquent. Given a validation task in full Alpaca dress — convert the active sentence to passive, the chef cooks the meal every day — the pretrained medium model produces a Response heading, followed by the sentence copied verbatim, unconverted, and then starts hallucinating a new Instruction section of its own. It has recognized the template's shape — headings beget headings — without grasping that the response section is where a task gets performed. Pure completion behavior wearing obedience's clothes. Extracting just the response, by slicing off the input text's length and stripping whitespace, gives the number this chapter exists to change.
:::

---
## What fine-tuning must add

- the pretrained model knows: language, facts, the template's look
- it lacks: the prompt-to-action reflex
- 935 worked examples will install it
- two epochs from now, the chef's meal gets cooked passively

::: narration
Take stock of the gap, because it's narrower and stranger than it first appears. The pretrained model already possesses nearly everything the task needs: fluent English, world knowledge, even a grasp of the template's visual grammar — it produced a plausible Response heading unprompted. What it lacks is a single reflex: that the text under Instruction is a directive, and the text under Response must be its execution. That reflex is what nine hundred thirty-five worked examples will install. It's worth holding onto how small this delta is, because it explains the coming training run's brevity — two epochs, well under an hour even on a laptop — and its dramatic effect. The knowledge is all there; fine-tuning just rewires what the model does with it.
:::

---
<!-- .slide: class="divider" -->
### Part V
## The fine-tuning run

::: narration
Part five trains. The functions come straight from the pretraining chapter, unmodified — proof of how much of instruction tuning is just pretraining pointed at curated text. Two epochs, a falling loss, and a model that visibly changes its manners between the first checkpoint and the last.
:::

---
## Old tools, unmodified

```python
from chapter05 import (
    calc_loss_loader,
    train_model_simple
)

# Training loss:   3.826
# Validation loss: 3.762
```

- pretraining's loss and training functions, imported as-is
- instruction tuning **is** next-token training on special text
- starting loss ≈ 3.8 — a fluent model, an unfamiliar format

::: narration
The training machinery is imported from chapter five without a single modification — the same loss-over-loader function, the same training loop. That reuse is the deepest fact in the chapter: instruction fine-tuning is not a new algorithm. It is ordinary next-token training, run on text that happens to be formatted instructions with good responses. The collate function did all the adaptation; the learning process is untouched. The initial losses tell their own story: around three point eight, nowhere near the ten point nine of a random model — this model already speaks English fluently — but well above zero, because the Alpaca costume and the answer-the-question reflex are new to it. Fine-tuning's job is precisely that remaining distance.
:::

---
## What the hardware says

| model | device | 2 epochs |
|---|---|---|
| gpt2-medium 355M | CPU (M3 MacBook Air) | 15.78 min |
| gpt2-medium 355M | GPU (A100) | **0.86 min** |
| gpt2-small 124M | CPU (M3 MacBook Air) | 5.74 min |
| gpt2-small 124M | GPU (A100) | 0.39 min |

- feasible everywhere, from laptop CPU to data-center GPU
- the book's numbers come from the A100 run
- struggling hardware? drop to the small model

::: narration
The book publishes reference runtimes, and they're worth a look for what they say about accessibility. Fine-tuning the medium model for two epochs takes just under sixteen minutes on a MacBook Air's CPU, under two minutes on a modest data-center GPU, and fifty-two seconds on an A100. The small model runs about three times faster everywhere. Two practical notes ride along: the chapter's published results come from the A100 run on the medium model, and anyone hitting memory or patience limits can switch the choose-model string back to the small one and follow along with reduced response quality. The era when tuning a third-of-a-billion-parameter model required an institution is visibly over — this is coffee-break scale.
:::

---
## Two epochs, deliberately

```python
optimizer = torch.optim.AdamW(
    model.parameters(), lr=0.00005, weight_decay=0.1)
num_epochs = 2

train_losses, val_losses, tokens_seen = train_model_simple(
    model, train_loader, val_loader, optimizer, device,
    num_epochs=num_epochs, eval_freq=5, eval_iter=5,
    start_context=format_input(val_data[0]),
    tokenizer=tokenizer)
```

- the familiar recipe: AdamW, lr 5e-5, decay 0.1
- start_context = a real validation instruction
- after each epoch: watch it attempt the chef sentence

::: narration
The run configuration is the gentle-fine-tuning recipe from the classification chapter: AdamW, learning rate five ten-thousandths of a percent, weight decay zero point one — but only two epochs this time, a choice the loss curves will justify shortly. The nicest touch is the start context: the periodic text sample that the training loop prints after each epoch is pointed at a real validation instruction — the chef sentence from the baseline. That turns the training log into a time-lapse of the skill being born: the same task, attempted by the same model, at successive stages of tuning. Numbers measure progress; watching the chef sentence get converted is believing it.
:::

---
## The time-lapse

```text
Ep 1 (Step 000000): Train loss 2.637, Val loss 2.626
Ep 1 (Step 000015): Train loss 0.857, Val loss 0.906
after ep 1:  "### Response: The meal is prepared every
              day by the chef.<|endoftext|>"

Ep 2 (Step 000230): Train loss 0.300, Val loss 0.657
after ep 2:  "### Response: The meal is cooked every
              day by the chef.<|endoftext|>"
```

- loss: 2.6 → 0.3 in two epochs
- epoch 1: task done, verb approximated · epoch 2: **exact**
- and it emits `<|endoftext|>` — the stop lesson landed

::: narration
The training log, read as a time-lapse. Losses fall fast — from two point six at the first step to under one within an epoch, ending around zero point three. But the printed samples steal the show. After epoch one, the chef sentence comes back as: the meal is prepared every day by the chef. Passive voice achieved, task understood — with the verb approximated, prepared for cooks. After epoch two: the meal is cooked every day by the chef. Exact. And in both samples, trailing the answer, sits an end-of-text token — the collate function's keep-one-mask-the-rest lesson, visibly learned: the model completes the task and then says it's done. From echo to obedience in under a minute of A100 time.
:::

---
## Reading the curves

<div class="viz">
<svg viewBox="0 0 460 210">
<line class="axis" x1="45" y1="170" x2="430" y2="170"/>
<line class="axis" x1="45" y1="20" x2="45" y2="170"/>
<path class="edge accent" d="M50,28 L70,90 C95,135 140,142 200,147 C280,153 370,156 425,158" fill="none"/>
<path class="edge good" d="M50,25 L70,85 C95,128 140,134 200,136 C280,139 370,140 425,141" fill="none"/>
<text class="cap accent" x="150" y="165">train → 0.3</text>
<text class="cap good" x="150" y="112">validation → 0.66</text>
<text class="tag" x="237" y="195">epochs 0 → 2 · sharp drop, then glide</text>
</svg>
</div>

- steep first descent: the format is learned in minutes
- second epoch: slower refinement, mild train–val gap
- a third epoch? the book says: risky, likely overfitting

::: narration
The loss plot has the healthy two-phase shape: a cliff at the start, as the model rapidly absorbs the template and the response reflex, then a long glide as it refines. A modest gap opens between training and validation in the second epoch — noticeable, not alarming. That gap is why the run stops at two epochs: the book notes that a third could tip into memorization territory, and with the trend already flattening, more epochs would buy little and risk the overfitting spiral that chapter five demonstrated so vividly. The judgment call — read the curve, stop while validation is still content — is by now a practiced skill rather than a rule from a book.
:::

---
## Exercise: the real Alpaca

- exercise 7.3: fine-tune on the original **Alpaca dataset**
- 52,002 entries — nearly 50× this chapter's data
- GPU strongly recommended · shrink batch_size or max length if OOM
- the same pipeline, industrial portion size

::: narration
The scaling exercise: swap the book's eleven-hundred-entry file for the original Alpaca dataset from Stanford — fifty-two thousand and two instruction pairs, one of the earliest and most influential open instruction datasets, and the source of the very prompt style this chapter wears. Nothing in the pipeline changes; only the portion size does, by a factor of nearly fifty, with longer entries to boot. The book attaches practical survival advice: use a GPU, and when memory runs out — it will — reduce the batch size from eight toward one, or lower the allowed max length from a thousand twenty-four to five hundred twelve or two fifty-six. The exercise's real lesson is watching a laptop-scale pipeline meet industrial-scale data, and learning which knobs give.
:::

---
<!-- .slide: class="divider" -->
### Part VI
## Harvest and inspect

::: narration
Part six harvests the model's responses on the held-out test set and inspects them by hand — which surfaces the chapter's deepest question. A classifier's answers were gradable by string comparison. How do you grade one hundred ten freely written paragraphs?
:::

---
## Extracting a clean answer

```python
token_ids = generate(model=model,
    idx=text_to_token_ids(input_text, tokenizer),
    max_new_tokens=256,
    context_size=BASE_CONFIG["context_length"],
    eos_id=50256)

response_text = (
    generated_text[len(input_text):]
    .replace("### Response:", "")
    .strip())
```

- `eos_id=50256`: generation stops when the model says done
- slice off the prompt, drop the heading, trim
- the learned stop token, now doing real work

::: narration
Harvesting responses uses the generate function from chapter five with its end-of-sequence parameter finally earning a salary: generation halts the moment the model emits token fifty thousand two hundred fifty-six, rather than running to the token budget. That works only because fine-tuning taught the model to produce that token when an answer is complete — the masking design choice from part three, closing its loop. Since generate returns prompt and continuation as one string, the response gets cleaned in three small moves: slice off the input text by length, drop the Response heading, strip whitespace. What remains is just the answer, ready to be compared with the dataset's reference output.
:::

---
## Three test examples, judged by eye

```text
Rewrite using a simile: "The car is very fast."
  correct: as fast as lightning
  model:   as fast as a bullet          ✓ good

Cloud type with thunderstorms?
  correct: cumulonimbus
  model:   cumulus cloud                ✗ close, wrong

Author of 'Pride and Prejudice'?
  correct: Jane Austen
  model:   The author of 'Pride and
           Prejudice' is Jane Austen.   ✓ correct
```

- one clean hit, one near-miss, one verbose hit
- "correct" is suddenly a matter of degree

::: narration
Three test examples, side by side with their reference answers. Asked for a simile about a fast car, the reference says as fast as lightning; the model says as fast as a bullet — different words, perfectly valid simile. Asked which cloud type accompanies thunderstorms, the reference is cumulonimbus; the model says cumulus — close, related, and wrong, though the book notes cumulus clouds can develop into cumulonimbus. Asked who wrote Pride and Prejudice, the model answers correctly, in a full sentence where the reference is just the name. Notice what happened to the notion of correct: it became graded, partial, arguable. A bullet simile isn't the lightning simile but deserves full marks; cumulus deserves some credit; verbose-but-right is fine. String equality is hopeless here.
:::

---
## How the field grades free text

- **benchmarks** — MMLU-style multiple choice: tests knowledge, not conversation
- **human preference** — LMSYS Chatbot Arena: gold standard, expensive
- **LLM-as-judge** — AlpacaEval: another model scores the answers
- the book builds the third, locally

::: narration
The field's answer to grading free text comes in three schools. Short-answer and multiple-choice benchmarks, like the massive multitask suite MMLU, restore string-comparable answers by constraining the format — good for measuring knowledge, blind to conversational quality. Human preference comparisons, like the LMSYS Chatbot Arena where people vote between anonymous model responses, are the gold standard and cost accordingly — reading and rating all eleven hundred responses in this dataset would be a serious human undertaking. And automated conversational benchmarks, like AlpacaEval, delegate the judging to another, stronger language model. The book builds the third option — with a twist: instead of calling a proprietary API, the judge will run entirely on your own machine.
:::

---
## Save everything first

```python
for i, entry in tqdm(enumerate(test_data)):
    ...
    test_data[i]["model_response"] = response_text

with open("instruction-data-with-response.json", "w") as file:
    json.dump(test_data, file, indent=4)

torch.save(model.state_dict(), "gpt2-medium355M-sft.pth")
```

- all 110 test responses generated (~1 min on A100) and stored
- responses ride alongside instruction, input, and reference output
- the tuned model saved: `-sft` — supervised fine-tuned

::: narration
Before judging, bookkeeping. A loop with a progress bar generates responses for all one hundred ten test entries — about a minute on the A100, six on the laptop — and stores each response inside its entry, right beside the instruction, the input, and the reference output. The enriched dataset is written to a JSON file, which decouples the pipeline: scoring can happen in a fresh session, on another day, without regenerating anything. And the model itself is saved under a name ending in s-f-t — supervised fine-tuned — the standard shorthand for exactly what this chapter did. Data archived, weights archived; the courtroom convenes next.
:::

---
<!-- .slide: class="divider" -->
### Part VII
## The judge is another LLM

::: narration
Part seven closes the book's arc with its most contemporary move: an eight-billion-parameter Llama 3, running locally through Ollama, reads every test response and scores it from zero to one hundred. The student built from scratch, graded by a borrowed professor.
:::

---
## The evaluation pipeline

<div class="viz wide">
<svg viewBox="0 0 560 170">
<defs><marker id="arrEV" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#7A736C"/></marker></defs>
<line class="edge" x1="150" y1="60" x2="185" y2="60" marker-end="url(#arrEV)"/>
<line class="edge" x1="330" y1="60" x2="365" y2="60" marker-end="url(#arrEV)"/>
<rect class="node" x="20" y="32" width="130" height="56" rx="7"/>
<text class="lbl sm" x="85" y="54">GPT-2 medium</text><text class="lbl sm" x="85" y="72">(our student, 355M)</text>
<rect class="node muted" x="187" y="32" width="143" height="56" rx="6"/>
<text class="lbl sm" x="258" y="54">110 test responses</text><text class="lbl mono sm" x="258" y="72">+ reference outputs</text>
<rect class="node accent" x="367" y="32" width="170" height="56" rx="7"/>
<text class="lbl on-fill sm" x="452" y="54">Llama 3 8B (judge)</text><text class="lbl on-fill sm" x="452" y="72">scores 0–100 each</text>
<text class="cap" x="285" y="135">student writes · judge reads response against reference · average = the model's grade</text>
</svg>
</div>

- student and judge never meet — a JSON file between them
- the judge sees instruction, reference, and response
- 110 scores → one comparable average

::: narration
The evaluation pipeline, end to end. The student — the fine-tuned GPT-2 medium — has already written its hundred ten test responses into a JSON file alongside each instruction and its reference output. The judge — Llama 3, twenty-two times larger — reads each triplet and returns a score from zero to one hundred, and the average of those scores becomes the model's grade. The two models never interact directly; the JSON file between them means judging can rerun any time, against any future version of the student, or even against other models' response files — which is exactly how the book will produce comparison numbers. It's a small, local instance of the architecture behind every public LLM leaderboard that uses automated judging.
:::

---
## Ollama: a local judge

- Llama 3 **8B** — Meta's instruction-tuned open model
- runs locally via **Ollama**, a llama.cpp wrapper
- ~16 GB RAM · smaller phi3 fits in 8 GB · llama3:70b if you can
- inference only — no training, no cloud, no data leaves the machine

::: narration
The judge is Llama 3, Meta's openly available instruction-tuned model, at eight billion parameters — over twenty times the size of the student it will grade. It runs locally through Ollama, an application wrapping the llama-dot-c-p-p library, which implements LLM inference in efficient C++ so a laptop can serve a model this size — about sixteen gigabytes of RAM for the eight-B; a smaller phi-three fits in eight, and a seventy-billion-parameter variant exists for the well-equipped. Ollama does inference only, no training — which is all a judge needs. Worth pausing on what this setup means: the evaluation loop involves no cloud API, no cost per token, and no test data leaving the machine.
:::

---
## The bigger-judge option

- Llama 3 8B is capable — GPT-4-class it is not
- an optional notebook swaps in **GPT-4 via the OpenAI API**
- stronger judgments, per-token cost, data leaves the machine
- the trade is yours to make; the pipeline doesn't care

::: narration
A sidebar acknowledges the judge's ceiling: an eight-billion-parameter local model is a capable grader, but not the equal of the large proprietary models, and the book's supplementary materials include an optional notebook that swaps in GPT-4 through the OpenAI API for readers who want stronger judgments. The trade-offs are the classic cloud-versus-local ledger: better evaluations against per-token cost, and — worth weighing explicitly — test data leaving the machine. What makes the swap trivial is the pipeline's shape: the judge sits behind one function that takes a prompt and returns text. Any model that can do that, local or remote, can hold the gavel.
:::

---
## Serve, pull, sanity-check

```bash
ollama serve          # start the server (or the app)
ollama run llama3     # first run: downloads 4.7 GB
```

```python
import psutil
def check_if_running(process_name):
    return any(process_name in p.info["name"]
        for p in psutil.process_iter(["name"]))

if not check_if_running("ollama"):
    raise RuntimeError("Ollama not running.")
```

- try it live: "What do llamas eat?" → a llama diet essay
- the psutil guard fails fast if the server is down

::: narration
Setup is two commands: ollama serve starts the local server — or the desktop app does the same in the background — and ollama run llama3 pulls the four-point-seven-gigabyte model on first use, then drops into a chat prompt. The book's sanity check is charmingly on-brand: ask the llama what llamas eat, and receive an earnest essay about grasses and grains. On the Python side, a small guard using psutil verifies an ollama process is actually alive before any evaluation code runs, raising immediately if not — the fail-fast pattern that converts a confusing mid-loop connection error into a clear message at the start. With the server confirmed, Python needs a way to talk to it.
:::

---
## query_model: REST, by hand

```python
def query_model(prompt, model="llama3",
        url="http://localhost:11434/api/chat"):
    data = {"model": model,
            "messages": [
                {"role": "user", "content": prompt}],
            "options": {"seed": 123,
                        "temperature": 0,
                        "num_ctx": 2048}}
    payload = json.dumps(data).encode("utf-8")
    request = urllib.request.Request(
        url, data=payload, method="POST")
    ...
    return response_data
```

- a chat request against localhost — standard library only
- seed 123, temperature 0: as deterministic as it gets
- the same message shape every chat API uses

::: narration
The bridge to the judge is a function that speaks REST to Ollama's local endpoint — built, in this book's stubborn way, on the standard library alone: a dictionary with the model name and a user message, JSON-encoded, posted to localhost, the streamed reply reassembled line by line. Two option settings matter for evaluation: a fixed seed and temperature zero, requesting maximally deterministic judging — though the book notes Ollama isn't fully deterministic across systems, so scores may wobble slightly. Notice the message format: a list of role-and-content dictionaries. That's the chat-API shape used across the industry, and here it is, hand-rolled in twenty lines against a server on your own machine.
:::

---
## The judge shows its work

```text
Model response: "The car is as fast as a bullet."
Score: 85/100. The response uses a simile correctly...
bullets are known for their high velocity... slightly
less vivid than 'lightning.'

Model response: "...a cumulus cloud."
Score: 40/100. Correctly identifies that thunderstorms
are related to clouds... but cumulonimbus, not cumulus.
```

- graded reasoning: partial credit, named flaws
- 85 for the bullet simile · 40 for the near-miss cloud
- exactly the judgment string comparison couldn't make

::: narration
Prompted with the instruction, the reference output, and the model's response, and asked to score from zero to one hundred, the judge writes genuinely reasoned evaluations. The bullet simile: eighty-five out of a hundred — simile used correctly, comparison apt, docked slightly because lightning is more vivid. The cumulus answer: forty — credit for connecting thunderstorms to clouds, clearly marked down for naming the wrong type, with the right one supplied. This is precisely the graded, partial, explained judgment that string comparison couldn't render on free text. An eight-billion-parameter reader turns out to be a serviceable teaching assistant — opinionated, consistent, and infinitely patient.
:::

---
## The judge grades a perfect answer

```text
Instruction: Name the author of 'Pride and Prejudice.'
Reference:   Jane Austen.
Model:       The author of 'Pride and Prejudice'
             is Jane Austen.

Judge: 95/100. Accurately answers... concise and
clear... only reason it isn't perfect: the response
is slightly redundant — repeating the question is
unnecessary. "Jane Austen" alone would be more concise.
```

- a correct answer, docked five points for wordiness
- the judge has *editorial* opinions
- calibration quirks come with the method

::: narration
The third worked judgment is the most revealing. The model names Jane Austen — factually perfect — but wraps the name in a full sentence restating the question. The judge scores it ninety-five, explaining that the response is accurate, clear, and slightly redundant: repeating the question is unnecessary, and the reference's bare Jane Austen would be more concise. Notice what just happened: the judge exercised an editorial preference, not merely a factual check. That's simultaneously the method's power — nuance no string comparison could render — and its caveat: scores inherit the judge's tastes and calibration quirks. An LLM judge is a judge, with everything the metaphor implies, including a jurisprudence of its own.
:::

---
## Scoring all of it

```python
def generate_model_scores(json_data, json_key,
                          model="llama3"):
    scores = []
    for entry in tqdm(json_data, desc="Scoring entries"):
        prompt = (
            f"Given the input `{format_input(entry)}` "
            f"and correct output `{entry['output']}`, "
            f"score the model response "
            f"`{entry[json_key]}` on a scale from 0 to 100. "
            f"Respond with the integer number only.")
        score = query_model(prompt, model)
        try:
            scores.append(int(score))
        except ValueError:
            continue
    return scores
```

- "integer only" — prose off, numbers on
- a try/except for when the judge chats anyway

::: narration
For the full test set, the judging prompt gets one crucial edit: respond with the integer number only. Reasoned essays are illuminating for three examples and unusable for computing an average over a hundred ten. The scoring function loops through every entry, asks for the bare number, and converts each reply to an integer — inside a try-except, because language models are language models, and occasionally the judge chats anyway; unparseable replies are skipped and counted. This wrapper pattern — instruct strictly, parse defensively — is the daily bread of anyone building pipelines on LLM outputs, making its first appearance here in miniature.
:::

---
## The verdict: 50.32

- all **110 of 110** responses scored, in about a minute
- fine-tuned GPT-2 medium: average **50.32 / 100**
- reference: Llama 3 8B base scores **58.51** · its instruct variant **82.6**
- a 355M model, hand-built, within 8 points of an 8B base model

::: narration
The full evaluation takes about a minute, every response parses, and the average lands at fifty point three two out of one hundred. Naked, that number means little — judged scores are only meaningful comparatively — so the book supplies the comparisons that give it teeth. On the same test set, under the same judge, Llama 3's base model — eight billion parameters, no instruction tuning — averages fifty-eight point five one. Its professionally instruction-tuned variant reaches eighty-two point six. Read those three numbers together: a three-hundred-fifty-five-million-parameter model, built from scratch across seven chapters and tuned on eleven hundred examples, lands within eight points of a base model twenty-two times its size. The gap to eighty-two is real too — it's what industrial-scale instruction data buys.
:::

---
## How firm is 50.32?

- Ollama is **not fully deterministic** across systems
- rerun the evaluation, scores wobble slightly
- remedy: repeat and average — treat the judge as a noisy instrument
- comparisons need identical judge, prompt, and test set

::: narration
One honesty footnote before leaning on the number. Even with a fixed seed and temperature zero, Ollama is not fully deterministic across operating systems as of the book's writing, so a rerun of the evaluation may not reproduce fifty point three two exactly. The book's remedy is standard measurement practice: repeat the evaluation several times and average, treating the judge as a slightly noisy instrument rather than an oracle. And the deeper discipline follows: judged scores are only comparable when the judge, the judging prompt, and the test set are all held identical. The reference numbers quoted alongside — Llama 3 base and instruct — were produced under exactly that protocol, which is what makes the comparison legitimate.
:::

---
## Four levers for a better score

- **hyperparameters** — learning rate, batch size, epochs
- **more and broader data** — 1,100 examples is a starting point
- **prompt format** — try Phi-3 style, or your own
- **a bigger base** — GPT-2 large or XL, one config key away

::: narration
The book closes the experiment with four concrete levers for anyone wanting to push past fifty. Tune the hyperparameters — learning rate, batch size, epoch count all interact, and the defaults were sensible rather than searched. Grow or diversify the dataset — eleven hundred examples barely samples the space of instructions; the Alpaca dataset, at fifty-two thousand entries, is the canonical next step and a suggested exercise. Experiment with the prompt format itself — the costume is a variable, not a constant. And swap in a larger base model — GPT-2 large or XL load with a one-line config change, capacity being the most reliable lever of all. Each is a self-contained experiment on infrastructure this book has already built.
:::

---
## Roads onward

- **preference tuning** (DPO) — align tone and style with human taste
- **LoRA** — fine-tune through small low-rank adapters (appendix E)
- production tooling: Axolotl, LitGPT
- staying current: arXiv cs.LG, r/LocalLLaMA

::: narration
The chapter ends by pointing at the roads it didn't take. Preference fine-tuning — direct preference optimization — is the optional stage after instruction tuning, shaping not whether the model obeys but how it sounds while obeying, aligning tone and judgment with human taste; the book's repository carries a bonus implementation. LoRA, low-rank adaptation, covered in an appendix and posed as an exercise, fine-tunes through small adapter matrices instead of touching all the weights — dramatically cheaper, functionally similar. For production-scale work, tools like Axolotl and LitGPT industrialize everything done by hand here. And for keeping pace with a fast field: the arXiv machine-learning feed and, in the book's charmingly specific recommendation, the local-llama subreddit.
:::

---
<!-- .slide: class="statement" -->
Alignment is a dataset. Obedience was learned from 935 examples.

::: narration
The statement worth carrying out of this chapter: alignment, at this scale, is a dataset. Nothing about the model's architecture changed — no new modules, no special obedience circuitry. The entire transformation from prompt-echoing completion engine to instruction-following assistant came from nine hundred thirty-five worked examples and two epochs of ordinary gradient descent. The behavior of a language model is, to a first approximation, the distribution of text it was tuned on — which is both empowering, since curating a dataset is within anyone's reach, and sobering, since every bias and blind spot of that dataset becomes a reflex of the model. Whoever writes the examples writes the manners.
:::

---
## What we built

- **format_input** — the Alpaca costume, applied everywhere
- **custom collate** — per-batch padding · shifted targets · −100 masking
- **GPT-2 medium, tuned** — loss 3.8 → 0.3 in two epochs
- **the chef test** — echo → "The meal is cooked every day by the chef."
- **LLM-as-judge** — local Llama 3 via Ollama: **50.32/100**, in context

::: narration
The inventory. A prompt-formatting function that dresses every example in Alpaca style, from training to evaluation. A custom collate pipeline — per-batch padding, targets shifted inside the collate, and the minus-one-hundred masking that hides filler from the loss while leaving one end-of-text to teach stopping. GPT-2 medium, loaded through the same size-agnostic machinery as ever, fine-tuned in two epochs from a loss of three point eight to zero point three — and from echoing the chef sentence to converting it perfectly, end-of-text and all. And an evaluation pipeline where a local Llama 3 judges all one hundred ten test responses, placing the hand-built model at fifty point three — eight points shy of a base model twenty-two times its size.
:::

---
## The whole journey

- **ch. 4** — the architecture: config → blocks → GPTModel
- **ch. 5** — pretraining: a loss, a loop, OpenAI's weights
- **ch. 6** — classification: head swap, 96% spam detection
- **ch. 7** — instruction tuning: a model that does what it's asked
- every stage, every line, built from scratch

::: narration
Step back and see the four decks as one arc. Chapter four built the machine: a seven-line config unfolding into layer norms, GELU, shortcut connections, transformer blocks, a complete GPT that generated confident gibberish. Chapter five taught it language: cross-entropy loss, the training loop, sampling strategies — then borrowed OpenAI's weights and verified them by fluency. Chapter six gave it a job: two output nodes, a mostly frozen network, and ninety-six percent spam detection after five laptop-minutes. And chapter seven gave it manners: instruction data, a masked collate, and a judge model to certify that asking now works. Architecture, knowledge, specialization, obedience — the full anatomy of a modern language model, with every line of it yours. That was the book's wager: that building it is the deepest way to understand it. Judge by how these four decks read now — the wager pays.
:::
