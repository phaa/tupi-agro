//Programa: Comandos AT com ESP8266
//Guia do Usuario do ESP8266
 
#include <SoftwareSerial.h>
 
//RX pino 2, TX pino 3
/*
 * Adaptador      Arduino
 *    RX      ->   3(TX)
 *    TX      ->   2(RX)
 */
SoftwareSerial esp8266(2, 3);
 
#define DEBUG true
 
void setup()
{
  Serial.begin(9600);
  esp8266.begin(9600); // baud rate padrão do ESP8266
  Serial.println("** Verificando conexão **");
  Serial.println();
  delay(1000);
  sendData("AT\r\n", 2000, DEBUG);
  delay(1000);
  Serial.println("** Versão de firmware **");
  Serial.println();
  delay(1000);
  sendData("AT+GMR\r\n", 2000, DEBUG); // rst
  Serial.println();
  Serial.println("** Final **");
}
 
void loop() {}
 
String sendData(String command, const int timeout, boolean debug)
{
  // Envio dos comandos AT para o modulo
  String response = "";
  esp8266.print(command);
  long int time = millis();
  while ( (time + timeout) > millis())
  {
    while (esp8266.available())
    {
      // The esp has data so display its output to the serial window
      char c = esp8266.read(); // read the next character.
      response += c;
    }
  }
  if (debug)
  {
    Serial.println(response);
  }
  return response;
}
