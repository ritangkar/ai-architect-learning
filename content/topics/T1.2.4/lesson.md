---
topicId: T1.2.4
lastReviewed: '2026-11-12'
status: draft
sources: []
diagrams: ["technique-decision"]
depthVariants:
  compress: summary and key terms
  standard: adds lesson and worked example
  deep: adds extended material
---
@@ summary
Three ways to give a model knowledge or behaviour: **retrieve** relevant text at query time (RAG), **fine-tune** the model on examples, or put everything in a **long context**. Retrieval suits changing, citable knowledge; fine-tuning suits consistent behaviour, format and style; long context suits bounded, one-off material. They combine, and the choice is a trade-off on freshness, grounding, cost, latency and maintainability.

@@ keyterms
- **RAG**: supply retrieved passages in the prompt.
- **Fine-tuning**: further train a model on examples to change its behaviour.
- **Long context**: place the full material in the prompt window.
- **Grounding**: answers tied to supplied sources.
- **Behaviour vs knowledge**: how the model responds versus what facts it uses.

@@ why
This choice recurs in every engagement, and it is frequently made on fashion. A decision table with explicit criteria lets you defend the choice and revisit it when conditions change.

@@ lesson
{{diagram:technique-decision}}

| Criterion | RAG | Fine-tuning | Long context |
|---|---|---|---|
| Knowledge changes often | Strong: update the index | Weak: retrain to update | Strong if you can re-supply it |
| Need citations / traceability | Strong | Weak | Possible but heavy |
| Consistent format, tone, narrow behaviour | Moderate (prompting) | Strong | Moderate |
| Per-request cost | Low to moderate | Low once trained | High for large inputs, every time |
| Latency | Retrieval adds a step | Low | Higher with long prompts |
| Upfront effort | Index and evaluation | Data preparation and training | Low |
| Maintenance | Keep the index fresh | Re-train, re-evaluate | Re-assemble inputs |

**Rules of thumb.** Use fine-tuning for *how* the model behaves (output format, domain style, classification with a stable label set), not for *what* it knows. Use RAG when facts change or must be cited. Use long context for bounded material you need to reason over as a whole, accepting the cost. Combine them: a fine-tuned small model with retrieval is common in cost-sensitive systems; for production examples of these trade-offs see [case CS-005](case:CS-005) (distilling a large model into a smaller one) and [case CS-006](case:CS-006) (a privacy-first retrieval design).

@@ example
A claims assistant must follow a strict reply template (behaviour) and quote current policy wording (knowledge). Prompting plus retrieval handles both if the template is simple. If template compliance stays unreliable, a small fine-tune on approved replies fixes the behaviour while retrieval continues to supply the current policy text.

@@ deep
**Total cost of ownership.** Include data preparation, evaluation, hosting, retraining and the human time to maintain each approach, not only per-token prices.

**Reversibility.** Retrieval is easy to change; fine-tuned models create a dependency on a specific base model and data version. Plan for re-training when the base model is retired.
