---
topicId: T1.2.1
lastReviewed: '2026-11-12'
status: draft
sources: []
diagrams: ["rag-baseline"]
depthVariants:
  compress: summary and key terms
  standard: adds lesson and worked example
  deep: adds extended material
---
@@ summary
Retrieval-augmented generation (RAG) answers questions by first retrieving relevant passages from your own documents and then asking a model to answer using them. The baseline flow has an offline ingestion path (load, chunk, embed, index) and an online query path (embed the question, retrieve, assemble the prompt, generate, cite). RAG keeps knowledge outside the model, so it can be updated and cited; baseline RAG breaks on multi-part questions, poor chunking, exact identifiers and missing evaluation.

@@ keyterms
- **Ingestion**: loading and preparing documents into a searchable index.
- **Chunk**: a passage-sized piece of a document that is indexed and retrieved.
- **Retriever**: the component that finds candidate chunks for a query.
- **Grounded generation**: asking the model to answer from supplied passages and cite them.
- **Citation**: a reference from the answer back to the passage that supports it.

@@ why
RAG is the default pattern for putting private, changing knowledge in front of a model with traceability. Most enterprise assistants you will review are RAG systems, and most of their failures are retrieval failures, not model failures.

@@ lesson
{{diagram:rag-baseline}}

**Ingestion (offline).** Extract text and structure from sources; split into chunks; compute an embedding for each; store text, vector and metadata (source, section, date, access rights) in an index.

**Query (online).** Embed the question; retrieve the top candidates; (optionally) rerank; build a prompt containing instructions plus the selected passages; generate an answer that cites passages; return the answer with links to sources.

**Where baseline RAG breaks.**
- *Chunking*: chunks that cut sentences or separate a definition from its use lose meaning.
- *Vocabulary mismatch and identifiers*: pure vector search misses exact codes and names.
- *Multi-hop or multi-part questions*: one retrieval round may not gather everything.
- *Stale or conflicting sources*: nothing in the baseline decides which document is authoritative.
- *Access control*: retrieval must respect who is asking.
- *No evaluation*: without a test set you cannot tell whether a change helped.

**Design questions to ask for any RAG system:** what are the sources and who owns them; how fresh must answers be; how are permissions enforced at retrieval; what happens when nothing relevant is found; how is quality measured.

@@ example
An internal policy assistant ingests a policy library with headings. Chunking by section keeps each rule with its heading. Each chunk stores policy name, section, effective date and the group allowed to read it. At query time retrieval filters by the asker's groups, returns five chunks, and the prompt tells the model to answer only from them and to say "not found in the policy library" otherwise. See how a large engineering organisation described a production retrieval system in [case CS-002](case:CS-002), including where a simple approach was not enough.

@@ deep
**Citations are a design feature, not decoration.** Require the model to return passage identifiers, verify them programmatically against what was retrieved, and show them to users. This both reduces fabrication and makes errors diagnosable.

**Freshness.** Decide an update path (re-ingest on change, scheduled refresh) and how deletions propagate to the index; stale chunks are a common silent failure.
