# Product Scope Specification: AviS CA & Tax Edition

## 1. Core Workflow
- **Target Users:** Managing Partners, Senior CAs, Article Assistants.
- **Ingestion Pipeline:** PDFs, Word (.docx), TXT, and Excel sheets containing internal audit SOPs, GST circulars, and tax compliance guidelines.
- **Retrieval & Grounding:**
  - Qdrant vector store filtered by `workspace_id`.
  - Verifiable citation payload with document name, page number, and chunk text.
  - Strict abstention policy: If confidence is below threshold, output: *"Available firm documentation does not provide sufficient evidence to answer this."*
