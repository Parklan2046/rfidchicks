# ESP32 RFID Gateway — Arduino Sketch

## Setup

1. **Arduino IDE**: Install ESP32 board support
2. **Libraries**: `PubSubClient`, `ArduinoJson`, `MFRC522` (or UHF reader library)
3. **Wiring**:
   - UHF RFID Reader → Serial2 (RX: GPIO16, TX: GPIO17)
   - DHT22 → GPIO4
   - GPS NEO-6M → Serial1 (RX: GPIO5, TX: GPIO18)
   - MQ-135 → GPIO34 (ADC1_CH6)

## Sample Code

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASS";
const char* mqtt_server = "broker.rfidchicks.local";
const char* checkpoint_id = "CP-FARM-02";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void publish_rfid(String tag_id) {
  StaticJsonDocument<256> doc;
  doc["checkpoint_id"] = checkpoint_id;
  doc["tag_id"] = tag_id;
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("rfidchicks/CP-FARM-02/rfid/read", buffer);
}

void publish_sensors() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int nh3_raw = analogRead(MQ135_PIN);
  
  StaticJsonDocument<256> doc;
  doc["checkpoint_id"] = checkpoint_id;
  doc["temperature_c"] = temp;
  doc["humidity_pct"] = hum;
  doc["nh3_raw"] = nh3_raw;
  
  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("rfidchicks/CP-FARM-02/sensors", buffer);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    while (!client.connect(checkpoint_id)) delay(500);
  }
  client.loop();
  
  // Check RFID reader (Serial2)
  if (Serial2.available()) {
    String tag_id = Serial2.readStringUntil('\n');
    tag_id.trim();
    if (tag_id.length() > 0) publish_rfid(tag_id);
  }
  
  // Publish sensor data every 60 seconds
  static unsigned long last_sensor = 0;
  if (millis() - last_sensor > 60000) {
    publish_sensors();
    last_sensor = millis();
  }
  
  delay(10);
}
```

## Bill of Materials (Per Gateway)

| Component | Model | Cost |
|-----------|-------|------|
| MCU | ESP32 DevKit v1 | $5 |
| UHF RFID Module | YR900-8D (China) | $35 |
| Temp/Humidity | DHT22 | $3 |
| NH₃ Sensor | MQ-135 | $2 |
| GPS | NEO-6M | $8 |
| microSD Module | SPI adapter | $2 |
| PCB + Case | Custom | $10 |
| **Total** | | **~$65** |
