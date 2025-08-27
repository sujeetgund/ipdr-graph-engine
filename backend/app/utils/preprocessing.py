# backend/app/utils/preprocessing.py
from datetime import datetime
from typing import Dict, Any
import math

def parse_timestamp(ts_str: str) -> datetime:
    # Expect ISO-like or "YYYY-MM-DD" style; adapt if you have a different format
    # Try flexible parsing:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(ts_str, fmt)
        except Exception:
            pass
    # fallback to fromisoformat
    return datetime.fromisoformat(ts_str)

def port_category(dst_port: int) -> int:
    """
    Simple categorical rule:
      0 -> well-known / system ports (<1024)
      1 -> ephemeral / high ports (>=1024)
      2 -> uncommon negative/invalid ports (fallback)
    """
    try:
        p = int(dst_port)
    except Exception:
        return 2
    if p < 0:
        return 2
    return 0 if p < 1024 else 1

def compute_features_from_row(
    row: Dict[str, Any],
    last_seen_store: Dict[str, datetime],
    default_time_since: float = 24*3600.0
) -> Dict[str, float]:
    """
    Input row keys expected (case-insensitive):
      timestamp, session_id, src_ip, src_port, dst_ip, dst_port,
      protocol, duration_s, bytes, phone_number, cell_tower_lat, cell_tower_lon
    Returns feature dict aligned to your model's feature names.
    """
    ts_raw = row.get("timestamp") or row.get("time") or row.get("ts")
    ts = parse_timestamp(ts_raw) if ts_raw else None

    duration = float(row.get("duration_s") or row.get("duration") or 0)
    byte_count = float(row.get("bytes") or row.get("data_bytes") or 0)

    # Derived features
    hour_of_day = ts.hour if ts else 0
    day_of_week = ts.weekday() if ts else 0

    bytes_per_second = (byte_count / duration) if duration > 0 else 0.0

    # time_since_last_session: prefer phone_number key, then src_ip
    key = None
    if row.get("phone_number"):
        key = str(row.get("phone_number"))
    elif row.get("src_ip"):
        key = str(row.get("src_ip"))
    last_seen = last_seen_store.get(key)
    if last_seen and ts:
        time_since_last_session = (ts - last_seen).total_seconds()
    else:
        time_since_last_session = default_time_since

    # update last seen
    if key and ts:
        last_seen_store[key] = ts

    dst_port = int(row.get("dst_port") or row.get("dstPort") or 0)
    port_category_num = port_category(dst_port)

    # Map to feature names
    features = {
        "duration_sec": duration,
        "bytes": byte_count,
        "hour_of_day": hour_of_day,
        "day_of_week": day_of_week,
        "time_since_last_session": time_since_last_session,
        "bytes_per_second": bytes_per_second,
        "port_category_num": port_category_num
    }
    return features
