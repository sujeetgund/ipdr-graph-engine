from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field, IPvAnyAddress
from typing import List, Optional
from fastapi import HTTPException
from app.models.session import SessionIn, PredictionOut
from app.services.anomaly_detector import AnomalyDetector

router = APIRouter(prefix="/api/v1/anomalies")

async def get_anomaly_detector() -> AnomalyDetector:
    from app.main import anomaly_detector
    if anomaly_detector is None:
        raise HTTPException(status_code=500, detail="Anomaly Detector not initialized")
    return anomaly_detector

@router.post("/predict_batch", response_model=List[PredictionOut])
async def predict_batch(request: List[SessionIn], detector: AnomalyDetector = Depends(get_anomaly_detector)):
    rows = [s.dict(by_alias=True) for s in request]
    results = detector.predict_batch(rows)
    return results