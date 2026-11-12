---
topicId: T1.1.3
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
Language models are powerful but fail in predictable ways: they can state false things fluently (**hallucination**), give different answers to the same prompt (**nondeterminism**), lack knowledge after their training date (**knowledge cutoff**), and sometimes ignore instructions. Each failure mode has standard mitigations: ground answers in sources, validate outputs, constrain what the model can do, and keep a human in the loop where errors are costly.

@@ keyterms
- **Hallucination**: plausible but unsupported or false output.
- **Nondeterminism**: variation between runs even with the same input; lowered but not eliminated by setting temperature to zero.
- **Knowledge cutoff**: the model does not know events or documents after its training data ends.
- **Grounding**: supplying source material and requiring answers to be based on it, with citations.
- **Guardrail**: a check or constraint applied to inputs, outputs or actions.

@@ why
Architects are accountable for what happens when the model is wrong. Naming the failure modes lets you design the mitigation, the monitoring and the honest limits you will state to the client.

@@ lesson
| Failure mode | What it looks like | Typical mitigations |
|---|---|---|
| Hallucination | Invented facts, citations, API names | Retrieve and cite sources; verify citations; abstain when sources lack the answer |
| Nondeterminism | Different answers on reruns | Deterministic logic for decisions; test with sets of cases, not single examples |
| Knowledge cutoff | Outdated facts | Retrieval from current sources; state the date limits |
| Weak instruction following | Skips steps, ignores format | Structured outputs with schema validation; enforce order in code |
| Prompt injection / manipulation | Follows instructions hidden in content | Treat content as untrusted; limit capabilities and require approval |
| Overconfidence | Confident tone on shaky answers | Calibrated language, confidence signals from retrieval, human review |

Mitigations are layered. No single one is sufficient, and prompt wording alone is never a security control. Choose mitigations in proportion to the cost of an error: a draft email needs little, a payment instruction needs a lot.

@@ example
A contract assistant cites "Clause 14.3" that does not exist. The architect's response is not "find a better model" but: restrict answers to retrieved passages; require each claim to include a passage identifier; automatically check that every cited identifier appears in the retrieved set; and route answers with no valid citation to "I could not find this in the provided documents".

@@ deep
**Evaluating failure rates.** Measure hallucination and refusal rates on a representative set that includes questions with no answer in the sources, because those reveal fabrication. Track them after every model or prompt change.

**Honesty with clients.** State residual risk plainly: mitigations reduce but do not eliminate failures. Define who reviews high-impact outputs and how errors are reported and corrected.
