Making Sense Sensor Box
========================

The Making Sense Sensor Box is a low cost fully open source public display to generate interactions between citizens and data on the public space.

## Source

### Built

The `/built` folder contains the files for building the installation:

- `NoiseBox.blend` the whole installation design in blender

- `CableClip.stl` and `Hinge.stl` 3D printed parts for the cable clips and hinges used.

- `Acrylic.dxf` acrylic cover lasercut file.

- `noiseBoxSchematic.fzz` and `noiseBoxSchematic.pdf` the wiring diagram for the installation.

### Code

The `/code` folder contains the Arduino files to drive the installation. 

Reads sensor data from an SCK 1.5 over the I2C bus when a user presses the button display the result on a WS2811 addressable LED strip. This code was originally created to display reading from the noise sensor in dB but it can quickly be changed to support any other sensor. It runs on an Arduino UNO but any compatible board can be used. 

![Schematic](https://cdn.rawgit.com/fablabbcn/smartcitizen-toolkit/5fa275bc/public-displays/sensor-box/built/noiseBoxSchematic.png)

You will need to add this on the [latest SCK 1.5](https://github.com/fablabbcn/Smart-Citizen-Kit-15/releases/latest) firmware `SmartCitizenKit.ino` to send the data over I2C aux connector every 250 milliseconds:

```c++
  uint32_t publish_timer = millis();
  
  void loop() {
  
    base.update();
  
    if (millis() - publish_timer > 250 && base.mode == MODE_AP) {
  
      publish_timer = millis();
  
      char toSend[8];
      String noiseString = String(base.getReading(SENSOR_NOISE));
      
      noiseString.toCharArray(toSend, 8);
  
      Wire.beginTransmission(8);
        Wire.write(toSend);
        Wire.endTransmission();
  
    }
  }
  
  ```
  
  Install the dependencies using the Arduino Library Manager:
  
  - Adafruit NeoPixel
  - LinkedList



