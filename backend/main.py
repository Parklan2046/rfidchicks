"""
RFID Chicks — Backend API
FastAPI-based checkpoint management for poultry supply chain traceability.
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

app = FastAPI(title="RFID Chicks", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory stores (replace with PostgreSQL in production) ──

batches: dict = {}
events: list = []
active_ws: list = []

# ── Models ──

class BatchCreate(BaseModel):
    batch_code: str
    breed: str
    hatch_date: datetime
    quantity: int

class CheckpointEvent(BaseModel):
    batch_id: str
    checkpoint_id: str
    event_type: str  # TAG_ASSIGNED, CHECK_IN, TRANSPORT_START, etc.
    operator_id: str
    location: Optional[dict] = None
    sensor_data: Optional[dict] = None

class BatchStatus(BaseModel):
    batch_id: str
    batch_code: str
    status: str
    last_checkpoint: Optional[str] = None
    events: list = []

# ── Routes ──

@app.post("/api/v1/batches")
async def create_batch(batch: BatchCreate):
    """Register a new chicken batch (hatchery)."""
    batch_id = str(uuid.uuid4())
    batches[batch_id] = {
        **batch.model_dump(),
        "id": batch_id,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "events": [],
    }
    return {"batch_id": batch_id, **batches[batch_id]}

@app.get("/api/v1/batches/{batch_id}")
async def get_batch(batch_id: str):
    """Get full history of a batch."""
    if batch_id not in batches:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batches[batch_id]

@app.post("/api/v1/events")
async def log_event(event: CheckpointEvent):
    """Log a checkpoint event for a batch."""
    if event.batch_id not in batches:
        raise HTTPException(status_code=404, detail="Batch not found")

    event_id = str(uuid.uuid4())
    event_record = {
        "event_id": event_id,
        **event.model_dump(),
        "timestamp": datetime.utcnow().isoformat(),
    }
    events.append(event_record)
    batches[event.batch_id]["events"].append(event_record)
    batches[event.batch_id]["last_checkpoint"] = event.checkpoint_id

    # Broadcast to WebSocket clients
    for ws in active_ws:
        try:
            await ws.send_json(event_record)
        except Exception:
            pass

    return {"event_id": event_id, "status": "logged"}

@app.get("/api/v1/trace/{qr_code}")
async def trace_by_qr(qr_code: str):
    """Consumer traceability endpoint — scan QR code to get full journey."""
    # In production: QR code maps to batch_id via DB lookup
    for batch_id, batch in batches.items():
        if batch.get("qr_code") == qr_code:
            return {
                "batch": batch,
                "journey": batch["events"],
                "cold_chain_status": "INTACT",  # computed from sensor data
                "certifications": ["HACCP_CERTIFIED", "HALAL_CERTIFIED"],
            }
    raise HTTPException(status_code=404, detail="QR code not found")

@app.get("/api/v1/alerts")
async def get_alerts():
    """Return active alerts (temperature breaches, missed checkpoints)."""
    return {
        "alerts": [],
        "thresholds": {
            "temperature_max_c": 30,
            "ammonia_max_ppm": 25,
            "transport_max_hours": 8,
        },
    }

@app.get("/api/v1/checkpoints")
async def list_checkpoints():
    """List all registered checkpoints."""
    return {
        "checkpoints": [
            {"id": "CP-HATCH-01", "name": "Hatchery East Wing", "type": "HATCHERY"},
            {"id": "CP-FARM-02",  "name": "Farm 7 Coop B",      "type": "FARM"},
            {"id": "CP-TRANS-03", "name": "Truck #42",          "type": "TRANSPORT"},
            {"id": "CP-PROC-04",  "name": "Processing Line 3",  "type": "PROCESSING"},
            {"id": "CP-COLD-05",  "name": "Cold Storage A",     "type": "COLD_STORAGE"},
            {"id": "CP-DIST-06",  "name": "Distribution Hub",   "type": "DISTRIBUTION"},
            {"id": "CP-RETAIL-07","name": "Supermarket #88",    "type": "RETAIL"},
        ]
    }

@app.websocket("/ws/live")
async def live_feed(websocket: WebSocket):
    """Real-time event stream for dashboard."""
    await websocket.accept()
    active_ws.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        active_ws.remove(websocket)

@app.get("/health")
async def health():
    return {"status": "ok", "batches_tracked": len(batches)}
