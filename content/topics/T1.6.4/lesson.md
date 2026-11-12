---
topicId: T1.6.4
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
An architecture review finds security, reliability, cost, governance and operability gaps in a design and **prioritises them by risk**. A good reviewer asks "what happens when this is wrong, unavailable or manipulated, and how would we know?", asks for evidence rather than assurances, and proposes concrete changes.

@@ keyterms
- **Blast radius**: how much damage a failure or compromise can cause.
- **Failure mode**: a specific way a component can go wrong.
- **Single point of failure**: a component whose failure stops everything.
- **Evidence request**: asking to see tests, logs, or measurements rather than accepting a claim.
- **Residual risk**: risk that remains after mitigation and must be explicitly accepted.

@@ why
Reviews are where an architect's judgement is tested. Time is short, so the skill is finding the few issues that matter and explaining them so they get fixed.

@@ lesson
**Review checklist by theme**
- *Security*: untrusted inputs reaching the model; tool permissions; credentials; data leaving the boundary; injection and excessive agency.
- *Reliability*: timeouts, retries, fallbacks, idempotency for side effects, behaviour when the model service is down.
- *Quality*: evaluation set, thresholds, regression gates, monitoring of drift.
- *Cost*: token volume, caching, routing, budgets and alerts.
- *Governance*: ownership, approvals, human oversight for high-impact actions, audit records.
- *Operability*: logging and tracing, versioned prompts and models, rollback, runbooks, on-call.

**Method**
1. Read the design and list assets, flows and trust boundaries.
2. For each boundary and each action, ask the failure-mode question.
3. Note missing evidence as a finding in itself.
4. Rank findings by impact times likelihood, and by irreversibility.
5. Write each as: observation, why it matters, recommended change, severity.
6. Distinguish must-fix before launch from improve-later.

**Tone.** Critique the design, not the people. Offer alternatives. Acknowledge what is sound so that the findings are trusted.

@@ example
Design: an agent reads supplier emails and posts payments through one service account. Findings, ranked: (1) irreversible payments from a single broad credential with no approval threshold (critical); (2) untrusted email content reaches the model that selects the payment (critical); (3) no evaluation or regression tests (high); (4) logs record only final postings, not inputs or reasoning (high); (5) no retry or idempotency policy (medium). Recommended: approval above a threshold, scoped credentials and payee allow-lists, input handling and evaluation set, fuller audit logging, idempotency keys.

@@ deep
**Practice.** Use the architecture review exercises in the portal: mark the real flaws in a constructed design and compare with the model findings. Notice which false alarms you raised and why.

**Proportionality.** A prototype for ten internal users deserves a different review depth than a customer-facing agent with payment powers. State the risk class you reviewed against.
