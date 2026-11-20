import hashlib
import re
from typing import BinaryIO
from pypdf import PdfReader
from docx import Document as DocxDocument

class DocumentParser:
    @staticmethod
    def compute_sha256(file_obj: BinaryIO) -> str:
        sha256 = hashlib.sha256()
        file_obj.seek(0)
        while chunk := file_obj.read(8192):
            sha256.update(chunk)
        file_obj.seek(0)
        return sha256.hexdigest()

    @staticmethod
    def extract_text_from_pdf(file_obj: BinaryIO) -> list[dict]:
        file_obj.seek(0)
        reader = PdfReader(file_obj)
        pages_content = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages_content.append({"page_number": idx + 1, "text": text.strip()})
        return pages_content

    @staticmethod
    def extract_text_from_docx(file_obj: BinaryIO) -> list[dict]:
        file_obj.seek(0)
        doc = DocxDocument(file_obj)
        full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        return [{"page_number": 1, "text": full_text}]

    @staticmethod
    def extract_text_from_txt(file_obj: BinaryIO) -> list[dict]:
        file_obj.seek(0)
        text = file_obj.read().decode("utf-8", errors="replace")
        return [{"page_number": 1, "text": text.strip()}]

class TextChunker:
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_document(self, pages: list[dict], doc_id: str, doc_name: str) -> list[dict]:
        chunks = []
        chunk_idx = 0
        for page in pages:
            text = page["text"]
            words = text.split()
            if not words:
                continue
            
            i = 0
            while i < len(words):
                chunk_words = words[i:i + self.chunk_size]
                chunk_text = " ".join(chunk_words)
                chunks.append({
                    "chunk_id": f"{doc_id}_{chunk_idx}",
                    "document_id": doc_id,
                    "document_name": doc_name,
                    "page_number": page["page_number"],
                    "content": chunk_text,
                })
                chunk_idx += 1
                if i + self.chunk_size >= len(words):
                    break
                i += (self.chunk_size - self.overlap)
        return chunks
