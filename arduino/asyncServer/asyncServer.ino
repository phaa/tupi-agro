#include "WiFi.h"
#include <AsyncTCP.h>
#include "ESPAsyncWebServer.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include <EEPROM.h>
#include <LiquidCrystal_I2C.h>

#define PUMP_RELAY_PIN 5
#define EXAUST_RELAY_PIN 18
#define SECTIONS_COUNT 6

// Debug
#define DEBUG
#ifdef DEBUG
  #define DEBUG_PRINT(x)  Serial.print (x)
  #define DEBUG_PRINTLN(x)  Serial.println (x)
#else
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#endif

// Web
const char* ssid = "Tupi";
const char* password =  "12345678";
AsyncWebServer server(80);

// LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);
byte lcdState = 0;

// Estado da irrigação
//byte pumpState;
//byte exaustingState;
//byte fertirrigationState;
bool automaticIrrigation = false;
bool automaticExausting = false;
bool automaticFertirrigation = false;

// Controle de seções de irrigação ativas
//byte sections[SECTIONS_COUNT];

// Contador de tempo
unsigned long counter1s = 0;
unsigned long counter2s = 0;

void setup() 
{
  // Se debug estiver on, ativa serial
  #ifdef DEBUG
    Serial.begin(115200);
  #endif
  
  setupPins();

  // Buscar dados da armazenagem
  initPreferences();
  
  // Inicialização do LCD
  lcd.init();
  lcd.setBacklight(HIGH);
  lcdPrint(0, 0, "Tupi Agro");
  lcdPrint(0, 1, "Inicializando...");

  initWifi();

  initServer();

  // Mensagem LCD
  lcdPrint(0, 1, "Sistema Online");
}

void loop() 
{
  if ( millis() - counter1s >= 1000 ) 
  {
    digitalWrite(PUMP_RELAY_PIN, pumpState);
    digitalWrite(EXAUST_RELAY_PIN, exaustingState);
    counter1s = millis();
    // Seta o estado da bomba de acordo com a disponibilidade no arrayde sections
  }
  
  if ( millis() - counter2s >= 3000 ) 
  {
    refreshLCD();
    counter2s = millis();
  }
} 

void setupPins() 
{
  // Configuração dos relés
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(EXAUST_RELAY_PIN, OUTPUT);
}

void initPreferences() 
{
  EEPROM.begin(SECTIONS_COUNT);
  
  DEBUG_PRINTLN("Lendo seções na memória...");
  
  for (int addressIndex = 0; addressIndex < (SECTIONS_COUNT - 1); addressIndex++) 
  {
    //sections[addressIndex] = EEPROM.read(addressIndex);
    DEBUG_PRINT("Seção: ");
    DEBUG_PRINT(addressIndex);
    DEBUG_PRINT(" Valor: ");
    DEBUG_PRINTLN(EEPROM.read(addressIndex));
    //DEBUG_PRINTLN(sections[addressIndex]);
  }
}

