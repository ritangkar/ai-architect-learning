# Deliverable B (Part 2): Curriculum Blueprint

Draft v0.1, prepared 2026-11-12. Companion data file: `curriculum_blueprint.json` (machine-readable, validated).

**Honesty notes.** (1) Resources below name authoritative sources and what to focus on; they are not yet individual verified URLs. Videos are slots to be curated and link-checked in the content phase, because I have not verified specific videos. (2) SAP statuses are recorded as notes with a verify instruction; the portal must display a status and last-verified date per SAP topic. (3) Case names are candidates drawn from research and indexes, not yet verified against primary sources; Part 3 does that. (4) Question counts are authoring targets, not written questions.

## 1. Structure and design rules

- 73 topics in 13 modules across three pillars, 17 competencies, 20 architecture patterns.
- No calendar dates. Order is driven by prerequisites and your assessment profile.
- Cross-pillar integration: 29 prerequisite edges cross pillars (for example SAP topics require vendor-neutral foundations; industry topics require both). The pathway can therefore teach a manufacturing case with agent architecture, SAP integration and domain logic together.
- Mastery is never set by lesson completion. A topic reaches proficient only after assessment evidence including at least one applied item (scenario, decision comparison or review exercise).
- Prerequisite graph validated: no dangling references, no cycles, every competency and pattern used.

## 2. Adaptive depth model

- **compress** (10-20 min typical): Initial or later assessment shows proficient on this topic's competencies. Content: One-page summary, key terms, 2 confirmation questions, jump to related cases.
- **standard** (45-90 min typical): Developing or untested. Content: Guided lesson, curated resources with focus notes, worked example, quiz, one exercise.
- **deep** (90-180 min typical): Gap or repeated misses. Content: Prerequisite refresh, extended lesson, multiple examples, scaffolded exercises, targeted re-assessment.

Time ranges are planning hints for the portal's session suggestions, not deadlines.

## 3. Levels and milestones (non-calendar)

- **L0 Orientation**: Complete initial assessment Exit gate: Knowledge profile created
- **L1 Foundation**: Every topic in M1.1 and M1.2 at proficient or compressed; no competency C02/C03 below developing
- **L2 Practitioner**: M1.3 complete; M2.1 proficient; 10 Tier A or B cases studied with exercises passed
- **L3 Architect**: M1.4, M1.5, M2.2 proficient; first architecture review exercise passed; C06, C07, C09 at least developing
- **L4 Senior Architect**: M2.3, M2.4, M3.1 proficient across at least 5 industries; all competencies at least developing; C12, C13, C14 proficient
- **L5 Lead Architect**: M1.6, M3.2, M3.3 complete; capstone simulations passed; all competencies proficient; review of weakest competencies due via spaced revision

Levels and gates are non-calendar. Thresholds are defaults recorded as configuration, not hard-coded.

## 4. Competencies

- **C01** Discovery and requirements elicitation: developed by 3 topics
- **C02** AI and LLM foundations and limits: developed by 5 topics
- **C03** Retrieval and knowledge architecture: developed by 7 topics
- **C04** Agent and orchestration design: developed by 8 topics
- **C05** Integration and interoperability (APIs, MCP, A2A): developed by 8 topics
- **C06** AI security and threat modeling: developed by 5 topics
- **C07** Identity, data access and privacy: developed by 7 topics
- **C08** Governance, responsible AI and human oversight: developed by 6 topics
- **C09** Evaluation and quality engineering: developed by 2 topics
- **C10** Reliability, performance and cost engineering: developed by 5 topics
- **C11** Operations, lifecycle and observability: developed by 2 topics
- **C12** Technology selection and trade-off analysis: developed by 30 topics
- **C13** SAP AI platform architecture: developed by 15 topics
- **C14** SAP CX solution architecture: developed by 8 topics
- **C15** Industry and domain architecture: developed by 14 topics
- **C16** Architecture documentation and communication: developed by 6 topics
- **C17** Architecture review and risk challenge: developed by 7 topics

## 5. Architecture patterns used for case-to-topic linking

- **PAT01** Baseline RAG
- **PAT02** Hybrid retrieval with reranking
- **PAT03** Agentic RAG
- **PAT04** Tool-calling agent
- **PAT05** Graph/workflow-orchestrated agent
- **PAT06** Supervisor multi-agent
- **PAT07** Human-in-the-loop approval gate
- **PAT08** LLM gateway and model routing
- **PAT09** MCP tool facade over enterprise APIs
- **PAT10** A2A delegation between agents
- **PAT11** Guardrail and policy layer
- **PAT12** Evaluation-driven development
- **PAT13** Semantic and prompt caching
- **PAT14** Event-driven intelligent automation
- **PAT15** Side-by-side extension (clean core)
- **PAT16** Data-product-enriched ML
- **PAT17** Embedded copilot in business app
- **PAT18** Agentic commerce storefront
- **PAT19** Identity propagation to tools (on-behalf-of)
- **PAT20** Fallback and graceful degradation

## 6. Initial assessment blueprint

Purpose: establish a knowledge profile per topic and competency before routing.

| Section | Weight | Content | Scoring |
|---|---|---|---|
| A. Concept and terminology MCQs | 25% | Items across all three pillars, 2-3 per competency | Auto-scored |
| B. Scenario architecture questions | 55% | 12-16 short scenarios (client problem, constraints, options). Choose and justify, rank trade-offs, spot flaws. Mix of selected-response with rubric-based justification checklists the learner self-checks against model answers | Rubric points per criterion; weighted 2-3x over MCQ items |
| C. Self-assessment of experience and confidence | 20% as calibration, 0% as competence | Rate confidence per topic cluster; record experience flags (e.g. SAP Commerce, MCP, Joule Studio) | Used to compute overconfidence/underconfidence per competency and to pre-seed compress candidates |

