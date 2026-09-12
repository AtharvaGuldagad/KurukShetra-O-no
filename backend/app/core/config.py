from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/disaster_relief"
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = ""  # Agent A only — set in .env if available
    QLORA_MODEL_PATH: str = ""  # Reserved for future fine-tuned model

    class Config:
        env_file = ".env"

settings = Settings()