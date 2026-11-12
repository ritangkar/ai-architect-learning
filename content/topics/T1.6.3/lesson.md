---
topicId: T1.6.3
lastReviewed: '2026-11-12'
status: draft
sources: []
diagrams: ["adr-flow"]
depthVariants:
  compress: summary and key terms
  standard: adds lesson and worked example
  deep: adds extended material
---
@@ summary
When several architectures could work, compare **four or five viable options** against **weighted criteria**, then record the outcome in an **architecture decision record (ADR)**: context, options, decision, reasons and consequences. The matrix informs the decision; it does not make it, and the ADR preserves the trade-offs you accepted so they can be revisited.

@@ keyterms
- **Options analysis**: structured comparison of alternatives against criteria.
- **Criteria weights**: numbers expressing how much each criterion matters in this context.
- **ADR**: a short document recording one significant decision and its reasoning.
- **Trade-off**: what you give up to gain something else.
- **Sensitivity check**: testing whether the decision survives changes in weights.

@@ why
Decisions made in meetings and chats are forgotten, and later teams cannot tell whether a constraint still applies. Clear criteria also expose disagreements about priorities early, which is where most architectural arguments really lie.

@@ lesson
{{diagram:adr-flow}}

**Steps**
1. State the decision and its context in a sentence or two.
2. List four or five *viable* options (include the "do the simple thing" option).
3. Agree criteria with the stakeholders: for example quality on the client's tasks, data handling, operational burden, cost at expected volume, time to deliver, exit cost.
4. Weight the criteria for this client, score each option, compute weighted totals.
5. Run a sensitivity check: change weights moderately; does the winner change? If so, the decision hinges on priorities, which is worth discussing explicitly.
6. Decide and write the ADR.

**ADR structure (widely used lightweight form).**
- *Title*: the decision.
- *Status*: proposed, accepted, superseded.
- *Context*: forces at play.
- *Decision*: what was chosen.
- *Options considered*: with brief reasons for rejection.
- *Consequences*: benefits, costs and risks accepted, and follow-up actions.

**Defending a recommendation.** Be ready to say what you would need to see to change your mind, what you are trading away, and how you will detect early if you chose wrongly.

@@ example
Choosing how to access models for a client: hosted API, managed cloud service in the client's existing cloud, self-hosted open-weight model, hybrid with routing. Criteria weights: data handling 5, quality on client tasks 5, operations burden 4, cost at volume 3, exit cost 2. The matrix favours the managed service; the sensitivity check shows self-hosting wins only if operations burden is weighted below 2, which the client's three-person platform team makes unlikely. The ADR records both facts. You can practise this on the options-analysis exercise in the [exercises](page:exercises/) area of the portal.

@@ deep
**Scoring pitfalls.** Avoid false precision: scores of 1 to 5 are judgements. Score each criterion across options in one pass to reduce bias, and have a second person score independently where stakes are high.

**Living records.** Mark ADRs superseded rather than deleting them, and link to the new decision. The history is part of the value.
