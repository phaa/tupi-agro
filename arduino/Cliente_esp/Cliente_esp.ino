#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include "dht.h"

// Debug
#define DEBUG
#ifdef DEBUG
#define DEBUG_PRINT(x)  Serial.print (x)
#define DEBUG_PRINTLN(x)  Serial.println (x)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#endif

// Pinos de periféricos
# define PUMP_RELAY_PIN 4
#define SOIL_SENSOR_PIN 34
#define SOIL_WET 1456
#define SOIL_DRY 2249
#define DHT11_PIN 19

// Wifi
#define SSID "Tupi"
#define PASSWORD "12345678"

// MQTT
#define BROKER_MQTT "broker.hivemq.com"
#define BROKER_PORT 1883 
#define TOPICO_ESTUFA "tupi/agro/estufa" 
#define TOPICO_BOMBA "tupi/agro/bomba"
#define TOPICO_FERTIRRIGACAO "tupi/agro/fertirrigacao" 
#define ID_MQTT "TupiAgro_01" //id mqtt (para identificação de sessão)

// Objetos de controle
dht DHT; 
WiFiClient espClient;
PubSubClient MQTT(espClient);
StaticJsonDocument<66> mqttJsonPayload;
StaticJsonDocument<66> bootPayload;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Estado da irrigação
byte pumpState = LOW;
byte exaustingState = LOW;
byte fertirrigationState = LOW;

// Status da comunicação
bool mqttStatus = false;
char buffer[130];

// Medições do ambiente
short airHumidity = 0;
short airTemperature = 0;
short soilMoisture = 0;

// Para cada n variações do lcd
short lcdState = 0;

// Contador de tempo
unsigned long counter1s = 0;
unsigned long counter10s = 0;
unsigned long counter1h = 0;

void setup() {
  #ifdef DEBUG
  Serial.begin(115200);
  #endif

  // Inicia LCD
  lcd.init();
  lcd.setBacklight(HIGH);

  // Informa inicialização do sistema
  lcdPrint(0, 0, "Tupi Agro");
  lcdPrint(0, 1, "Inicializando");

  // Executa configurações do sistema
  initPins();
  initWifi();
  initMQTT();
  connectMQTT();

  // boot();
  /*
   * lê os sensores da estufa
   * manda as informações para o servidor
   * servidor processa esses dados dos sensores 
   * decide o que deve estar ligado ou não
   * envia ao arduino
   * sincroniza o arduino com o servidor
   * arduino continua trabalhando sincronizado com o servidor
   */

  lcdPrint(0, 1, "Sistema Online");
  delay(2000);
}

void loop() {
  // Antes de proceder com as operações, verifica as comunicações
  checkCommunication();
  checkInputs();

  if ( millis() - counter1s >= 1500 ) {
    refreshLCD();
    counter1s = millis();
  }

  if ( millis() - counter10s >= 10000 ) {
    DEBUG_PRINTLN("Verificação de 10s");
    checkGreenhouse(false);
    counter10s = millis();
  }

  if ( millis() - counter1h >= 3600000 ) {
    DEBUG_PRINTLN("Verificação 1h");
    checkGreenhouse(true);
    counter1h = millis();
  }

  // Keep-alive da comunicação com broker MQTT
  MQTT.loop();
}