void initServer() 
{
  // Configuração das rotas do servidor
  server.on("/check", HTTP_GET, [](AsyncWebServerRequest * request) 
  {
    DEBUG_PRINT(request->client()->remoteIP());
    DEBUG_PRINTLN(" solicitou uma checagem.");
    request->send(200, "text/plain", "Módulo ESP32 ok!");
  });

  server.on("/restart", HTTP_GET, [](AsyncWebServerRequest * request) 
  {
    request->send(200, "text/plain", "Reiniciando módulo...");
    ESP.restart();
  });
  
  server.on("/irrigationstatus", HTTP_GET, [](AsyncWebServerRequest * request) 
  {
    AsyncResponseStream *response = request->beginResponseStream("application/json");
    
    DynamicJsonDocument doc(1024);
    JsonObject greenhouseStats = doc.to<JsonObject>();
    //greenhouseStats["pumpState"] = pumpState;
    //greenhouseStats["automaticIrrigation"] = automaticIrrigation;
    //greenhouseStats["exaustingState"] = exaustingState;
    greenhouseStats["automaticExausting"] = automaticExausting;
    greenhouseStats["fertirrigationState"] = fertirrigationState;
    greenhouseStats["automaticFertirrigation"] = automaticFertirrigation;

    JsonArray sectionsJSON = greenhouseStats.createNestedArray("sections");
    for (int addressIndex = 0; addressIndex < (SECTIONS_COUNT - 1); addressIndex++) 
    {
      sectionsJSON.add(EEPROM.read(addressIndex));
    }
    
    serializeJson(greenhouseStats, *response);
    DEBUG_PRINT(request->client()->remoteIP());
    DEBUG_PRINTLN(" solicitou dados.");
    request->send(response);
  });

  server.on("/command", HTTP_GET, [](AsyncWebServerRequest * request) 
  {
    //AsyncResponseStream *response = request->beginResponseStream("application/json");
    preferences.begin("bomba", false);
    
    if (request->hasParam("automaticIrrigation")) 
    {
      String iaParam = request->getParam("automaticIrrigation")->value();
      automaticIrrigation = (iaParam.toInt()) ? true : false;
      preferences.putBool("ai", automaticIrrigation);
      
      DEBUG_PRINT("IA: ");
      DEBUG_PRINTLN(automaticIrrigation);
    }

    if (request->hasParam("automaticExausting")) 
    {
      String iaParam = request->getParam("automaticExausting")->value();
      automaticExausting = (iaParam.toInt()) ? true : false;
      preferences.putBool("ae", automaticExausting);
      
      DEBUG_PRINT("EA: ");
      DEBUG_PRINTLN(automaticExausting);
    }

    if (request->hasParam("automaticFertirrigation")) 
    {
      String iaParam = request->getParam("automaticFertirrigation")->value();
      automaticFertirrigation = (iaParam.toInt()) ? true : false;
      preferences.putBool("af", automaticFertirrigation);
      
      DEBUG_PRINT("FA: ");
      DEBUG_PRINTLN(automaticFertirrigation);
    }

    /*

    if (request->hasParam("exaust")) {
      String exaustParam = request->getParam("exaust")->value();
      exaustingState = (exaustParam.toInt()) ? HIGH : LOW;
      preferences.putInt("es", exaustingState);
      
      DEBUG_PRINT("Exaustão: ");
      DEBUG_PRINTLN(exaustingState);
    }

    if (request->hasParam("fertirrigation")) {
      String fertirrigationParam = request->getParam("fertirrigation")->value();
      fertirrigationState = (fertirrigationParam.toInt()) ? HIGH : LOW;
      preferences.putInt("fs", fertirrigationState);
      
      DEBUG_PRINT("Fertirrigação: ");
      DEBUG_PRINTLN(fertirrigationState);
    }
    */

    DEBUG_PRINT(request->client()->remoteIP());
    preferences.end();
    DEBUG_PRINTLN(" solicitou mudança de estado.");
    request->send(200, "text/plain", "ok");
  });

  server.on("/togglesection", HTTP_GET, [](AsyncWebServerRequest * request) 
  {
    if (request->hasParam("pump") && request->hasParam("section")) 
    {
      int sectionParam = request->getParam("section")->value().toInt();
      int pumpParam = request->getParam("pump")->value().toInt();

      // Salva na memória EEPROM
      EEPROM.write(sectionParam, pumpParam);
      EEPROM.commit();
      
      DEBUG_PRINT("Seção (id, valor) ");
      DEBUG_PRINT(char_array);
      DEBUG_PRINT(" ");
      DEBUG_PRINTLN(pumpParam);
      //togglePump();
    }

    DEBUG_PRINT(request->client()->remoteIP());
    DEBUG_PRINT(" solicitou mudança na seção ");
    DEBUG_PRINTLN(sectionParam);
    request->send(200, "text/plain", "ok");
  });

  // Autoriza o CORS
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  server.begin();
}

void togglePump() 
{
  int pump = 0;
  
  for (int i = 0; i < sizeof sections/sizeof sections[0]; i++) 
  {
    pump = pump || sections[i];
  }

  DEBUG_PRINT("Valor da bomba: ");
  DEBUG_PRINTLN(pump);
  
  preferences.begin("bomba", false);
  preferences.putInt("ps", pump);
  preferences.end();
}

void initWifi() 
{
  DEBUG_PRINTLN("Conectando ao WiFi..");
  lcdPrint(0, 1, "Conectando WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(1000);
    DEBUG_PRINT(".");
  }
  DEBUG_PRINTLN("");
  DEBUG_PRINTLN(WiFi.localIP());
  DEBUG_PRINTLN(WiFi.macAddress());
}

void lcdPrint(short cursor, short line, String msg) 
{
  lcd.setCursor(cursor, line);
  lcd.print(msg);
}

void refreshLCD() 
{
  lcd.clear();
  // passar display message para as globais
  String displayMsg = "";
  //lcdState = 1;
  switch (lcdState) 
  {
    // Para poder declarar variavel dentro de um case, é necessário um bloco {}
    case 0:
      displayMsg = (pumpState) ? F("Irrigacao: ON") : F("Irrigacao: OFF");
      lcdPrint(0, 0, displayMsg);

      displayMsg = (exaustingState) ? F("Exaustao: ON") : F("Exaustao: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
    case 1:
      //displayMsg = (automaticIrrigation) ? F("Irrigacao A: ON") : F("Irrigacao A: OFF");
      displayMsg = "IP:" + IpAddressToString(WiFi.localIP());
      lcdPrint(0, 0, displayMsg);
      displayMsg = "Sinal: " + String(WiFi.RSSI()) + "dbm";
      //displayMsg = (automaticExausting) ? F("Exaustao A: ON") : F("Exaustao A: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
    
    // Adicionar cases que mostram os estados de cada seção
  }

  // lcdState tem que ser igual igual ao ultimo caso
  lcdState = (lcdState == 1) ? 0 : lcdState + 1;
}

String IpAddressToString(const IPAddress& ipAddress)
{
    return String(ipAddress[0]) + String(".") +
           String(ipAddress[1]) + String(".") +
           String(ipAddress[2]) + String(".") +
           String(ipAddress[3]);
}
