import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from app.schemas.api import (
    WorkspaceCreate,
    WorkspaceResponse,
    DocumentUploadResponse,
    ChatQueryRequest,
    ChatQueryResponse,
    CitationItem,
)
from app.models.entities import DocumentStatus
from app.services.ingestion import DocumentParser, TextChunker
from app.services.rag import GroundedGenerator, ABSTENTION_MESSAGE

router = APIRouter(prefix="/v1", tags=["API v1"])

# In-memory stores for fast MVP API validation & testing
WORKSPACE_STORE: dict[uuid.UUID, dict] = {}
DOCUMENT_STORE: dict[uuid.UUID, dict] = {}
VECTOR_INDEX_STORE: dict[uuid.UUID, list[dict]] = {}

@router.post("/workspaces", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(payload: WorkspaceCreate):
    for ws in WORKSPACE_STORE.values():
        if ws["slug"] == payload.slug:
            raise HTTPException(status_code=400, detail="Workspace slug already exists.")
    
    ws_id = uuid.uuid4()
    record = {
        "id": ws_id,
        "name": payload.name,
        "slug": payload.slug,
        "created_at": "2026-11-20T22:00:00Z"
    }
    WORKSPACE_STORE[ws_id] = record
    VECTOR_INDEX_STORE[ws_id] = []
    return record

@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: uuid.UUID):
    if workspace_id not in WORKSPACE_STORE:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    return WORKSPACE_STORE[workspace_id]

@router.post("/workspaces/{workspace_id}/documents", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    workspace_id: uuid.UUID,
    file: UploadFile = File(...)
):
    if workspace_id not in WORKSPACE_STORE:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Supported: .pdf, .docx, .txt")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file provided.")

    import io
    file_bytes = io.BytesIO(content)
    content_hash = DocumentParser.compute_sha256(file_bytes)

    # Deduplication check within tenant workspace
    for doc in DOCUMENT_STORE.values():
        if doc["workspace_id"] == workspace_id and doc["content_hash"] == content_hash:
            raise HTTPException(status_code=409, detail="Document with identical content already exists.")

    if ext == "pdf":
        pages = DocumentParser.extract_text_from_pdf(file_bytes)
    elif ext == "docx":
        pages = DocumentParser.extract_text_from_docx(file_bytes)
    else:
        pages = DocumentParser.extract_text_from_txt(file_bytes)

    doc_id = uuid.uuid4()
    chunker = TextChunker(chunk_size=150, overlap=30)
    chunks = chunker.chunk_document(pages, str(doc_id), file.filename)

    doc_record = {
        "id": doc_id,
        "workspace_id": workspace_id,
        "filename": file.filename,
        "file_type": ext,
        "file_size_bytes": len(content),
        "content_hash": content_hash,
        "status": DocumentStatus.INDEXED,
        "chunk_count": len(chunks),
        "created_at": "2026-11-20T22:00:00Z"
    }
    DOCUMENT_STORE[doc_id] = doc_record
    VECTOR_INDEX_STORE[workspace_id].extend(chunks)

    return doc_record

@router.post("/chat/query", response_model=ChatQueryResponse)
async def query_assistant(payload: ChatQueryRequest):
    if payload.workspace_id not in WORKSPACE_STORE:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    # Multi-tenant isolated retrieval from vector index store
    tenant_chunks = VECTOR_INDEX_STORE.get(payload.workspace_id, [])
    
    # Simple semantic/keyword match for MVP retrieval testing
    query_terms = set(payload.query.lower().split())
    matched_chunks = []
    for chunk in tenant_chunks:
        chunk_words = set(chunk["content"].lower().split())
        overlap = query_terms.intersection(chunk_words)
        if len(overlap) >= 1:
            matched_chunks.append(chunk)

    if not matched_chunks:
        return ChatQueryResponse(
            answer=ABSTENTION_MESSAGE,
            is_abstained=True,
            citations=[]
        )

    # Synthesize answer with grounding tags
    top_chunks = matched_chunks[:3]
    answer_text = f"According to firm documentation [1], {top_chunks[0]['content'][:120]}."
    citations = GroundedGenerator.verify_citations(answer_text, top_chunks)

    return ChatQueryResponse(
        answer=answer_text,
        is_abstained=False,
        citations=[CitationItem(**c) for c in citations]
    )
