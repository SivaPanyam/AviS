from typing import List, Dict, Any, Optional
import uuid
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.core.config import settings

class VectorStoreService:
    def __init__(self):
        self.collection_name = "avis_knowledge_chunks"
        self._client: Optional[AsyncQdrantClient] = None

    async def get_client(self) -> AsyncQdrantClient:
        if self._client is None:
            if settings.USE_EMBEDDED_QDRANT:
                # Embedded path-based local vector store: zero Docker required
                self._client = AsyncQdrantClient(path=str(settings.QDRANT_STORAGE_PATH))
            else:
                self._client = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        return self._client

    async def ensure_collection(self, vector_dim: int = 384):
        client = await self.get_client()
        collections = await client.get_collections()
        exists = any(c.name == self.collection_name for c in collections.collections)
        if not exists:
            await client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE),
            )

    async def upsert_chunks(
        self,
        workspace_id: uuid.UUID,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
    ):
        await self.ensure_collection(vector_dim=len(embeddings[0]) if embeddings else 384)
        client = await self.get_client()
        points = []
        for chunk, embedding in zip(chunks, embeddings):
            point_id = str(uuid.uuid4())
            payload = {
                "workspace_id": str(workspace_id),
                "chunk_id": chunk.get("chunk_id"),
                "document_id": chunk.get("document_id"),
                "document_name": chunk.get("document_name"),
                "page_number": chunk.get("page_number"),
                "content": chunk.get("content"),
            }
            points.append(PointStruct(id=point_id, vector=embedding, payload=payload))

        await client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

    async def query_tenant_chunks(
        self,
        workspace_id: uuid.UUID,
        query_embedding: List[float],
        limit: int = 5,
        score_threshold: float = 0.50,
    ) -> List[Dict[str, Any]]:
        client = await self.get_client()
        
        tenant_filter = Filter(
            must=[
                FieldCondition(
                    key="workspace_id",
                    match=MatchValue(value=str(workspace_id)),
                )
            ]
        )

        search_result = await client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            query_filter=tenant_filter,
            limit=limit,
            score_threshold=score_threshold,
        )

        retrieved = []
        for hit in search_result:
            if hit.payload:
                retrieved.append({
                    "score": hit.score,
                    "chunk_id": hit.payload.get("chunk_id"),
                    "document_id": hit.payload.get("document_id"),
                    "document_name": hit.payload.get("document_name"),
                    "page_number": hit.payload.get("page_number"),
                    "content": hit.payload.get("content"),
                })
        return retrieved

vector_service = VectorStoreService()
