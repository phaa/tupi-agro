/*
 * Parâmetros de checagem da estufa
 * Antigo: ÁGUA(269), AR(632)
 * Novo: ÁGUA(305), AR(682)
 * ESP: ÁGUA(1456), AR(2249)
 */
void checkGreenhouse(bool store) {
  soilMoisture = map(analogRead(SOIL_SENSOR_PIN), SOIL_WET, SOIL_DRY, 100, 0);
  DHT.read11(DHT11_PIN);
  airHumidity = round(DHT.humidity);
  airTemperature = round(DHT.temperature);

  //DEBUG_PRINTLN(analogRead(SOIL_SENSOR_PIN));

  // Normaliza a entrada do sensor
  if (soilMoisture > 100) { soilMoisture = 100; } 
  else if (soilMoisture < 0) { soilMoisture = 0; }

  // Troca o tópico 
  wrapper.getElement(0).set("onGreenhouseCheck");

  greenhouseStats["pumpState"] = pumpState;
  greenhouseStats["exaustingState"] = exaustingState;
  greenhouseStats["fertirrigationState"] = fertirrigationState;
  greenhouseStats["airHumidity"] = airHumidity;
  greenhouseStats["airTemperature"] = airTemperature;
  greenhouseStats["soilMoisture"] = soilMoisture;

  String output;
  serializeJson(doc, output);

  // Send event
  socketIO.sendEVENT(output);

  // Print JSON for debugging
  DEBUG_PRINTLN(output);
}
