#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <RTClib.h>
#include <HX711.h>
#include <Preferences.h>
#include "secrets.h"

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int HX_DT = 25;
const int HX_SCK = 26;
const float REF_WEIGHT_G = 45.6;     // reference weight used for calibration
const long TZ_OFFSET_S = 7 * 3600;    // WIB

RTC_DS3231 rtc;
HX711 scale;
Preferences prefs;
bool rtcOk = false;

float readOnce() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return duration * 0.0343 / 2.0;
}

// Median of n readings; returns -1 when fewer than 5 echoes came back
float medianDistance(int n, float* spread) {
  float v[20];
  int c = 0;
  for (int i = 0; i < n && i < 20; i++) {
    float d = readOnce();
    if (d > 0) v[c++] = d;
    delay(60);
  }
  if (c < 5) return -1;
  for (int i = 1; i < c; i++) {
    float k = v[i];
    int j = i - 1;
    while (j >= 0 && v[j] > k) { v[j + 1] = v[j]; j--; }
    v[j + 1] = k;
  }
  *spread = v[c - 1] - v[0];
  return v[c / 2];
}

void syncFromNtp() {
  Serial.printf("NTP: connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nNTP: Wi-Fi failed, RTC not changed");
    return;
  }
  configTime(TZ_OFFSET_S, 0, "pool.ntp.org");
  struct tm t;
  if (getLocalTime(&t, 10000)) {
    rtc.adjust(DateTime(t.tm_year + 1900, t.tm_mon + 1, t.tm_mday, t.tm_hour, t.tm_min, t.tm_sec));
    Serial.println("\nNTP: RTC set");
  } else {
    Serial.println("\nNTP: no time received");
  }
  WiFi.disconnect(true);
}

void handleCommand(char cmd) {
  if (cmd == 't') {
    scale.tare(15);
    prefs.putLong("offset", scale.get_offset());
    Serial.println(">> tare done (empty = 0 g)");
  } else if (cmd == 'c') {
    scale.calibrate_scale(REF_WEIGHT_G, 15);
    prefs.putFloat("scale", scale.get_scale());
    Serial.printf(">> calibrated with %.1f g, factor %.4f (saved to flash)\n", REF_WEIGHT_G, scale.get_scale());
  } else if (cmd == 'n' && rtcOk) {
    syncFromNtp();
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Wire.begin(21, 22);
  rtcOk = rtc.begin();
  if (!rtcOk) {
    Serial.println("DS3231 not found at 0x68, check SDA/SCL");
  } else if (rtc.lostPower()) {
    Serial.println("DS3231 lost power, syncing from NTP");
    syncFromNtp();
  }

  prefs.begin("demo", false);
  scale.begin(HX_DT, HX_SCK);
  scale.set_median_mode();
  scale.set_scale(prefs.getFloat("scale", 1.0));
  if (prefs.isKey("offset")) scale.set_offset(prefs.getLong("offset"));
  else scale.tare(15);

  Serial.println("Commands: t = tare, c = calibrate with reference weight, n = sync RTC from NTP");
}

void loop() {
  while (Serial.available()) handleCommand(Serial.read());

  char timeBuf[20] = "RTC error";
  if (rtcOk) {
    DateTime now = rtc.now();
    snprintf(timeBuf, sizeof(timeBuf), "%04d-%02d-%02d %02d:%02d:%02d",
             now.year(), now.month(), now.day(), now.hour(), now.minute(), now.second());
  }

  float spread = 0;
  float dist = medianDistance(20, &spread);

  Serial.printf("%s | ", timeBuf);
  if (dist < 0) Serial.print("distance: no echo | ");
  else Serial.printf("distance %.2f cm (spread %.2f) | ", dist, spread);
  if (scale.is_ready()) Serial.printf("weight %.1f g\n", scale.get_units(7));
  else Serial.println("weight: HX711 not ready");
}
