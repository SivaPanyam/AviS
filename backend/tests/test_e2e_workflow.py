import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_complete_ca_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create Workspace
        ws_res = await ac.post("/api/v1/workspaces", json={"name": "Kamat & Associates CA", "slug": "kamat-ca"})
        assert ws_res.status_code == 201
        ws_data = ws_res.json()
        ws_id = ws_data["id"]

        # 2. Upload Tax SOP Document
        doc_content = b"Tax Audit Section 44AB requires accounts to be audited if turnover exceeds Rs 1 Crore for business."
        files = {"file": ("Tax_Audit_44AB.txt", doc_content, "text/plain")}
        doc_res = await ac.post(f"/api/v1/workspaces/{ws_id}/documents", files=files)
        assert doc_res.status_code == 201
        doc_data = doc_res.json()
        assert doc_data["filename"] == "Tax_Audit_44AB.txt"
        assert doc_data["chunk_count"] >= 1

        # 3. Query Assistant on Covered Topic
        query_res = await ac.post("/api/v1/chat/query", json={
            "workspace_id": ws_id,
            "query": "What are the rules for Tax Audit Section 44AB turnover limit?"
        })
        assert query_res.status_code == 200
        query_data = query_res.json()
        assert query_data["is_abstained"] is False
        assert len(query_data["citations"]) >= 1
        assert query_data["citations"][0]["document_name"] == "Tax_Audit_44AB.txt"

        # 4. Query Assistant on Unsupported Topic (Verify Abstention)
        query_unsupported = await ac.post("/api/v1/chat/query", json={
            "workspace_id": ws_id,
            "query": "What is the penalty under Transfer Pricing Form 3CEB?"
        })
        assert query_unsupported.status_code == 200
        unsupported_data = query_unsupported.json()
        assert unsupported_data["is_abstained"] is True
        assert "not provide sufficient evidence" in unsupported_data["answer"]
        assert len(unsupported_data["citations"]) == 0
