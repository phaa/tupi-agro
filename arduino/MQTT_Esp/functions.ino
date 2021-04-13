/*
 * Atributos do Wifi
 */
void initWifi() {
  WiFi.begin(SSID, PASSWORD);
  
  DEBUG_PRINT("(Wifi) Conectando à rede: ");
  DEBUG_PRINTLN(SSID);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    DEBUG_PRINT(".");
  }
  DEBUG_PRINTLN("");
  DEBUG_PRINTLN("(Wifi) Conectado à rede.");
  DEBUG_PRINT("(Wifi) IP address:");
  DEBUG_PRINTLN(WiFi.localIP());
}

/*
 * Atributos do MQTT
 */
void initMQTT() {
  MQTT.setServer(BROKER_MQTT, BROKER_PORT); //informa qual broker e porta deve ser conectado
  MQTT.setCallback(callbackMQTT); //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}

void connectMQTT() {
  if (WiFi.status() == WL_CONNECTED) {
    DEBUG_PRINTLN("(MQTT) Link ON");
    while (!MQTT.connected()) {
      if (MQTT.connect(ID_MQTT)) {
        MQTT.subscribe(TOPICO_BOMBA);
        MQTT.subscribe(TOPICO_ESTUFA);
        DEBUG_PRINTLN("(MQTT) Conexão OK.");
      } else {
        delay(2000);
      }
    }
  } else {
    DEBUG_PRINTLN("(MQTT) Wifi OFF, reconectando.");
    WiFi.reconnect();
    connectMQTT();
  }
}

void callbackMQTT(char * topic, byte * payload, unsigned int length) {
  String msg;
  //obtem a string do payload recebido
  for (int i = 0; i < length; i++) {
    char c = (char) payload[i];
    msg += c;
  }

  String topicString = String(topic);

  if (topicString.equals(TOPICO_BOMBA)) {
    if (msg.equals("AI_ON")) {
      automaticIrrigation = true;
      MQTT.publish(TOPICO_BOMBA, "AI_ON_OK");
    }
    if (msg.equals("AI_OFF")) {
      automaticIrrigation = false;
      MQTT.publish(TOPICO_BOMBA, "AI_OFF_OK");
    }
    if (msg.equals("PUMP_ON")) {
      setPumpState(HIGH);
    }
    if (msg.equals("PUMP_OFF")) {
      setPumpState(LOW);
    }
  } 
  
  if (topicString.equals(TOPICO_ESTUFA)) {
    if (msg.equals("ANALYSIS_ON")) {
      realTimeAnalysis = true;
    }
    if (msg.equals("ANALYSIS_OFF")) {
      realTimeAnalysis = false;
    }
    if (msg.equals("GET_ARDUINO_STATE")) {
      doc2["pump"] = pumpState;
      doc2["exaust"] = exaustingState;
      doc2["ia"] = automaticIrrigation;
      size_t n = serializeJson(doc2, buffer);
      MQTT.publish(TOPICO_ESTUFA, buffer, n);
    }
  }
}

void checkCommunication(void) {
  if (!MQTT.connected()) {
    connectMQTT(); //se não há conexão com o Broker, a conexão é refeita
  }
}

/*
 * Atributos LCD
 */
void refreshLCD() {
  lcd.clear();
  String displayMsg = "";
  switch (lcdState) {
    case 0:
      //coluna, linha
      lcd.setCursor(0, 0);
      displayMsg = "Ar T:" + String(airTemperature) + "C";
      lcd.print(displayMsg);
    
      lcd.setCursor(9, 0);
      displayMsg = "U:" + String(airHumidity) + "%";
      lcd.print(displayMsg);
    
      lcd.setCursor(0, 1);
      displayMsg = "Solo U:" + String(soilMoisture) + "%";
      lcd.print(displayMsg);
    
      lcd.setCursor(11, 1);
      displayMsg = "U:" + String(analogRead(SOIL_SENSOR_PIN)) + "%";
      lcd.print(displayMsg);
      break;
    case 1:
      lcd.setCursor(0, 0);
      displayMsg = (pumpState) ? F("Irrigacao: ON") : F("Irrigacao: OFF");
      lcd.print(displayMsg);
      lcd.setCursor(0, 1);
      displayMsg = (exaustingState) ? F("Exaustao: ON") : F("Exaustao: OFF");
      lcd.print(displayMsg);
      break;
    case 2:
      lcd.setCursor(0, 0);
      displayMsg = (mqttStatus) ? F("Sistema: ONLINE") : F("Sistema: OFFLINE");
      lcd.print(displayMsg);
      lcd.setCursor(0, 1);
      displayMsg = (automaticIrrigation) ? F("IA: ON") : F("IA: OFF");
      lcd.print(displayMsg);
      break;
  }

  lcdState = (lcdState >= 3) ? 0 : lcdState+1;
}

// Em breve colocar identificador da bomba
void setPumpState(byte state) {
  if (state) {
    // Relés ligados
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpState = HIGH;
    MQTT.publish(TOPICO_BOMBA, "PUMP_ON_OK");
  } else {
    // Relés desligados
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpState = LOW;
    MQTT.publish(TOPICO_BOMBA, "PUMP_OFF_OK");
  }
}

void checkGreenhouse(bool sendToServer, bool store) {
  DHT.read11(DHT11_PIN);
  airHumidity = round(DHT.humidity);
  airTemperature = round(DHT.temperature);
  //a proxima leitura vai ser a média da anterior com essa
  soilMoisture = map(analogRead(SOIL_SENSOR_PIN), 269, 632, 100, 0);
  // novo Agua: 305 Ar: 682
  // antigo 269, 632

  //Serial.println(analogRead(SOIL_SENSOR_PIN));

  // Normaliza a entrada do sensor
  if (soilMoisture > 100) {
    soilMoisture = 100;
  } else if (soilMoisture < 0) {
    soilMoisture = 0;
  }

  // Só analiza os sensores caso a irrigação automática esteja ligada
  if (automaticIrrigation == true) {
    if (soilMoisture < SOIL_MOISTURE_THRESHOLD) {
      setPumpState(HIGH);
    } else if (soilMoisture >= MINIMUM_OPTIMAL_MOISTURE || pumpState == LOW) {
      setPumpState(LOW);
    }
  }

  if (sendToServer) {
    // prepara o pacote JSON para o servidor
    doc["soilMoisture"] = soilMoisture;
    doc["airTemp"] = airTemperature;
    doc["airHumidity"] = airHumidity;
    doc["store"] = (store) ? true : false;
    size_t n = serializeJson(doc, buffer);
    MQTT.publish(TOPICO_ESTUFA, buffer, n);
  }
}
