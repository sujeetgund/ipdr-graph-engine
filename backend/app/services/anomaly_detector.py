import json
import joblib
import pandas as pd
from typing import List
from app.utils.preprocessing import compute_features_from_row
from app.models.session import AnomalyPrediction
from app.core.config import settings
from fastapi import HTTPException
import logging


logger = logging.getLogger(__name__)


class AnomalyDetector:
    def __init__(self):
        self.model = joblib.load(settings.MODEL_PATH)
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
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
            df["hour_of_day"] = df["timestamp"].dt.hour
            df["day_of_week"] = df["timestamp"].dt.dayofweek
            df = df.sort_values(["phone_number", "timestamp"])
            df["time_since_last_session"] = (
                df.groupby("phone_number")["timestamp"]
                .diff()
                .dt.total_seconds()
                .fillna(0)
            )
        else:
            df["hour_of_day"] = df["hour_of_day"] if "hour_of_day" in df.columns else 0
            df["day_of_week"] = df["day_of_week"] if "day_of_week" in df.columns else 0
            df["time_since_last_session"] = (
                df["time_since_last_session"]
                if "time_since_last_session" in df.columns
                else 0
            )

        # Create Feature: bytes per second
        if "bytes" in df.columns and "duration_sec" in df.columns:
            df["bytes_per_second"] = df["bytes"] / df["duration_sec"].replace(0, 1)
        else:
            df["bytes_per_second"] = 0

        # Create Feature: port category
        common_ports = set([80, 443, 53, 22, 25, 110, 143, 21, 23, 8080, 5060, 5061])
        if "dst_port" in df.columns:
            df["port_category"] = df["dst_port"].apply(
                lambda x: "common" if x in common_ports else "unusual"
            )
            port_category_map = {"common": 0, "unusual": 1}
            df["port_category_num"] = df["port_category"].map(port_category_map)
        else:
            df["port_category_num"] = 0

        # Create Feature: protocol consistency
        if "protocol" in df.columns and "phone_number" in df.columns:
            protocol_mode = df.groupby("phone_number")["protocol"].agg(
                lambda x: x.mode()[0] if not x.mode().empty else None
            )
            df = df.merge(
                protocol_mode.rename("most_common_protocol"),
                left_on="phone_number",
                right_index=True,
            )
            df["protocol_consistency_score"] = (
                df["protocol"] == df["most_common_protocol"]
            ).astype(int)
            df.drop("most_common_protocol", axis=1, inplace=True)
        else:
            df["protocol_consistency_score"] = 0

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
