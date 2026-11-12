---
topicId: T1.2.5
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
Retrieval and generation must be measured separately. Retrieval metrics (recall at k, precision, ranking quality) tell you whether the right passages are found; generation metrics (faithfulness to sources, relevance, completeness) tell you whether the answer uses them well. Both need a **golden set** of real questions. LLM-as-judge scales evaluation but is biased and must be calibrated against human judgement.

@@ keyterms
- **Recall at k**: share of relevant passages found in the top k results.
- **Precision at k**: share of the top k that are relevant.
- **MRR / nDCG**: measures of how high relevant results are ranked.
- **Faithfulness (groundedness)**: whether claims in the answer are supported by the retrieved text.
- **Golden set**: curated questions with expected answers or relevant passages, used for regression testing.

@@ why
Without measurement, every change is a guess and regressions are found by users. Separating retrieval from generation tells you which component to fix.

@@ lesson
**Build a golden set.** Collect real questions (anonymised), have experts mark the passages that answer them and the expected answer or acceptance criteria. Include hard cases: questions with no answer, ambiguous questions, and questions needing several passages. Keep it versioned and refresh it as usage changes.

**Retrieval metrics.** Recall at k answers "was the right evidence retrieved?"; precision at k answers "how much noise came with it?"; MRR and nDCG reward ranking relevant items higher. Use them to compare chunking, embeddings, hybrid and reranking.

**Generation metrics.** Faithfulness (every claim supported), answer relevance (addresses the question), completeness (nothing important missing), and refusal correctness (declines when sources lack the answer).

**LLM-as-judge.** A model can score outputs against a rubric cheaply. Known issues: bias towards longer or similar-style answers, inconsistency, and blind spots. Calibrate by comparing judge scores with human labels on a sample, use clear rubrics, combine with deterministic checks (citations present and valid, schema valid) and keep periodic human review.

**Operate it.** Run the golden set automatically on every change to prompts, models or retrieval, and track results over time.

@@ example
Users complain answers are wrong. Recall at 5 on the golden set is 0.55, but when the correct passages are supplied directly the generator scores 0.9 on faithfulness. The fault is retrieval, so the team improves chunking and adds reranking rather than changing the model. Recall at 5 rises to 0.8, and end-to-end quality follows.

@@ deep
**Statistical honesty.** Small golden sets give noisy results; report the size and avoid over-reading small differences. Keep a held-out portion that you do not tune against.

**Online signals.** Complement offline tests with sampled human review of production traffic and user feedback, tracked for drift.
