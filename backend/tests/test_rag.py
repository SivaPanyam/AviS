import io
from app.services.ingestion import DocumentParser, TextChunker
from app.services.rag import GroundedGenerator, ABSTENTION_MESSAGE

def test_document_parser_and_chunker():
    sample_text = "This is a tax audit guideline. " * 50
    file_bytes = io.BytesIO(sample_text.encode("utf-8"))
    
    sha256 = DocumentParser.compute_sha256(file_bytes)
    assert len(sha256) == 64
    
    pages = DocumentParser.extract_text_from_txt(file_bytes)
    assert len(pages) == 1
    assert "tax audit guideline" in pages[0]["text"]
    
    chunker = TextChunker(chunk_size=20, overlap=5)
    chunks = chunker.chunk_document(pages, doc_id="test_doc_1", doc_name="GST_Guide.txt")
    assert len(chunks) > 1
    assert chunks[0]["document_name"] == "GST_Guide.txt"
    assert chunks[0]["page_number"] == 1

def test_grounded_generator_prompt():
    chunks = [
        {"chunk_id": "c1", "document_name": "GST_Rule.pdf", "page_number": 4, "content": "ITC cannot be claimed after 30th November."},
        {"chunk_id": "c2", "document_name": "Audit_SOP.docx", "page_number": 1, "content": "Audit reports must be signed by two partners."},
    ]
    prompt = GroundedGenerator.construct_grounded_prompt("What is the deadline for ITC?", chunks)
    assert "GST_Rule.pdf" in prompt
    assert "Audit_SOP.docx" in prompt
    assert ABSTENTION_MESSAGE in prompt

def test_citation_verification():
    chunks = [
        {"chunk_id": "c1", "document_name": "GST_Rule.pdf", "page_number": 4, "content": "ITC deadline info"},
        {"chunk_id": "c2", "document_name": "Audit_SOP.docx", "page_number": 1, "content": "Partner sign info"},
    ]
    sample_answer = "ITC cannot be claimed after 30th November [1]."
    citations = GroundedGenerator.verify_citations(sample_answer, chunks)
    assert len(citations) == 1
    assert citations[0]["document_name"] == "GST_Rule.pdf"
    assert citations[0]["tag"] == "[1]"