Design rules: no item credited for definitions alone where a scenario variant exists; each item tagged with topics, competencies, difficulty; adaptive stop rule for low-value items after a competency is clearly proficient or clearly weak; results produce (a) per-competency estimate with confidence range, (b) per-topic state (unknown, gap, developing, proficient), (c) compress/standard/deep assignment, (d) first recommended activities. Because scenario answers cannot be machine-graded for free text on a static site, justification is scored by selecting from criteria and comparing to a model answer; this limitation is stated in the UI.

## 7. Modules and topics


### Pillar 1: Core enterprise AI architecture (vendor-neutral)


#### M1.1 Foundations of modern AI

**T1.1.1 ML, deep learning and generative AI landscape**
- Prerequisites: none
- Objectives: Distinguish predictive ML, deep learning, generative AI and rules/automation and state which problem types each suits; Explain why many enterprise problems should not use an LLM
- Competencies: C02
- Resources (source: what to focus on): YouTube lecture or conference talk (to be curated and URL-verified): Short orientation talk, skip if assessment shows strength; Research papers (arXiv): Optional: only for gap learners
- Related case candidates (unverified until Part 3): Predictive and generative cases in catalog
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.1.2 LLM mechanics: tokens, context windows, attention, inference**
- Prerequisites: T1.1.1
- Objectives: Explain tokens, context window and attention at the level needed to reason about cost and latency; Estimate how prompt size and output length drive latency and spend
- Competencies: C02, C10
- Resources (source: what to focus on): Anthropic developer documentation: Context windows, prompt caching, token counting; OpenAI platform documentation: Tokenization and pricing concepts; YouTube lecture or conference talk (to be curated and URL-verified): Visual explanation of transformers, selected for architects
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)

**T1.1.3 Model capabilities, limitations and failure modes**
- Prerequisites: T1.1.2
- Objectives: Explain hallucination, nondeterminism, knowledge cutoff and instruction-following limits; Choose mitigations (grounding, validation, human review) per failure mode
- Competencies: C02, C17
- Resources (source: what to focus on): Anthropic developer documentation: Reducing hallucinations guidance; OWASP GenAI Security Project (LLM Top 10): Overreliance and misinformation risks
- Patterns: PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: none

**T1.1.4 Embeddings and semantic similarity**
- Prerequisites: T1.1.2
- Objectives: Explain what an embedding represents and what it cannot capture; Reason about embedding model choice, dimensionality and domain fit
- Competencies: C02, C03
- Resources (source: what to focus on): OpenAI platform documentation: Embeddings guide; YouTube lecture or conference talk (to be curated and URL-verified): Embeddings explained visually
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)

**T1.1.5 Prompt engineering and context engineering**
- Prerequisites: T1.1.2
- Objectives: Design system prompts, structured outputs and context assembly for a business task; Explain context engineering as managing what enters the window, not just wording
- Competencies: C02, C04
- Resources (source: what to focus on): Anthropic developer documentation: Prompting and structured output guidance; OpenAI platform documentation: Structured outputs; Anthropic engineering blog: Building effective agents: Context and tool design sections
- Patterns: PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)


#### M1.2 Knowledge and retrieval architecture

**T1.2.1 Retrieval-augmented generation fundamentals**
- Prerequisites: T1.1.4, T1.1.5
- Objectives: Draw and explain an end-to-end baseline RAG flow including ingestion, chunking, retrieval, generation and citation; Identify where baseline RAG breaks
- Competencies: C03
- Resources (source: what to focus on): YouTube lecture or conference talk (to be curated and URL-verified): Architect-oriented RAG walkthrough; Company engineering blogs (builder-authored): One builder-authored RAG support case
- Patterns: PAT01 Baseline RAG
- Related case candidates (unverified until Part 3): DoorDash support RAG (candidate, verify primary)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.2.2 Vector stores, hybrid search and reranking**
- Prerequisites: T1.2.1
- Objectives: Compare vector databases, search engines with vector support and pgvector-style options on scale, ops burden, filtering and security; Explain why hybrid retrieval and reranking improve recall and precision
- Competencies: C03, C12
- Resources (source: what to focus on): Official vendor documentation for the specific product: Two or three vendor docs for contrasting options; YouTube lecture or conference talk (to be curated and URL-verified): Hybrid search explained
- Patterns: PAT02 Hybrid retrieval with reranking
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.2.3 Advanced retrieval: chunking strategies, graph RAG, agentic RAG**
- Prerequisites: T1.2.2
- Objectives: Select a chunking and metadata strategy for a given document type; Explain when graph-based or agentic retrieval is justified versus its added cost and risk
- Competencies: C03, C04
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Agentic RAG production write-up (candidate: Uber, verify); Research papers (arXiv): Selected retrieval papers
- Patterns: PAT03 Agentic RAG
- Related case candidates (unverified until Part 3): Uber agentic RAG (candidate, verify)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.2.4 RAG versus fine-tuning versus long-context**
- Prerequisites: T1.2.1, T1.1.3
- Objectives: Produce a decision table for knowledge freshness, grounding, cost, latency and maintainability; Recognize when fine-tuning is for behavior and format rather than knowledge
- Competencies: C03, C12
- Resources (source: what to focus on): Anthropic developer documentation: Long context and caching notes; OpenAI platform documentation: Fine-tuning overview
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.2.5 Retrieval evaluation and quality measurement**
- Prerequisites: T1.2.2
- Objectives: Define retrieval metrics and generation metrics and how to build a golden set; Explain limits of LLM-as-judge and how to calibrate it
- Competencies: C09, C03
- Resources (source: what to focus on): Official vendor documentation for the specific product: Evaluation framework docs (e.g. open-source eval tooling); Company engineering blogs (builder-authored): LLM jury and guardrail quality monitoring posts (candidate: DoorDash, verify)
- Patterns: PAT12 Evaluation-driven development
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M1.3 Agents, tools and orchestration

