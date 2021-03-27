#include "dht.h"
#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// Debug
//#define DEBUG
#ifdef DEBUG
#define DEBUG_PRINT(x)  Serial.print (x)
#define DEBUG_PRINTLN(x)  Serial.println (x)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#endif

// Config Sensor solo
#define SOIL_SENSOR_PIN A0
#define SOIL_MOISTURE_THRESHOLD 50 // Nível mínimo aceitável de umidade 30% 
#define MINIMUM_OPTIMAL_MOISTURE 70

// Configs DHT11
# define DHT11_PIN A1
dht DHT; //VARIÁVEL DO TIPO DHT

// Pensar no estado dela em caso de falta de energia
// Relés
# define PUMP_RELAY_PIN 2

//LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);
short lcdState = 0;

// Variáveis de controle
byte pumpState = LOW;
byte exaustingState = LOW;
bool automaticIrrigation = true;
bool realTimeAnalysis = true;
short airHumidity = 0;
short airTemperature = 0;
short soilMoisture = 0;

// Ethernet
EthernetClient ethClient;

// MQTT
PubSubClient MQTT(ethClient);
StaticJsonDocument<33> doc;
StaticJsonDocument<33> doc2;
char buffer[65];
#define BROKER_MQTT "broker.hivemq.com"
#define BROKER_PORT 1883 /
#define TOPICO_ESTUFA "tupi/agro/estufa" 
#define TOPICO_BOMBA "tupi/agro/bomba"
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao" 
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

// Auxiliar para o contador
unsigned long previousTime2s = 0;
unsigned long previousTime5s = 0;
unsigned long previousTime30min = 0;

void setup() {
  Serial.begin(9600);

  // Config LCD
  lcd.init();
  lcd.setBacklight(HIGH);
  lcd.setCursor(0, 0);
  lcd.print(F("Tupi Agro"));
  lcd.setCursor(0, 1);
  lcd.print(F("Inicializando..."));

  // Pino da bomba
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, HIGH);

  // Métodos auxiliares
  initEthernet();
  initMQTT();
  connectMQTT();

  lcd.setCursor(0, 1);
  lcd.print(F("Sistema Online"));
}

void loop() {
  // Antes de fazer qualquer coisa verifica o status da conexão
  VerificaConexoes();

  if ( millis() - previousTime2s >= 3000 ) {
    manageLCD();
    previousTime2s = millis();
  }

  // A cada 10 segundos lê a estufa e atualiza os dados no display
  if ( millis() - previousTime5s >= 10000 ) {
    if (realTimeAnalysis) {
      // Monitoramento em tempo real ligado
      DEBUG_PRINTLN("Hora de publicar 5s/true");
      checkGreenhouse(true, false);
    } else {
      // Monitoramento desligado
      DEBUG_PRINTLN("Hora de publicar 5s/false");
      checkGreenhouse(false, false);
    }

    previousTime5s = millis();
  }

  // A cada hora lê a estufa e manda os dados ao servidor
  if ( millis() - previousTime30min >= 3600000 ) {
    DEBUG_PRINTLN("Hora de publicar 1Hr/true");
    // Envia os dados ao servidor e armazena
    checkGreenhouse(true, true);
    previousTime30min = millis();
  }

  // Keep-alive da comunicação com broker MQTT
  MQTT.loop(); // Callback será executada automaticamente no decorrer do loop
}

void manageLCD() {
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
      displayMsg = "Solo T:" + String(airTemperature) + "%";
      lcd.print(displayMsg);
    
      lcd.setCursor(11, 1);
      displayMsg = "U:" + String(soilMoisture) + "%";
      lcd.print(displayMsg);
      break;
    case 1:
      lcd.setCursor(0, 0);
      if (pumpState == HIGH) {
        displayMsg = F("Irrigacao: ON");
      } else {
        displayMsg = F("Irrigacao: OFF");
      }
      lcd.print(displayMsg);
      lcd.setCursor(0, 1);
      if (exaustingState == HIGH) {
        displayMsg = F("Exaustao: ON");
      } else {
        displayMsg = F("Exaustao: OFF");
      }
      lcd.print(displayMsg);
      break;
    case 2:
      lcd.setCursor(0, 0);
      if (!MQTT.connected()) {
        displayMsg = F("Sistema: OFFLINE");
      } else {
        displayMsg = F("Sistema: ONLINE");
      }
      lcd.print(displayMsg);
      lcd.setCursor(0, 1);
      if (automaticIrrigation) {
        displayMsg = F("IA: ON");
      } else {
        displayMsg = F("IA: OFF");
      }
      lcd.print(displayMsg);
      break;
  }
  lcdState++;
  // casos com a irrigacao manual/automatica
  // casos com fertuirrigacao

  if (lcdState == 3) {
    lcdState = 0;
  }
}

