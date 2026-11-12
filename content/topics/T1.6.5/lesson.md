---
topicId: T1.6.5
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
Explain architecture at the **right level of abstraction** for the audience: executives need the decision, options, cost, risk and value; technical leads need components, interfaces and trade-offs; delivery teams need detail. Frame risk, value and cost **honestly**, including what you do not yet know.

@@ keyterms
- **Abstraction level**: how much detail a view shows.
- **Decision framing**: presenting a choice with options and a recommendation.
- **Audience map**: who must decide, who must build, who is affected.
- **C4 views**: context, container, component and code diagrams at increasing detail.
- **Honest uncertainty**: stating assumptions and unknowns plainly.

@@ why
A correct architecture that nobody understands is not adopted. Overstated claims erode trust the first time reality differs; marketing-style case studies are a warning of how that happens.

@@ lesson
**Match view to audience**
- Executives and sponsors: one page. The problem, the recommended option and the alternatives, benefits in business terms, total cost, key risks and how they are managed, what you need from them.
- Business owners: how it works in their process, what changes for users, controls and oversight.
- Technical leads: the C4 context and container views, key decisions and trade-offs, integration points, non-functional design.
- Delivery teams: detailed design, interfaces, runbooks.

**Principles**
- Lead with the decision or the question to be answered.
- Use one idea per diagram; label every box and arrow; show the boundary of the system.
- Name risks and say what mitigates them; do not hide them in an appendix.
- Separate what is established from what is assumed. Quote numbers with their source and conditions.
- Prepare the questions you expect and the evidence for your answers.

**Reading claims critically.** Vendor and marketing material usually states outcomes without architecture. Treat such numbers as claims to be verified, not as facts. The catalogue entry for [case CS-008](case:CS-008) is included for exactly this purpose.

@@ example
For a steering committee: slide 1, the decision (approve phase 1 funding); slide 2, three options with a recommendation; slide 3, context diagram; slide 4, top five risks with mitigations and owners; slide 5, costs and what is not yet known. A technical appendix holds the container view and the decision records for those who want to dig in.

@@ deep
**Telling the truth about uncertainty.** AI systems have performance that is measured, not guaranteed. Present ranges and the evaluation behind them, and what monitoring will reveal after launch. Clients trust architects who say what they do not know.

**Written follow-up.** After meetings, send a short record of decisions, open questions and owners so that agreements are not lost.
