from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOCAL_DATA_DIR = BASE_DIR / "data"
LOCAL_DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "AviS - Private Business AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Desktop Embedded vs External Database Toggle
    USE_SQLITE: bool = True
    SQLITE_DB_PATH: Path = LOCAL_DATA_DIR / "avis_local.db"
    
    # External Postgres fallback (if USE_SQLITE is False)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "avis"
    POSTGRES_PASSWORD: str = "avis_secret"
    POSTGRES_DB: str = "avis_db"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.USE_SQLITE:
            return f"sqlite+aiosqlite:///{self.SQLITE_DB_PATH.as_posix()}"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    # Embedded Qdrant (Zero Docker needed)
    USE_EMBEDDED_QDRANT: bool = True
    QDRANT_STORAGE_PATH: Path = LOCAL_DATA_DIR / "qdrant_local"
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    
    # Document storage directory
    DOCUMENT_STORAGE_DIR: Path = LOCAL_DATA_DIR / "documents"
    
    # Security
    SECRET_KEY: str = "avis-desktop-local-insecure-key-1234567890"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days for local desktop
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
settings.DOCUMENT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.QDRANT_STORAGE_PATH.mkdir(parents=True, exist_ok=True)
