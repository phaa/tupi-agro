#include "dht.h"
#include "WiFiEsp.h"

// Config Sensor solo
# define SOIL_SENSOR A0
# define SOIL_MOISTURE_THRESHOLD 50 // Nível mínimo aceitável de umidade  
# define MINIMUM_OPTIMAL_MOISTURE 90
 
// Configs DHT11
# define PINO_DHT11 A1
dht DHT; //VARIÁVEL DO TIPO DHT

// Config LEDs indicativos
#define SOILPIN_G 6
#define SOILPIN_Y 5
#define SOILPIN_R 3
#define PUMPPIN_G 7
#define PUMPPIN_R 2

// Pensar no estado dela em caso de falta de energia
# define PUMP_RELAY 10
int pumpState = LOW;

// Configs WiFi 
#ifndef HAVE_HWSERIAL1
#include "SoftwareSerial.h"
SoftwareSerial Serial1(8, 9); // RX, TX
#endif

char ssid[] = "Tupi";            // SSID 
char pass[] = "12345678";        // senha
int status = WL_IDLE_STATUS;     // Status do wifi
char server[] = "192.168.0.131";
short port = 80;

unsigned long lastConnectionTime = 0;         // Última conexão com o servidor
const unsigned long postingInterval = 2000L; // Tempo entre as requisições em milisegundos

// Inicia o cliente ESP
WiFiEspClient client;


// MQTT
#define TOPICO_SUBSCRIBE "MQTTFilipeFlopEnvia"     //tópico MQTT de escuta
#define TOPICO_PUBLISH   "MQTTFilipeFlopRecebe"    //tópico MQTT de envio de informações para Broker
                                                   //IMPORTANTE: recomendamos fortemente alterar os nomes
                                                   //            desses tópicos. Caso contrário, há grandes
                                                   //            chances de você controlar e monitorar o NodeMCU
                                                   //            de outra pessoa.
#define ID_MQTT  "HomeAutd"     //id mqtt (para identificação de sessão)


const char* BROKER_MQTT = "iot.eclipse.org"; //URL do broker MQTT que se deseja utilizar
int BROKER_PORT = 1883; // Porta do Broker MQTT

//Inicia o cliente MQTT
PubSubClient MQTT(client);

void setup() {
  Serial.begin(9600);
  Serial.println("Teste sensores");

  // Pino da bomba
  pinMode(PUMP_RELAY, OUTPUT);

  // Configura o pinos dos leds como saídas
  pinMode(SOILPIN_G, OUTPUT);
  pinMode(SOILPIN_Y, OUTPUT);
  pinMode(SOILPIN_R, OUTPUT);
  pinMode(PUMPPIN_G, OUTPUT);
  pinMode(PUMPPIN_R, OUTPUT);

  initWifi();
  printWifiStatus();
}

void loop() {
  // Leitura do sensor DHT11
  DHT.read11(PINO_DHT11);
  int h = DHT.humidity;
  int t = DHT.temperature;

  // Faz a leitura do sensor de umidade do solo
  int soilMoisture = analogRead(SOIL_SENSOR);
  soilMoisture = map(soilMoisture, 0, 870, 0, 100);
  //soilMoisture = map(soilMoisture, 310, 600, 100, 0);
  
  // Evitar valores fora do itervalo ~3%
  if (soilMoisture > 100) {
    soilMoisture = 100;
  } else if (soilMoisture < 0) {
    soilMoisture = 0;
  }

  // Quando voltar a energia, se a umidade estiver baixa, mantém a bomba ligada do mesmo jeito
  if (soilMoisture < SOIL_MOISTURE_THRESHOLD) {
    // Relés ligados
    digitalWrite(PUMP_RELAY, HIGH);
    digitalWrite(PUMPPIN_G, HIGH);
    digitalWrite(PUMPPIN_R, LOW);
    pumpState = HIGH;
  } else if (soilMoisture >= MINIMUM_OPTIMAL_MOISTURE || pumpState == LOW) {
    // Se a umidade não estiver abaixo, mostra que bomba está desligada, por isso a variável
    // Relés desligados
    digitalWrite(PUMP_RELAY, LOW);
    digitalWrite(PUMPPIN_G, LOW);
    digitalWrite(PUMPPIN_R, HIGH);
    pumpState = LOW;
  }

  Serial.print(F("Umidade: "));
  Serial.print(h);
  Serial.print(F(" %t "));
  Serial.print(F("Temperatura: "));
  Serial.print(t);
  Serial.print(F(" *C "));
  Serial.print(F("Umidade do solo: "));
  Serial.print(soilMoisture);
  Serial.println(F(" *%"));

  // Timer para novas requests
  if (millis() - lastConnectionTime > postingInterval) {
    httpRequest(soilMoisture, h, t);
    //Serial.println(F("REQUISIÇÃO!!!"));
    lastConnectionTime = millis();
  }
  
  delay(1000);
}

// Esse método cria uma conexão HTTP com o servidor
void httpRequest(int soilMoisture, float airHumidity, float airTemp)
{
  Serial.println();
  
  // close any connection before send a new request
  // this will free the socket on the WiFi shield
  client.stop();

  // if there's a successful connection
  if (client.connect(server, port)) {
    //Serial.println("Conectando...");

    String jsonString = "{ \"soilMoisture\": \"" + String(soilMoisture) + 
    "\", \"airTemp\": \"" + String(airTemp) + 
    "\", \"airHumidity\": \"" + String(airHumidity) + "\" }";

    String PostHeader = "POST http://192.168.0.131:80/api/store_data HTTP/1.1\r\n";
    PostHeader += "Connection: keep-alive\r\n";
    PostHeader += "Content-Type: application/json; charset=utf-8\r\n";
    PostHeader += "Host: 192.168.0.131:80\r\n";
    PostHeader += "Content-Length: " + String(jsonString.length()) + "\r\n\r\n";
    PostHeader += jsonString;

    // Debug
    Serial.println(PostHeader);
    
    // send the HTTP PUT request
    client.println(PostHeader);

    // note the time that the connection was made
    lastConnectionTime = millis();
    client.stop();
  }
  else {
    // if you couldn't make a connection
    Serial.println("Connection failed");
  }
}

void initWifi() {
  // Inicia a comunicação com o ESP
  Serial1.begin(9600);
  // Inicia o módulo ESP
  WiFi.init(&Serial1);

  // Checa a presença do módulo ESP-01
  if (WiFi.status() == WL_NO_SHIELD) {
    Serial.println("Módulo ESP não encontrado");
    // Não continua
    while (true);
  }

  // Tenta a conexão WiFi
  while ( status != WL_CONNECTED) {
    Serial.print("Tentando conectar à rede WPA SSID: ");
    Serial.println(ssid);
    // Connect to WPA/WPA2 network
    status = WiFi.begin(ssid, pass);
    delay(500);
  }
  Serial.print("Conectado!");
}



void initMQTT() {
  
}
