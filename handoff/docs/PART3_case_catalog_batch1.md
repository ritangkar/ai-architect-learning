# Deliverable C (Part 3): Case Study Catalog, Batch 1

Prepared 2026-11-12. Machine-readable: `case_catalog_batch1.json`.

## Honest status

- **14 catalog entries** in this batch (Tier A: 7, A-provisional: 2, B: 1, C: 4). The 100-200 target is **not reached**, and I will not pad it. 13 further candidates are listed as backlog and 7 coverage gaps are named.
- Tier A entries were read from builder-authored primary pages this session. Wording is paraphrased; every fact lists its source ID.
- Industries in this batch skew to technology and e-commerce because those firms publish engineering detail. Banking, healthcare, telecom, energy, travel and manufacturing are gaps, not omissions by choice.
- No reconstructed (R) architecture was used. Alternatives in decision tables are labelled as independent analysis where the source does not state them.
- Several ZenML pages were found; they are used only as discovery pointers, never as evidence.

## Evidence tags
V verified, I interpretation, R reconstructed, U unknown.

## Catalog table

| ID | Company | Industry | Category | Tier | Patterns | Source IDs |
|---|---|---|---|---|---|---|
| CS-001 | Uber | Mobility and technology (internal finance function) | AI agents; Multi-agent architectures; AI-driven analytics and decision intelligence | A | PAT06, PAT08, PAT12, PAT07 | SRC-023 |
| CS-002 | Uber | Mobility and technology (internal engineering support) | RAG and enterprise knowledge assistants; Conversational AI | A | PAT03, PAT02, PAT12, PAT01 | SRC-024 |
| CS-003 | Dropbox | Software and collaboration | RAG and enterprise knowledge assistants; AI agents | A | PAT02, PAT04, PAT12, PAT01 | SRC-025 |
| CS-004 | Dropbox | Software and collaboration | AI agents; RAG and enterprise knowledge assistants | A | PAT09, PAT02, PAT12 | SRC-026 |
| CS-005 | Instacart | Grocery e-commerce | Conversational AI; AI-driven analytics and decision intelligence; Predictive AI and machine learning | A | PAT01, PAT11, PAT13, PAT12 | SRC-027 |
| CS-006 | Slack (Salesforce) | Enterprise collaboration software | RAG and enterprise knowledge assistants; AI chatbots and enterprise assistants | A | PAT01, PAT19, PAT11 | SRC-028 |
| CS-007 | Zalando | Fashion e-commerce (internal engineering) | Software engineering and coding agents; AI agents | A | PAT08, PAT09, PAT11, PAT19 | SRC-029 |
| CS-008 | Klarna | Banking and financial services (payments) | Conversational AI; AI agents | C | PAT05, PAT12 | SRC-030 |
| CS-009 | Mindset Consulting (SAP partner) | SAP partner engineering (multi-industry) | AI agents; Intelligent automation | B | PAT09, PAT15, PAT19 | SRC-014 |
| CS-010 | DataXstream (SAP partner) | Distribution and sales (B2B) | AI agents; Predictive AI and machine learning; Intelligent automation | C | PAT14, PAT07, PAT16, PAT04 | SRC-013 |
| CS-011 | SAP | Enterprise software (SAP reference architecture) | AI agents; Multi-agent architectures; Other emerging enterprise AI | A-provisional | PAT09, PAT10, PAT19 | SRC-001, SRC-002, SRC-003 |
| CS-012 | SAP | Enterprise software (SAP reference architecture) | Predictive AI and machine learning; AI-driven analytics and decision intelligence | A-provisional | PAT16, PAT15 | SRC-004 |
| CS-013 | SAP | Retail and B2B commerce | Conversational AI; AI agents | C | PAT18, PAT09 | SRC-007, SRC-015, SRC-016 |
| CS-014 | SAP and Google Cloud | Marketing and customer experience | Multi-agent architectures; AI agents | C | PAT10, PAT06 | SRC-017 |

## Priority for full walkthrough content
1. CS-006 Slack AI (security and hosting decisions)
2. CS-004 Dropbox Dash MCP lessons (relevant to SAP MCP design)
3. CS-001 Uber Finch (agent analytics)
4. CS-005 Instacart (latency and distillation)
5. CS-002 Uber Genie (ingestion and evaluation)
6. CS-003 Dropbox Dash RAG and agents
7. CS-007 Zalando (governance of coding agents)
8. CS-009 Mindset MCP on BTP (SAP-specific, with identity review exercise)
9. CS-011 and CS-012 SAP reference architectures after full-page reading

## New sources added

