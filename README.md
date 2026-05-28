# 🐔 RFID Chicks — Chicken Supply Chain Traceability

**RFID-based poultry traceability system: farm-to-retail tracking with IoT checkpoints.**

## Overview

RFID Chicks is an end-to-end poultry supply chain traceability platform. It uses **UHF RFID (RAIN RFID)** tags at the batch/crate level, **IoT environmental sensors**, and optional **blockchain anchoring** to create an immutable, auditable record of every chicken's journey — from hatchery to supermarket shelf.

## Why This Matters

- **Food Safety**: Rapid recall isolation (minutes vs. days)
- **Consumer Trust**: Scan-to-know provenance
- **Regulatory Compliance**: FDA FSMA 204, EU Farm-to-Fork, CFIA traceability mandates
- **Efficiency**: Real-time inventory, automated checkpoint logging, cold-chain monitoring

## Supply Chain Journey

```
🏭 HATCHERY          🚛 TRANSPORT        🏭 PROCESSING
[RFID assigned]  →  [Temp/GPS log]  →  [Grading/Pack]
                                           |
🏪 RETAIL             🚛 DISTRIBUTION      📦 COLD CHAIN
[QR + RFID]      ←  [Last-mile log]   ←  [Temp monitoring]
     |
  👤 CONSUMER
  [Scan QR → full history]
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CONSUMER LAYER                     │
│         QR Scan → Product Journey Web App           │
├─────────────────────────────────────────────────────┤
│                   API LAYER (FastAPI)                │
│    REST endpoints / WebSocket for real-time alerts   │
├─────────────────────────────────────────────────────┤
│              CHECKPOINT MIDDLEWARE                   │
│   RFID tag reads → normalized events → PostgreSQL   │
│   IoT sensor data → time-series → alerting engine   │
├─────────────────────────────────────────────────────┤
│             HARDWARE / EDGE LAYER                    │
│  UHF RFID readers | Temp/humidity sensors | GPS     │
│  ESP32/Arduino gateways at each checkpoint          │
├─────────────────────────────────────────────────────┤
│            BLOCKCHAIN LAYER (Optional)               │
│    Hyperledger Fabric or Ethereum L2                │
│    Immutable event hashes for auditability          │
└─────────────────────────────────────────────────────┘
```

## Key Checkpoints

| Stage | Checkpoint | Data Captured |
|-------|-----------|--------------|
| 1. Hatchery | RFID tag assignment | Batch ID, breed, hatch date, vaccine records |
| 2. Farm | Coop entry/exit RFID gates | Growth data, feed logs, health events |
| 3. Transport | Truck RFID + IoT sensors | Temperature, humidity, GPS route, duration |
| 4. Processing | Conveyor RFID scan | Slaughter date, grade, weight, inspection |
| 5. Packaging | Box/crate RFID → QR link | Pack date, best-before, batch mapping |
| 6. Cold Storage | Warehouse RFID gates | Storage temp history, entry/exit timestamps |
| 7. Distribution | Last-mile RFID + GPS | Delivery route, handoff signature |
| 8. Retail | Store receiving scan | Shelf placement, inventory sync |
| 9. Consumer | QR code scan | Full provenance, certifications, farm story |

## Technology Stack

- **RFID**: UHF RAIN RFID (Impinj or similar) — 860-960 MHz
- **Gateway**: ESP32 / Raspberry Pi at each checkpoint
- **Backend**: Python FastAPI + PostgreSQL + Redis
- **IoT**: MQTT for sensor data streaming
- **Blockchain**: Hyperledger Fabric (permissioned, supply-chain optimized)
- **Frontend**: React / Next.js dashboard + consumer QR page
- **Deploy**: Docker Compose, Kubernetes-ready

## Getting Started

```bash
# Clone
git clone https://github.com/Parklan2046/rfidchicks
cd rfidchicks

# Start backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Start with Docker
docker-compose up -d
```

## Project Status

🚧 **Phase 1 — Research & Architecture** (Current)
- [x] Supply chain mapping
- [x] System architecture design
- [ ] Hardware prototype
- [ ] Backend API
- [ ] Pilot deployment

## License

MIT — Parklan2046
