---
topicId: T1.2.2
lastReviewed: '2026-11-12'
status: draft
sources: []
diagrams: ["hybrid-retrieval"]
depthVariants:
  compress: summary and key terms
  standard: adds lesson and worked example
  deep: adds extended material
---
@@ summary
Vector search finds meaning, keyword (lexical) search finds exact terms, and each fails where the other succeeds. **Hybrid retrieval** runs both and merges results, and a **reranker** then reorders the merged candidates by relevance to the query. Where you store vectors (a dedicated vector database, a search engine with vector support, or a relational database with a vector extension) is a trade-off on scale, operations, filtering and security.

@@ keyterms
- **Lexical search (BM25-style)**: ranking by term matches and rarity.
- **Hybrid retrieval**: combining lexical and vector results.
- **Reciprocal rank fusion (RRF)**: a simple way to merge ranked lists by summing 1 / (k + rank) for each list.
- **Reranker**: a model that scores query-passage pairs jointly to reorder candidates.
- **Metadata filter**: restricting results by attributes such as date, owner or permission.

@@ why
Retrieval quality is the most common limit on RAG quality. Knowing the standard remedies, and what they cost in latency and operations, lets you improve recall and precision without guessing.

@@ lesson
{{diagram:hybrid-retrieval}}

**Why hybrid.** Embeddings handle paraphrase; lexical search handles identifiers, rare terms and exact phrases. Running both and fusing the lists captures both kinds of match.

**Fusion.** RRF is popular because it needs no score calibration: each list contributes 1 / (k + rank) per document (k is a constant, often around 60), and the sums decide the final order.

**Reranking.** A first-stage retriever is fast but approximate. A second-stage reranker reads the query and each candidate together and produces a better ordering. It adds latency and cost proportional to the number of candidates, so retrieve generously (for example dozens), rerank, then pass only the best few to the generator.

**Where to store vectors.**

| Option | Strengths | Watch out for |
|---|---|---|
| Dedicated vector database | Built for similarity search at scale, rich index options | Another system to run, secure and keep in sync |
| Search engine with vector support | One system for lexical and vector, good filtering | Tuning effort, resource use |
| Relational database with a vector extension | Reuse existing operations, transactions and permissions | Scale and index limits at very large size |

Decide using data volume, filtering and permission needs, team skills and existing platforms, and verify claims with a test on your own data.

@@ example
A parts search fails on exact part numbers when vector-only. The team adds lexical search, merges with RRF, retrieves 40 candidates, reranks and passes the top 5. Recall at 10 on their labelled queries rises, and added latency is measured and accepted. Because they measured before and after, they know the change helped.

@@ deep
**Filtering and security.** Permission filters must apply during retrieval, not after: filtering after retrieval can return too few results, or leak through scores. Check how each store handles filtered vector search.

**Cost and latency budget.** Each added stage must earn its place against a measured gain. Keep a latency budget per stage and test with realistic load.
