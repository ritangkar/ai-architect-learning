# Engine reference

All numbers below are defaults in `content/config/engine.json` (and `content/config/gates.json` for level gates). The engine (`src/lib/engine/*`) reads them at run time; nothing is hard-coded. The engine is deterministic: no model calls, no `Math.random`, ties are broken by a date-free seeded hash.

## 1. Evidence

Every answer is an immutable **attempt**: `{id, itemId, itemType, timestamp, contentVersion, topics[], competencies[], response, score 0..1, confidence 1..5?, timeMs, seed?, optionOrder?, context, runId?, caseId?, exerciseId?}`. Attempts are append-only. `context` is one of `initial`, `quiz`, `review`, `exercise`, `confirm`, `case_exercise`. Lesson views, video views and "mark read" are *events* and never enter these formulas.

Item scores (`scoring.ts`):

| Type | Score |
|---|---|
| mcq | `(correct picks - wrong picks) / correct count`, clamped to [0,1] |
| scenario | `0.6 x credit(chosen option) + 0.4 x rationale score`, where rationale score = `(valid picks - invalid picks) / valid count`; with no rationales, just the option credit |
| decision_comparison | `1 - sum(weight x abs(learner - model) / 4) / sum(weight)` over option x criterion cells |
| architecture_review | `(flaws found - 0.5 x false alarms) / flaws`, clamped |
| card | known 1, almost 0.5, missed 0 |

Options are shown in a seeded shuffle (`seededShuffle(options, seed|questionId)`); the order is stored in the attempt.

## 2. Topic evidence (spec 8.1, 8.2)

For a topic take its attempts sorted by time (ties by id), keep the last `max_attempts_considered` (12), and let `n` be how many remain. For the i-th (0 = oldest) attempt:

```
decay_i   = recency_decay_per_newer_attempt ^ (n - 1 - i)            (0.85)
w_i       = evidence_weights[itemType] x decay_i                      (mcq 1, scenario 3, decision_comparison 3, architecture_review 3, card 0.5)
s_i'      = max(0, 1 - negative_weight_multiplier x (1 - s_i))        if confidence >= 4 and s_i < 0.4   (x1.5)
            s_i                                                        otherwise
E         = sum(w_i x s_i') / sum(w_i)
M (mass)  = sum(w_i)
```

State thresholds (`state_thresholds`):

| State | Condition |
|---|---|
| unknown | no attempts, or `M < 3` |
| gap | `E < 0.50` |
| developing | `0.50 <= E < 0.70`, or `E >= 0.70` without the proficient requirements |
| proficient | `E >= 0.70`, `M >= 6`, and at least 1 applied item (scenario, decision_comparison, architecture_review) with score `>= 0.70` |
| mastered | proficient, plus `E >= 0.85`, at least 2 applied items `>= 0.80` on **different days**, and at least one correct review (`context = review`, score `>= pass_threshold` 0.70) at least `review_after_days` (7) after the first moment the evidence reached proficient |

Note: with weight 1 and decay 0.85, even 12 perfect MCQs give `M = 5.7`, so MCQs alone can never reach proficient. This follows from the spec's numbers; tune the weights if you disagree.

Interval: half-width = `0.5 / sqrt(M)` (the config string `competency_interval_halfwidth` is parsed, never evaluated). `lo = max(0, E - hw)`, `hi = min(1, E + hw)`. `lowEvidence` is true when fewer than 3 attempts or `M < 3`.

## 3. Competency estimate and calibration (spec 8.3)

The competency estimate applies the topic formula to all attempts tagged with the competency, pooled over topics (see ADR-0011 for why this differs from averaging topic estimates). Coverage = topics touched / topics developing it.

Calibration index = `mean(confidence / 5) - mean(score)` over the last `calibration_window_items` (20) rated items. Positive means overconfident. A competency is flagged overconfident above `+calibration.flag_threshold` (0.15) and underconfident below `-0.15`. If no per-item confidence exists, the self-rating gap `selfRating/5 - E` is used.

## 4. Initial assessment (F02)

* Order: self-rating (Section C), then adaptive items (Section A concept = mcq/card, Section B scenario = the rest).
* Section weights `initial_assessment.weights` (0.25 / 0.55 / 0.20) are realised by the per-competency pattern `section_pattern` (A,B,A,B,A,B,A): with item weights 1 and 3 that is about 25:55 by scored weight.
* Next competency: not stopped and with items left; fewest items first (until `min_items_per_competency_before_stop`), then widest interval, then higher self-rating first, then seeded hash. Self-rating changes order only.
* Next item within a competency: the pattern's section if available, difficulty target starting at 3 and stepping +1 after a good answer (`>= 0.7`) and -1 after a poor one, ties by seeded hash.
* Stop a competency after at least `min_items_per_competency_before_stop` (3) items when `lo > stop_if_interval_above` (0.8) or `hi < stop_if_interval_below` (0.4); also at `max_items_per_competency` (7) or when the bank has no more items. Competencies with too few items are reported as **low evidence**.
* Depth assignment: proficient or mastered gives compress; gap gives `routing.gap_depth` (deep); developing gives standard; unknown topics inherit compress/deep from their competencies when those are all proficient or any is gap, marked *inferred* and never counted as mastery.