**T1.3.1 Tool and function calling**
- Prerequisites: T1.1.5
- Objectives: Explain the tool-calling loop and what the application, not the model, must enforce; Design tool schemas that are safe, narrow and testable
- Competencies: C04, C05
- Resources (source: what to focus on): OpenAI platform documentation: Function calling; Anthropic developer documentation: Tool use; Anthropic engineering blog: Building effective agents: Tool design guidance
- Patterns: PAT04 Tool-calling agent
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)

**T1.3.2 Workflows versus agents: control patterns**
- Prerequisites: T1.3.1
- Objectives: Distinguish fixed workflows, routing, orchestrator-worker and autonomous loops; Choose the least autonomous design that meets requirements
- Competencies: C04, C12
- Resources (source: what to focus on): Anthropic engineering blog: Building effective agents: Patterns catalog and when to avoid agents
- Patterns: PAT04 Tool-calling agent, PAT05 Graph/workflow-orchestrated agent
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.3.3 Orchestration frameworks: LangChain, LangGraph and alternatives**
- Prerequisites: T1.3.2
- Objectives: Explain what a graph-based orchestrator adds (state, branching, checkpoints, human interrupts); Compare frameworks against platform-native builders and plain code on lock-in and observability
- Competencies: C04, C12
- Resources (source: what to focus on): LangGraph and LangChain documentation: Concepts: state, nodes, edges, persistence, interrupts; Official vendor documentation for the specific product: One alternative agent framework doc for contrast
- Patterns: PAT05 Graph/workflow-orchestrated agent, PAT07 Human-in-the-loop approval gate
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)

**T1.3.4 Multi-agent systems**
- Prerequisites: T1.3.2
- Objectives: State when multi-agent decomposition helps and when it adds cost, latency and failure surface; Design supervisor and handoff patterns with clear responsibility boundaries
- Competencies: C04, C17
- Resources (source: what to focus on): Anthropic engineering blog: Building effective agents: Multi-agent research system lessons; Company engineering blogs (builder-authored): Multi-agent production write-up (to be selected)
- Patterns: PAT06 Supervisor multi-agent
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: none

**T1.3.5 Model Context Protocol (MCP)**
- Prerequisites: T1.3.1
- Objectives: Explain MCP roles (host, client, server), transports and what it standardizes; Design an MCP facade over enterprise APIs with least privilege and per-user authorization
- Competencies: C05, C07
- Resources (source: what to focus on): Model Context Protocol specification and docs: Architecture, authorization and security guidance
- Patterns: PAT09 MCP tool facade over enterprise APIs, PAT19 Identity propagation to tools (on-behalf-of)
- Related case candidates (unverified until Part 3): Mindset MCP servers on BTP (partner source, SRC-014)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)

**T1.3.6 Agent-to-agent interoperability (A2A) and the protocol landscape**
- Prerequisites: T1.3.5, T1.3.4
- Objectives: Explain how A2A differs from MCP and where each sits in an architecture; Evaluate maturity, governance and lock-in risk of agent protocols
- Competencies: C05, C12
- Resources (source: what to focus on): Agent2Agent protocol specification (Linux Foundation project): Task lifecycle, agent cards, auth schemes; SAP Architecture Center reference architectures: SAP A2A and MCP interoperability reference (SRC-001)
- Patterns: PAT10 A2A delegation between agents
- Related case candidates (unverified until Part 3): SAP Agent Gateway reference (SRC-001/002)
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.3.7 Memory, state and long-running agent execution**
- Prerequisites: T1.3.3
- Objectives: Differentiate conversation state, long-term memory and business system of record; Design for resumability, idempotency and timeouts
- Competencies: C04, C10
- Resources (source: what to focus on): LangGraph and LangChain documentation: Persistence and checkpointing; Anthropic engineering blog: Building effective agents: Long-running agent considerations
- Patterns: PAT05 Graph/workflow-orchestrated agent, PAT20 Fallback and graceful degradation
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M1.4 Solution architecture and technology selection

**T1.4.1 Enterprise AI reference architecture**
- Prerequisites: T1.2.1, T1.3.2
- Objectives: Draw a layered reference architecture (channels, orchestration, models, knowledge, tools, security, observability); Place each component on a responsibility and trust boundary map
- Competencies: C12, C16
- Resources (source: what to focus on): C4 model and Architecture Decision Records: C4 diagrams and ADR format; SAP Architecture Center reference architectures: Compare a vendor reference architecture to the vendor-neutral model
- Patterns: PAT08 LLM gateway and model routing, PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.4.2 Model selection, routing and gateways**
- Prerequisites: T1.4.1, T1.1.3
- Objectives: Create a model selection scorecard (quality, latency, cost, data residency, tool-use reliability); Explain gateway, routing, fallback and caching patterns
- Competencies: C12, C10
- Resources (source: what to focus on): Official vendor documentation for the specific product: Provider model docs and pricing pages, re-verified at use time
- Patterns: PAT08 LLM gateway and model routing, PAT13 Semantic and prompt caching, PAT20 Fallback and graceful degradation
- Related case candidates (unverified until Part 3): DoorDash multi-provider GenAI gateway (candidate, verify)
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.4.3 Cloud and vendor ecosystems compared**
- Prerequisites: T1.4.2
- Objectives: Compare AWS, Azure, Google Cloud, OpenAI, Anthropic and open-source options on capability, governance, residency, pricing model and lock-in; Produce a defensible vendor recommendation with stated assumptions
- Competencies: C12
- Resources (source: what to focus on): AWS Bedrock and AI documentation: Bedrock; Microsoft Azure AI Foundry documentation: AI Foundry; Google Cloud Vertex AI documentation: Vertex AI; OpenAI platform documentation: Enterprise offerings; Anthropic developer documentation: Enterprise offerings
- Patterns: PAT08 LLM gateway and model routing
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.4.4 Portability, lock-in and exit strategy**
- Prerequisites: T1.4.3
- Objectives: Identify lock-in points (prompts, tool schemas, vector indexes, orchestration state, eval sets); Design an abstraction layer proportionate to risk
- Competencies: C12, C17
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Multi-provider gateway case (candidate)
- Patterns: PAT08 LLM gateway and model routing
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: none

