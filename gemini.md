# AviS: Project Context & Architectural Invariants

## 1. Product Vision & Target Audience
- **Format:** **Downloadable Native Desktop Application** (not a public SaaS web app).
- **Primary Market:** Indian Chartered Accountant (CA) & Tax Consulting firms.
- **Primary Use-Case:** Article assistants and junior CAs querying internal audit checklists, GST circulars, income tax notifications, and firm SOPs.
- **Core Value Proposition:** Verifiable citations with page numbers, strict abstention when context is absent, and 100% data privacy (zero training on client audit files).

---

## 2. Architectural Invariants

### Desktop-First Packaging
- The user experience is packaged as an installable desktop application.
- The UI runs locally, communicating with the embedded core backend over local IPC or loopback (`127.0.0.1`).
- Heavy external cloud dependencies must be optional; local storage and vector persistence are prioritized.

### Grounding & Abstention Contract (`FR-06`, `FR-07`)
- Every factual claim generated must contain a citation reference (`[1]`, `[2]`).
- When retrieved context does not meet similarity thresholds, the system must output:
  > *"Available firm documentation does not provide sufficient evidence to answer this."*
- Never hallucinate answers or generate unverified tax opinions.

### Model Serving Separation
- The inference layer is abstracted behind an adapter pattern.
- Model serving (local quantized weights, Ollama, private API gateways) is decoupled from the ingestion, vector indexing, and UI layers.

---

## 3. Tech Stack
- **Frontend / GUI:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons (desktop-ready).
- **Backend Core:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async).
- **Document Processing:** PyPDF, python-docx, sliding-window chunker with SHA-256 deduplication.
- **Vector Engine:** Qdrant (async client with workspace/tenant isolation).
- **Testing:** Pytest, pytest-asyncio, HTTPX.

---

## 4. Verification & Testing Standards
- All backend modifications must pass `python -m pytest tests/`.
- All frontend modifications must pass `npm run build` (`tsc && vite build`).
- Commits must follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).
