/*
   Configurações dos Pinos
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
   Configurações do Wifi
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

void checkCommunication(void) {
  if (WiFi.status() != WL_CONNECTED) {
    DEBUG_PRINTLN("(Wifi) Link OFF, reconectando.");
    WiFi.reconnect();
    if (WiFi.status() != WL_CONNECTED) {
      checkCommunication();
    }
  }
}

/*
   Configurações do Socket
*/
void hexdump(const void *mem, uint32_t len, uint8_t cols = 16) {
  const uint8_t* src = (const uint8_t*) mem;
  Serial.printf("\n[HEXDUMP] Address: 0x%08X len: 0x%X (%d)", (ptrdiff_t)src, len, len);
  for (uint32_t i = 0; i < len; i++) {
    if (i % cols == 0) {
      Serial.printf("\n[0x%0hola8X] 0x%08X: ", (ptrdiff_t)src, i);
    }
    Serial.printf("%02X ", *src);
    src++;
  }
  Serial.printf("\n");
}

void socketIOEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case sIOtype_DISCONNECT:
      DEBUG_PRINTLN("[SocketIO] Desconectado!");
      socketStatus = false;
      break;
    case sIOtype_CONNECT:
      Serial.printf("[SocketIO] Conectado à URL: %s", payload);

      // conecta ao namespace comum "/" (não há acoplamento automático apartir do Socket.IO V3)
      socketIO.send(sIOtype_CONNECT, "/");
      socketStatus = true;
      break;
    case sIOtype_EVENT:
      {
        StaticJsonDocument<70> doc;

        // parse a JSON array
        deserializeJson(doc, payload);

        // extract the values
        JsonArray array = doc.as<JsonArray>();
        const char* topic = array[0].as<const char*>();
        const char* data = array[1].as<const char*>();
        Serial.printf("[SocketIO] Tópico %s\n", topic);
        Serial.printf("[SocketIO] Carga %s\n", data);

        if (strcmp(topic, "onToggleTool") == 0) {
          if (strcmp(data, "PUMP_ON") == 0) {
            pumpState = HIGH;
          } 
          else if (strcmp(data, "PUMP_OFF") == 0) {
            pumpState = LOW;
          } 
          else if (strcmp(data, "EXAUST_ON") == 0) {
            exaustingState = HIGH;
          } 
          else if (strcmp(data, "EXAUST_OFF") == 0) {
            exaustingState = LOW;
          }
          //Serial.printf("[SocketIO] Tópico vdd %s\n", topic);
        }
        else if (strcmp(topic, "requestBoot") == 0) {
          checkGreenhouse(true);
        }
        
      }
      break;
    case sIOtype_ACK:
      Serial.printf("[SocketIO] get ack: %u\n", length);
      hexdump(payload, length);
      break;
    case sIOtype_ERROR:
      Serial.printf("[SocketIO] get error: %u\n", length);
      hexdump(payload, length);
      break;
    case sIOtype_BINARY_EVENT:
      Serial.printf("[SocketIO] get binary: %u\n", length);
      hexdump(payload, length);
      break;
    case sIOtype_BINARY_ACK:
      Serial.printf("[SocketIO] get binary ack: %u\n", length);
      hexdump(payload, length);
      break;
  }
}

void initSocketIO() {
  socketIO.begin(SOCKET_ADDR, SOCKET_PORT, "/socket.io/?EIO=4");
  socketIO.onEvent(socketIOEvent);
}

/*
   Atributos LCD
*/
void lcdPrint(short cursor, short line, String msg) {
  lcd.setCursor(cursor, line);
  lcd.print(msg);
}

void refreshLCD() {
  lcd.clear();
  // passar display message para as globais
  String displayMsg = "";
  lcdState = 1;
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
      displayMsg = (socketStatus) ? F("Sistema: ONLINE") : F("Sistema: OFFLINE");
      lcdPrint(0, 0, displayMsg);
      //displayMsg = (automaticIrrigation) ? F("IA: ON") : F("IA: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
  }

  //lcdState = (lcdState == 2) ? 0 : lcdState + 1;
}