**T1.4.5 Beyond LLM chat: predictive ML, vision, multimodal, automation and coding agents**
- Prerequisites: T1.1.1
- Objectives: Match problem type to approach (forecasting, anomaly detection, document AI, vision inspection, RPA plus LLM, coding agents); Explain where tabular foundation models and classical ML still win
- Competencies: C12, C15
- Resources (source: what to focus on): Company engineering blogs (builder-authored): One case each: vision, predictive, coding agent (to be selected)
- Patterns: PAT14 Event-driven intelligent automation, PAT16 Data-product-enriched ML
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M1.5 Production readiness and non-functional architecture

**T1.5.1 Threat modeling for AI systems**
- Prerequisites: T1.4.1
- Objectives: Build a threat model with trust boundaries, assets, actors and abuse cases for an agentic system; Map threats to controls placed outside the model
- Competencies: C06
- Resources (source: what to focus on): OWASP GenAI Security Project (LLM Top 10): LLM Top 10 and agentic threat guidance (verify current edition); NIST AI Risk Management Framework: AI RMF as governance frame
- Patterns: PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.2 Prompt injection, indirect injection and excessive agency**
- Prerequisites: T1.5.1, T1.3.1
- Objectives: Explain direct versus indirect injection through documents, tickets, emails and tool output; Design containment: least privilege tools, approval for writes, output validation, isolation of untrusted content
- Competencies: C06, C17
- Resources (source: what to focus on): OWASP GenAI Security Project (LLM Top 10): LLM01 and excessive agency entries; YouTube lecture or conference talk (to be curated and URL-verified): Practitioner talk on injection attacks (to be curated)
- Patterns: PAT07 Human-in-the-loop approval gate, PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)

**T1.5.3 Identity, authentication and authorization for agents**
- Prerequisites: T1.3.5, T1.5.1
- Objectives: Differentiate service identity from on-behalf-of user identity and justify when each is acceptable; Design authorization so an agent can never exceed the invoking user's rights
- Competencies: C07, C06
- Resources (source: what to focus on): Model Context Protocol specification and docs: Authorization guidance; SAP Architecture Center reference architectures: Identity patterns for agents on SAP BTP
- Patterns: PAT19 Identity propagation to tools (on-behalf-of)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.4 Privacy, data protection and data governance for AI**
- Prerequisites: T1.5.1
- Objectives: Classify data flows to models, logs, caches and vector stores and identify retention and residency risks; Select controls: redaction, tenancy isolation, no-training terms, regional endpoints
- Competencies: C07, C08
- Resources (source: what to focus on): NIST AI Risk Management Framework: Privacy and data sections; EU AI Act official texts and Commission guidance: Data governance obligations (verify applicability)
- Patterns: PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.5 Guardrails, responsible AI, governance and human oversight**
- Prerequisites: T1.5.1
- Objectives: Design guardrail layers (input, retrieval, output, action) and decide where humans approve; Define governance artifacts: model cards, use-case registry, risk tiering, accountability
- Competencies: C08, C06
- Resources (source: what to focus on): NIST AI Risk Management Framework: AI RMF functions; Company engineering blogs (builder-authored): Guardrail write-up (candidate)
- Patterns: PAT07 Human-in-the-loop approval gate, PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.6 Evaluation frameworks and testing strategy**
- Prerequisites: T1.2.5, T1.3.2
- Objectives: Design an evaluation strategy: golden sets, regression suites, online metrics, human review, red-team tests; Gate releases on evaluation results
- Competencies: C09
- Resources (source: what to focus on): OpenAI platform documentation: Evals guidance; Company engineering blogs (builder-authored): Evaluation-driven development write-ups
- Patterns: PAT12 Evaluation-driven development
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.7 Observability, tracing and audit**
- Prerequisites: T1.3.3
- Objectives: Specify traces, metrics and audit records required to reconstruct an agent decision; Balance observability with privacy of logged prompts and outputs
- Competencies: C11, C08
- Resources (source: what to focus on): Official vendor documentation for the specific product: Open telemetry for GenAI and an LLM observability tool doc
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.8 Reliability, failure scenarios and disaster recovery**
- Prerequisites: T1.4.2
- Objectives: Enumerate AI-specific failure scenarios (provider outage, rate limits, tool failure, retrieval drift) and recovery strategies; Define RTO/RPO implications for stateful agents and indexes
- Competencies: C10, C17
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Error handling in LLM systems write-up (candidate)
- Patterns: PAT20 Fallback and graceful degradation
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: none

**T1.5.9 Latency, throughput and cost optimization**
- Prerequisites: T1.1.2, T1.4.2
- Objectives: Build a cost and latency model for a workload and identify the top levers; Apply caching, routing, batching, prompt compression and smaller models appropriately
- Competencies: C10
- Resources (source: what to focus on): Anthropic developer documentation: Prompt caching; Official vendor documentation for the specific product: Batch and priority tiers across providers
- Patterns: PAT13 Semantic and prompt caching, PAT08 LLM gateway and model routing
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.5.10 Deployment, CI/CD, versioning, change management and operating model**
- Prerequisites: T1.5.6, T1.5.7
- Objectives: Define release, rollback and versioning for prompts, tools, models and indexes; Specify operational ownership, support tiers and incident response
- Competencies: C11, C16
- Resources (source: what to focus on): Company engineering blogs (builder-authored): LLMOps platform write-up (candidate)
- Patterns: PAT12 Evaluation-driven development
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M1.6 The architect's craft