## 5. Spaced review (F11)

Boxes 1..6 with intervals `box_intervals_days` = [1, 3, 7, 16, 35, 70]. Correct: `box + correct_moves_up` (1), capped; but a correct answer with confidence `<= low_confidence_threshold` (2) does not advance when `low_confidence_correct_advances` is false. Incorrect: `box - incorrect_drops` (2), floor `min_box` (1). Next due = review time + interval of the new box. New cards are due immediately. Snooze hides a card until the snooze ends; reset returns it to box 1. The queue is ordered by overdue time, then by weaker competency. Dates schedule revision only.

## 6. Recommender (F12, spec 8.4)

Candidate activities: learn (a topic whose prerequisites are met), case (Tier A/B, not yet passed; routed to a prerequisite when needed), exercise (non-simulation, not passed), revise (all due cards, or a topic with two or more due).

```
score = 0.35 gapSeverity + 0.25 unblockValue + 0.15 caseRelevance + 0.15 reviewDue + 0.10 levelFit     (recommender.weights)
gapSeverity  = 1.0 if topic state gap; 0.7 if unknown; else 1 - E of the topic's weakest competency (fallback topic E)
               (cases and exercises: mean over their topics; revise: due share)
unblockValue = downstream topics + cases that list the topic, divided by the maximum among candidates
caseRelevance= 1 if the topic is a prerequisite of the queued or resumed case, 0.5 if it shares a pattern, else 0
reviewDue    = due cards for the topic divided by the maximum among candidates
levelFit     = 1.0 if it advances a topic or kind named by an unmet condition of the next level gate, else 0.5
```

Ties: `hashUnit("rec|" + activityId)`. Every recommendation lists its "Because" reasons built from these factors.

**Session mix** `session_mix_target` (learn 40, case 30, exercise 15, revise 15) plus `mix_shifts` rules (`due_cards>25` adds 20 to revise; `topics_in_gap>3` adds 15 to learn; `queued_case_prereqs_all_proficient` adds 10 to case), renormalised. Rules are parsed (`name>N` or a boolean metric), never evaluated. Three slots are allocated by largest remainder over the mix among kinds that have candidates; each slot shows `alternatives_per_slot` (1) alternative. The shift is explained in text.

**Routing:** for a case with a prerequisite in gap or unknown, recommend the earliest (topologically) unmet prerequisite, including unmet prerequisites of those (ADR-0014), at `routing.gap_depth` or `routing.unknown_depth`, with "then return to case X"; the resume pointer `{caseId, section, viaTopic}` is stored and the topic page offers "Return to the case".

**Regression:** a case review exercise below `case_exercise_regression_below` (0.5) is recorded as an `architecture_review`-weight attempt across the case's prerequisite topics, which lowers their estimates and can reopen them; revision cards for those topics are reset to due and the case shows "Revisit before continuing". At or above `pass_threshold` (0.7) the exercise counts as passed.

## 7. Pathway (F03)

Stable topological order (Kahn, ties by blueprint order). A prerequisite is *met* unless it is in gap or unknown without a compress inference. Each item shows state, assigned depth, reason and unmet prerequisites. Proficient topics show "Confirm in 2 questions": two `confirm` attempts with mean `>= 0.7` mark it confirmed. The learner can override to a weakest-first order.

## 8. Levels and gates (F15)

Level = the highest level in sequence whose gate conditions are all met (`gates.json`): `assessment_completed`, `modules_satisfied`, `competencies_min_state`, `cases_passed`, `exercise_passed`, `industries_studied`, `simulations_passed`, `reviews_current`. Interpretations are recorded in ADR-0009.

## 9. Other keys

`backup_reminder` (7 days or 25 new attempts), `import_max_bytes` (25 MB), `freshness.stale_after_days` (90), `session_length_hint_minutes` (120), `streak_visible_by_default` (false), `recommender.estimated_minutes`. Keys added by this implementation, not in the handoff: `calibration.flag_threshold`, `initial_assessment.section_order`, `section_pattern`, `max_items_per_competency`, `recommender.estimated_minutes`, `pass_threshold`.
