---
topicId: T1.1.1
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
Predictive machine learning learns a mapping from inputs to a number or label from historical examples. Deep learning is machine learning with many-layered neural networks, which excels at images, audio and text. Generative AI produces new content (text, code, images) and large language models (LLMs) are its most visible form. Rules and automation encode known logic explicitly. An architect's first job is to match the technique to the problem, and for many enterprise problems the right answer is *not* an LLM.

@@ keyterms
- **Predictive ML**: learns to forecast or classify (churn risk, demand, fraud score) from labelled history.
- **Deep learning**: neural networks with many layers; the basis of modern vision, speech and language models.
- **Generative AI**: models that produce new content conditioned on a prompt.
- **LLM**: a generative model trained on large text corpora to predict the next token.
- **Rules/automation**: explicit, deterministic logic (workflow engines, business rules, scripts).

@@ why
Clients often say "AI" when they mean one of four different things with different costs, risks and evidence needs. Choosing the wrong class (an LLM for exact calculation, or a rules engine for open-ended language) is the most expensive early mistake in an AI engagement, and it is made before any technology is picked.

@@ lesson
A useful way to choose is to ask what kind of output the task needs and how much error is tolerable.

| If the task is... | Usually suits | Why |
|---|---|---|
| Fully specified logic, exact results (tax, eligibility, routing rules) | Rules / code | Deterministic, auditable, cheap |
| Predicting a number or category from structured history (churn, demand, failure) | Predictive ML | Measurable error, purpose-built |
| Understanding or producing free text, summarising, drafting, extracting from messy documents | Generative AI / LLM | Handles ambiguity and language |
| Perception (images, audio) | Deep learning vision/speech models | Specialised architectures |

{{diagram:technique-choice}}

Three tests help before reaching for an LLM:

1. **Is the logic fully specifiable?** If a human can write the rules down completely, write them down. LLMs approximate rules; code executes them.
2. **Is a wrong answer costly or must it be reproducible?** LLM output varies and can be confidently wrong. Where audit or reproducibility matters, keep decisions deterministic and use models at the edges (extraction, drafting, triage).
3. **Is there structured historical data and a numeric target?** Then a predictive model, evaluated on held-out data, is usually more accurate, cheaper and easier to monitor than prompting an LLM.

Hybrid designs are common: a model extracts fields from a document, rules validate them, a predictive model scores risk, and an LLM drafts the explanation.

@@ example
**Expense approval.** Policy checks such as "meals over a limit need a manager" are rules. Reading the receipt photo is perception plus extraction (a model). Spotting unusual spending patterns is predictive/anomaly detection. Writing a friendly rejection note is generative. One workflow, four techniques, and the approval decision itself stays deterministic so it can be audited.

@@ deep
**Why the distinction matters for evaluation.** Each class is evaluated differently. Predictive models use held-out error metrics (precision, recall, mean absolute error). LLM features need task-specific evaluation sets and human review because there is no single accuracy number. Rules need ordinary software tests. A design that mixes them needs all three, which is part of the cost an architect must make visible.

**Over-use warning signs.** An LLM is probably the wrong tool if you are asking it for exact arithmetic, for decisions that must be identical on every run, or for classifications where you have thousands of labelled examples and a stable label set.
