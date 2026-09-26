import os

class Settings:
    PROJECT_NAME: str = "onemoon-ml-service"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("ML_SERVICE_PORT", "8000"))
    HOST: str = os.getenv("ML_SERVICE_HOST", "0.0.0.0")

settings = Settings()
