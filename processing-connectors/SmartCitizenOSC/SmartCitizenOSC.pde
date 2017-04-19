/*

 SmartCitizen API - Procressing.org basic example
 
 This example demonstrate how to do a basic call to the SmartCitizen API 
 to retrieve the latest data from one device and send it over OSC to later 
 use it on OSC compatible tools like: Pure Data, Max MSP, Live, VVVV, Grasshopper...
 
 For more info:
 http://developer.smartcitizen.me/#devices
 
 This code is under public domain.
 
 */

import oscP5.*;
import netP5.*;

OscP5 oscP5;
NetAddress myRemoteLocation;

long lastUpdate = 0;

long updateInterval = 20;

String resourceURL = "http://data.smartcitizen.me/v0/devices/3325";


void setup() {

  /* start oscP5, listening for incoming messages at port 7474 */
  oscP5 = new OscP5(this, 7474);

  /* myRemoteLocation is a NetAddress. a NetAddress takes 2 parameters,
   * an ip address and a port number. myRemoteLocation is used as parameter in
   * oscP5.send() when sending osc packets to another computer, device, 
   * application. usage see below. for testing purposes the listening port
   * and the port of the remote location address are the same, hence you will
   * send messages back to this sketch.
   */
  myRemoteLocation = new NetAddress("127.0.0.1", 7474); 


  println(">> SmartCitizen API Query URL: " + resourceURL);
  println(">> Starting data poll...");

  getDataAndOSC();
}

void draw() {
  if (millis() - lastUpdate > (updateInterval*1000)) {
    getDataAndOSC();
    
  }
}

void getDataAndOSC() {

  JSONObject sckData = loadJSONObject(resourceURL);

  //println("sckData "+sckData);

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


  /*  osc messages for Max msp */
  OscMessage myMessage = new OscMessage("/smartcitizen");
  myMessage.add((float)temp);
  myMessage.add((float)hum);
  myMessage.add((float)co);
  myMessage.add((float)no2);
  myMessage.add((float)light);
  myMessage.add((float)noise);
  /* send the message */
  oscP5.send(myMessage, myRemoteLocation);

  lastUpdate = millis();
}