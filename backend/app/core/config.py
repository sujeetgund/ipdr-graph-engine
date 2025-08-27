from dotenv import load_dotenv
from pathlib import Path
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "IPDR Graph Engine"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "A graph-based engine for IPDR data processing"

    ARTIFACT_DIR: Path = Path("artifacts")
    MODEL_PATH: Path = ARTIFACT_DIR / "ensemble_voting_classifier.pkl"
    FEATURE_ORDER_PATH: Path = ARTIFACT_DIR / "anomaly_detection_feature_order.json"


settings = Settings()
