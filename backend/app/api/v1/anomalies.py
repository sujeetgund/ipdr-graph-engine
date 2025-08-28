from fastapi import APIRouter, Depends
import pandas as pd
from typing import List
from fastapi import HTTPException
from app.models.session import Session, AnomalyPrediction
from app.services.anomaly_detector import AnomalyDetector

router = APIRouter(prefix="/api/v1/anomalies")


async def get_anomaly_detector() -> AnomalyDetector:
    from app.main import anomaly_detector

    if anomaly_detector is None:
        raise HTTPException(
            status_code=500, detail="Anomaly Detector service not initialized"
        )
    return anomaly_detector


@router.post("/predict", response_model=List[AnomalyPrediction])
async def predict_batch(
    request: List[Session], detector: AnomalyDetector = Depends(get_anomaly_detector)
):
    """
    Predict anomalies for a batch of sessions.

    - **request**: A list of session data to analyze.
    - **detector**: An instance of the AnomalyDetector service.

    Returns:
        A list of anomaly predictions for each session.
    """
    rows = [s.dict(by_alias=True) for s in request]
    input_df = pd.DataFrame(rows)
    results = detector.predict(input_df)
    return results
