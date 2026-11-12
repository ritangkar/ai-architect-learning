# Deliverable A (Part 1 of N): Research and Architecture Report
AI Solution Architect Learning Platform. Research checked 2026-11-12.

Status legend used throughout: [CONFIRMED] = stated by you in the master prompt. [RECOMMENDED] = my design recommendation. [ASSUMPTION] = unverified. [VERIFY] = conflicting or secondary-source-only; Claude Code or you must confirm against primary docs before it goes into learner-facing content.

---

## 1. Understanding of the objective

You want to become an enterprise AI Solution Architect, primary specialization SAP CX, who can lead discovery, produce requirements and architecture documents, compare 4-5 viable architectures, and defend a recommendation. Coding is secondary. Your learning method is studying many real implementations and the reasoning behind them. The platform is a static, backend-free GitHub Pages LMS with adaptive assessment, a case study library, and local progress with JSON backup.

Key implications [CONFIRMED]:
- Case studies are the spine; topics exist to unlock them (prerequisite-gated, then return to the case).
- Mastery is evidenced by assessments and application exercises, never by "marked complete".
- Scenario questions outweigh MCQs.
- No fixed dates; recommendations adapt to gaps.
- No embedded API keys; portal must work with zero paid API calls.

## 2. Requirements analysis (Phase 1)

### 2.1 Confirmed requirements (summary)
Three equal pillars (vendor-neutral enterprise AI, SAP AI, cross-industry); 100-200 case catalog with provenance classes (Verified / Interpretation / Reconstructed / Unknown); decision-comparison tables per case; simulations clearly labelled; production-readiness curriculum incl. architecture review exercises; initial assessment (MCQ + scenario + self-rating); adaptive pathway with spaced revision; knowledge map linking topics, prerequisites, cases, patterns, assessments, competencies; static GitHub Pages; local persistence with JSON export/restore; no cross-device sync promise; accessibility, responsive, fast; deployment guide for a novice; Claude Code master prompt that forbids silent omission.

### 2.2 Constraints [CONFIRMED]
No Python/dev environment install on your laptops; limited coding; OpenAI credits available but portal must not depend on them; SAP Commerce access; possible Joule/BTP access.

### 2.3 Open questions (genuinely blocking only two)
1. GitHub username and repository name. I cannot verify these. The prompt says to verify rather than assume; I will encode this as a Claude Code first step (inspect git remote, `gh repo view`) and make `base` path configurable via one environment variable. [RECOMMENDED]
2. Whether you want the portal to include a bring-your-own-key playground. Default: no, out of scope for v1. [ASSUMPTION]

### 2.4 Contradiction check
No genuine contradictions. One tension to resolve: "100-200 cases" versus "do not invent cases" versus "marketing stories are insufficient". Resolution [RECOMMENDED]: a three-tier catalog (see section 5). Only Tier A cases get full walkthroughs; catalog size is bounded by verifiable evidence, and I will report the honest count, not the target.

## 3. Research findings: SAP AI landscape (Pillar 2)

Important caveat: SAP naming and availability are moving quickly and sources disagree. Items marked [VERIFY] must be checked on SAP Help Portal / SAP Roadmap Explorer before being taught as fact. The curriculum should teach a "GA vs preview vs roadmap" status field on every SAP topic, with a last-checked date.

### 3.1 Platform structure (as described in sources)
- SAP Business AI Platform consolidates BTP, Business Data Cloud (BDC) and Business AI; layers described include models, AI Foundation (Generative AI Hub, AI Core), a context layer (domain models, Knowledge Graph), Joule Studio, and a governance layer (SAP AI Agent Hub). Sources: SAPinsider Sapphire 2026 coverage; LeverX. [VERIFY exact layer names; analyst-written]
- SAP's own architecture site (architecture.learning.sap.com) documents Generative AI Hub and AI Core as lifecycle, serving and governed model access, and a BDC + AI Core reference architecture with three patterns: model development in SAP Databricks with AI Core serving; batch inference via AI Core workflow executions; real-time inference through an extension "Data Agent" on BTP querying Datasphere and calling AI Core endpoints. This is primary-source and high teaching value.
- Generative AI Hub exposes models from Mistral, OpenAI, Gemini, Anthropic and others (SAP News, SAPinsider Q4 2025 release coverage). SAP-RPT-1 (relational/tabular foundation model) was introduced at TechEd 2025; later versions (RPT-1.5, RPT-2.0) are mentioned by secondary sources. [VERIFY versions and GA dates]

