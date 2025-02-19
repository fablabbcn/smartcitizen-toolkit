#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include "Adafruit_ThinkInk.h"

#define EPD_DC D6
#define EPD_CS D7
#define EPD_BUSY D3  // can set to -1 to not use a pin (will wait a fixed delay)
#define SRAM_CS D5
#define EPD_RESET D4  // can set to -1 and share with microcontroller Reset!
#define EPD_SPI &SPI  // primary SPI
ThinkInk_213_Tricolor_Z16 display(EPD_DC, EPD_RESET, EPD_CS, SRAM_CS, EPD_BUSY, EPD_SPI);

// Replace with your network credentials
const char* ssid = "Iaac-Office-Wifi";
const char* password = "enteroffice2016";
const char* serverName = "https://api.smartcitizen.me/v0/devices/15812";
double temp;
double light;
double noise;
double humidity;
double pressure;
double eCO2;

void setup() {
  Serial.begin(115200);
  Serial.println();
  // Initialize Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println(WiFi.localIP());
  display.begin(THINKINK_TRICOLOR);
}

void loop() {

  WiFiClientSecure* client = new WiFiClientSecure;
  if (client) {
    // set secure client without certificate
    client->setInsecure();
    //create an HTTPClient instance
    HTTPClient https;
    //Initializing an HTTPS communication using the secure client
    //Serial.print("[HTTPS] begin...\n");
    if (https.begin(*client, serverName)) {  // HTTPS
      //Serial.print("[HTTPS] GET...\n");
      // start connection and send HTTP header
      int httpCode = https.GET();
      // httpCode will be negative on error
      if (httpCode > 0) {
        // HTTP header has been send and Server response header has been handled
        //Serial.printf("[HTTPS] GET... code: %d\n", httpCode);
        // file found at server
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
          // print server response payload
          String payload = https.getString();
          Serial.println(payload);
          JSONVar myObject = JSON.parse(payload);
          if (JSON.typeof(myObject) == "undefined") {
            Serial.println("Parsing input failed!");
          }
          //Serial.println(myObject["data"]["sensors"][0]["id"]);
          for (int i = 0; i < myObject["data"]["sensors"].length(); i++) {
            int data = myObject["data"]["sensors"][i]["id"];
            if (data == 14) {
              light = myObject["data"]["sensors"][i]["value"];
              Serial.print("Light=  ");
              Serial.println(light);
            } else if (data == 53) {
              noise = myObject["data"]["sensors"][i]["value"];
              Serial.print("Noise=  ");
              Serial.println(noise);
            } else if (data == 58) {
              pressure = myObject["data"]["sensors"][i]["value"];
              Serial.print("Pressure=  ");
              Serial.println(pressure);
            } else if (data == 56) {
              humidity = myObject["data"]["sensors"][i]["value"];
              Serial.print("Humidity=  ");
              Serial.println(humidity);
            } else if (data == 55) {
              temp = myObject["data"]["sensors"][i]["value"];
              Serial.print("Tempertature=  ");
              Serial.println(temp);
              Serial.println("Que buena esta la manteca colorá");
            } else if (data == 112) {
              eCO2 = myObject["data"]["sensors"][i]["value"];
              Serial.print("eCO2=  ");
              Serial.println(eCO2);
            }

          }
          draw();
          display.display();
          // temp = myObject["data"]["sensors"][0][1];
          // Serial.print("Temperature = ");
          // Serial.print(temp);
          // Serial.print("  Measured: ");
          // Serial.println(myObject["readings"][0][0]);
        }
      } else {
        
        //Serial.printf("[HTTPS] GET... failed, error: %s\n", https.errorToString(httpCode).c_str());
      }
      https.end();
    }
  } else {
    //Serial.printf("[HTTPS] Unable to connect\n");
  }
  delay(360000);
}
void draw() {
  display.clearBuffer();

  Serial.println("table printing...");
  display.clearBuffer();

  display.drawLine(0, 0, display.width(), 0, EPD_RED);
  display.drawLine(0, 30, display.width(), 30, EPD_RED);
  display.drawLine(0, 60, display.width(), 60, EPD_RED);
  display.drawLine(0, 90, display.width(), 90, EPD_RED);
  //display.drawLine(0,90,display.width(),90,EPD_RED);

  display.drawLine(display.width() / 2, 0, display.width() / 2, 90, EPD_RED);


  display.setTextSize(1);
  display.setCursor(5, 3);
  display.setTextColor(EPD_RED);
  display.print("Temperature:");
  display.setTextSize(2);
  display.setTextColor(EPD_BLACK);
  display.setCursor((display.width() / 2) - 60, 15);
  display.print(temp, 0);

  display.setTextSize(1);
  display.setCursor((display.width() / 2) + 5, 3);
  display.setTextColor(EPD_RED);
  display.print("Noise:");
  display.setTextSize(2);
  display.setTextColor(EPD_BLACK);
  display.setCursor(display.width() - 60, 15);
  display.print(noise, 0);

  display.setTextSize(1);
  display.setCursor(5, 33);
  display.setTextColor(EPD_RED);
  display.print("Humidity:");
  display.setTextSize(2);
  display.setCursor((display.width() / 2) - 60, 45);
  display.setTextColor(EPD_BLACK);
  display.print(humidity, 0);

  display.setTextSize(1);
  display.setCursor((display.width() / 2) + 5, 33);
  display.setTextColor(EPD_RED);
  display.print("Pressure:");
  display.setTextSize(2);
  display.setCursor(display.width() - 60, 45);
  display.setTextColor(EPD_BLACK);
  display.print(pressure, 0);

  display.setTextSize(1);
  display.setCursor((display.width() / 2) + 5, 63);
  display.setTextColor(EPD_RED);
  display.print("Light:  ");
  display.setTextSize(2);
  display.setCursor(display.width() - 60, 75);
  display.setTextColor(EPD_BLACK);
  display.print(light, 0);

  display.setTextSize(1);
  display.setCursor(5, 63);
  display.setTextColor(EPD_RED);
  display.print("eCO2:  ");
  display.setTextSize(2);
  display.setCursor((display.width() / 2) - 60, 75);
  display.setTextColor(EPD_BLACK);
  display.print(eCO2, 0);

  display.setTextSize(1);
  display.setCursor(3, 94);
  display.println("https://smartcitizen.me/kits/15812");


}
