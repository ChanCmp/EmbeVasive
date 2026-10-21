#include <Arduino.h>

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

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

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("HC-SR04 calibration: median of 20 readings");
}

void loop() {
  const int N = 20;
  float v[N];
  int c = 0;
  for (int i = 0; i < N; i++) {
    float d = readOnce();
    if (d > 0) v[c++] = d;
    delay(60);
  }
  if (c < 5) {
    Serial.println("no echo");
    delay(1000);
    return;
  }
  for (int i = 1; i < c; i++) {
    float k = v[i];
    int j = i - 1;
    while (j >= 0 && v[j] > k) { v[j + 1] = v[j]; j--; }
    v[j + 1] = k;
  }
  Serial.printf("median %.2f cm | min %.2f | max %.2f | spread %.2f | valid %d/%d\n",
                v[c / 2], v[0], v[c - 1], v[c - 1] - v[0], c, N);
  delay(500);
}