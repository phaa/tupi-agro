// Include necessários para a comunicação
#include <WiFi.h>
#include <SocketIOclient.h>
//#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// Includes dos periféricos
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "dht.h"

// Debug
#define DEBUG
#ifdef DEBUG
  #define DEBUG_PRINT(x)  Serial.print (x)
  #define DEBUG_PRINTLN(x)  Serial.println (x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
  #define DEBUG_PRINTF(x)
  #define DEBUG_PRINTF(x, y, z)
#endif

// Pinos de periféricos
# define PUMP_RELAY_PIN 4
#define SOIL_SENSOR_PIN 34
#define SOIL_WET 1456
#define SOIL_DRY 2249
#define DHT11_PIN 19

// Comunicação
#define SSID "Tupi"
#define PASSWORD "12345678"
#define SOCKET_ADDR "192.168.0.131"
#define SOCKET_PORT 80

// Objetos de controle
SocketIOclient socketIO;
LiquidCrystal_I2C lcd(0x27, 16, 2);
DynamicJsonDocument doc(256);
JsonArray wrapper;
JsonObject greenhouseStats;
dht DHT;

// Estado da irrigação
byte pumpState = LOW;
byte exaustingState = LOW;
byte fertirrigationState = LOW;

// Medições do ambiente
short airHumidity = 0;
short airTemperature = 0;
short soilMoisture = 0;

// Status da comunicação
bool socketStatus = false;

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

  // Configura os documentos json
  wrapper = doc.to<JsonArray>();
  wrapper.add("fooEvent");
  greenhouseStats = wrapper.createNestedObject();

  // Executa configurações do sistema
  initPins();
  initWifi();
  initSocketIO();

  
  /*
   * lê os sensores da estufa
   * manda as informações para o servidor
   * servidor processa esses dados dos sensores 
   * decide o que deve estar ligado ou não
   * envia ao arduino
   * sincroniza o arduino com o servidor
   * arduino continua trabalhando sincronizado com o servidor
   */

  lcdPrint(0, 1, "Sistema Pronto");
  delay(2000);
}

void loop() {
  // Keep alive da comunicação com o socket
  socketIO.loop();

  // Antes de proceder com as operações, verifica as comunicações
  checkCommunication();
  checkInputs();

  if ( millis() - counter1s >= 1200 ) {
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
}
