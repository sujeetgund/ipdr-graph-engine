import json
import joblib
import pandas as pd
from typing import List
from app.utils.preprocessing import compute_features_from_row
from app.models.session import AnomalyPrediction
from app.core.config import settings
from fastapi import HTTPException
import logging
from catboost import CatBoostClassifier


logger = logging.getLogger(__name__)


class AnomalyDetector:
    def __init__(self):
        self.model = CatBoostClassifier()
        self.model.load_model(settings.MODEL_PATH)
        if self.model is None:
            raise HTTPException(
                status_code=500, detail="The model is not loaded successfully"
            )

        with open(settings.FEATURE_ORDER_PATH, "r") as f:
            self.feature_order = json.load(f)

        # In-memory store for last-seen timestamps keyed by phone or src_ip
        self.last_seen = {}

    async def cleanup(self):
        """Clean up resources used by the anomaly detector."""
        logger.info("Cleaning up resources in AnomalyDetector")
        self.model = None
        self.feature_order = None
        self.last_seen = {}

    def preprocess_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess the input DataFrame by creating new features.

        Args:
            df (pd.DataFrame): Input DataFrame containing session data.

        Returns:
            pd.DataFrame: Preprocessed DataFrame with new features.
        """
        # Create Feature: Time-based features
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df["hour_of_day"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek

        # Create Feature: bytes per second
        if "bytes" in df.columns and "duration_sec" in df.columns:
            df["bytes_per_second"] = df["bytes"] / df["duration_sec"].replace(0, 1)
        else:
            df["bytes_per_second"] = 0

        # Create Features: OneHotEncode Protocol
        df["protocol_HTTP"] = df["protocol"].apply(lambda x: 1 if x == "HTTP" else 0)
        df["protocol_HTTPS"] = df["protocol"].apply(lambda x: 1 if x == "HTTPS" else 0)
        df["protocol_SIP"] = df["protocol"].apply(lambda x: 1 if x == "SIP" else 0)
        df["protocol_TCP"] = df["protocol"].apply(lambda x: 1 if x == "TCP" else 0)
        df["protocol_UDP"] = df["protocol"].apply(lambda x: 1 if x == "UDP" else 0)

        # Select features
        return df[self.feature_order]

    def predict(self, sessions_df: pd.DataFrame) -> List[AnomalyPrediction]:
        """Predict anomalies for a batch of sessions.

        Args:
            sessions_df (pd.DataFrame): DataFrame containing session data.

        Returns:
            List[AnomalyPrediction]: List of prediction results for each session.
        """
        X = self.preprocess_df(sessions_df)
        if X.empty:
            return []

        # Get probabilities
        probs = (
            self.model.predict_proba(X)
            if hasattr(self.model, "predict_proba")
            else None
        )

        results = []
        for idx, prob in enumerate(probs):
            session_id = sessions_df.iloc[idx]["session_id"]
            results.append(
                {
                    "session_id": session_id,
                    "anomaly": 1 if prob[1] > 0.5 else 0,
                    "confidence_score": float(prob[1]) if probs is not None else None,
                }
            )
        return results
