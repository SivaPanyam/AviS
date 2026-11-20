# AviS - Private Knowledge Engine for CA & Tax Firms

[![CI / Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Stack](https://img.shields.io/badge/architecture-Local--First%20Desktop%20App-indigo)](#)
[![Market](https://img.shields.io/badge/target-Indian%20CA%20%26%20Tax%20Firms-blue)](#)

AviS is a **downloadable, local-first desktop application** designed specifically for Indian Chartered Accountant (CA) and tax consultancy practices. It turns dense firm SOPs, audit checklists, GST notifications, and income tax circulars into an instant, citation-backed knowledge assistant running securely on the user's machine without exposing private client data to public LLM training.

---

## 🎯 The Core Problem & Solution

* **The Problem:** Junior staff and article assistants repeatedly interrupt senior partners with routine procedural questions (e.g., Section 44AB thresholds, Form 3CD reporting clauses, GST ITC reversal rules). Past audit working papers and regulatory SOPs remain scattered across local drives and folders.
* **The Solution:** A standalone, native desktop software that practitioners download and install. Users drag-and-drop firm documents and search via natural language. Every answer requires exact page/paragraph source citations and strictly abstains when evidence is missing.

---

## 🏛️ System Architecture: Local-First Desktop App

AviS is packaged as a **downloadable native desktop application** (Tauri / Electron wrapper around an embedded FastAPI engine and local vector store):

```
┌────────────────────────────────────────────────────────┐
│                   AviS Desktop App                     │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │   Frontend GUI (React + TypeScript + Vite)     │   │
│   │   - Document Ingestion Panel                   │   │
│   │   - Citation-Grounded Chat Interface           │   │
│   │   - Strict Abstention Banners                  │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │ Local IPC / Loopback       │
│   ┌───────────────────────▼────────────────────────┐   │
│   │   Embedded Core Engine (FastAPI / Python)      │   │
│   │   - Document Parsers (PDF, DOCX, TXT)          │   │
│   │   - Sliding-Window Text Chunker                │   │
│   │   - Citation Verification & Grounding Engine   │   │
│   │   - SQLite / Local Metadata Store              │   │
│   └───────────────────────┬────────────────────────┘   │
│                           │                            │
│   ┌───────────────────────▼────────────────────────┐   │
│   │   Local Embedded Vector Store (Qdrant / Chroma)│   │
│   │   - Local Tenant / Partition Isolation         │   │
│   │   - Cosine Similarity Matching                 │   │
│   └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

> **Note on Model Serving:** The LLM inference adapter is intentionally decoupled. Model serving (whether local quantized weights or private endpoints) will be finalized in later stages without compromising application architecture.

---

## 🚀 Key Features

* **Downloadable & Local-First:** Runs as a native desktop application without forcing firms to manage complex cloud infrastructure or multi-tenant web portals.
* **Verifiable Citations:** Answers include clickable source references `[1]`, `[2]` linking directly to document names and page numbers.
* **Strict Abstention Policy:** If the firm’s documents do not contain evidence for a question, the assistant explicitly states:
  > *"Available firm documentation does not provide sufficient evidence to answer this."*
* **Zero-Training Guarantee:** Client files and audit papers never leave the firm's machines or train public third-party models.

---

## 📂 Repository Layout

```
Avis/
├── backend/              # Embedded FastAPI backend engine
│   ├── app/
│   │   ├── api/          # Workspace, document, and chat endpoints
│   │   ├── core/         # Configuration and settings
│   │   ├── models/       # Relational models and schemas
│   │   └── services/     # Ingestion, chunking, RAG grounding, vector store
│   └── tests/            # Automated test suite (Pytest)
├── frontend/             # Desktop GUI (React + Vite + Tailwind CSS)
│   ├── src/              # Ingestion, chat, and citation UI components
│   └── package.json
├── Docs/                 # Startup, PRD, ICP, and governance documentation
│   ├── 00-governance/    # Strategic decisions and ADRs
│   └── 01-product/       # CA & Tax firm product specifications
├── gemini.md             # Antigravity project conventions and operating rules
└── docker-compose.yml    # Development multi-container orchestration
```

---

## 🧪 Quickstart & Testing

### 1. Run Backend Tests
```bash
cd backend
python -m pytest tests/
```

### 2. Run Desktop UI Development Server
```bash
cd frontend
npm install
npm run dev
```

### 3. Build Desktop UI Distribution
```bash
cd frontend
npm run build
```
