# Product Scope Specification: AviS CA Desktop Application

## 1. Product Form Factor: Downloadable Desktop Application
- **Distribution:** Installable desktop binary (Windows / macOS / Ubuntu) for tax professionals.
- **User Environment:** Runs locally on the user's workstation without requiring external server deployment.
- **Core Workflow:**
  1. User installs AviS desktop app.
  2. Drag-and-drops firm SOPs, tax circulars, and audit checklists into the local knowledge base.
  3. Queries the assistant in natural language.
  4. Receives answers with instant citations linking to document name and page number.
  5. Strict abstention is triggered if the query is not grounded in the firm's files.

## 2. Ingestion & Retrieval Pipeline
- **Supported Formats:** `.pdf`, `.docx`, `.txt`.
- **Deduplication:** Automatic SHA-256 content hashing to avoid redundant indexing.
- **Chunking:** Semantic sliding-window chunker with page-level tracking.
- **Retrieval:** Local cosine similarity vector search with similarity confidence thresholds.

## 3. Model Serving Decoupling
- The model inference adapter remains modular. The application functions end-to-end with local mock/API adapters, allowing the exact model hosting (local quantized weights vs. private cloud endpoint) to be configured subsequently.
