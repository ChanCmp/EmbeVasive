#include <Arduino.h>
#include <HX711.h>
#include <Preferences.h>

HX711 scale;
Preferences prefs;

const float KNOWN_WEIGHT_G = 27.1;

void setup() {
  Serial.begin(115200);
  scale.begin(25, 26);

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
      scale.tare(20);
      prefs.putLong("offset", scale.get_offset());
      Serial.println("Tared and saved.");
    } else if (cmd == 'c') {
      Serial.println("Place the weight now, keep still (5 s)...");
      delay(5000);
      float value = scale.get_value(20);        // reading minus saved offset
      float factor = value / KNOWN_WEIGHT_G;
      scale.set_scale(factor);
      prefs.putFloat("factor", factor);
      Serial.printf("Factor %.4f saved.\n", factor);
    }
  }
  if (scale.is_ready()) {
    Serial.printf("%.1f g\n", scale.get_units(5));
  }
  delay(300);
}