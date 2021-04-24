/*
 * Configurações dos Pinos
 */
void initPins() {
  // Pino da bomba
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, HIGH);
}

void checkInputs() {
  //veriica se apertou algum botao para desligar ou ligar 
}

/*
 * Configurações do Wifi
 */
void initWifi() {
  WiFi.begin(SSID, PASSWORD);
  
  DEBUG_PRINT("(Wifi) Conectando à rede: ");
  DEBUG_PRINT(SSID);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    DEBUG_PRINT(".");
  }
  
  DEBUG_PRINTLN("");
  DEBUG_PRINTLN("(Wifi) Conectado.");
  DEBUG_PRINT("(Wifi) IP address: ");
  DEBUG_PRINTLN(WiFi.localIP());
}

/*
 * Configurações do MQTT
 */
void initMQTT() {
  MQTT.setServer(BROKER_MQTT, BROKER_PORT); //informa qual broker e porta deve ser conectado
  MQTT.setCallback(callbackMQTT); //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}

void connectMQTT() {
  DEBUG_PRINTLN("(MQTT) Verificando link wifi.");
  if (WiFi.status() == WL_CONNECTED) {
    DEBUG_PRINTLN("(MQTT) Link ON.");
    while (!MQTT.connected()) {
      if (MQTT.connect(ID_MQTT)) {
        mqttStatus = true;
        MQTT.subscribe(TOPICO_BOMBA);
        MQTT.subscribe(TOPICO_ESTUFA);
        DEBUG_PRINTLN("(MQTT) Conexão MQTT estabelecida.");
      } 
      else {
        delay(1000);
      }
    }
  } 
  else {
    DEBUG_PRINTLN("(MQTT) Link OFF, reconectando.");
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

  DEBUG_PRINT("(MQTT) Mensagem recebida: ");
  DEBUG_PRINTLN(msg);

  String topicString = String(topic);

  if (topicString.equals(TOPICO_BOMBA)) {
    /*
    if (msg.equals("AI_ON")) {
      automaticIrrigation = true;
      MQTT.publish(TOPICO_BOMBA, "AI_ON_OK");
    }
    if (msg.equals("AI_OFF")) {
      automaticIrrigation = false;
      MQTT.publish(TOPICO_BOMBA, "AI_OFF_OK");
    }*/
    if (msg.equals("PUMP_ON")) {
      pumpState = HIGH;
      digitalWrite(PUMP_RELAY_PIN, LOW);
      MQTT.publish(TOPICO_BOMBA, "PUMP_ON_OK");
    }
    if (msg.equals("PUMP_OFF")) {
      pumpState = LOW;
      digitalWrite(PUMP_RELAY_PIN, HIGH);
      MQTT.publish(TOPICO_BOMBA, "PUMP_OFF_OK");
    }
  } 
  
  if (topicString.equals(TOPICO_ESTUFA)) {
    /*if (msg.equals("ANALYSIS_ON")) {
      realTimeAnalysis = true;
    }
    if (msg.equals("ANALYSIS_OFF")) {
      realTimeAnalysis = false;
    }*/
    
    if (msg.equals("GET_MEASUREMENTS")) {
      bootPayload["boot"] = true;
      bootPayload["pump"] = pumpState;
      bootPayload["exaust"] = exaustingState;
      bootPayload["fert"] = fertirrigationState;
      size_t n = serializeJson(bootPayload, buffer);
      MQTT.publish(TOPICO_ESTUFA, buffer, n);
    }
  }
}

void checkCommunication(void) {
  if (!MQTT.connected()) {
    mqttStatus = false;
    connectMQTT(); //se não há conexão com o Broker, a conexão é refeita
  }
}

/*
 * Atributos LCD
 */
void lcdPrint(short cursor, short line, String msg) {
  lcd.setCursor(cursor, line);
  lcd.print(msg);
}

void refreshLCD() {
  lcd.clear();
  String displayMsg = "";
  switch (lcdState) {
    case 0: {
      displayMsg = "Ar T:" + String(airTemperature) + "C";
      lcdPrint(0, 0, displayMsg);
    
      displayMsg = "U:" + String(airHumidity) + "%";
      lcdPrint(9, 0, displayMsg);
    
      displayMsg = "Solo:" + String(soilMoisture) + "%";
      lcdPrint(0, 1, displayMsg);

      float voltage = analogRead(SOIL_SENSOR_PIN) * (3.3 / 4095.0);
      displayMsg = "V:" + String(voltage) + "";
      lcdPrint(9, 1, displayMsg);
      } break;
    case 1:
      displayMsg = (pumpState) ? F("Irrigacao: ON") : F("Irrigacao: OFF");
      lcdPrint(0, 0, displayMsg);
      
      displayMsg = (exaustingState) ? F("Exaustao: ON") : F("Exaustao: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
    case 2:
      displayMsg = (mqttStatus) ? F("Sistema: ONLINE") : F("Sistema: OFFLINE");
      lcdPrint(0, 0, displayMsg);
      //displayMsg = (automaticIrrigation) ? F("IA: ON") : F("IA: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
  }

  lcdState = (lcdState == 2) ? 0 : lcdState+1;
}