- **SRC-023** [Uber Engineering: Unlocking Financial Insights with Finch](https://www.uber.com/blog/unlocking-financial-insights-with-finch), primary (builder-authored), page read 2026-11-12; publication date not captured
- **SRC-024** [Uber Engineering: Enhanced Agentic-RAG (Genie)](https://www.uber.com/blog/enhanced-agentic-rag/), primary (builder-authored), page read 2026-11-12; publication date not captured
- **SRC-025** [Dropbox Tech: Building Dash, RAG and AI agents for businesses](https://dropbox.tech/machine-learning/building-dash-rag-multi-step-ai-agents-business-users), primary (builder-authored), page read 2026-11-12; post dated Apr 24 2025 per page
- **SRC-026** [Dropbox Tech: Knowledge graphs, MCP and DSPy in Dash (VP interview)](https://dropbox.tech/machine-learning/vp-josh-clemm-knowledge-graphs-mcp-and-dspy-dash), primary (builder-authored), page read 2026-11-12; date not captured
- **SRC-027** [Instacart: Building the Intent Engine](https://company.instacart.com/tech-innovation/building-the-intent-engine-how-instacart-is-revamping-query-understanding-with-llms), primary (builder-authored), page read 2026-11-12; date not captured
- **SRC-028** [Slack Engineering: How we built Slack AI to be secure and private](https://slack.engineering/how-we-built-slack-ai-to-be-secure-and-private/), primary (builder-authored), page read 2026-11-12; date not captured
- **SRC-029** [Zalando Engineering: Agentic Engineering at Zalando, a snapshot](https://engineering.zalando.com/posts/2026/08/agentic-engineering-at-zalando-a-snapshot.html), primary (builder-authored), page read 2026-11-12; URL indicates Aug 2026
- **SRC-030** [LangChain: How Klarna's AI assistant redefined customer support](https://www.langchain.com/blog/customers-klarna), vendor-authored case study, page read 2026-11-12; page dated Feb 12 2025

(Sources SRC-001 to SRC-022 are in the Part 1 register.)

## Entries

### CS-001 Finch: conversational finance data agent in Slack

**Uber** | Mobility and technology (internal finance function) | Tier A | Depth: Detailed architecture with evaluation approach; no quantitative results published

**Problem:** Finance analysts lose time locating datasets and writing complex SQL; requests to data science take hours or days.

**Technologies named in sources:** Slack SDK and Slack AI Assistant APIs, LangGraph, Uber Generative AI Gateway (self-hosted and third-party LLMs), OpenSearch metadata index, Presto, IBM Planning Analytics, Oracle EPM, Google Sheets export

**Patterns:** PAT06, PAT08, PAT12, PAT07 | **Prerequisite topics:** T1.3.2, T1.3.3, T1.3.4, T1.4.2, T1.5.6

**Verified (V):**
- The agent runs inside Slack using the Slack SDK and AI Assistant APIs, with live status updates. [SRC-023]
- LangGraph coordinates a supervisor that routes requests to specialised sub-agents such as a SQL writer and a document reader. [SRC-023]
- Models are reached through an internal generative AI gateway so they can be swapped; both self-hosted and third-party LLMs are used. [SRC-023]
- Data is exposed as curated single-table data marts; an OpenSearch index holds column names, values and aliases for fuzzy matching of filter values. [SRC-023]
- The SQL writer checks the user's permissions before running a query; RBAC limits access to sensitive financial data. [SRC-023]
- Evaluation compares query results against golden queries, tests supervisor routing on ambiguous intents, runs end-to-end simulations and regression re-runs before prompt or model changes. [SRC-023]
- Sub-agents run in parallel and common metrics are pre-fetched to cut latency. [SRC-023]
- The authors acknowledge hallucination risk and plan on-demand expert validation of answers. [SRC-023]

**Interpretation (I):**
- Comparing result sets rather than SQL text tolerates equivalent queries but needs stable reference data; it can mask semantic mistakes when both queries share the same wrong filter.
- Simplifying schemas into single-table marts moves complexity from the model into data engineering, trading flexibility for reliability.

**Unknown (U):** Models used; Quantified accuracy, latency, adoption or time savings; How RBAC is implemented and how identity reaches the data sources; How golden-query comparison is scored; Cost and scale

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Data exposure to the model | Curated single-table marts with simplified schemas | Expose the raw warehouse and let the model plan joins; semantic layer or metrics store; pre-built dashboards only | Source states the aim is lower query complexity and faster retrieval. Alternative trade-offs are independent analysis. | documented rationale; alternatives are independent analysis |
| Orchestration | Supervisor routing to specialised sub-agents in LangGraph | Single agent with all tools; fixed workflow with intent classifier; fully autonomous planner | Source documents the supervisor design and tests routing accuracy. Why not the alternatives is not stated. | documented design; alternatives are independent analysis |
| Model access | Internal gateway so models can be swapped | Direct provider SDKs per agent | Source states swappability. Broader lock-in reasoning is independent analysis. | documented design; reasoning partly independent |
| Filter value resolution | Search index with aliases for fuzzy matching | Model guesses literal values; exact match only; user picks from list | Source describes the index purpose. Failure modes of alternatives are independent analysis. | documented design; alternatives independent |
| Quality assurance | Golden-result comparison plus routing, end-to-end and regression tests | Manual spot checks; LLM-as-judge only; production feedback only | Source describes the suite; no explanation of rejected approaches. | documented design; alternatives independent |

**Architecture review exercise:** Finch states permission checks occur before query execution but not how identity propagates. List three ways a delegated agent could exceed a user's data rights and the control that closes each.

**Lessons for an architect:** Constrain the data the model sees before tuning the model. Evaluate agents per component and end to end, and regression-test before every prompt or model change. Plan human validation for decisions that matter, because the authors themselves cite hallucination risk.

**Adapting to another client:** For SAP CX analytics (sales or service KPIs), the same pattern maps to BDC data products as the curated layer and Joule Studio or a BTP agent as the supervisor; identity propagation then becomes the main design question (see T2.4.2). This mapping is independent analysis.

### CS-002 Genie: enhanced agentic RAG over policy documents

**Uber** | Mobility and technology (internal engineering support) | Tier A | Depth: Detailed pipeline and evaluation method; relative improvements only

**Problem:** An on-call Slack copilot answered security and privacy questions inaccurately over 40+ policy documents; a golden set of 100+ expert questions showed answers were incomplete or wrong.

**Technologies named in sources:** LangGraph, Langfx (internal LangChain-based service in Michelangelo), BM25, vector search, Google Docs API loader, MarkdownTextSplitter, LLM-as-judge

**Patterns:** PAT03, PAT02, PAT12, PAT01 | **Prerequisite topics:** T1.2.1, T1.2.2, T1.2.3, T1.2.5, T1.1.5

**Verified (V):**
- A custom Google Docs loader replaced PDF parsing because standard PDF loaders lost table structure and no single parser worked across documents. [SRC-024]
- An LLM converts tables and structured text to markdown; table chunks are kept intact via metadata; documents get LLM summaries and chunks get FAQs and keywords. [SRC-024]
- Pre-retrieval agents rewrite ambiguous queries, split complex ones into sub-queries and identify the most likely source documents. [SRC-024]
- Retrieval runs vector search and BM25 over enriched metadata and merges results as a union; a post-processor deduplicates and orders chunks by position in the source. [SRC-024]
- Evaluation uses expert reference answers run in batch with an LLM judge scoring 0-5, cutting evaluation turnaround from weeks to minutes. [SRC-024]
- Reported results are relative: 27% more acceptable answers and 60% fewer incorrect answers. [SRC-024]

**Interpretation (I):**
- Changing the source format (Google Docs instead of PDF) was a bigger lever than changing the model, which is a common ingestion lesson.
- Relative gains without baselines cannot be converted to absolute quality; ask for the baseline before quoting these numbers to a client.

**Unknown (U):** Generation, enrichment and judge LLMs; Vector store; Latency, cost and production scale; Judge agreement with human experts; Access control enforcement in retrieval

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Document ingestion | Custom Google Docs loader with table-aware markdown conversion | Keep PDF parsers (several tried); OCR or layout models; re-author sources | Source documents PDF parsers losing table row and column context and no universal parser. | documented |
| Retrieval | Hybrid vector plus BM25 union over enriched metadata | Vector only; BM25 only; reranker-based fusion | Source describes the hybrid; the choice of union over reranking is not explained. | documented design; rationale partly independent |
| Query handling | Query optimizer and source identifier agents before retrieval | Single-pass retrieval with raw query | Source describes the agents as handling ambiguity and narrowing sources. | documented |
| Evaluation | Expert references plus LLM judge with reasoning | Human review per release; synthetic questions only | Source cites speed gain. Judge validity is not reported. | documented; limits are independent analysis |

**Architecture review exercise:** The reported 60% reduction in incorrect advice has no baseline. Define the evidence you would request, and how you would test the judge's agreement with experts before trusting it.

**Lessons for an architect:** Fix ingestion before tuning generation. Enrich chunks and queries; do not rely on raw similarity alone. Judge-based evaluation speeds iteration but must be validated against humans.

**Adapting to another client:** For an SAP service knowledge assistant over product manuals and notes, the same ingestion-first approach applies; the access-control question (not answered in the source) must be designed explicitly. Independent analysis.

### CS-003 Dash: RAG plus code-planned agents for universal business search

**Dropbox** | Software and collaboration | Tier A | Depth: Detailed design rationale and trade-offs; no model names or accuracy figures

**Problem:** Business knowledge is scattered across apps, formats and modalities, slowing search and raising access-control risk.

**Technologies named in sources:** Lexical index with embedding reranking, LLM-planned code in a Python-like DSL, custom interpreter with static analysis, LLM judges, Natural Questions, MuSiQue, MS MARCO

**Patterns:** PAT02, PAT04, PAT12, PAT01 | **Prerequisite topics:** T1.2.2, T1.2.4, T1.3.2, T1.5.1, T1.5.6

**Verified (V):**
- Dropbox chose a traditional lexical index with embedding-based reranking over a pure vector index. [SRC-025]
- For complex tasks an LLM expresses a plan as code in a Python-like DSL which a purpose-built minimal interpreter validates with static analysis and dry runs. [SRC-025]
- The interpreter implements only required functionality to reduce the risks of a full-featured interpreter. [SRC-025]
- The post names trade-offs: latency versus quality, freshness versus scalability, budget versus experience, model size versus latency and accuracy. [SRC-025]
- Evaluation uses public datasets plus LLM judges for correctness and completeness and passage-level precision, recall and F1. [SRC-025]
- The post reports over 95% of queries completing in 1-2 seconds. [SRC-025]
- Prompts do not transfer cleanly between models. [SRC-025]

**Interpretation (I):**
- Planning as code makes failures locatable and testable, giving determinism that free-form tool loops lack.

**Unknown (U):** Model names, embedding model, index technology; How permissions are enforced inside retrieval and agent execution; Benchmark scores; Cost and error rates; Sync frequency

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Retrieval index | Lexical index with embedding reranking | Pure vector index; pure lexical search | Source states these as trade-offs; detailed reasoning is limited. | documented selection; alternatives named |
| Agent planning representation | LLM-written code in a restricted DSL executed by a custom interpreter | Iterative tool calling; general-purpose Python sandbox; fixed workflows | Source describes the DSL approach and its security benefit of a minimal interpreter; alternatives comparison is independent analysis. | documented design; alternatives independent |
| Freshness model | Periodic sync with webhooks where appropriate, query-time chunking | Live API calls per query; full real-time indexing | Source discusses the freshness versus scalability trade-off. | documented trade-off |

**Architecture review exercise:** The post does not say how access control is enforced during retrieval and agent execution. Propose three enforcement points and the failure each prevents.

**Lessons for an architect:** Restrict what an agent can express, not just what it may call. Make retrieval model-agnostic and measure it end to end. State trade-offs explicitly to clients.

**Adapting to another client:** Applies to cross-system SAP CX search (Commerce, Sales, Service content) where permission models differ per source. Independent analysis.

### CS-004 Dash: knowledge graphs, MCP limits and DSPy

**Dropbox** | Software and collaboration | Tier A | Depth: Candid lessons and rejected alternatives; few quantitative results

**Problem:** Scaling an AI search product exposed context bloat, latency in MCP-based agents and unmanageable prompts.

**Technologies named in sources:** MCP, DSPy, BM25 plus dense vectors, knowledge graph compressed into bundles, LLM-as-judge (an OpenAI o3 upgrade is mentioned)

**Patterns:** PAT09, PAT02, PAT12 | **Prerequisite topics:** T1.3.5, T1.2.3, T1.5.6, T1.5.9

**Verified (V):**
- Tool definitions and returned content consume context; Dropbox caps context at about 100,000 tokens because quality degrades beyond it. [SRC-026]
- Some MCP-based agents took up to 45 seconds for a simple query versus seconds with direct index access. [SRC-026]
- Mitigations include one 'super tool' over the index instead of many retrieval tools, storing large results outside the model context and sub-agents with narrower tool sets. [SRC-026]
- A graph database was tried and rejected for latency, query pattern and hybrid retrieval reasons; graphs are built asynchronously and compressed into bundles that go through the normal chunk and embed pipeline. [SRC-026]
- Index-based retrieval was chosen over federated retrieval for connector coverage, preprocessing and speed, at the cost of engineering effort, storage and freshness management. [SRC-026]
- DSPy is used to optimise prompts against evals, starting with judge prompts; about 30 prompts are edited by 5-15 engineers. [SRC-026]

**Interpretation (I):**
- Federated MCP access is attractive for speed of integration but shifts quality and latency to each external system.

**Unknown (U):** Quantified retrieval or DSPy gains; Latency after mitigation; Cost; Knowledge graph schema and bundle construction

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Retrieval topology | Central index | Federated retrieval via MCP connectors to each app | Source lists connector access, preprocessing, offline ranking and speed in favour of the index, and cost and freshness against. | documented |
| Tool exposure | Single super tool over the index | 5-10 separate retrieval tools | Source cites context cost and tool selection quality. | documented |
| Relationship store | Graph summarised into bundles in the existing retrieval pipeline | Dedicated graph database | Source states graph database was rejected for latency, query pattern and hybrid retrieval difficulty. | documented |
| Prompt management | Programmatic optimisation with DSPy | Hand-edited prompt strings | Source states preference for generating prompts from goals. | documented |

**Architecture review exercise:** You are told to expose 40 enterprise APIs as MCP tools to one agent. Using this case, list the risks and redesign the tool surface.

**Lessons for an architect:** Context is a budget. Protocols do not remove latency and quality costs. Prompt optimisation tooling pays off at scale.

**Adapting to another client:** Directly relevant to exposing SAP APIs via MCP: scope servers narrowly and measure latency before scaling the tool count. Compare with CS-009. Independent analysis.

### CS-005 Intent Engine: LLM-driven query understanding with teacher-student distillation

**Instacart** | Grocery e-commerce | Tier A | Depth: Detailed architecture, latency engineering and metrics; teacher model unnamed

**Problem:** Legacy query understanding struggled with broad queries, noisy labels, tail queries and fragmented models; rewrites covered about half of search traffic.

**Technologies named in sources:** Llama-3-8B student (hedged in source), LoRA fine-tuning, A100 then H100 GPUs, embedding-similarity guardrails, FastText (legacy)

**Patterns:** PAT01, PAT11, PAT13, PAT12 | **Prerequisite topics:** T1.2.4, T1.5.9, T1.4.2, T1.5.6, T3.1.2

**Verified (V):**
- Strategy: start from LLMs and inject company context via RAG, validate with guardrails, then fine-tune. [SRC-027]
- An offline teacher pipeline with caching handles head queries and produces training data; a smaller fine-tuned student serves tail queries in real time. [SRC-027]
- Out-of-the-box latency was close to 700 ms on A100; merging LoRA adapters and moving to H100 reached about 300 ms. [SRC-027]
- FP8 quantisation cut latency roughly 10% but reduced recall, so unquantised serving was chosen. [SRC-027]
- Caching means only about 2% of queries need real-time inference. [SRC-027]
- Reported results include rewrite coverage above 95% with precision above 90%, and a 50% drop in complaints about poor tail-query results. [SRC-027]

**Interpretation (I):**
- Splitting offline quality from online latency is the key architectural idea: spend frontier-model cost where latency does not matter, distil for where it does.

**Unknown (U):** Teacher model identity; Cache-hit definition and thresholds; Training and serving cost; A/B test design and significance

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Where to put intelligence | Offline large-model teacher plus distilled small student | Call a frontier model online for every query; classical models only | Source cites latency and cost constraints at search scale. | documented rationale |
| Hallucination control | Taxonomy-bound guardrails with similarity thresholds | Trust model output; human review of all outputs | Source describes the validation layer. | documented |
| Quantisation | Keep unquantised | FP8 quantisation | Source states a recall loss outweighed ~10% latency gain. | documented |

**Architecture review exercise:** The post cites a 30% latency gain in one place while its numbers imply a bigger change. How would you reconcile before presenting this to a client?

**Lessons for an architect:** Latency budgets drive model placement. Fine-tuning is for behaviour and consistency here, with RAG supplying knowledge. Make quality trade-offs measurable.

**Adapting to another client:** Relevant to SAP Commerce search and B2B catalogue query understanding. Independent analysis.

### CS-006 Slack AI: privacy-first generative AI architecture

**Slack (Salesforce)** | Enterprise collaboration software | Tier A | Depth: Detailed on security and hosting decisions; no quality or latency metrics

**Problem:** Deliver generative AI features while keeping customer data inside the trust boundary and honouring existing compliance commitments.

**Technologies named in sources:** Closed-source LLMs hosted in an AWS escrow VPC, RAG, existing ACL libraries

**Patterns:** PAT01, PAT19, PAT11 | **Prerequisite topics:** T1.2.4, T1.5.3, T1.5.4, T1.4.3, T3.2.2

**Verified (V):**
- Four principles: customer data stays in the trust boundary, no training on customer data, AI only shows what the user can already see, and enterprise security and compliance still apply. [SRC-028]
- Closed-source models run in an escrow VPC on AWS so the model provider has no access to customer data. [SRC-028]
- Slack chose off-the-shelf models with RAG over fine-tuning on customer data because it could not guarantee sufficient protections. [SRC-028]
- Retrieval uses the requesting user's access control lists and existing display libraries; output is visible only to the requester. [SRC-028]
- Outputs are ephemeral and not written to disk; stored data follows a least-data principle and existing key management and residency infrastructure. [SRC-028]
- If a source message is removed by DLP, derived summaries are invalidated. [SRC-028]

**Interpretation (I):**
- Reusing existing authorisation code paths for retrieval is a strong pattern: the AI layer inherits, rather than reimplements, access control.

**Unknown (U):** Model vendor and models; Retention periods; Technical detail of the escrow VPC; Latency and quality metrics; Prompt construction and evaluation (deferred by the authors)

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Model hosting | Provider models inside an escrow VPC | Hosted provider API; self-hosted open model; vendor-managed private deployment | Source documents data-ownership requirement and that vendors generally do not ship closed models for self-hosting. | documented |
| Knowledge strategy | RAG with stateless model calls | Fine-tune on customer data | Source states it could not guarantee strong enough protection if training on customer data. | documented |
| Authorisation | Requesting user's ACLs at retrieval | Service-level access with output filtering | Source states AI must show only what the user can already see. | documented principle |

**Architecture review exercise:** Derived summaries are invalidated when a source message is deleted. Identify two other places an AI system might retain derivatives of deleted data and how to detect them.

**Lessons for an architect:** Start from non-negotiable data principles and derive hosting choices from them. Inherit authorisation from the system of record. Stateless RAG simplifies privacy arguments.

**Adapting to another client:** Maps directly to SAP CX client conversations about data residency and no-training terms with Generative AI Hub. Independent analysis.

### CS-007 Agentic engineering platform: gateway, MCP and risk-based review

**Zalando** | Fashion e-commerce (internal engineering) | Tier A | Depth: Detailed platform components and governance; limited ROI evidence

**Problem:** Give 250+ engineering teams measurable access to LLMs and coding agents without forcing one tool, while controlling cost, governance and delivery risk.

**Technologies named in sources:** LiteLLM-based gateway (OpenAI, AWS Bedrock, Google Vertex), pydantic-ai CLI, internal MCP servers with OAuth ingress filter, kagent (planned platform), Claude Code, opencode (client tools)

**Patterns:** PAT08, PAT09, PAT11, PAT19 | **Prerequisite topics:** T1.4.2, T1.4.5, T1.3.5, T1.5.5, T1.5.10

**Verified (V):**
- A LiteLLM-based gateway proxies model access with pre and post call hooks and prompt-cache checkpoint injection. [SRC-029]
- A local proxy injects auth headers for coding agents and shows per-model cost and cache usage. [SRC-029]
- Internal MCP servers sit behind a default OAuth ingress filter; configuration is secret-free via token injection. [SRC-029]
- About a third of pull requests are classified low-risk and auto-approved; risk rules derive from production incidents, and risk-based approval is reported to cut lead time by 20-40% versus all PRs. [SRC-029]
- A future agent platform with an identity broker, delegation chains and token vault is described as in progress. [SRC-029]
- Sandboxing is listed as an unsolved problem. [SRC-029]

**Interpretation (I):**
- Gateway-first rollout produces the telemetry needed for governance before standardising tools.

**Unknown (U):** Threat model details; Model-to-task allocation and selection criteria; Identity broker timeline; ROI beyond lead time

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Tool strategy | Single gateway, no mandated client tool | Standardise on one coding assistant | Source states goal of measurable access without central mandate and cites difficulty consolidating tools. | documented |
| Review control | Risk-based PR approval | Human review for every PR; size limits only | Source reports lead-time reduction and risk rules from incidents. | documented |
| Agent identity | Planned identity broker with delegation and token vault | Shared service credentials | Source lists the broker as being built. | documented plan |

**Architecture review exercise:** Coding agents increase PR size and complexity. Design controls that preserve review quality without hurting lead time.

**Lessons for an architect:** Instrument first, standardise later. Governance rules should come from incident data. Agent identity is still an open problem even at mature organisations.

**Adapting to another client:** Useful template for governing AI-assisted SAP development teams. Independent analysis.

### CS-008 Klarna AI assistant (vendor-authored account)

**Klarna** | Banking and financial services (payments) | Tier C | Depth: Vendor marketing; many controls not described

**Problem:** Scale customer support across markets for a large payments platform.

**Technologies named in sources:** LangGraph, LangSmith

**Patterns:** PAT05, PAT12 | **Prerequisite topics:** T1.3.3, T1.5.6, T1.6.5

**Verified (V):**
- Built on LangGraph with LangSmith tracing; described as multi-agent routing by the vendor. [SRC-030]
- Vendor-reported: 2.5 million conversations handled, 80% faster resolution, about 70% of repetitive tasks automated. [SRC-030]

**Interpretation (I):**
- Use as a critical-reading exercise: the source omits guardrails, data handling, fallback and escalation, which are the architect's real questions.

**Unknown (U):** Models; Guardrails; Data handling; Escalation criteria; Metric methodology and independent verification

**Architecture review exercise:** List the ten discovery questions you would ask Klarna before reusing this design, grouped by security, quality, escalation and cost.

**Lessons for an architect:** Marketing case studies state outcomes, not architecture; do not copy numbers.

**Adapting to another client:** Not adaptable without further primary evidence.

### CS-009 Domain-scoped MCP servers on SAP BTP for Joule agents

**Mindset Consulting (SAP partner)** | SAP partner engineering (multi-industry) | Tier B | Depth: Architecture path and design rules stated by the implementer; no measured results

**Problem:** Give Joule agents governed, reliable access to S/4HANA business functions.

**Technologies named in sources:** SAP BTP Joule Studio, MCP servers on BTP Cloud Foundry, BTP Destination service, Cloud Connector, S/4HANA on-premise OData, OAuth2 client credentials

**Patterns:** PAT09, PAT15, PAT19 | **Prerequisite topics:** T1.3.5, T2.1.2, T2.2.2, T2.2.5, T2.4.2, T2.4.3

**Verified (V):**
- Path: Joule Studio agent to MCP server on Cloud Foundry to Destination service to Cloud Connector to S/4HANA. [SRC-014]
- Authentication is OAuth2 client credentials, with CSRF handling for OData V2 and one shared destination for all servers. [SRC-014]
- Nine MCP servers with 144 tools, each scoped to one business domain, about 20-30 tools per server. [SRC-014]
- The author cites reduced tool-selection accuracy with large tool sets as the reason for narrow servers. [SRC-014]
- The author reads a recent SAP API policy as requiring agent calls to SAP APIs to go through SAP-endorsed paths and notes unresolved customer questions. [SRC-014]

**Interpretation (I):**
- Client-credentials auth implies service-level identity; the post describes no per-user authorisation, so segregation of duties would need separate design.
- The SAP API policy statement is the author's reading and must be verified against SAP's own text before use.

**Unknown (U):** Measured reliability or savings; Write safeguards and approval steps; Per-user identity handling; Customers and timelines; Policy text itself

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| MCP granularity | One server per business domain, ~20-30 tools | One large server for all APIs | Author cites tool-selection degradation as tool count grows. | documented rationale (self-reported) |
| Connectivity | Reuse BTP Destination and Cloud Connector | Direct network exposure of S/4HANA; custom connectivity | Author states it keeps within SAP's existing trust layer. | documented |
| Identity | Service credentials via client credentials | Principal propagation or on-behalf-of user tokens | Not discussed by the source; comparison is independent analysis. | independent analysis |

**Architecture review exercise:** Find the segregation-of-duties risk in this architecture and redesign identity so the agent cannot exceed the user's authorisations.

**Lessons for an architect:** Narrow tool surfaces improve reliability. Reuse platform trust components. Question identity at every hop.

**Adapting to another client:** Template for exposing Commerce or Service Cloud APIs to Joule agents. Independent analysis.

### CS-010 Churn Risk Agent built in Joule Studio (editorial coverage)

**DataXstream (SAP partner)** | Distribution and sales (B2B) | Tier C | Depth: Secondary editorial description; no architecture or outcome metrics

**Problem:** Detect at-risk customers and trigger a retention response for sales teams.

**Technologies named in sources:** SAP Joule Studio, MCP server, SAP BTP Kyma runtime, containerised ML service

**Patterns:** PAT14, PAT07, PAT16, PAT04 | **Prerequisite topics:** T2.2.2, T1.4.5, T3.1.1

**Verified (V):**
- A proprietary ML model scores churn risk and ranks accounts; separate recommendation, availability and promotion agents then create an SAP inquiry and draft a retention email. [SRC-013]
- The only human step described is reviewing and sending the drafted email. [SRC-013]
- The agent is listed on the SAP Store; coverage reports a second-place finish in a SAP event but no business results. [SRC-013]

**Interpretation (I):**
- Combining a classical ML scorer with LLM agents is a sound split of responsibilities; the editorial source does not show how the pieces were validated.

**Unknown (U):** S/4HANA version and APIs; Model training data and accuracy; Error handling; Business results

**Architecture review exercise:** Using only this description, list what you would need to see before recommending it to a distribution client.

**Lessons for an architect:** Predictive scoring plus agentic action is a reusable shape. Upgrade to Tier B when a builder-authored technical source is found.

**Adapting to another client:** Candidate for B2B retention scenarios; needs a primary source.

### CS-011 SAP A2A and MCP interoperability reference architecture

**SAP** | Enterprise software (SAP reference architecture) | Tier A-provisional | Depth: Primary SAP documentation; this session used search excerpts, full page body to be read before walkthrough

**Problem:** Let Joule agents and third-party agents interoperate with governed access to SAP and non-SAP tools.

**Technologies named in sources:** A2A 0.3.0 with HTTP+JSON, SAP Cloud Identity Services App2App tokens with named user context, MCP Gateway in SAP Integration Suite, Agent Gateway, Joule as A2A client

**Patterns:** PAT09, PAT10, PAT19 | **Prerequisite topics:** T1.3.5, T1.3.6, T2.2.4, T2.4.2

**Verified (V):**
- SAP uses A2A as the preferred approach for external agent interoperability and MCP for tool access. [SRC-001]
- The Agent Gateway exposes Joule agents externally via A2A; authentication uses IAS App2App tokens with named user context. [SRC-002]
- MCP Gateway in Integration Suite exposes SAP and non-SAP APIs as governed MCP tools. [SRC-001]
- Inbound A2A interoperability general availability was announced for October 2026; the customer defines which agents a client may invoke. [SRC-003]

**Interpretation (I):**
- Named-user context in tokens suggests the design intends user-level authorisation across agent hops; confirm in full documentation.

**Unknown (U):** Full flows and limits (page body not read this session); Pricing and licensing

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| External agent protocol | A2A for agent to agent, MCP for tools | Proprietary SAP APIs only; REST per integration | Source states A2A as preferred for external interoperability. | documented |

**Architecture review exercise:** Draw inbound and outbound flows and mark every identity hop.

**Lessons for an architect:** Protocol layering: MCP for tools, A2A for agents.

**Adapting to another client:** Foundation for any BYO-agent SAP engagement.

### CS-012 Business Data Cloud with SAP AI Core: three AI-enhanced data product patterns

**SAP** | Enterprise software (SAP reference architecture) | Tier A-provisional | Depth: Primary SAP documentation; this session used search excerpts, full page body to be read before walkthrough

**Problem:** Turn governed SAP business data into predictive and agentic AI outcomes.

**Technologies named in sources:** SAP Business Data Cloud, SAP Databricks, MLflow and Unity Catalog, SAP AI Core, Generative AI Hub, SAP Datasphere, BTP destination service

**Patterns:** PAT16, PAT15 | **Prerequisite topics:** T2.1.3, T2.1.4, T1.4.5

**Verified (V):**
- Pattern 1: train in SAP Databricks on governed data products, register models, serve through AI Core. [SRC-004]
- Pattern 2: batch inference via AI Core workflow executions separated from low-latency serving. [SRC-004]
- Pattern 3: a BTP extension agent queries Datasphere, calls an AI Core endpoint and can use Generative AI Hub to explain results. [SRC-004]

**Interpretation (I):**
- Separating batch and real-time serving of one governed model is the architectural point to teach.

**Unknown (U):** Full rationale and limits (page body not read this session)

**Architectural decisions**

| Decision | Selected | Alternatives | Reasoning | Basis |
|---|---|---|---|---|
| Serving path | AI Core for governed serving of models trained in Databricks | Serve directly from Databricks | Source states AI Core provides enterprise governance, scaling and monitoring with SAP integration. | documented |

**Architecture review exercise:** Pick batch or real-time for ticket categorisation, forecast refresh and fraud scoring, and justify.

**Lessons for an architect:** Data products are the unit of reuse.

**Adapting to another client:** Applies to service-ticket classification and sales forecasting in CX.

### CS-013 Commerce Cloud storefront MCP server for agentic commerce (announcement-level)

**SAP** | Retail and B2B commerce | Tier C | Depth: Product announcements and commentary; roadmap-heavy

**Problem:** Let customers shop through AI platforms as well as the storefront.

**Technologies named in sources:** SAP Commerce Cloud, MCP server

**Patterns:** PAT18, PAT09 | **Prerequisite topics:** T2.3.2, T1.3.5

**Verified (V):**
- SAP lists conversational AI shopping through an MCP server in its Q2 2026 CX release. [SRC-007]
- Coverage states the server exposes catalog, pricing, inventory and promotions to AI platforms. [SRC-015]
- A commentator notes each merchant deploys the server and that much capability is roadmap. [SRC-016]

**Interpretation (I):**
- Exposing pricing and inventory to external agents raises contract-price, entitlement and rate-limit questions the sources do not address.

**Unknown (U):** Architecture details; Security model; GA status per region; Results

**Architecture review exercise:** List what must be true before exposing B2B contract pricing via an MCP server.

**Lessons for an architect:** Separate announcement from implementation evidence.

**Adapting to another client:** Discovery prompt for B2B clients; needs SAP documentation.

### CS-014 Multi-agent marketing with Joule and Gemini Enterprise (secondary report)

**SAP and Google Cloud** | Marketing and customer experience | Tier C | Depth: Secondary news summary; metric unverified

**Problem:** Run campaign creation and optimisation across SAP and Google agents.

**Technologies named in sources:** A2A, MCP, Gemini Enterprise, SAP Joule, ABAP SDK for Google Cloud

**Patterns:** PAT10, PAT06 | **Prerequisite topics:** T2.3.4, T1.3.6

**Verified (V):**
- The report says A2A links Google-built agents to Joule and MCP gives access to SAP data. [SRC-017]
- A retailer automation rate of 23% is quoted but not confirmed. [SRC-017]

**Interpretation (I):**
- Do not quote the 23% without a primary source.

**Unknown (U):** Architecture; Governance; Results

**Architecture review exercise:** Which consent and brand-safety controls are missing from this description?

**Lessons for an architect:** Cross-vendor agent protocols raise governance questions first.

**Adapting to another client:** Needs SAP primary documentation.

## Backlog (not yet verified; not in the catalog)

| Candidate | Status | Industry | Next |
|---|---|---|---|
| DoorDash support RAG, guardrails and quality monitoring | Primary DoorDash engineering URLs found by search but not yet read | E-commerce delivery | next batch |
| DoorDash GenAI platform talk (InfoQ) | Conference talk located; not yet read | E-commerce delivery | next batch |
| LinkedIn GenAI stack and hiring assistant | Only secondary coverage and ZenML summaries located; primary LinkedIn engineering posts to find | Professional networking | next batch |
| GitHub Copilot context engineering | Mentioned in ZenML index; primary source not yet located | Software | next batch |
| Uber software factory (agentic coding) | ZenML summary only; primary post to find | Mobility | next batch |
| Gerdau generative AI in steel manufacturing | Microsoft customer story and Databricks page located (vendor); technical source needed | Manufacturing | needs technical source |
| Austrian Post order processing automation | ZenML summary only; primary source to find | Logistics | needs primary source |
| Barclays MLOps and LLM integration | Conference talk summaries only | Banking | needs primary source |
| Harvey legal AI infrastructure | ZenML summary only | Professional services | needs primary source |
| Rocket home-buying conversational assistant | ZenML summary only | Financial services | needs primary source |
| Rubrik enterprise AI platform integration | ZenML summary only | Software | needs primary source |
| Glean enterprise search with LLMs | ZenML summary only | Software | needs primary source |
| Instacart, DoorDash and Uber Eats search comparison | ByteByteGo newsletter (secondary); use only to point to primaries | Retail | secondary only |

## Coverage gaps

- Banking and financial services: searches returned vendor and consultancy content; need named-institution technical sources
- Healthcare and life sciences: same; need hospital or pharma engineering/regulatory-grade sources
- Telecom and media: same
- Energy and utilities: not yet searched
- Travel and hospitality: not yet searched
- Manufacturing and automotive: only vendor stories and ZenML summaries so far
- SAP CX implementations with outcomes: only reference architectures, one partner blog and editorial coverage found

## How the catalog scales (summary; full protocol in Part 4)
Each batch: pick candidates by gap, locate a builder-authored primary source, read the full page, extract only stated facts with source IDs, record Unknowns, draft decisions with a documented or independent-analysis label, validate IDs, and tier honestly. A Claude Code content phase with web access can run these batches repeatedly against the schema.
