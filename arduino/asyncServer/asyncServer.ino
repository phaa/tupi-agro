#include "WiFi.h"
#include <AsyncTCP.h>
#include "ESPAsyncWebServer.h"
#include "AsyncJson.h"
#include "ArduinoJson.h"
#include "dht.h"
#include <LiquidCrystal_I2C.h>

#define PUMP_RELAY_PIN 5
#define EXAUST_RELAY_PIN 18
#define SOIL_SENSOR_PIN 34
#define SOIL_WET 1456
#define SOIL_DRY 2249
#define DHT11_PIN 19
#define SOIL_MOISTURE_THRESHOLD 30 // Nível mínimo aceitável de umidade 30% 
#define MINIMUM_OPTIMAL_MOISTURE 80 // Nível máximo aceitável de umidade 80% 
#define AIR_TEMPERATURE_THRESHOLD 30 // Temperatura máxima aceitável do ar 
#define OPTIMAL_AIR_TEMPERATURE 28 // Temperatura ideal do ar

// Debug
//#define DEBUG
#ifdef DEBUG
#define DEBUG_PRINT(x)  Serial.print (x)
#define DEBUG_PRINTLN(x)  Serial.println (x)
#else
#define DEBUG_PRINT(x)
#define DEBUG_PRINTLN(x)
#endif

const char* ssid = "Tupi";
const char* password =  "12345678";

AsyncWebServer server(80);
dht DHT;
LiquidCrystal_I2C lcd(0x27, 16, 2);
short lcdState = 0;

// Estado da irrigação
byte pumpState = LOW;
byte exaustingState = LOW;
byte fertirrigationState = LOW;
bool automaticIrrigation = true;
bool automaticExausting = true;
bool automaticFertirrigation = true;

// Contador de tempo
unsigned long counter1s = 0;
unsigned long counter2s = 0;

// Medições do ambiente
short airHumidity = 0;
short airTemperature = 0;
short soilMoisture = 0;

void setup() {
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(EXAUST_RELAY_PIN, OUTPUT);

  lcd.init();
  lcd.setBacklight(HIGH);
  lcdPrint(0, 0, "Tupi Agro");
  lcdPrint(0, 1, "Inicializando...");

  #ifdef DEBUG
    Serial.begin(115200);
  #endif

  WiFi.begin(ssid, password);

  DEBUG_PRINTLN("Conectando ao WiFi..");
  lcdPrint(0, 1, "Conectando WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    DEBUG_PRINT(".");
  }
  DEBUG_PRINTLN("");

  DEBUG_PRINTLN(WiFi.localIP());
  DEBUG_PRINTLN(WiFi.macAddress());

  server.on("/greenhouse", HTTP_GET, [](AsyncWebServerRequest * request) {
    AsyncResponseStream *response = request->beginResponseStream("application/json");
    /*
      DynamicJsonDocument greenhouseStats(1024);

      greenhouseStats["pumpState"] = pumpState;
      greenhouseStats["automaticIrrigation"] = automaticIrrigation;
      greenhouseStats["exaustingState"] = exaustingState;
      greenhouseStats["automaticExausting"] = automaticExausting;
      greenhouseStats["fertirrigationState"] = fertirrigationState;
      greenhouseStats["automaticFertirrigation"] = automaticFertirrigation;
      greenhouseStats["airHumidity"] = airHumidity;
      greenhouseStats["airTemperature"] = airTemperature;
      greenhouseStats["soilMoisture"] = soilMoisture;

      serializeJson(greenhouseStats, *response);
    */
    serializeGreenhouseStats(response);
    DEBUG_PRINTLN(ESP.getFreeHeap());
    request->send(response);
  });

  server.on("/command", HTTP_GET, [](AsyncWebServerRequest * request) {
    AsyncResponseStream *response = request->beginResponseStream("application/json");
    //AsyncWebParameter* p = request->getParam("download");
    //p->name().c_str() p->value().c_str();

    short err = 0;

    if (request->hasParam("pump")) {
      String pumpParam = request->getParam("pump")->value();

      if (automaticIrrigation == LOW) {
        err++;
      } else {
        pumpState = (pumpParam.toInt()) ? HIGH : LOW;
        DEBUG_PRINT("Bomba: ");
        DEBUG_PRINTLN(pumpState);
      }
    }

    if (request->hasParam("exaust")) {
      String exaustParam = request->getParam("exaust")->value();

      if (automaticExausting == LOW) {
        err++;
      } else {
        exaustingState = (exaustParam.toInt()) ? HIGH : LOW;
        DEBUG_PRINT("Exaustão: ");
        DEBUG_PRINTLN(exaustingState);
      }
    }

    if (request->hasParam("fertirrigation")) {
      String fertirrigationParam = request->getParam("fertirrigation")->value();

      if (automaticExausting == LOW) {
        err++;
      } else {
        fertirrigationState = (fertirrigationParam.toInt()) ? HIGH : LOW;
        DEBUG_PRINT("Fertirrigação: ");
        DEBUG_PRINTLN(fertirrigationState);
      }
    }

    if (request->hasParam("automaticIrrigation")) {
      String iaParam = request->getParam("automaticIrrigation")->value();
      automaticIrrigation = (iaParam.toInt()) ? true : false;
      DEBUG_PRINT("IA: ");
      DEBUG_PRINTLN(automaticIrrigation);
    }

    if (request->hasParam("automaticExausting")) {
      String iaParam = request->getParam("automaticExausting")->value();
      automaticExausting = (iaParam.toInt()) ? true : false;
      DEBUG_PRINT("EA: ");
      DEBUG_PRINTLN(automaticExausting);
    }

    if (request->hasParam("automaticFertirrigation")) {
      String iaParam = request->getParam("automaticFertirrigation")->value();
      automaticFertirrigation = (iaParam.toInt()) ? true : false;
      DEBUG_PRINT("FA: ");
      DEBUG_PRINTLN(automaticFertirrigation);
    }

    // if err > 0 { denyChange() }

    if(err > 0) {
      DynamicJsonDocument status(30);

      status["error"] = "forbidden";

      serializeJson(status, *response);
    } else {
      serializeGreenhouseStats(response);
    }

    
    request->send(response);
  });

  // CORS
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  server.begin();

  // Mensagem LCD
  lcdPrint(0, 1, "Sistema Online");
}