**T1.6.1 Client discovery and question frameworks for AI engagements**
- Prerequisites: none
- Objectives: Run structured discovery covering business outcome, process, data, risk, users, constraints and success metrics; Distinguish stated requests from underlying needs
- Competencies: C01
- Resources (source: what to focus on): YouTube lecture or conference talk (to be curated and URL-verified): Discovery technique talk (to be curated); C4 model and Architecture Decision Records: Context diagrams as discovery output
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.6.2 From requirements to functional spec, technical spec and handover pack**
- Prerequisites: T1.6.1
- Objectives: Write testable requirements including AI-specific NFRs (accuracy thresholds, refusal behavior, latency, cost ceilings); Structure an architecture document and implementation handover pack
- Competencies: C01, C16
- Resources (source: what to focus on): C4 model and Architecture Decision Records: Document structure and diagramming
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.6.3 Architecture options analysis and decision records**
- Prerequisites: T1.4.1, T1.6.2
- Objectives: Compare 4-5 viable architectures against weighted criteria and record the decision in an ADR; Defend a recommendation including accepted trade-offs
- Competencies: C12, C16
- Resources (source: what to focus on): C4 model and Architecture Decision Records: ADR practice
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.6.4 Architecture review exercises**
- Prerequisites: T1.5.1, T1.6.3
- Objectives: Find security, reliability, cost, governance and operability gaps in a plausible design; Prioritize findings by risk and propose changes
- Competencies: C17
- Resources (source: what to focus on): OWASP GenAI Security Project (LLM Top 10): Use as checklist
- Patterns: PAT11 Guardrail and policy layer, PAT20 Fallback and graceful degradation
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: none

**T1.6.5 Communicating architecture to clients and executives**
- Prerequisites: T1.6.3
- Objectives: Explain an AI architecture to technical and non-technical audiences using appropriate abstraction; Frame risk, value and cost honestly
- Competencies: C16
- Resources (source: what to focus on): YouTube lecture or conference talk (to be curated and URL-verified): Executive communication talk (to be curated)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T1.6.6 Tracking emerging AI architecture developments**
- Prerequisites: T1.4.1
- Objectives: Maintain a lightweight radar of tools, protocols and models with evidence-based adoption criteria; Separate hype from production evidence
- Competencies: C12
- Resources (source: what to focus on): ZenML LLMOps Database (discovery index only, not primary evidence): Discovery index for new production cases; SAP Roadmap Explorer (status of GA vs planned): Example of status-tracking discipline
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


### Pillar 2: SAP ecosystem and AI architecture


#### M2.1 SAP AI platform map

**T2.1.1 SAP Business AI platform overview and availability-status model**
- Prerequisites: T1.4.1
- Objectives: Explain how SAP positions Business AI Platform, BTP, Business Data Cloud and Joule; Classify any SAP AI capability as GA, phased, early access, preview or roadmap and cite where status was checked
- Competencies: C13
- Resources (source: what to focus on): SAP Architecture Center reference architectures: Reference architectures overview; SAP Roadmap Explorer (status of GA vs planned): Status verification; SAP News Center: Release announcements with caution about roadmap language
- Related case candidates (unverified until Part 3): SAP BDC + AI Core reference (SRC-004)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Mixed; many items phased. Re-verify at study time.

**T2.1.2 BTP essentials for AI: subaccounts, destinations, Cloud Connector, identity**
- Prerequisites: T2.1.1
- Objectives: Describe how BTP connects side-by-side apps to S/4HANA and CX systems securely; Explain principal propagation and its role in agent tool calls
- Competencies: C13, C07
- Resources (source: what to focus on): SAP Help Portal: Connectivity and security documentation; SAP Architecture Center reference architectures: BTP integration references
- Patterns: PAT15 Side-by-side extension (clean core), PAT19 Identity propagation to tools (on-behalf-of)
- Related case candidates (unverified until Part 3): Mindset BTP MCP path (SRC-014)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: GA foundation; compress for experienced learners.

**T2.1.3 SAP AI Foundation: AI Core, AI Launchpad and Generative AI Hub**
- Prerequisites: T2.1.2, T1.4.2
- Objectives: Explain what Generative AI Hub provides (governed multi-model access) versus calling a provider directly; Choose between AI Core serving, Generative AI Hub orchestration and external model endpoints
- Competencies: C13, C12
- Resources (source: what to focus on): SAP Architecture Center reference architectures: BDC and AI Core patterns (SRC-004); SAP Help Portal: Generative AI Hub documentation
- Patterns: PAT08 LLM gateway and model routing, PAT16 Data-product-enriched ML
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)
- Status note: Verify model catalog and regions at study time.

**T2.1.4 Business Data Cloud, Datasphere and the Knowledge Graph**
- Prerequisites: T2.1.1, T1.2.1
- Objectives: Explain data products and how they ground SAP-aware AI; Compare SAP Knowledge Graph grounding with generic RAG over documents
- Competencies: C13, C03
- Resources (source: what to focus on): SAP Architecture Center reference architectures: BDC reference architecture; SAP Help Portal: Knowledge Graph and Datasphere docs
- Patterns: PAT16 Data-product-enriched ML, PAT01 Baseline RAG
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Knowledge Graph capabilities described as expanding; verify.

**T2.1.5 SAP tabular and predictive AI (SAP-RPT) and embedded ML**
- Prerequisites: T2.1.3, T1.4.5
- Objectives: Explain what a relational/tabular foundation model offers versus classical ML pipelines; State current availability and limits
- Competencies: C13, C12
- Resources (source: what to focus on): SAP News Center: Model announcements; SAP Help Portal: Model documentation
- Patterns: PAT16 Data-product-enriched ML
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Version and GA dates conflict across sources; verify.


#### M2.2 Joule, Joule Studio and agent governance

