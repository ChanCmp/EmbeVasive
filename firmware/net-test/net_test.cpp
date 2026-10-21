#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "secrets.h"

const unsigned long HEARTBEAT_MS = 30000;   // dashboard marks the device offline after 3 min
unsigned long lastBeat = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected, IP %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.printf("\nWi-Fi failed (status %d)\n", WiFi.status());
  }
}

// Sends one request to the backend and prints the status code and response body
void request(const char* method, const char* path, const String& body = "") {
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(API_BASE_URL) + path;
  WiFiClient plain;
  WiFiClientSecure secure;
  secure.setInsecure();   // skips certificate check, fine for a demo
  HTTPClient http;
  if (url.startsWith("https")) http.begin(secure, url);
  else http.begin(plain, url);

  http.addHeader("X-Device-Key", DEVICE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = (strcmp(method, "GET") == 0) ? http.GET() : http.sendRequest(method, body);
  Serial.printf("%s %s -> %d\n", method, path, code);
  if (code > 0) Serial.println(http.getString());
  else Serial.printf("Request error: %s\n", http.errorToString(code).c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  connectWiFi();
  request("GET", "/api/device/schedules");
}

void loop() {
  if (millis() - lastBeat >= HEARTBEAT_MS || lastBeat == 0) {
    lastBeat = millis();
    request("POST", "/api/device/readings", "{}");   // empty body = heartbeat only
  }
}
