---
topicId: T1.1.2
lastReviewed: '2026-11-12'
status: draft
sources: []
diagrams: []
depthVariants:
  compress: summary and key terms
  standard: adds lesson and worked example
  deep: adds extended material
---
@@ summary
LLMs read and write **tokens**, small chunks of text. The **context window** is the maximum number of tokens the model can consider in one request (prompt plus output). Cost is usually charged per token, and latency grows with prompt length (before the first word appears) and with output length (each further token takes time). Cost and latency are therefore engineering variables you can estimate and manage.

@@ keyterms
- **Token**: a unit of text (a word, part of a word or punctuation). In English, a token is very roughly three-quarters of a word; other languages and code differ.
- **Context window**: the token limit for one request, covering instructions, retrieved text, history and the answer.
- **Attention**: the mechanism letting each token weigh other tokens in the context; its cost grows with context length.
- **Inference**: running a trained model to produce output (as opposed to training).
- **Time to first token / decoding speed**: the delay before output starts, and the rate at which it then streams.

@@ why
Architects must answer "what will it cost, how fast will it be and what happens when the document is longer than the window?" before a build starts. Those answers come from tokens, not from the number of users.

@@ lesson
**Tokens.** Models do not see characters or words; a tokenizer splits text into tokens. Because providers price and limit by tokens, you estimate by counting tokens, not words. Use the provider's tokenizer to count real samples rather than relying on rules of thumb.

**Context window.** Everything in one request competes for the same budget: system instructions, conversation history, retrieved passages, tool results and the reply. When the budget is exceeded you must drop, summarise or retrieve selectively. A very large window does not remove the need to choose content: more irrelevant text raises cost and latency and can reduce answer quality.

**Attention and cost.** In the standard transformer design, each token attends to the others, so processing cost rises faster than linearly with context length. Providers use optimisations, but the practical lesson holds: long prompts are slower and dearer.

**Latency has two parts.**
1. *Prefill*: the model processes the whole prompt before producing anything. Longer prompts delay the first token.
2. *Decoding*: tokens are generated one after another, so longer answers take proportionally longer. Streaming output improves perceived speed but not total time.

**Cost formula.** Monthly cost is approximately: requests x (input tokens x input price + output tokens x output price). Output tokens are commonly priced higher than input tokens, and some platforms discount repeated prompt prefixes; check the current price list for the chosen provider.

@@ example
An assistant sends a 6,000-token prompt (instructions plus retrieved text) and receives a 400-token answer, 20,000 times a month.

- Input tokens per month: 6,000 x 20,000 = 120 million.
- Output tokens per month: 400 x 20,000 = 8 million.

Using **illustrative** prices of 1 currency unit per million input tokens and 4 per million output tokens (not any real vendor's price): 120 x 1 + 8 x 4 = 152 units. If retrieval trimmed the prompt to 2,000 tokens, input cost drops by two thirds to 40, total 72. The biggest lever was the prompt, not the answer.

@@ deep
**Conversation history.** In a chat, each turn typically resends earlier turns, so the input grows with the length of the conversation. Strategies: keep a rolling window, summarise old turns, or store facts outside the prompt and retrieve them.

**Output limits.** Set maximum output tokens deliberately; unbounded answers cost money and time. Ask for structured or concise formats when appropriate.

**What to measure.** Track tokens in and out per request, time to first token, total latency and cost per task, not just per request. A task that needs three model calls costs three times as much.
