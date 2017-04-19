/*

 SmartCitizen API - Procressing.org basic example
 
 This example demonstrate how to do a basic call to the SmartCitizen API 
 to retrieve the latest data from one device. 
 
 For more info:
 http://developer.smartcitizen.me/#devices
 
 This code is under public domain.
 
 */

long lastUpdate = 0;

long updateInterval = 20;

String resourceURL = "http://data.smartcitizen.me/v0/devices/3325";


void setup() {
  getData();
}

void draw() {
  if (millis() - lastUpdate > (updateInterval*1000)) {
    getData();
    
  }
}

void getData() {

  JSONObject sckData = loadJSONObject(resourceURL);

  JSONObject data = sckData.getJSONObject("data");  // This contains your requested device info and data.

  String timeStamp = data.getString("recorded_at");

  JSONArray sensors = data.getJSONArray("sensors");             // You can get general device information from here

  JSONObject lightSensor = sensors.getJSONObject(0);     // You can get properties from an specific datapoint to do whatever you want.
  float light = lightSensor.getFloat("value");

  JSONObject humSensor = sensors.getJSONObject(2);     // You can get properties from an specific datapoint to do whatever you want.
  float hum = humSensor.getFloat("value");

  JSONObject tempSensor = sensors.getJSONObject(3);     // You can get properties from an specific datapoint to do whatever you want.
  float temp = tempSensor.getFloat("value");

  JSONObject no2Sensor = sensors.getJSONObject(4);     // You can get properties from an specific datapoint to do whatever you want.
  float no2 = no2Sensor.getFloat("value");

  JSONObject coSensor = sensors.getJSONObject(5);     // You can get properties from an specific datapoint to do whatever you want.
  float co = coSensor.getFloat("value");

  JSONObject noiseSensor = sensors.getJSONObject(7);     // You can get properties from an specific datapoint to do whatever you want.
  float noise = noiseSensor.getFloat("value");


  println("lastPost >> " + timeStamp + " @ Temp: " + temp + " ªC | " + hum + " % rel | " + co + " kOhm | " + no2 + " kOhm | " + light + " lux | "  + noise + " dB");


  lastUpdate = millis();
}