from pydantic import BaseModel, Field, IPvAnyAddress
from typing import List, Optional

class SessionIn(BaseModel):
    timestamp: str
    session_id: str
    src_ip: str
    src_port: int
    dst_ip: str
    dst_port: int
    protocol: str
    duration_s: float = Field(..., alias="duration_s")
    bytes: float
    phone_number: Optional[str] = None
    cell_tower_lat: Optional[float] = None
    cell_tower_lon: Optional[float] = None

class PredictionOut(BaseModel):
    session_id: Optional[str]
    anomaly: int
    score: Optional[float] = None
