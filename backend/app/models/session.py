from pydantic import BaseModel, Field, IPvAnyAddress
from typing import Optional


class Session(BaseModel):
    timestamp: str
    session_id: str
    src_port: int
    dst_port: int
    protocol: str
    duration_sec: float = Field(..., alias="duration_sec")
    bytes: float
    cell_tower_lat: Optional[float] = None
    cell_tower_lon: Optional[float] = None


class AnomalyPrediction(BaseModel):
    session_id: Optional[str]
    anomaly: int
    confidence_score: Optional[float] = None
