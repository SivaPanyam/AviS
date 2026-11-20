import pytest
import uuid
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.vector_store import VectorStoreService

@pytest.mark.asyncio
async def test_vector_store_tenant_filter():
    service = VectorStoreService()
    
    mock_client = AsyncMock()
    mock_client.get_collections.return_value = MagicMock(collections=[])
    
    # Mock hit matching the requested workspace
    mock_hit = MagicMock()
    mock_hit.score = 0.88
    mock_hit.payload = {
        "workspace_id": "ws-123",
        "chunk_id": "c-1",
        "document_name": "GST_Rules.pdf",
        "page_number": 2,
        "content": "Mandatory GST e-invoicing for > ₹5 Cr."
    }
    mock_client.search.return_value = [mock_hit]
    
    with patch.object(service, "get_client", return_value=mock_client):
        ws_id = uuid.uuid4()
        results = await service.query_tenant_chunks(
            workspace_id=ws_id,
            query_embedding=[0.1] * 384,
            limit=3
        )
        
        assert len(results) == 1
        assert results[0]["document_name"] == "GST_Rules.pdf"
        assert results[0]["score"] == 0.88
        
        # Verify tenant filter was applied in call
        mock_client.search.assert_called_once()
        call_kwargs = mock_client.search.call_args.kwargs
        assert call_kwargs["collection_name"] == "avis_knowledge_chunks"
        assert call_kwargs["query_filter"].must[0].key == "workspace_id"