### 3.2 Joule, Joule Studio, agents
- Joule Studio skill builder GA July 2025; agent builder GA stated for December 2025 (SAP product page). Other sources say Joule Studio GA in Q1 2026 (Enterprise DNA, CallSphere), "Joule Studio 2.0" rolling out around Sapphire 2026, and TechEd 2026 coverage says GA of Joule Work and Joule Studio is "underway in phases". These conflict. [VERIFY, treat GA as phased and landscape-dependent]
- Pricing: SAP's product page says the agent builder is a free promo until 2026-09-30 then a Premium AI feature; SAPinsider says free Joule Studio tooling and runtime through 2026-12-31 with post-2026 pricing undisclosed. Conflict. [VERIFY, important for client cost discussions]
- Joule Studio capabilities per SAP: natural-language agent definition, model choice, tools and MCP server configuration, grounding in data, documents and SAP Knowledge Graph, stateful runtime with guardrails.
- SAP AI Agent Hub (built on LeanIX): inventory and governance of SAP and third-party agents, LLMs and MCP servers; GA planned Q3 2026 per SAPinsider. [VERIFY current status]
- Joule Work / Assistants / Agents layering: Joule Work as common interface, Assistants as role-based coordinators, Agents as task executors (SoftwareReviews/Info-Tech on Connect 2026). Expanded agents GA planned Q1 2027 per that source. [VERIFY]

### 3.3 Interoperability: MCP and A2A (strong primary source)
SAP's architecture site states SAP uses A2A as the preferred approach for external agent interoperability and MCP for tool access. Documented specifics:
- Agent Gateway exposes Joule Agents via A2A, A2A spec version 0.3.0, HTTP+JSON transport, authentication via SAP Cloud Identity Services App2App tokens with named user context. Inbound A2A GA announced for October 2026.
- Joule acts as an A2A client to call external agents ("Bring Your Own Agent").
- MCP Gateway in SAP Integration Suite exposes SAP and non-SAP APIs as governed MCP tools.
- Earlier SAP pages note outbound-only state before the gateway was GA, a good example of why availability dates matter.
Teaching value: this is the best material for "connecting external AI models and frameworks to SAP systems".

### 3.4 SAP CX specifics
- Q4 2025 CX release: out-of-the-box Digital Service Agent and Shopping Agent, Joule Studio agent builder for CX apps (SAP News).
- Q2 2026 CX release: Commerce Cloud storefront MCP server for conversational AI shopping; Joule in Engagement Cloud (Early Adopter Care); Sales Cloud field-sales add-on; Parloa and Google Cloud partnerships (SAP News, July 2026).
- NRF 2026 announcement: storefront MCP server for Commerce Cloud exposing catalog, pricing, inventory and promotions to AI platforms; commentary notes each merchant deploys it themselves and much capability is roadmap. [Talk Commerce newsletter, opinion]
- Commerce Cloud, cloud ERP edition for mid-market and new Order Management Services capabilities. [VERIFY details]
- Sales Cloud V2 / Service Cloud V2 AI features (email-to-order, deep research, agent inbox) described by a partner blog. [VERIFY, partner marketing]
- SAP Joule + Google Gemini Enterprise multi-agent marketing in Engagement Cloud via A2A and MCP, with a Smyths Toys deployment cited at a 23% automation rate (Enterprise DNA, secondary). [VERIFY before using as a case]

### 3.5 Implementation-level SAP evidence found
- DataXstream churn-risk agent built in Joule Studio with an MCP server for S/4HANA-grounded retention workflows (SAPinsider). Candidate case.
- Mindset Consulting: nine MCP servers on BTP Cloud Foundry; path Joule agent to MCP server to Destination service to Cloud Connector to S/4HANA on-prem; OAuth2 client credentials; one server per business domain (partner engineering blog). Candidate case with real architectural detail; vendor/partner source so confidence is "Verified as partner-stated".
- Accenture Optisell on Joule Studio (SAP product page mention only; shallow).

### 3.6 Curriculum implication
Pillar 2 must be organised around architecture questions, not products: where does model access live (Generative AI Hub vs direct provider), where do tools live (MCP Gateway vs custom MCP on Cloud Foundry), how does identity propagate (IAS, destinations, Cloud Connector), where is governance (Agent Hub), when to use Joule Studio vs pro-code agent via A2A. Each topic carries status (GA / phased / preview / roadmap) and a last-verified date.

## 4. Research findings: Pillar 1 and 3 inputs

