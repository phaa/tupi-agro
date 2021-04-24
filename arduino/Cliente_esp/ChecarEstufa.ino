/*
 * Parâmetros de checagem da estufa
 * Antigo: ÁGUA(269), AR(632)
 * Novo: ÁGUA(305), AR(682)
 * ESP: ÁGUA(1456), AR(2249)
 */
void checkGreenhouse(bool store) {
  short soilMeasure = map(analogRead(SOIL_SENSOR_PIN), SOIL_WET, SOIL_DRY, 100, 0);
  soilMoisture = round((soilMoisture + soilMeasure)/2);
  DHT.read11(DHT11_PIN);
  airHumidity = round(DHT.humidity);
  airTemperature = round(DHT.temperature);

  //DEBUG_PRINTLN(analogRead(SOIL_SENSOR_PIN));

  // Normaliza a entrada do sensor
  if (soilMoisture > 100) { soilMoisture = 100; } 
  else if (soilMoisture < 0) { soilMoisture = 0; }

  mqttJsonPayload["soilMoisture"] = soilMoisture;
  mqttJsonPayload["airTemp"] = airTemperature;
  mqttJsonPayload["airHumidity"] = airHumidity;
  mqttJsonPayload["store"] = store;
  size_t n = serializeJson(mqttJsonPayload, buffer);
  MQTT.publish(TOPICO_ESTUFA, buffer, n);
}