**T2.2.1 Joule Work, Assistants and Agents: the layering**
- Prerequisites: T2.1.1
- Objectives: Explain the roles of Joule Work, role-based Assistants and task Agents; Describe how a user request is routed to agents and which system acts
- Competencies: C13, C14
- Resources (source: what to focus on): SAP News Center: Sapphire and TechEd announcements, status-checked; SAP Help Portal: Joule documentation
- Patterns: PAT17 Embedded copilot in business app, PAT05 Graph/workflow-orchestrated agent
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)
- Status note: Rollout phased per landscape; verify before client use.

**T2.2.2 Joule Studio: skill builder and agent builder**
- Prerequisites: T2.2.1, T1.3.1
- Objectives: Explain what can and cannot be configured (instructions, models, tools, MCP, grounding, guardrails); Design an agent in Joule Studio and list its tools, authorizations and approval points
- Competencies: C13, C04
- Resources (source: what to focus on): SAP Help Portal: Joule Studio guide; SAP Learning: Joule Studio learning journey; SAP Architecture Center reference architectures: Joule agent references
- Patterns: PAT04 Tool-calling agent, PAT07 Human-in-the-loop approval gate
- Related case candidates (unverified until Part 3): DataXstream churn agent (SRC-013, candidate)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)
- Status note: GA dates and pricing conflict across sources (see register SRC-005/006/009).

**T2.2.3 SAP AI Agent Hub and agent governance**
- Prerequisites: T2.2.2, T1.5.5
- Objectives: Explain inventory, observability and policy functions of an agent governance hub across SAP and non-SAP agents; Compare with generic enterprise AI governance tooling
- Competencies: C13, C08
- Resources (source: what to focus on): SAP News Center: Announcements; SAP Help Portal: Product documentation when available
- Patterns: PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Planned GA Q3 2026 per secondary source; verify current.

**T2.2.4 Bring-your-own-agent: A2A Agent Gateway and MCP Gateway**
- Prerequisites: T1.3.6, T2.2.2
- Objectives: Draw inbound and outbound A2A and MCP flows between Joule agents and external agents; Describe authentication (IAS App2App with user context) and customer control over which agents may be invoked
- Competencies: C05, C13
- Resources (source: what to focus on): SAP Architecture Center reference architectures: A2A and MCP interoperability, Agent Gateway pages (SRC-001..003)
- Patterns: PAT09 MCP tool facade over enterprise APIs, PAT10 A2A delegation between agents, PAT19 Identity propagation to tools (on-behalf-of)
- Related case candidates (unverified until Part 3): SAP Agent Gateway reference
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Inbound A2A GA announced for October 2026 by SAP; confirm scope.

**T2.2.5 Low-code versus pro-code agents on SAP: decision framework**
- Prerequisites: T2.2.2, T2.2.4, T1.3.3
- Objectives: Compare Joule Studio, custom agents on BTP and external frameworks on control, governance, skills, cost and portability; Recommend and defend an approach for a given client profile
- Competencies: C12, C13
- Resources (source: what to focus on): SAP Architecture Center reference architectures: Reference patterns; Company engineering blogs (builder-authored): Partner implementation write-ups
- Patterns: PAT05 Graph/workflow-orchestrated agent, PAT09 MCP tool facade over enterprise APIs, PAT15 Side-by-side extension (clean core)
- Related case candidates (unverified until Part 3): Mindset (SRC-014); DataXstream (SRC-013)
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M2.3 SAP CX architecture with AI

**T2.3.1 SAP CX portfolio map**
- Prerequisites: T2.1.1
- Objectives: Map Commerce Cloud, Sales Cloud V2, Service Cloud V2, Engagement Cloud (Emarsys), Customer Data Cloud and ESM and how they connect to ERP; Distinguish current products from legacy (for example C4C) and migration implications
- Competencies: C14
- Resources (source: what to focus on): SAP Help Portal: What's new pages per product; SAP News Center: CX release posts (SRC-007, SRC-008)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Product naming changes frequently; verify.

**T2.3.2 Commerce Cloud and agentic commerce**
- Prerequisites: T2.3.1, T1.3.5
- Objectives: Explain the storefront MCP server concept, what catalog/pricing/inventory/promotion data it exposes and who deploys and secures it; Evaluate Spartacus/composable storefront and OCC APIs as foundations for agent access
- Competencies: C14, C05
- Resources (source: what to focus on): SAP News Center: CX Q2 2026 post; SAP Help Portal: Commerce Cloud documentation
- Patterns: PAT18 Agentic commerce storefront, PAT09 MCP tool facade over enterprise APIs
- Related case candidates (unverified until Part 3): SAP Commerce storefront MCP (SRC-007/015, roadmap-heavy)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: browser (browser-based or hosted only; no local install)
- Status note: Capabilities partly roadmap; verify GA per region.

**T2.3.3 Service and Sales Cloud AI scenarios**
- Prerequisites: T2.3.1, T2.2.2
- Objectives: Analyze AI scenarios such as service case summarization, email-to-order and deal qualification for data, integration and risk requirements; Identify which are embedded features versus custom agent opportunities
- Competencies: C14
- Resources (source: what to focus on): SAP Help Portal: Service Cloud and Sales Cloud what's new; SAP News Center: Release posts
- Patterns: PAT17 Embedded copilot in business app, PAT14 Event-driven intelligent automation
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Partner-blog claims need SAP-source verification.

**T2.3.4 Engagement and marketing AI, including multi-agent with external platforms**
- Prerequisites: T2.3.1, T1.3.6
- Objectives: Explain the Joule and Google Gemini Enterprise multi-agent marketing design at the level documented; Analyze consent, brand-safety and data-flow requirements
- Competencies: C14, C05
- Resources (source: what to focus on): SAP News Center: Cloud Next 2026 partnership announcements; SAP Architecture Center reference architectures: A2A and MCP references
- Patterns: PAT10 A2A delegation between agents, PAT06 Supervisor multi-agent
- Related case candidates (unverified until Part 3): SAP-Google marketing agents (SRC-017 secondary, verify)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Targeted H2 2026 per secondary source.