### 4.1 Security
OWASP Top 10 for LLM Applications 2025 (v2.0): prompt injection LLM01, indirect injection via documents or retrieved content, sensitive information disclosure, supply chain, data and model poisoning, new entries System Prompt Leakage and Vector and Embedding Weaknesses, excessive agency, unbounded consumption (LLM10, token floods and cost attacks). Secondary summaries only so far; Claude Code or the content phase should fetch genesis.owasp.org primary pages. A 2026 edition is referenced; [VERIFY] which edition to teach and note differences. Architectural framing for the curriculum: agentic systems make the model part of the trust boundary; controls must sit outside the model (least-privilege tools, human approval for writes, identity propagation).

### 4.2 Protocol landscape
MCP governs agent-to-tool; A2A governs agent-to-agent; A2A moved to the Linux Foundation in June 2025 with SAP among founding members (secondary). Teach both as a pair, plus a "when not to use an agent protocol" decision.

### 4.3 Case source ecosystems (for Phase 4)
- ZenML LLMOps Database: aggregates 1,182 production case studies (as of Dec 2025) with links to original sources and industry tags. Use as a discovery index only; each case must be traced to its original engineering post, and ZenML summaries are AI-generated so must not be cited as primary evidence.
- GitHub list "llms-in-production" (curated engineering blogs).
- Vendor reference architectures: architecture.learning.sap.com.
- Named candidates surfaced so far (NOT yet verified against primary posts): DoorDash (support RAG with guardrails and quality monitoring; GenAI platform talk on InfoQ), Uber (Finch data agent; agentic RAG; software factory), Klarna (customer-service assistant), Instacart / DoorDash / Uber Eats search comparison (ByteByteGo), LinkedIn, GitHub Copilot, Dropbox, Glean, Zalando agentic engineering, Slack, Rubrik, Barclays, Gerdau (steel manufacturing assistant), Austrian Post (order processing), Rocket (home buying assistant).

## 5. Case study strategy [RECOMMENDED]

Quantity versus quality: I will not claim 100-200 until evidence is checked. Three tiers:

| Tier | Meaning | Primary-source requirement | Content produced | Target count (aspirational) |
|---|---|---|---|---|
| A | Full architecture walkthrough | At least one technical primary source (engineering blog, architecture doc, conference talk by builders) | Full 27-section template with provenance tags per claim | 25-40 |
| B | Structured analysis | Primary source exists but limited depth | Condensed template, decisions table labelled "independent analysis" where inferred | 40-80 |
| C | Catalog stub | Credible source, shallow detail | Metadata, pattern tags, link, explicit "depth: limited", no invented detail | 35-80 |

Total aspirational 100-200 only if sources pass; the platform must display the true count. Rules:
1. Every claim tagged V (verified), I (interpretation), R (reconstructed), U (unknown), with source ID.
2. Vendor marketing pages alone cap a case at Tier C.
3. Diagrams from sources are linked, not copied; reconstructed diagrams carry a visible "Reconstructed" banner.
4. Simulations carry a "SIMULATION" badge, kept in a separate collection.
5. Diversity quotas: no more than ~15% from any single company; coverage across industries, pillars and AI categories; SAP-relevant cases weighted up.
6. Copyright: summarise in own words; short attributed quotes only.
7. Each case lists prerequisite topics, patterns, and competency mappings so the adaptive engine can route learners.

Important honesty note: truly SAP-CX-specific, technically detailed public cases are scarce (found so far: SAP reference architectures, DataXstream, Mindset). Expect the SAP CX subset to be mostly Tier A/B built from SAP reference architectures plus partner posts, and supplement with clearly labelled simulations for discovery-conversation practice.

## 6. Platform architecture (Phase 5)

### 6.1 Stack options evaluated
| Option | Strengths | Weaknesses | Verdict |
|---|---|---|---|
| Astro (static, Markdown/MDX content collections, islands for interactivity) | Content/app separation, fast pages, official GitHub Pages action, `site` + `base` config, great for a growing content library, Pagefind search compatible | Interactivity needs islands; team must manage base-path links | Recommended |
| Vite + React SPA with hash routing | Rich interactivity, simple | Content in bundle or fetched JSON, SEO irrelevant but heavier JS, router/base pitfalls | Viable alternative |
| Next.js static export | Familiar | More config for project-site base paths, heavier | Not needed |
| Docusaurus/VitePress | Great docs | Less suited to custom adaptive LMS logic | Not recommended as the core |
| Plain HTML/JS | Zero build | Poor maintainability at this scale | Rejected |

