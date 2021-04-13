#include "dht.h"
#include <WiFi.h>
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
#define SOIL_SENSOR_PIN 35
#define SOIL_MOISTURE_THRESHOLD 50 // Nível mínimo aceitável de umidade 30% 
#define MINIMUM_OPTIMAL_MOISTURE 70

// Configs DHT11
# define DHT11_PIN 34
dht DHT; 

#define SSID "Tupi"
#define PASSWORD "12345678"
WiFiClient espClient;

// Pensar no estado dela em caso de falta de energia
// Relés
# define PUMP_RELAY_PIN 16

// MQTT
PubSubClient MQTT(espClient);
StaticJsonDocument<33> doc;
StaticJsonDocument<33> doc2;
char buffer[65];
#define BROKER_MQTT "broker.hivemq.com"
#define BROKER_PORT 1883 
#define TOPICO_ESTUFA "tupi/agro/estufa" 
#define TOPICO_BOMBA "tupi/agro/bomba"
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao" 
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

//LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);
short lcdState = 0;

// Variáveis de controle
byte pumpState = LOW;
byte exaustingState = LOW;
bool automaticIrrigation = true;
bool realTimeAnalysis = true;
bool mqttStatus = false;
short airHumidity = 0;
short airTemperature = 0;
short soilMoisture = 0;

// Auxiliar para o contador
unsigned long previousTime2s = 0;
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
  //Serial.println("Acabou pinos");
  // Métodos auxiliares
  initWifi();
  initMQTT();
  connectMQTT();
  //Serial.println("Conectou");

  lcd.setCursor(0, 1);
  lcd.print(F("Sistema Online"));
}

void loop() {
  // Antes de fazer qualquer coisa verifica o status da conexão
  checkCommunication();

  if ( millis() - previousTime2s >= 2000 ) {
    if (realTimeAnalysis) {
      // Monitoramento em tempo real ligado
      DEBUG_PRINTLN("Hora de publicar 5s/true");
      checkGreenhouse(true, false);
    } else {
      // Monitoramento desligado
      DEBUG_PRINTLN("Hora de publicar 5s/false");
      checkGreenhouse(false, false);
    }
    refreshLCD();
    previousTime2s = millis();
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
