import java.io.*;
import java.net.*;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLPeerUnverifiedException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;


class SmartCitizen { 
  String myAuthToken; 
  int myDeviceID;

  SmartCitizen (int deviceID, String authToken) {  
    myAuthToken = authToken;
    myDeviceID = deviceID;
  }

  String getNowUTCString () {
    Date now = new Date();
    DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
    dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
    return dateFormat.format(now);
  }

  JSONObject createSensorObject (String sensorID, int sensorValue) {
    JSONObject sensor = new JSONObject();
    sensor.setString("id", sensorID);
    sensor.setInt("value", sensorValue);
    return sensor;
  }

  JSONArray createSingleReadingObject (JSONObject sensorData, String time) {
    JSONArray sensors = new JSONArray();
    sensors.setJSONObject(0, sensorData);
    JSONObject block = new JSONObject();
    block.setJSONArray("sensors", sensors);
    block.setString("recorded_at", time);
    JSONArray blocks = new JSONArray();
    blocks.setJSONObject(0, block);
    return blocks;
  }

  JSONObject createDataPayload (JSONArray Readings) {
    JSONObject data = new JSONObject();
    data.setJSONArray("data", Readings);
    return data;
  }

  String makeURL () {
    return "https://api.smartcitizen.me/v0/devices/" + myDeviceID + "/readings?access_token=" + myAuthToken;
  }


  void pushSimpleData(String sensorID, int sensorValue) {
    println("# SmartCitize API:");

    StringBuilder response = new StringBuilder();

    JSONObject data = createDataPayload(createSingleReadingObject(createSensorObject(sensorID, sensorValue), getNowUTCString()));

    try {
      URL url = new URL(makeURL());
      try {
        HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
        try {
          connection.setRequestMethod("POST"); //use post method
          connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
          connection.setRequestProperty("Accept", "application/json");
          connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11");
          connection.setDoOutput(true); //we will send stuff
          OutputStreamWriter wr = new OutputStreamWriter(connection.getOutputStream());
          wr.write(data.toString()); 
          wr.flush();
          wr.close();
        }  
        catch (IOException e) {
          println(e);
        }
        int status = connection.getResponseCode();
        InputStream in;
        if (status >= 400)
          in = connection.getErrorStream();
        else
          in = connection.getInputStream();
        BufferedReader rd = null;
        try {
          rd = new BufferedReader(new InputStreamReader(in));
          String responseSingle = null;
          while ((responseSingle = rd.readLine()) != null) {
            response.append(responseSingle);
          }

          JSONObject apiResponse = JSONObject.parse(response.toString());

          String message = apiResponse.getString("message", "No message");

          if (status >= 400) {
            println(" > Error (" + status + "): " + message);
          } else {
            println(" > " + message);
          }
        }  
        catch (IOException e) {
          println(" > Error: " + e);
        }
      }  
      catch (IOException e) {
        println(" > Error: " + e);
      }
    }  
    catch (IOException e) {
      println(" > Error: " + e);
    }
  }
} 