void checkGreenhouse(bool sendToServer, bool store) {
  DHT.read11(DHT11_PIN);
  airHumidity = round(DHT.humidity);
  airTemperature = round(DHT.temperature);
  //a proxima leitura vai ser a média da anterior com essa
  soilMoisture = map(analogRead(SOIL_SENSOR_PIN), 269, 632, 100, 0);
  //Agua: 305 Ar: 682

  // Normaliza a entrada do sensor
  if (soilMoisture > 100) {
    soilMoisture = 100;
  } else if (soilMoisture < 0) {
    soilMoisture = 0;
  }

  manageLCD();

  // Só analiza os sensores caso a irrigação automática esteja ligada
  if (automaticIrrigation == true) {
    if (soilMoisture < SOIL_MOISTURE_THRESHOLD) {
      setPumpState(HIGH);
    } else if (soilMoisture >= MINIMUM_OPTIMAL_MOISTURE || pumpState == LOW) {
      setPumpState(LOW);
    }
  } else {
    setPumpState(pumpState);
  }

  // Se for o momento do publicar
  if (sendToServer) {
    doc["soilMoisture"] = soilMoisture;
    doc["airTemp"] = airTemperature;
    doc["airHumidity"] = airHumidity;
    
    if (store) {
      doc["store"] = true;
    } else {
      doc["store"] = false;
    }
    size_t n = serializeJson(doc, buffer);
    MQTT.publish(TOPICO_ESTUFA, buffer, n);
  }
}

// Em breve colocar identificador da bomba
void setPumpState(int state) {
  if (state == HIGH) {
    // Relés ligados
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpState = HIGH;
    MQTT.publish(TOPICO_BOMBA, "PUMP_ON_OK");
  } else if (state == LOW) {
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

  Serial.println(msg);
  Serial.println(topicString);

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
      //msg = String(pumpState)+","+String(exaustingState)+","+String(automaticIrrigation);
      //MQTT.publish(TOPICO_ESTUFA, msg.toCharArray());
      //Serial.println("GET_ARDUINO_STATE");
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
  DEBUG_PRINTLN("(ETHERNET) Iniciando módulo ethernet.");

  // Configurações de endereço
  byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
  IPAddress ip(192, 168, 0, 177);

  Ethernet.init(10);
  Ethernet.begin(mac, ip);
  //DEBUG_PRINTLN(Ethernet.hardwareStatus());
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    DEBUG_PRINTLN("(ETHERNET) Chipset ethernet não encontrado.");
    // Does nothing
    for (;;) {
      ;
    }
  }

  // Print the ethernet gateway
  DEBUG_PRINT("(ETHERNET) Gateway IP: ");
  DEBUG_PRINTLN(Ethernet.gatewayIP());

  // Print your local IP address:
  DEBUG_PRINT("(ETHERNET) IP obtido: ");
  DEBUG_PRINTLN(Ethernet.localIP());

  // Print Ethernet OK
  DEBUG_PRINTLN("(ETHERNET) Ethernet carregado com sucesso.");
}

void connectMQTT() {
  while (!MQTT.connected()) {
    DEBUG_PRINT("(BROKER) Tentando se conectar ao Broker MQTT: ");
    DEBUG_PRINTLN(BROKER_MQTT);
    if (MQTT.connect(ID_MQTT)) {
      DEBUG_PRINTLN("(BROKER) Conectado com sucesso ao broker MQTT.");
      MQTT.subscribe(TOPICO_BOMBA);
      MQTT.subscribe(TOPICO_ESTUFA);
    } else {
      DEBUG_PRINTLN("(BROKER) Falha ao reconectar no broker.");
      DEBUG_PRINTLN("(BROKER) Haverá nova tentatica de conexao em 2s.");
      delay(1000);
    }
  }
}

void VerificaConexoes(void) {
  if (!MQTT.connected()) {
    connectMQTT(); //se não há conexão com o Broker, a conexão é refeita
  }
  if (Ethernet.linkStatus() == LinkOFF) {
    initEthernet(); // se a conexão ethernet caiu, reconecta
  }
}
