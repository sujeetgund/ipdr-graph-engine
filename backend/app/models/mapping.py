from pydantic import BaseModel
from typing import Optional


class IPDRLog(BaseModel):
    timestamp: str
    session_id: Optional[str]
    src_ip: str
    src_port: int
    src_phone: str
    dst_ip: str
    dst_port: int
    dst_phone: str
    protocol: str
    duration_sec: int
    bytes: int
    cell_tower_lat: float
    cell_tower_lon: float
    

class Node(BaseModel):
    node_id: str
    ip: str
    phone: str

class Edge(BaseModel):
    session_id: str
    timestamp: str
    protocol: str
    duration_sec: int
    bytes: int
    src: Node
    dst: Node
    cell_tower_lat: float
    cell_tower_lon: float
