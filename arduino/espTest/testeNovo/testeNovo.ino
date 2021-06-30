// -- This achieves ADC2 usability even when Wifi/Bluetooth are turned on!
//#include "dht.h"
#include "DHT.h"
#include <WiFi.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#define PIN 36 // Substitute xx with your ADC2 Pin number
int value;
  
// Debug
#define DEBUG
#ifdef DEBUG
#define DEBUG_PRINT(x)  Serial.print (x)
#define DEBUG_PRINTLN(x)  Serial.println (x)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#endif

#define SSID "Tupi"
#define PASSWORD "12345678"
WiFiClient espClient;

#define DHTTYPE DHT11
#define DHT11_PIN 32
DHT dht(DHT11_PIN, DHTTYPE);
//dht DHT;

//LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);
short lcdState = 0;

PubSubClient MQTT(espClient);
#define BROKER_MQTT "broker.hivemq.com"
#define BROKER_PORT 1883
#define TOPICO_ESTUFA "tupi/agro/estufa"
#define TOPICO_BOMBA "tupi/agro/bomba"
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao"
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

short soilMoisture = 0;
short airHumidity = 0;
short airTemperature = 0;
boolean mqttStatus = false;
char buffer[130];

void setup() {
  Serial.begin(115200);

  // Config LCD
  lcd.init();
  lcd.setBacklight(HIGH);
  lcd.setCursor(0, 0);
  lcd.print(F("Tupi Agro"));
  lcd.setCursor(0, 1);
  lcd.print(F("Inicializando..."));

  initWifi();
  initMQTT();
  connectMQTT();
  dht.begin();

  lcd.setCursor(0, 1);
  lcd.print(F("Sistema Online"));
  delay(100);
}

void loop() {
  checkCommunication();
  lcd.clear();
  String displayMsg = "";

  soilMoisture = map(analogRead(PIN), 1456, 2249, 100, 0);

  airHumidity = round(dht.readHumidity());
  airTemperature = round(dht.readTemperature());

  lcd.setCursor(0, 0);
  displayMsg = "Ar T:" + String(airTemperature) + "C";
  lcd.print(displayMsg);

  lcd.setCursor(9, 0);
  displayMsg = "U:" + String(airHumidity) + "%";
  lcd.print(displayMsg);

  lcd.setCursor(0, 1);
  displayMsg = "Solo U:" + String(soilMoisture) + "%";
  lcd.print(displayMsg);

  lcd.setCursor(10, 1);
  displayMsg = "U:" + String((analogRead(PIN) / 4095) * 3.3) + "%";
  lcd.print(displayMsg);

  MQTT.publish(TOPICO_ESTUFA, "sss");
  //MQTT.publish(TOPICO_ESTUFA, buffer, n);
  
  MQTT.loop(); // Callback será executada automaticamente no decorrer do loopdelay(1000);
  delay(1000);
}

/*
    Atributos do Wifi
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
   Atributos do MQTT
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
        mqttStatus = true;
        MQTT.subscribe(TOPICO_BOMBA);
        MQTT.subscribe(TOPICO_ESTUFA);
        DEBUG_PRINTLN("(MQTT) Conexão OK.");
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

void checkCommunication(void) {
  if (!MQTT.connected()) {
    mqttStatus = false;
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

  DEBUG_PRINT("(MQTT) ");
  DEBUG_PRINTLN(msg);

  String topicString = String(topic);
}
