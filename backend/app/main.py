from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1 import anomalies
import joblib
from app.core.config import settings
from app.services.anomaly_detector import AnomalyDetector
import logging

logger = logging.getLogger(__name__)

anomaly_detector = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global anomaly_detector
    # Load Anomaly Detector once at startup
    anomaly_detector = AnomalyDetector()
    logger.info("✅ Anomaly Detector service loaded")
    yield
    # Cleanup at shutdown
    anomaly_detector.cleanup()
    logger.info("🛑 Anomaly Detector service disposed")

app = FastAPI(
    title="IPDR Graph Engine",
    version="0.1.0",
    description="Detect anomalous sessions and map A→B relationships from IPDR logs.",
    lifespan=lifespan
)

# Routers
app.include_router(anomalies.router, tags=["Anomalies"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
