# tupi_agro
Projeto com a finalidade de gerenciar parâmetros de umidade, temperatura, pH do solo, e fertirrigaḉão através de microcontroladores instalados em estufas de produção de pimentão colorido


#define CS_PIN 10
#define BROKER_MQTT "broker.hivemq.com"
#define BROKER_PORT 1883 
#define TOPICO_ESTUFA "tupi/agro/estufa" 
#define TOPICO_BOMBA "tupi/agro/bomba"
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao" 
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

EthernetClient ethClient;
PubSubClient MQTT(ethClient);

// Endereço MAC do módulo
byte mac[] = {
  0x00, 0xAA, 0xBB, 0xCC, 0xDE, 0x02
};

void setup() {
  initSerial();
  initEthernet();
}

void loop() {
  checkEthernet(); // Sempre verificando a atividade da rede
}

void initSerial() {
  Serial.begin(9600);
  while (!Serial) {
    ; // espera pela comunicação serial conectar
  }
}

void initEthernet() {
  Ethernet.init(CS_PIN);
  // Inicia a conexão ethernet:
  Serial.println("Incializando Ethernet");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Falha ao conseguir endereço via DHCP");
    if (Ethernet.hardwareStatus() == EthernetNoHardware) {
      Serial.println("Módulo ethernet não encontrado.");
    } else if (Ethernet.linkStatus() == LinkOFF) {
      Serial.println("Cabo ethernet não conectado.");
    }
    // Daqui em diante não há nada para fazer, então para no loop
    while (true) {
      delay(1);
    }
  }
  // Printa o IP
  Serial.print("IP atribuído: ");
  Serial.println(Ethernet.localIP());
}

void initMQTT() {
  MQTT.setServer(BROKER_MQTT, BROKER_PORT); //informa qual broker e porta deve ser conectado
  MQTT.setCallback(callbackMQTT); //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}

void connectMQTT() {
  if (Ethernet.linkStatus() == LinkON) {
    Serial.println("Link ON");
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

void checkEthernet() {
  switch (Ethernet.maintain()) {
    case 1:
      //renewed fail
      Serial.println("Error: renewed fail");
      break;

    case 2:
      //renewed success
      Serial.println("Renewed success");
      //print your local IP address:
      Serial.print("My IP address: ");
      Serial.println(Ethernet.localIP());
      break;

    case 3:
      //rebind fail
      Serial.println("Error: rebind fail");
      break;

    case 4:
      //rebind success
      Serial.println("Rebind success");
      //print your local IP address:
      Serial.print("My IP address: ");
      Serial.println(Ethernet.localIP());
      break;

    default:
      //nothing happened
      break;
  }
}
