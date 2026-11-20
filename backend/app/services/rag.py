from typing import List, Dict, Any

ABSTENTION_MESSAGE = "Available firm documentation does not provide sufficient evidence to answer this."

class GroundedGenerator:
    @staticmethod
    def construct_grounded_prompt(query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        if not retrieved_chunks:
            return ""
        
        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks):
            doc_name = chunk.get("document_name", "Unknown")
            page = chunk.get("page_number", "N/A")
            content = chunk.get("content", "").strip()
            context_blocks.append(f"[{idx + 1}] Source: {doc_name} (Page {page})\nContent: {content}")
        
        context_str = "\n\n".join(context_blocks)
        
        prompt = (
            "You are AviS, a private and precise knowledge assistant for tax and audit professionals.\n"
            "STRICT RULES:\n"
            "1. Answer ONLY using the factual context provided below.\n"
            "2. For every factual claim, append the citation tag matching the source, e.g., [1].\n"
            f"3. If the context does not contain sufficient facts to answer the question, output EXACTLY:\n"
            f"'{ABSTENTION_MESSAGE}' and do not fabricate information.\n\n"
            f"CONTEXT:\n{context_str}\n\n"
            f"QUESTION: {query}\n\n"
            "ANSWER:"
        )
        return prompt

    @staticmethod
    def verify_citations(answer: str, retrieved_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        used_citations = []
        for idx, chunk in enumerate(retrieved_chunks):
            tag = f"[{idx + 1}]"
            if tag in answer:
                used_citations.append({
                    "tag": tag,
                    "document_name": chunk.get("document_name"),
                    "page_number": chunk.get("page_number"),
                    "chunk_id": chunk.get("chunk_id"),
                })
        return used_citations
