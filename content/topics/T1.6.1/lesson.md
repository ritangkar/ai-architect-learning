---
topicId: T1.6.1
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
Discovery turns "we want AI" into a scoped, measurable problem. Cover seven areas: business outcome, current process, data, risk and compliance, users, constraints, and success metrics. Separate the **stated request** (a chatbot) from the **underlying need** (shorter time to resolve customer queries) and ask for evidence of the baseline.

@@ keyterms
- **Stated request vs underlying need**: what the client asks for versus the problem it is meant to solve.
- **Baseline**: how the work performs today; without it, improvement cannot be shown.
- **Success metric**: a measurable target with a way to collect it.
- **Constraint**: a fixed limit (budget, data location, tools, skills, time).
- **Assumption log**: a list of things taken as true but not yet confirmed.

@@ why
Most AI project failures trace to unclear problems, unavailable data or unstated constraints discovered late. Structured discovery is the cheapest risk reduction an architect performs.

@@ lesson
**Seven areas and example questions**

1. *Outcome*: What decision or task are we improving? Who benefits? What does success look like in numbers?
2. *Process*: How is it done today, step by step? Where do delays and errors occur? What is the volume and variation?
3. *Data*: Where is the information, who owns it, what is its quality, format and freshness, and can we use it for this purpose?
4. *Risk and compliance*: What is the cost of a wrong answer? Which rules apply (privacy, sector regulation, internal policy)? Who must approve?
5. *Users*: Who will use it, in what setting, with what skills, and what do they trust or fear?
6. *Constraints*: Budget, timeline, platforms already in place, skills, security standards, hosting and data location.
7. *Success metrics*: Which measures, how collected, what threshold means "worth it", and what is the baseline?

**Technique.** Interview several roles (sponsor, operator, data owner, security, legal); ask for examples and artefacts (real tickets, documents); prefer "show me" to "tell me"; restate what you heard; record assumptions and open questions with owners.

**Reframing.** "We want a chatbot" becomes "reduce average handling time for the three most common query types without raising error rates". That reframing opens options other than a chatbot, including process change or simple automation.

@@ example
A manufacturer asks for an AI assistant for maintenance technicians. Discovery shows technicians mainly need the right manual page quickly on poor connectivity, and 70% of lookups concern a few dozen machines. The solution may be a curated search over those manuals with offline access, with generative summaries a later phase. The success metric is time to find the procedure, measured before and after.

@@ deep
**Discovery artefacts.** Produce a problem statement, a use-case list ranked by value and risk, a data inventory, a constraint list, an assumption log, and a short list of open decisions. These feed the specification and options analysis ([T1.6.2](topic:T1.6.2), [T1.6.3](topic:T1.6.3)).

**Avoiding leading questions.** Ask open questions first, then test hypotheses. Beware of asking only the sponsor; operators often hold the real process knowledge.
