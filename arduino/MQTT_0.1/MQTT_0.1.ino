#include "dht.h"
#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>

// Debug 
#define DEBUG
#ifdef DEBUG
  #define DEBUG_PRINT(x)  Serial.print (x)
  #define DEBUG_PRINTLN(x)  Serial.println (x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif

// Config Sensor solo
#define SOIL_SENSOR_PIN A0
#define SOIL_MOISTURE_THRESHOLD 50 // Nível mínimo aceitável de umidade  
#define MINIMUM_OPTIMAL_MOISTURE 100
#define DRY_VALUE 632
#define WET_VALUE 269
int intervals = (DRY_VALUE - WET_VALUE)/3;

// Configs DHT11
# define DHT11_PIN A1
dht DHT; //VARIÁVEL DO TIPO DHT

// Pensar no estado dela em caso de falta de energia
# define PUMP_RELAY_PIN 10
int pumpState = LOW;
int automaticIrrigation = true;
bool realTimeAnalysis = true;

// MQTT 
byte mac[] = { 0x90, 0xA2, 0xDA, 0x10, 0xA9, 0x8B };
byte ip[] = { 192, 168, 0, 177 };
EthernetClient ethClient;
PubSubClient MQTT(ethClient);
#define BROKER_MQTT "broker.hivemq.com" //URL do broker MQTT que se deseja utilizar
#define BROKER_PORT 1883 // Porta do Broker MQTT
#define TOPICO_ESTUFA "tupi/agro/estufa" //tópico MQTT de envio de informações para Broker
#define TOPICO_BOMBA "tupi/agro/bomba" //tópico MQTT de envio de informações para Broker
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao" //tópico MQTT de envio de informações para Broker
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

// Auxiliar para o contador
unsigned long previousTime5s = 0;
unsigned long previousTime30min = 0;

void setup() {
  Serial.begin(9600);

  // Pino da bomba
  pinMode(PUMP_RELAY_PIN, OUTPUT);

  initEthernet();
  initMQTT();
  reconnectMQTT();
}

void loop() {
  // Antes de fazer qualquer coisa verifica o status da conexão
  VerificaConexoesWifiEMQTT();

  // A cada 5 segundos lê a estufa
  if( millis() - previousTime5s >= 5000 ) {
    if(realTimeAnalysis) {
      DEBUG_PRINTLN("Hora de publicar 5s/true");
      analyzeGreenhouse(true, true);
    } else {
      DEBUG_PRINTLN("Hora de publicar 5s/false");
      analyzeGreenhouse(false, true);
    }
    previousTime5s = millis();
  } 
  
  // A cada meia hora lê a estufa manda os dados ao servidor
  if ( millis() - previousTime30min >= 60000 ) {
    DEBUG_PRINTLN("Hora de publicar 1min/true");
    analyzeGreenhouse(true, false);
    previousTime30min = millis();
  }

  // Keep-alive da comunicação com broker MQTT
  MQTT.loop(); // Callback será executada automaticamente no decorrer do loop
}

