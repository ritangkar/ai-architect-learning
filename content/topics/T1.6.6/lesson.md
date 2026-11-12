---
topicId: T1.6.6
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
The field moves quickly. Keep a lightweight **radar** of tools, protocols and models with explicit adoption criteria, and judge items by **production evidence** rather than announcements. Separate "interesting", "worth a bounded trial" and "adopt" so that attention and risk stay proportional.

@@ keyterms
- **Radar**: a maintained list of technologies by stage (watch, trial, adopt, hold).
- **Adoption criteria**: the evidence needed before moving an item up a stage.
- **Production evidence**: builder-authored accounts, independent evaluation, long-running use.
- **Hype signal**: claims without architecture, measurements or limits.
- **Timebox**: a fixed, small budget of time for a trial.

@@ why
Clients ask what is new and whether to use it. An architect who chases every release wastes effort; one who ignores change falls behind. A simple routine gives both discipline and credibility.

@@ lesson
**A lightweight routine**
1. Pick a few sources: official documentation and release notes of tools you use, engineering blogs written by the builders of production systems, standards and protocol repositories, and independent evaluations.
2. Log each item with a one-line description, what problem it solves, and where you learned of it.
3. Place it on the radar: *watch*, *trial* (bounded experiment), *adopt* (recommended default), *hold* (avoid for now).
4. Define adoption criteria: maturity and maintenance, security model, fit with current estate, evidence from real deployments, exit cost.
5. Review the radar on a regular cadence and record why items move.

**Judging evidence.** Prefer builder-authored technical write-ups with stated limits over marketing; check dates, as fast-moving areas age quickly; note when a claim depends on one vendor's measurement. Where sources disagree, record the conflict and the date you checked instead of picking silently.

**Protocols and standards.** For emerging interoperability protocols, read the specification and its current version, note which vendors support it in production, and watch for breaking changes.

@@ example
A new agent framework appears. Radar entry: "watch". A two-day timeboxed trial on a non-critical workflow asks: does it reduce code versus plain functions, can we test it, how does it handle state and approval, how is it maintained? The result and date are recorded; adoption waits for evidence of use in production systems like ours.

@@ deep
**Avoid recency bias.** Compare new options with the boring baseline (plain code, existing platform features). The question is whether the new thing beats what you already have for this client, not whether it is impressive.

**Share it.** A short monthly note to colleagues or clients turns your radar into a visible, useful habit.
