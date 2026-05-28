# System Architecture — RFID Chicks

## High-Level Architecture

```
                           ┌──────────────┐
                           │  CONSUMER     │
                           │  QR Scan App  │
                           └──────┬───────┘
                                  │ HTTPS
                           ┌──────▼───────┐
                           │   FRONTEND    │
                           │  React/Next   │
                           └──────┬───────┘
                                  │ REST / WS
                           ┌──────▼───────┐
                           │  API GATEWAY  │
                           │   (FastAPI)   │
                           └──────┬───────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
           ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
           │  PostgreSQL  │ │  Redis    │ │  InfluxDB   │
           │  (Events)    │ │  (Cache)  │ │  (Sensors)  │
           └──────────────┘ └───────────┘ └─────────────┘
                  │
           ┌──────▼──────┐
           │  BLOCKCHAIN  │ (optional layer)
           │  Fabric/ETH  │
           └──────────────┘
                  ▲
                  │ MQTT
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌────▼────┐   ┌───▼───┐
│ ESP32 │   │  ESP32  │   │ ESP32 │   ... (N checkpoints)
│Farm   │   │Transport│   │Retail │
└───┬───┘   └────┬────┘   └───┬───┘
    │            │            │
 ┌──▼──┐     ┌──▼──┐     ┌──▼──┐
 │RFID │     │RFID │     │RFID │
 │Reader│    │Reader│    │Reader│
 └─────┘     │GPS+  │     └─────┘
             │Temp  │
             └──────┘
```

## Core Components

### 1. Edge Layer (ESP32 Gateway)

- Reads RFID events from UHF reader via UART
- Collects sensor data (temp, humidity, NH₃, GPS) via I²C
- Publishes to MQTT broker with JSON payloads
- Local microSD buffer for offline operation (< 48hr buffer)

**MQTT Topics**:
```
rfidchicks/{checkpoint_id}/rfid/read
rfidchicks/{checkpoint_id}/sensors/temperature
rfidchicks/{checkpoint_id}/sensors/humidity
rfidchicks/{checkpoint_id}/sensors/gps
rfidchicks/{checkpoint_id}/alerts
```

### 2. MQTT Broker (Mosquitto)

- Lightweight, handles 10k+ concurrent connections
- TLS encrypted transport
- Topic-based routing → Backend subscribers

### 3. Backend API (FastAPI)

**Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/batches` | Register new batch |
| GET | `/api/v1/batches/{id}` | Get batch full history |
| POST | `/api/v1/events` | Log checkpoint event |
| GET | `/api/v1/trace/{qr_code}` | Consumer trace lookup |
| GET | `/api/v1/alerts` | Active alerts |
| WS | `/ws/live` | Real-time checkpoint feed |

**Internal Services**:
- `EventProcessor`: Normalizes RFID/IoT events → PostgreSQL
- `AlertEngine`: Checks sensor thresholds → SMS/email
- `BlockchainAnchor`: Hashes batch events → on-chain

### 4. Database Schema

```
batches
├── id (UUID)
├── batch_code (str)
├── breed (str)
├── hatch_date (datetime)
├── quantity (int)
├── status (enum: ACTIVE, PROCESSED, SHIPPED, SOLD)
└── created_at

checkpoints
├── id (UUID)
├── name (str)
├── type (enum: HATCHERY, FARM, TRANSPORT, ...)
├── location (lat, lng)
└── gateway_id (str)

events
├── id (UUID)
├── batch_id (FK → batches)
├── checkpoint_id (FK → checkpoints)
├── event_type (enum)
├── timestamp (datetime)
├── operator_id (str)
├── sensor_data (JSONB)
├── blockchain_tx (str, nullable)
└── created_at

sensor_readings (timeseries → InfluxDB)
├── checkpoint_id
├── sensor_type
├── value
└── timestamp
```

### 5. Blockchain Layer (Optional)

- **Hyperledger Fabric**: Permissioned, private channel per supply chain partner
- **What goes on-chain**: Event hashes (SHA-256), batch genealogy, certification proofs
- **What stays off-chain**: Full sensor data, operator details, PII
- **Why blockchain**: Immutable audit trail for regulators, shared trust between partners without central authority

### 6. Consumer Frontend

- Mobile-responsive web app
- QR code scan → `/trace/{qr_code}` → renders journey timeline
- Shows: farm → transport → processing → retail timeline
- Cold-chain integrity badge (green/yellow/red)
- Certification badges (organic, halal, free-range)

## Deployment

```yaml
# docker-compose.yml
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
  postgres:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
  redis:
    image: redis:alpine
  mosquitto:
    image: eclipse-mosquitto
    ports: ["1883:1883", "9001:9001"]
  influxdb:
    image: influxdb:2.7
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
```
