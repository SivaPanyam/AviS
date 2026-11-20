# Decision Log: AviS Focus & Architecture

## Decision ID: DEC-2026-001
- **Date:** 2026-11-20
- **Decision:** Target Indian Chartered Accountant (CA) & Tax Consulting firms as the primary market wedge.
- **Context:** Solo-founder execution requiring a high-urgency, high-retrieval workflow where accuracy, verifiable citations, and strict confidentiality dominate over generic chatbot features.
- **Consequences:**
  - Standardizes the first MVP around Tax SOPs, GST Circulars, and Audit Checklists.
  - Fixes the initial pilot offer to ₹14,999 (30-day managed pilot, up to 5 users, 1 knowledge base, verified source citations).
  - Enforces server-side tenant isolation and zero-training data compliance guarantees.

## Decision ID: DEC-2026-002
- **Date:** 2026-11-20
- **Decision:** Modular Architecture with Desktop Packaging.
- **Context:** Transition from a pure cloud SaaS model to a **downloadable, local-first desktop application**.
- **Consequences:**
  - Eliminates cloud hosting compliance friction for CA firms who refuse to upload client audit documents to third-party web servers.
  - Packages the React UI and embedded FastAPI core as a downloadable native desktop application.
  - Decouples the LLM model serving layer for future evaluation (local quantized weights or secure private endpoints).
