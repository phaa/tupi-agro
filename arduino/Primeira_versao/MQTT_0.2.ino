// Dados Ethernet
#define ETHERNET_CS_PIN 10
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 0, 177);

// Dados MQTT
#define BROKER_MQTT "broker.hivemq.com"
#define BROKER_PORT 1883 /
#define TOPICO_ESTUFA "tupi/agro/estufa" 
#define TOPICO_BOMBA "tupi/agro/bomba"
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao" 
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

void initEthernet() {
  Ethernet.init(ETHERNET_CS_PIN);
  Ethernet.begin(mac, ip);
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    // para o programa aqui
    for (;;) {;}
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

void initMQTT() {
  MQTT.setServer(BROKER_MQTT, BROKER_PORT); //informa qual broker e porta deve ser conectado
  MQTT.setCallback(callbackMQTT); //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}

void connectMQTT() {
  if (Ethernet.linkStatus() == LinkON) {
    while (!MQTT.connected()) {
      if (MQTT.connect(ID_MQTT)) {
        MQTT.subscribe(TOPICO_BOMBA);
        MQTT.subscribe(TOPICO_ESTUFA);
      } else {
        delay(2000);
      }
    }
  } else {
    // Para o programa aqui
    initEthernet();
  }
}

void checkCommunication(void) {
  if (!MQTT.connected()) {
    connectMQTT(); //se não há conexão com o Broker, a conexão é refeita
  }
}

void setup() {
  initEthernet();
  initMQTT();
  connectMQTT();
}

void loop() {
  checkCommunication();
}