void analyzeGreenhouse(bool publish, bool realTimeAnalysis) {
  DHT.read11(DHT11_PIN);
  int airHumidity = DHT.humidity;
  int airTemperature = DHT.temperature;
  int soilMoisture = analogRead(SOIL_SENSOR_PIN);
  //soilMoisture = float(map(soilMoisture, 269, 632, 100, 0));
  
  // Normaliza a entrada do sensor
  //if (soilMoisture > 100) {
    // = 100.00;
  //} else if (soilMoisture < 0) {
    //soilMoisture = 0.00;
  //}

  if(soilMoisture > WET_VALUE && soilMoisture < (WET_VALUE + intervals))
  {
    Serial.println("Very Wet");
  }
  else if(soilMoisture > (WET_VALUE + intervals) && soilMoisture < (DRY_VALUE - intervals))
  {
    Serial.println("Wet");
  }
  else if(soilMoisture < DRY_VALUE && soilMoisture > (DRY_VALUE - intervals))
  {
    Serial.println("Dry");
  }

  if (automaticIrrigation == true) {
    // Só analiza os sensores caso a irrigação automática esteja ligada
    if (soilMoisture < SOIL_MOISTURE_THRESHOLD) {
      setPumpState(HIGH);
    } else if (soilMoisture >= MINIMUM_OPTIMAL_MOISTURE || pumpState == LOW) {
      setPumpState(LOW);
    }
  } else {
    setPumpState(pumpState);
  }

  // Se for o momento do publicar
  if (publish) {
    String jsonString = "{ \"soilMoisture\": \"" + String(soilMoisture) + 
    "\", \"airTemp\": \"" + String(airTemperature) + 
    "\", \"airHumidity\": \"" + String(airHumidity) + "\"";
    
    if (realTimeAnalysis == false) {
      jsonString += ", \"store\": \"true\" }";
    } else {
      jsonString += "}";
    }

    char attributes[100];
    jsonString.toCharArray( attributes, 100 );
    // Retorna true ou false
    MQTT.publish( TOPICO_ESTUFA, attributes );
  }
}

// Em breve colocar identificador da bomba
void setPumpState(int state) {
  if (state == HIGH) {
    // Relés ligados
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpState = HIGH;
    MQTT.publish(TOPICO_BOMBA, "PUMP_ON_OK");
  } else if (state == LOW){
    // Relés desligados
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpState = LOW;
    MQTT.publish(TOPICO_BOMBA, "PUMP_OFF_OK");
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
    /*if (msg.equals("PUMP_ON")) {
      pumpState = HIGH;
    }
    if (msg.equals("PUMP_OFF")) {
      pumpState = HIGH;
    }*/
  }
}

void initMQTT() {
  MQTT.setServer(BROKER_MQTT, BROKER_PORT); //informa qual broker e porta deve ser conectado
  MQTT.setCallback(callbackMQTT); //atribui função de callback (função chamada quando qualquer informação de um dos tópicos subescritos chega)
}

void initEthernet() {
  // Initializing Ethernet
  DEBUG_PRINTLN("(ETHERNET) Initializing Ethernet...");

  Ethernet.begin(mac, ip);
  DEBUG_PRINTLN(Ethernet.hardwareStatus());
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    DEBUG_PRINTLN("(ETHERNET) Ethernet shield was not found.");
    // Does nothing
    for(;;){;}
  }
  
  // Print the ethernet gateway
  DEBUG_PRINT("(ETHERNET) Gateway IP: ");
  DEBUG_PRINTLN(Ethernet.gatewayIP());

  // Print your local IP address:
  DEBUG_PRINT("(ETHERNET) Local IP: ");
  DEBUG_PRINTLN(Ethernet.localIP());

  // Print Ethernet OK
  DEBUG_PRINTLN("(ETHERNET) Ethernet Initialized...");
}

void reconnectMQTT() {
  while (!MQTT.connected()) {
    DEBUG_PRINT("(BROKER) Tentando se conectar ao Broker MQTT: ");
    DEBUG_PRINTLN(BROKER_MQTT);
    if (MQTT.connect(ID_MQTT)) {
      DEBUG_PRINTLN("(BROKER) Conectado com sucesso ao broker MQTT!");
      MQTT.subscribe(TOPICO_BOMBA);
    } else {
      DEBUG_PRINTLN("(BROKER) Falha ao reconectar no broker.");
      DEBUG_PRINTLN("(BROKER) Haverá nova tentatica de conexao em 2s");
      delay(1000);
    }
  }
}

void VerificaConexoesWifiEMQTT(void) {
  if (Ethernet.linkStatus() == LinkOFF) {
    initEthernet(); // se a conexão ethernet caiu, reconecta
  }
  if (!MQTT.connected()) {
    reconnectMQTT(); //se não há conexão com o Broker, a conexão é refeita
  }
}
