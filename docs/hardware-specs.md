# Hardware Specification — RFID Chicks

## RFID Technology Choice: UHF RAIN RFID

| Parameter | Spec |
|-----------|------|
| Frequency | 860-960 MHz (UHF) |
| Standard | EPC Gen2v2 (ISO 18000-63) |
| Read Range | Up to 10 meters |
| Read Speed | Up to 1,000 tags/second |
| Tag Type | Passive (no battery) |
| Tag Form Factor | Adhesive label, hard tag for crates, or embeddable |
| Cost per Tag | $0.05 - $0.15 USD (bulk) |

## Checkpoint Hardware

### 1. RFID Readers

**Fixed Readers** (gates, conveyors, dock doors):
- Model: Impinj Speedway R420 or Zebra FX9600
- Antennas: 4-port, circular-polarized UHF
- Mounting: Overhead gate frame, conveyor side-mount

**Handheld Readers** (farm health checks, inventory):
- Model: Zebra MC3330R or Chainway C72 UHF
- Range: 3-5 meters
- Battery: Full-shift operation

**Embedded Readers** (low-cost checkpoints):
- Module: ThingMagic Nano or Impinj RS1000
- Integration: ESP32 via UART/SPI
- Cost: ~$50-100 per checkpoint

### 2. IoT Sensor Kits

| Sensor | Model | Range | Interface |
|--------|-------|-------|-----------|
| Temperature/Humidity | DHT22 / SHT31 | -40~80°C, 0-100% RH | I²C |
| Ammonia (NH₃) | MQ-135 | 10-1000 ppm | Analog → ADC |
| GPS | NEO-6M | ±2.5m accuracy | UART |
| Accelerometer | MPU6050 | Motion/tilt | I²C |

### 3. Gateway Device

**ESP32 Development Board**:
- WiFi + Bluetooth (dual-mode)
- 2× I²C, 3× UART, SPI
- MQTT client → sensor data to cloud
- Local buffer: microSD for offline logging
- Power: 5V USB or 12V DC with battery backup

**Alternative**: Raspberry Pi Zero 2 W (for heavier processing needs)

### 4. Network Architecture

```
RFID Reader ──→ ESP32 Gateway ──MQTT──→ Broker (Mosquitto)
IoT Sensors ──→                          │
                                         ├──→ Backend API (FastAPI)
                                         ├──→ Time-series DB (InfluxDB)
                                         └──→ Alert Engine
```

## Tag Attachment Methods

| Stage | Method | Tag Type |
|-------|--------|----------|
| Hatchery crate | Cable tie hard tag | Reusable UHF hard tag |
| Farm coop | Mounted on door frame (batch-level) | Fixed reader + batch ID |
| Processing hook | Food-grade UHF label | Single-use adhesive |
| Retail package | Printed QR with RFID inlay | Smart label |
| Pallet | RFID label on side | 4×6" UHF label |

## Cost Estimate (Per Farm)

| Item | Qty | Unit Cost | Total |
|------|-----|-----------|-------|
| Fixed UHF Reader | 2 | $1,200 | $2,400 |
| Handheld Reader | 1 | $800 | $800 |
| ESP32 Gateway + Sensors | 3 | $60 | $180 |
| RFID Tags (10,000) | 1 batch | $0.10/ea | $1,000 |
| **Total Hardware** | | | **~$4,380** |

Not including: cloud hosting, software development, installation labor.
