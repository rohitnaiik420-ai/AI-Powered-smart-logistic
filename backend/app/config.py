import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Multimodal Smart Logistics Management Platform"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./logistics.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "enterprise_multimodal_logistics_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Simulation Settings
    SIMULATION_TICK_RATE_SECONDS: float = 2.0
    SIMULATION_DEFAULT_SPEED: float = 1.0

settings = Settings()