**T2.3.5 B2B order management and S/4HANA integration with AI**
- Prerequisites: T2.3.2, T2.4.1
- Objectives: Design AI-assisted order capture and order reliability flows across CX, order management and ERP; Identify system-of-record, idempotency and approval requirements
- Competencies: C14, C15
- Resources (source: what to focus on): SAP Help Portal: Order Management Services documentation; SAP Architecture Center reference architectures: Integration references
- Patterns: PAT14 Event-driven intelligent automation, PAT07 Human-in-the-loop approval gate
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T2.3.6 CX customer data and identity**
- Prerequisites: T2.3.1, T1.5.4
- Objectives: Explain how customer identity and consent data affect AI personalization and agent actions; Design data minimization for AI over CX data
- Competencies: C14, C07
- Resources (source: what to focus on): SAP Help Portal: Customer Data Cloud and identity docs
- Patterns: PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M2.4 SAP integration, identity and extension architecture

**T2.4.1 SAP integration architecture: Integration Suite, APIs, events**
- Prerequisites: T2.1.2
- Objectives: Select between API, event, and batch integration for AI use cases; Describe how Integration Suite MCP Gateway fits
- Competencies: C05, C13
- Resources (source: what to focus on): SAP Architecture Center reference architectures: Integration reference architectures; SAP Help Portal: Integration Suite documentation
- Patterns: PAT09 MCP tool facade over enterprise APIs, PAT14 Event-driven intelligent automation
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T2.4.2 Identity propagation and authorization in SAP landscapes**
- Prerequisites: T2.1.2, T1.5.3
- Objectives: Trace a user identity from Joule or an external agent to an S/4HANA or CX authorization check; Identify where service accounts silently bypass user-level controls
- Competencies: C07, C06, C13
- Resources (source: what to focus on): SAP Architecture Center reference architectures: IAS App2App, principal propagation references; SAP Help Portal: Security guides
- Patterns: PAT19 Identity propagation to tools (on-behalf-of)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T2.4.3 Connecting external models and frameworks to SAP systems**
- Prerequisites: T2.4.1, T1.3.5
- Objectives: Compare patterns: Generative AI Hub, direct provider call from BTP, MCP servers on Cloud Foundry, gateway-mediated agents; Specify security and cost controls for each
- Competencies: C05, C13
- Resources (source: what to focus on): SAP Architecture Center reference architectures: Reference patterns; Company engineering blogs (builder-authored): Partner build (SRC-014)
- Patterns: PAT09 MCP tool facade over enterprise APIs, PAT08 LLM gateway and model routing
- Related case candidates (unverified until Part 3): Mindset (SRC-014)
- Assessment targets: 4 MCQ, 2 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T2.4.4 Extending S/4HANA and CX with AI: side-by-side versus embedded, clean core**
- Prerequisites: T2.4.1
- Objectives: Explain clean-core principles and where AI extensions belong; Decide embedded feature, side-by-side app or external service for a requirement
- Competencies: C13, C12
- Resources (source: what to focus on): SAP Architecture Center reference architectures: Clean core and extensibility guidance
- Patterns: PAT15 Side-by-side extension (clean core), PAT17 Embedded copilot in business app
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T2.4.5 SAP AI governance, compliance, licensing and cost in client discussions**
- Prerequisites: T2.2.3, T1.5.9
- Objectives: Explain which SAP AI features are included, premium or consumption-priced and how to verify with the client's contract; Assemble a total-cost view including BTP and model consumption
- Competencies: C08, C13, C12
- Resources (source: what to focus on): SAP Help Portal: Product and pricing information where public; SAP News Center: Promotions and changes (treat as time-limited)
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Pricing statements conflict across sources; always verify.


### Pillar 3: Cross-industry business and solution architecture


#### M3.1 Industry architecture lenses

