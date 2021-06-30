//#include <LiquidCrystal_I2C.h>
#include "DHT.h"

// set the LCD number of columns and rows
int lcdColumns = 16;
int lcdRows = 2;
boolean relay = false;
// set LCD address, number of columns and rows
// if you don't know your display address, run an I2C scanner sketch
//LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);  

#define DHTTYPE DHT11
#define DHT11_PIN 21
#define SOIL_PIN 34
DHT dht(DHT11_PIN, DHTTYPE);

void setup(){
  Serial.begin(115200);
  pinMode(4, OUTPUT);
  // initialize LCD
  //lcd.init();
  // turn on LCD backlight                      
  //lcd.backlight();
  dht.begin();
}

void loop(){
  digitalWrite(4, HIGH);
  // set cursor to first column, first row
  //lcd.setCursor(0, 0);
  // print message
  short umidade = analogRead(SOIL_PIN);
  float airHumidity = dht.readHumidity();
  float airTemperature = dht.readTemperature();
  //short airHumidity = round(dht.readHumidity());
  //short airTemperature = round(dht.readTemperature());
  Serial.print("Umidade ar: ");
  Serial.println(airHumidity);
  Serial.print("Temperatura ar: ");
  Serial.println(airTemperature);
  //lcd.print("U: ");
  //lcd.setCursor(3,0);
  //lcd.print(airHumidity);
  // set cursor to first column, second row
  //lcd.setCursor(0,1);
  //lcd.print("Umidade: ");
  umidade = map(umidade, 1456, 2249, 100, 0);
  Serial.print("Umidade solo: ");
  Serial.println(umidade);
  //lcd.setCursor(9,1);
  //lcd.print(umidade);
  delay(1000);
  digitalWrite(4, LOW);
  delay(1000);
  //lcd.clear(); 
}
