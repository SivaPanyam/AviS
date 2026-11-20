import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.entities import UserRole, DocumentStatus

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)

class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str
    created_at: datetime

class UserCreate(BaseModel):
    workspace_id: uuid.UUID
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.MEMBER

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    workspace_id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

class DocumentUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    workspace_id: uuid.UUID
    filename: str
    file_type: str
    file_size_bytes: int
    content_hash: str
    status: DocumentStatus
    chunk_count: int
    created_at: datetime

class ChatQueryRequest(BaseModel):
    workspace_id: uuid.UUID
    query: str = Field(..., min_length=1)

class CitationItem(BaseModel):
    tag: str
    document_name: str
    page_number: int | str
    chunk_id: str

class ChatQueryResponse(BaseModel):
    answer: str
    is_abstained: bool
    citations: list[CitationItem]
