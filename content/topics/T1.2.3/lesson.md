---
topicId: T1.2.3
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
Beyond baseline RAG: **chunking strategy** (how documents are split and annotated) often matters more than model choice; **graph RAG** adds relationships between entities for questions that span documents; **agentic RAG** lets a model plan retrieval steps, reformulate queries and combine evidence. Each adds cost, latency and failure modes, so use them when evidence shows baseline retrieval is the limit.

@@ keyterms
- **Structure-aware chunking**: splitting along headings, sections, tables or code units instead of fixed length.
- **Overlap**: repeating a little text between neighbouring chunks to keep context.
- **Parent-child retrieval**: retrieving small chunks but supplying the larger parent section to the model.
- **Graph RAG**: retrieval that uses a knowledge graph of entities and relations.
- **Agentic RAG**: an agent decides what to retrieve, may iterate and may use several tools.

@@ why
Teams often jump to complex retrieval before fixing basics. An architect should know the order of remedies and the price of each, and should require evidence that the next step is needed.

@@ lesson
**Chunking by document type.**
- Policies and manuals: split by heading, keep section titles as metadata.
- Tables and spreadsheets: keep header with rows; consider turning rows into descriptive text.
- Source code: split by function or class.
- Conversations and tickets: split by thread or turn with participants and time.

Add metadata (title path, source, date, owner, access group). Test chunk size on real questions rather than assuming one value fits.

**Escalation ladder (try in order).** Better chunking and metadata, then hybrid retrieval and reranking, then query rewriting, then multi-step or agentic retrieval, then graph structures. Move up only when a labelled evaluation shows the current step is the bottleneck.

**Graph RAG.** Useful when answers depend on relationships across documents (who reports to whom, which component depends on which). Costs: building and maintaining the graph, extraction errors, and extra complexity.

**Agentic RAG.** Helps with multi-part questions and ambiguous queries because the model can search, read, and search again. Costs: more calls (latency and spend), harder testing, more ways to go wrong, and a larger attack surface if tools are involved. Put limits on steps, budget and tools. A production example of moving from simple to agentic retrieval is in [case CS-002](case:CS-002) and a broader enterprise search design in [case CS-004](case:CS-004).

@@ example
Support articles are long and sectioned. Fixed 500-token chunks split steps from their prerequisites. Re-chunking by section with the title path attached and retrieving the whole parent section for the top chunk fixes most of the failures without any new technology. Only the remaining multi-part questions justify an agentic step.

@@ deep
**Evaluate each rung.** Keep the same labelled set and record recall, answer quality, latency and cost for each change so you can show what each extra component bought.

**Failure budgets.** For agentic retrieval, cap iterations, tokens and tool calls, and define what the system does when the cap is reached.
