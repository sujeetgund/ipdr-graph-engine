from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1 import anomalies_router, mappings_router
from app.services.anomaly_detector import AnomalyDetector
from app.services.a2b_mapper import A2BMapper
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

anomaly_detector = None
a2b_mapper = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global anomaly_detector
    # Load Anomaly Detector once at startup
    anomaly_detector = AnomalyDetector()
    logger.info("✅ Anomaly Detector service loaded")

    global a2b_mapper
    # Load A2B Mapper once at startup
    a2b_mapper = A2BMapper()
    logger.info("✅ A2B Mapper service loaded")

    yield
    # Cleanup at shutdown
    anomaly_detector.cleanup()
    logger.info("🛑 Anomaly Detector service disposed")
    a2b_mapper.cleanup()
    logger.info("🛑 A2B Mapper service disposed")


app = FastAPI(
    title="IPDR Graph Engine",
    version="0.1.0",
    description="Detect anomalous sessions and map A→B relationships from IPDR logs.",
    lifespan=lifespan,
)

# Routers
app.include_router(anomalies_router, tags=["Anomalies"])
app.include_router(mappings_router, tags=["Mappings"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
