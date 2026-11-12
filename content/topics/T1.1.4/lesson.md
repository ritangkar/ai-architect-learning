---
topicId: T1.1.4
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
An **embedding** is a list of numbers (a vector) that represents a piece of text so that texts with similar meaning have vectors that are close together. Embeddings power semantic search and retrieval. They capture topical similarity well but do not capture exact identifiers, negation or recency reliably, and quality depends on the embedding model and the domain.

@@ keyterms
- **Embedding / vector**: numeric representation of text meaning.
- **Cosine similarity**: a common measure of closeness between two vectors.
- **Dimensionality**: number of values per vector (more is not automatically better).
- **Embedding model**: the model producing vectors; the same model must embed documents and queries.
- **Semantic search**: finding items by meaning rather than shared keywords.

@@ why
Retrieval quality sets the ceiling for any retrieval-augmented system. Understanding what embeddings can and cannot do tells you when vector search alone is enough and when it needs keywords, filters or reranking.

@@ lesson
An embedding model maps text to a point in a high-dimensional space. A query "How do I reset my password?" lands near a passage titled "Account recovery steps" even though they share no words. Similarity search finds the nearest vectors.

**What embeddings capture well:** topic, paraphrase, intent-level similarity, cross-lingual similarity (for multilingual models).

**What they capture poorly:**
- Exact strings such as part numbers, error codes and names.
- Negation and fine logical differences ("allowed" versus "not allowed" can sit close together).
- Numbers and units.
- Recency and authority; a stale passage can be just as "similar" as the current one.

**Choosing a model.** Consider domain fit (legal, medical and code text behave differently), language coverage, maximum input length, dimensionality (affects storage and search cost), cost and whether you can host it. Evaluate on your own queries; public benchmark scores do not guarantee performance on your data. If you change the embedding model you must re-embed the whole corpus.

**Practical rules.** Embed documents and queries with the same model. Keep metadata (source, date, access rights) alongside vectors so you can filter. Combine with keyword search for identifiers.

@@ example
A parts catalogue search returns excellent matches for "bearing that survives high heat" but fails on the exact part number "BX-4471-H". The fix is not a bigger embedding model; it is adding keyword matching so exact identifiers are found lexically, then merging the results (see hybrid retrieval).

@@ deep
**Measuring embeddings for your use.** Build a small set of real queries with the passages that answer them and measure how often the right passage appears in the top results for each candidate model. This is cheap and far more informative than leaderboards.

**Storage and cost.** Total storage grows with number of chunks times dimensionality times bytes per value. Quantisation and smaller dimensions reduce cost at some quality price; test the trade-off.
