import gab.opencv.*;
import processing.video.*;

SmartCitizen mySCK = new SmartCitizen(3509, "XEGwy6BsEybbz3BjYxemxfTQcHjAAJ1s3vJkemhdQ45Cq4hvBM7pNlrY48SUjCfai");

Capture cam;
OpenCV opencv;

int activity = 0;
int frames = 0;
long prevTime = 0;

void setup() {
  size(640, 360);

  String[] cameras = Capture.list();

  if (cameras.length == 0) {
    println("There are no cameras available for capture.");
    exit();
  } else {
    println("Available cameras:");
    for (int i = 0; i < cameras.length; i++) {
      println("[" + i + "] " + cameras[i]);
    }

    // The camera can be initialized directly using an 
    // element from the array returned by list():
    cam = new Capture(this, cameras[4]);
    cam.start();
  }  

  opencv = new OpenCV(this, 640, 360);

  opencv.startBackgroundSubtraction(5, 3, 0.5);
}

void draw() {
  if (cam.available() == true) {
    cam.read();

    image(cam, 0, 0);  

    opencv.loadImage(cam);

    opencv.updateBackground();

    opencv.dilate();
    opencv.erode();

    noFill();
    stroke(255, 0, 0);
    strokeWeight(3);


    for (Contour contour : opencv.findContours()) {
      activity++;
      contour.draw();
    }

    frames++;  

    if (millis() - prevTime > 10000) {
      prevTime = millis();
      activity = activity/frames;
      println(activity);
      mySCK.pushSimpleData("activity", activity);
      activity = 0;
      frames = 0;
    }
  }
}

void mousePressed() {
  opencv.startBackgroundSubtraction(5, 3, 0.5);
}