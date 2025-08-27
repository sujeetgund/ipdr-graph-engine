import json
import joblib
import pandas as pd
from typing import Dict, Any, List
from app.utils.preprocessing import compute_features_from_row
from app.core.config import settings
from fastapi import HTTPException


class AnomalyDetector:
    def __init__(self):
        self.model = joblib.load(settings.MODEL_PATH)
        if self.model is None:
            raise HTTPException(status_code=500, detail="The model is not loaded successfully")
        
        with open(settings.FEATURE_ORDER_PATH, "r") as f:
            self.feature_order = json.load(f)
        
        # In-memory store for last-seen timestamps keyed by phone or src_ip
        self.last_seen = {}
    
    def cleanup(self):
        self.model = None
        self.feature_order = None
        self.last_seen = {}

    def prepare_dataframe(self, sessions: List[Dict[str, Any]]) -> pd.DataFrame:
        rows = []
        for row in sessions:
            feats = compute_features_from_row(row, self.last_seen)
            # Keep original session_id for mapping back
            feats["_session_id"] = row.get("session_id") or row.get("sessionId") or None
            rows.append(feats)
        if not rows:
            return pd.DataFrame(columns=self.feature_order + ["_session_id"])

        df = pd.DataFrame(rows)
        # Ensure all feature columns exist and in desired order
        for col in self.feature_order:
            if col not in df.columns:
                df[col] = 0.0
        df = df[self.feature_order + ["_session_id"]]

        return df

    def predict_batch(self, sessions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Returns list of dicts: [{session_id, prediction, probability(if available)}...]
        prediction = 0 => Normal
        prediction = 1 => Anomaly
        """
        df = self.prepare_dataframe(sessions)
        if df.empty:
            return []
        X = df[self.feature_order]
        # Some models support predict_proba
        try:
            probs = self.model.predict_proba(X) if hasattr(self.model, "predict_proba") else None
        except Exception:
            probs = None
        preds = self.model.predict(X)
        
        results = []
        for idx, pred in enumerate(preds):
            session_id = df.iloc[idx]["_session_id"]
            prob = float(probs[idx][1]) if probs is not None else None
            results.append({"session_id": session_id, "anomaly": int(pred), "score": prob})
        return results
