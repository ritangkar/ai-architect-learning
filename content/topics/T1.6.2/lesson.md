---
topicId: T1.6.2
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
Turn discovery into **testable requirements**, including AI-specific non-functional requirements such as accuracy thresholds, refusal behaviour, latency and cost ceilings. Then structure the architecture document and a **handover pack** so the delivery team inherits decisions together with their reasons.

@@ keyterms
- **Functional requirement**: what the system must do.
- **Non-functional requirement (NFR)**: how well it must do it (performance, security, reliability, quality).
- **Acceptance criterion**: a check that decides whether a requirement is met.
- **Handover pack**: the set of documents that lets a delivery team build and operate the design.
- **Traceability**: links from requirements to design decisions and tests.

@@ why
Vague requirements ("accurate", "fast", "safe") cannot be built or accepted. AI systems add quality dimensions that are easy to forget, and an architecture that is not handed over with its rationale decays at the first surprise.

@@ lesson
**Writing a testable requirement.** State the condition, the measure, the threshold and how it is verified. Weak: "The assistant must be accurate." Testable: "On the agreed evaluation set of 200 questions, at least 90% of answers are rated correct and grounded by two reviewers; answers without support in the sources must refuse."

**AI-specific NFRs to consider**
- Quality: accuracy or groundedness thresholds on a named evaluation set.
- Refusal and fallback behaviour: when to decline, hand off, or escalate.
- Latency: time to first token and to completion for defined percentiles.
- Cost: ceiling per task or per month, and what happens at the limit.
- Safety and security: data classes allowed to leave the boundary; actions needing approval.
- Explainability and audit: what is recorded for each answer.
- Availability and degradation: behaviour if the model service fails.
- Change: how prompt and model updates are tested and released.

**Architecture document skeleton.** Context and goals; scope and users; constraints and assumptions; the key decisions with options and reasons; logical architecture (for example C4 context and container views); data and integration flows; security and governance; evaluation and operations; risks and open issues.

**Handover pack.** The architecture document, the decision records, the requirements with acceptance criteria and traceability, interface contracts, the evaluation set and how to run it, the operations runbook outline, and a list of open risks with owners.

@@ example
For a policy assistant, an NFR table lists: grounded-answer rate 90% on the evaluation set; unsupported questions must produce a refusal in at least 95% of test cases; first token within 3 seconds for 95% of requests; cost below an agreed amount per hundred questions; all answers logged with sources and user identity. Each row names how it is tested and who signs it off.

@@ deep
**Requirements are hypotheses for AI.** Quality thresholds set before data is explored may need revision. Record them as targets reviewed at agreed checkpoints, not as fixed contract terms, and be explicit about the effect of changes.

**Keep decisions with reasons.** Link each design choice to the requirement or constraint that drove it, using decision records ([T1.6.3](topic:T1.6.3)).