void serializeGreenhouseStats(AsyncResponseStream *response) {
  DynamicJsonDocument greenhouseStats(1024);
  greenhouseStats["pumpState"] = pumpState;
  greenhouseStats["automaticIrrigation"] = automaticIrrigation;
  greenhouseStats["exaustingState"] = exaustingState;
  greenhouseStats["automaticExausting"] = automaticExausting;
  greenhouseStats["fertirrigationState"] = fertirrigationState;
  greenhouseStats["automaticFertirrigation"] = automaticFertirrigation;
  greenhouseStats["airHumidity"] = airHumidity;
  greenhouseStats["airTemperature"] = airTemperature;
  greenhouseStats["soilMoisture"] = soilMoisture;
  serializeJson(greenhouseStats, *response);
}

void loop() {
  if ( millis() - counter1s >= 1000 ) {
    checkGreenhouse();
    digitalWrite(PUMP_RELAY_PIN, pumpState);
    digitalWrite(EXAUST_RELAY_PIN, exaustingState);
    counter1s = millis();
  }
  
  if ( millis() - counter2s >= 3000 ) {
    refreshLCD();
    counter2s = millis();
  }
} 

// Add ia
void checkGreenhouse() {
  soilMoisture = map(analogRead(SOIL_SENSOR_PIN), SOIL_WET, SOIL_DRY, 100, 0);
  DHT.read11(DHT11_PIN);
  airHumidity = round(DHT.humidity);
  airTemperature = round(DHT.temperature);

  // Normaliza a entrada do sensor
  if (soilMoisture > 100) {
    soilMoisture = 100;
  }
  else if (soilMoisture < 0) {
    soilMoisture = 0;
  }

  // if automatic          obs: fertirrigationState
  /*
  if (automaticIrrigation) {
    // Gerencia a irrigação
    if (soilMoisture < SOIL_MOISTURE_THRESHOLD) {
      pumpState = HIGH;
    }
    else if (soilMoisture >= MINIMUM_OPTIMAL_MOISTURE || pumpState == LOW) {
      pumpState = LOW;
    }
  }

  if (automaticExausting) {
    // Gerencia a exaustão
    if (airTemperature > AIR_TEMPERATURE_THRESHOLD) {
      exaustingState = HIGH;
    }
    else if (airTemperature <= OPTIMAL_AIR_TEMPERATURE || exaustingState == LOW) {
      exaustingState = LOW;
    }
  }*/

}

void lcdPrint(short cursor, short line, String msg) {
  lcd.setCursor(cursor, line);
  lcd.print(msg);
}

void refreshLCD() {
  lcd.clear();
  // passar display message para as globais
  String displayMsg = "";
  //lcdState = 1;
  switch (lcdState) {
    case 0: {
        displayMsg = "Ar T:" + String(airTemperature) + "C";
        lcdPrint(0, 0, displayMsg);

        displayMsg = "U:" + String(airHumidity) + "%";
        lcdPrint(9, 0, displayMsg);

        //displayMsg = "Solo:" + String(soilMoisture) + "%";
        displayMsg = "Solo:" + String(analogRead(SOIL_SENSOR_PIN)) + "%";
        lcdPrint(0, 1, displayMsg);

        float voltage = analogRead(SOIL_SENSOR_PIN) * (3.3 / 4095.0);
        displayMsg = "V:" + String(voltage) + "";
        //lcdPrint(10, 1, displayMsg);
      } break;
    case 1:
      displayMsg = (pumpState) ? F("Irrigacao: ON") : F("Irrigacao: OFF");
      lcdPrint(0, 0, displayMsg);

      displayMsg = (exaustingState) ? F("Exaustao: ON") : F("Exaustao: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
    case 2:
      //displayMsg = (automaticIrrigation) ? F("Irrigacao A: ON") : F("Irrigacao A: OFF");
      displayMsg = "IP:" + IpAddressToString(WiFi.localIP());
      lcdPrint(0, 0, displayMsg);
      displayMsg = "Sinal: " + String(WiFi.RSSI()) + "dbm";
      //displayMsg = (automaticExausting) ? F("Exaustao A: ON") : F("Exaustao A: OFF");
      lcdPrint(0, 1, displayMsg);
      break;
  }

  lcdState = (lcdState == 2) ? 0 : lcdState + 1;
}

String IpAddressToString(const IPAddress& ipAddress)
{
    return String(ipAddress[0]) + String(".") +
           String(ipAddress[1]) + String(".") +
           String(ipAddress[2]) + String(".") +
           String(ipAddress[3]);
}