Recommendation [RECOMMENDED]: Astro with TypeScript, content collections (Markdown/MDX + JSON/YAML validated by Zod schemas), React or Preact islands for assessment, dashboard and knowledge map, Pagefind for client-side search, Mermaid or SVG for diagrams, Tailwind or hand-written CSS tokens. Rationale: GitHub Pages project sites need a `base` path equal to the repository name; Astro's docs specify `site: https://<username>.github.io` and `base: /<repo>`, deployment via GitHub Actions with Pages source set to "GitHub Actions" (Astro docs checked 2026-11-12). Build-time schema validation catches broken prerequisite links and missing provenance tags, which matters when content scales.

### 6.2 Deployment [RECOMMENDED, from Astro docs]
GitHub Actions workflow using the official `withastro/action` plus `actions/deploy-pages`; permissions contents read, pages write, id-token write; Settings, Pages, Source = GitHub Actions. All internal links must respect `base`. Action versions drift; Claude Code must check current versions rather than copy from this report.

### 6.3 Content model
Content in `/content` (Markdown + frontmatter and JSON): pillars, modules, topics, lessons, resources, questions, cases, patterns, competencies, sources. Application logic in `/src`. A build step generates a knowledge graph JSON (topic prerequisites, case-to-topic, case-to-pattern, question-to-competency) and fails the build on dangling references, cycles in prerequisites, or cases missing source IDs.

### 6.4 Local persistence [RECOMMENDED]
IndexedDB (via a small wrapper) for attempts and review history; localStorage for light preferences; versioned schema with migrations; explicit "Export progress (JSON)" and "Import/restore" with schema validation and merge-or-replace choice; periodic "back up now" reminder. Honest limits to display in the UI: data lives in one browser profile on one device; clearing site data deletes it; private windows may not persist; another device starts empty until you import a backup; no automatic sync. Optional later: File System Access or manual copy of the JSON to cloud storage by the user.

### 6.5 Assessment and adaptive engine [RECOMMENDED]
- Competency model: each question and exercise maps to competencies and topics with a difficulty and a type (MCQ, scenario, architecture review, decision comparison).
- Scoring: scenario items weighted higher than MCQ (suggested 2-3x), confidence-calibrated (self-rating versus correctness exposes overconfidence).
- Mastery state per topic: unknown, gap, developing, proficient, mastered, requiring evidence from at least two independent assessments including one applied item; lesson completion never raises mastery.
- Spaced review: SM-2-style or simple Leitner scheduling on revision cards and missed questions, with intervals as defaults, not fixed dates.
- Recommender: ranks next activities by (gap severity x prerequisite-unblocking value x case relevance) with a rule that if a case's prerequisites include a gap topic, route to the topic first and then return to the case with a "resume" pointer.
- Rules are deterministic and explainable ("Recommended because...") so no model call is needed.

### 6.6 Security [CONFIRMED + RECOMMENDED]
No secrets in repo, bundle, config or history; secret scanning in CI; no analytics keys needed; CSP-friendly output; external links with rel noopener; embedded videos via privacy-enhanced embeds with fallback links; any future BYO-key exercise must be separate documentation only, run in the user's own environment.

## 7. Risks and limitations
- Source disagreement on SAP availability and pricing (see 3.2). Mitigation: status plus last-verified fields; a content-freshness view in the portal.
- Case depth ceiling: honest tiers; platform shows real counts.
- Single-device local data loss. Mitigation: backup prompts.
- Content volume: authoring 100+ cases is a multi-session effort; plan as a pipeline with Claude Code batching and a validation gate, not a single pass.
- Secondary-source reliance in this round: several facts above come from blogs and analyst coverage; they are flagged [VERIFY].
- YouTube resources: availability and licensing change; store only links and your own commentary, verify each URL at build or review time.

## 8. Remaining parts (explicit tracking)
This is Part 1. Not yet produced:
- Part 2: Deliverable B, curriculum blueprint (modules, topics, prerequisites, objectives, resources, assessments, competencies) across three pillars.
- Part 3: Deliverable C, case catalog with verified sources per entry (requires per-case primary-source research; will be produced in batches and tiered honestly).
- Part 4: Deliverable D, full functional and technical specification with acceptance criteria.
- Part 5: Deliverable E, JSON handoff package (schemas plus content files).
- Part 6: Deliverables F and G, Claude Code master prompt and deployment guide requirement.
- Part 7: Validation matrix against every requirement.

Sources: see PART1_source_register.json.