**T3.1.1 B2B commerce, sales and distribution**
- Prerequisites: T1.4.1
- Objectives: Explain B2B specifics: contract pricing, configure-price-quote, account hierarchies, punchout, reorder and sales rep workflows; Identify high-value AI scenarios and their data prerequisites
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): B2B foodservice search assistant (candidate from index, verify); SAP News Center: SAP B2B order capture announcements
- Patterns: PAT18 Agentic commerce storefront, PAT14 Event-driven intelligent automation
- Related case candidates (unverified until Part 3): B2B conversational search (candidate)
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.2 Retail, e-commerce and B2C**
- Prerequisites: T1.2.1
- Objectives: Analyze personalization, search, support and merchandising architectures and their scale and latency profiles; Compare search integration approaches seen in production
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Search architecture comparison (candidate: DoorDash/Instacart/Uber Eats analysis, verify)
- Patterns: PAT02 Hybrid retrieval with reranking, PAT13 Semantic and prompt caching
- Related case candidates (unverified until Part 3): Instacart/DoorDash/Uber Eats search (candidate)
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.3 Manufacturing and automotive**
- Prerequisites: T1.3.2
- Objectives: Explain shop-floor, quality and service-knowledge AI scenarios and OT/IT boundaries; Identify safety and latency constraints that shape architecture
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Manufacturing assistant cases (candidate: Gerdau, verify)
- Patterns: PAT01 Baseline RAG, PAT14 Event-driven intelligent automation
- Related case candidates (unverified until Part 3): Gerdau upskilling assistant (candidate)
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.4 Supply chain and logistics**
- Prerequisites: T1.3.2
- Objectives: Analyze planning, exception management and tender/contract analysis scenarios; Design agent boundaries around ERP and TMS systems of record
- Competencies: C15, C12
- Resources (source: what to focus on): SAP News Center: SAP supply-chain agents (status-checked); Company engineering blogs (builder-authored): Logistics case (to be selected)
- Patterns: PAT14 Event-driven intelligent automation, PAT07 Human-in-the-loop approval gate
- Related case candidates (unverified until Part 3): Austrian Post order automation (candidate)
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.5 Banking and financial services**
- Prerequisites: T1.5.4
- Objectives: Explain model risk, explainability, audit and data residency demands; Design human oversight for advice-adjacent and decision-adjacent AI
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Bank LLM platform cases (candidate: Barclays, verify); NIST AI Risk Management Framework: Risk management framing
- Patterns: PAT11 Guardrail and policy layer, PAT07 Human-in-the-loop approval gate
- Related case candidates (unverified until Part 3): Barclays MLOps and LLM integration (candidate)
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.6 Healthcare and life sciences**
- Prerequisites: T1.5.4
- Objectives: Explain PHI handling, clinical safety and validation constraints; Design retrieval and summarization with traceability to sources
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Healthcare RAG case (to be selected, HIPAA context)
- Patterns: PAT01 Baseline RAG, PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.7 Telecom and media**
- Prerequisites: T1.4.5
- Objectives: Analyze large-scale support, network operations and content workflows; Identify cost and latency drivers at high volume
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Telecom or media case (to be selected)
- Patterns: PAT13 Semantic and prompt caching, PAT20 Fallback and graceful degradation
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.8 Energy and utilities**
- Prerequisites: T1.4.5
- Objectives: Analyze asset, grid and customer-service scenarios with safety-critical context; Explain consumption-summary and field-service AI patterns
- Competencies: C15, C12
- Resources (source: what to focus on): SAP News Center: Utilities consumption summary feature in Service Cloud (SRC-008); Company engineering blogs (builder-authored): Energy case (to be selected)
- Patterns: PAT17 Embedded copilot in business app
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.9 Travel and hospitality**
- Prerequisites: T1.2.1
- Objectives: Analyze conversational booking, disruption handling and loyalty personalization; Identify real-time inventory and pricing integration constraints
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Travel case (to be selected)
- Patterns: PAT04 Tool-calling agent, PAT18 Agentic commerce storefront
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.1.10 Professional services and public sector**
- Prerequisites: T1.2.1
- Objectives: Analyze knowledge work, contract review and document intelligence; Identify confidentiality, tenancy and audit requirements
- Competencies: C15, C12
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Legal or advisory AI case (candidate: Harvey infrastructure write-up, verify)
- Patterns: PAT01 Baseline RAG, PAT11 Guardrail and policy layer
- Related case candidates (unverified until Part 3): Harvey legal AI infrastructure (candidate)
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M3.2 Regulation and data constraints

**T3.2.1 Regulatory lens: AI regulation, privacy and sector rules**
- Prerequisites: T1.5.4
- Objectives: Explain how risk-based AI regulation and privacy law change architecture (logging, human oversight, transparency, data location); State clearly when legal advice is needed
- Competencies: C08, C15
- Resources (source: what to focus on): EU AI Act official texts and Commission guidance: Official texts and guidance (verify status and dates); NIST AI Risk Management Framework: Framework mapping
- Assessment targets: 4 MCQ, 1 scenario, 0 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none
- Status note: Regulatory timelines change; verify at study time.

**T3.2.2 Data residency, sovereignty and deployment model choices**
- Prerequisites: T3.2.1, T1.4.3
- Objectives: Compare regional endpoints, private deployment and sovereign options; Decide when self-hosted open models are justified
- Competencies: C07, C12
- Resources (source: what to focus on): AWS Bedrock and AI documentation: Regional controls; Microsoft Azure AI Foundry documentation: Regional controls; Google Cloud Vertex AI documentation: Regional controls
- Patterns: PAT08 LLM gateway and model routing
- Assessment targets: 4 MCQ, 1 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none


#### M3.3 Cross-industry synthesis

**T3.3.1 Cross-industry pattern synthesis**
- Prerequisites: T3.1.1, T3.1.3, T3.1.5, T1.6.3
- Objectives: Identify recurring patterns across industries and where industry constraints force deviation; Adapt a documented architecture to a different industry and justify changes
- Competencies: C12, C15
- Resources (source: what to focus on): Company engineering blogs (builder-authored): Cases from the catalog, Tier A only
- Patterns: PAT01 Baseline RAG, PAT05 Graph/workflow-orchestrated agent, PAT07 Human-in-the-loop approval gate, PAT11 Guardrail and policy layer
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 0 review exercise, 6 revision cards
- Hands-on: none

**T3.3.2 Capstone architecture simulations (clearly labelled simulations)**
- Prerequisites: T3.3.1, T2.2.5, T1.6.4
- Objectives: Lead a simulated discovery, produce options analysis and ADR for an SAP CX scenario, then defend it against an architecture review; Produce an architecture document and handover pack
- Competencies: C01, C12, C14, C16, C17
- Resources (source: what to focus on): C4 model and Architecture Decision Records: Templates
- Patterns: PAT05 Graph/workflow-orchestrated agent, PAT09 MCP tool facade over enterprise APIs, PAT07 Human-in-the-loop approval gate
- Related case candidates (unverified until Part 3): SIMULATION: B2B order capture with SAP Commerce and S/4HANA; SIMULATION: service agent with Joule Studio
- Assessment targets: 4 MCQ, 2 scenario, 1 decision comparison, 1 review exercise, 6 revision cards
- Hands-on: none

## 8. Topic-to-case routing rule (summary)
A case lists prerequisite topic IDs. If any prerequisite is in gap or unknown, the pathway inserts the topic at deep or standard depth, then returns to the case with a resume pointer and a short "where each concept appears in this case" overlay. Part 3 supplies the case side of this mapping.

## 9. What is not yet done
- Written lesson text, individual verified resource URLs and videos, authored questions: content phase after the specification is approved.
- Case verification: Part 3.
- Gate thresholds and recommender weights are defaults to be tuned in Part 4/5 configuration.
