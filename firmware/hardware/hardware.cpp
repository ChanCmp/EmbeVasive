#include <Arduino.h>
#include <HX711.h>
#include <Preferences.h>

HX711 scale;
Preferences prefs;

const int HX_DT  = 25;
const int HX_SCK = 26;

const float KNOWN_WEIGHT_G = 25.1;    // mass of the item you calibrate with
const float MIN_CAL_COUNTS = 1000;    // guess: reject calibration if raw counts are below this

// Median of n single readings (in grams), rejects occasional spikes
float readMedianGrams(int n = 9) {
  float v[15];
  int c = 0;
  for (int i = 0; i < n && i < 15; i++) {
    if (scale.is_ready()) v[c++] = scale.get_units(1);
    delay(10);
  }
  if (c == 0) return NAN;
  for (int i = 1; i < c; i++) {
    float k = v[i];
    int j = i - 1;
    while (j >= 0 && v[j] > k) { v[j + 1] = v[j]; j--; }
    v[j + 1] = k;
  }
  return v[c / 2];
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  scale.begin(HX_DT, HX_SCK);

  prefs.begin("scale", false);
  float factor = prefs.getFloat("factor", 1.0);
  long offset  = prefs.getLong("offset", 0);
  scale.set_scale(factor);
  scale.set_offset(offset);

  Serial.printf("Loaded factor=%.4f offset=%ld\n", factor, offset);
  Serial.println("Commands: t = tare + save, c = calibrate + save");
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();

    if (cmd == 't') {
      Serial.println("Taring, keep the load cell empty and still...");
      scale.tare(20);
      prefs.putLong("offset", scale.get_offset());
      Serial.println("Tared and saved.");
    }
    else if (cmd == 'c') {
      Serial.println("Place the weight now, keep still (5 s)...");
      delay(5000);
      float value = scale.get_value(20);   // raw reading minus saved offset
      Serial.printf("Raw counts: %.0f\n", value);

      if (fabs(value) < MIN_CAL_COUNTS) {
        Serial.println("No weight detetcted, calibration cancelled.");
      } else {
        float factor = value / KNOWN_WEIGHT_G;
        scale.set_scale(factor);
        prefs.putFloat("factor", factor);
        Serial.printf("Factor %.4f saved.\n", factor);
      }
    }
    else if (cmd == 'r') {
  prefs.clear();            // erase saved factor and offset
  scale.set_scale(1.0);
  scale.set_offset(0);
  Serial.println("Saved calibration cleared.");
}
  }

  float g = readMedianGrams();
Serial.printf("%.1f g (raw %ld)\n", g, scale.read());
  delay(200);
}