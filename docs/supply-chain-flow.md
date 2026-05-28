# Supply Chain Flow — Farm to Retail

## 1. 🏭 Hatchery

**RFID Event**: `TAG_ASSIGNED`

| Field | Value |
|-------|-------|
| Batch ID | `BATCH-YYYYMMDD-XXX` |
| Breed | e.g. Cobb 500, Ross 308 |
| Hatch Date | ISO 8601 |
| Quantity | # of chicks in batch |
| Vaccine | Marek's, NDV, IBV records |
| RFID Tag Type | UHF RAIN RFID, attached to transport crate |

**Hardware**: UHF RFID printer-encoder (e.g., Zebra ZT411 RFID) at crate packing station.

---

## 2. 🐔 Farm (Grow-out)

**RFID Events**: `CHECK_IN`, `HEALTH_LOG`, `FEED_LOG`, `CHECK_OUT`

Checkpoints:
- Coop entry RFID gate — logs which batch entered which house
- Weekly health scan — handheld RFID reader logs individual health flags
- Feed consumption — RFID-tagged feed bins linked to batches
- Mortality tracking — removed birds scanned out
- Exit scan — batch leaves for processing

**IoT Sensors**:
- Ammonia (NH₃) — 0-25 ppm threshold
- Temperature — 18-24°C ideal
- Humidity — 50-70% RH

---

## 3. 🚛 Live Transport

**RFID Events**: `TRANSPORT_START`, `TRANSPORT_END`

| Data | Source |
|------|--------|
| Crate RFID scan | Loading dock reader |
| Truck temp/humidity | IoT sensor → MQTT |
| GPS route | Vehicle tracker |
| Travel duration | Start/end timestamps |
| Driver ID | RFID badge |

**Alert thresholds**: Temp > 30°C for > 30 min → SMS alert to logistics manager.

---

## 4. 🏭 Processing Plant

**RFID Events**: `SLAUGHTER`, `GRADE`, `PACKAGE`

- Incoming crate scan → batch verified
- Post-slaughter: RFID tag on hook/conveyor → links carcass to batch
- USDA/CFIA inspection → digital sign-off
- Grading (A/B/C) → linked to RFID
- Packaging: **UHF RFID → QR code mapping** created
  - Each packaged product gets a unique QR
  - QR links to batch RFID history in backend

---

## 5. 📦 Cold Chain / Warehouse

**RFID Events**: `COLD_STORAGE_IN`, `TEMP_LOG`, `COLD_STORAGE_OUT`

- RFID gate at warehouse dock
- Continuous temperature logging (every 15 min)
- FIFO inventory management via RFID location tracking
- Exit scan → next destination logged

---

## 6. 🚛 Distribution

**RFID Events**: `DIST_START`, `DIST_END`

- Last-mile delivery tracking
- Handoff confirmation at retail (RFID badge of receiver)
- GPS + timestamp for delivery SLA monitoring

---

## 7. 🏪 Retail

**RFID Events**: `RETAIL_RECEIVE`, `SHELF_PLACE`, `SOLD`

- Receiving dock RFID scan → enters store inventory
- Shelf-level RFID for real-time stock
- POS scan → `SOLD` event triggers inventory update
- Expiry monitoring → alert for approaching best-before

---

## 8. 👤 Consumer

**Consumer Action**: Scan QR code on package

→ Resolves to a web page showing:
- Farm of origin (with location)
- Breed & hatch date
- Processing date & plant
- Cold chain integrity (was temp maintained?)
- Certifications (organic, free-range, halal, etc.)
- Full journey timeline

---

## Data Schema (Core Events)

```json
{
  "event_id": "evt_abc123",
  "event_type": "TRANSPORT_START",
  "batch_id": "BATCH-20260528-042",
  "timestamp": "2026-05-28T14:30:00Z",
  "location": { "lat": 22.3193, "lng": 114.1694 },
  "checkpoint": "FARM_EXIT_GATE_B",
  "operator_id": "OP-007",
  "sensor_data": {
    "temperature_c": 22.5,
    "humidity_pct": 65
  },
  "blockchain_tx": "0x7a3b... (optional)"
}
```
