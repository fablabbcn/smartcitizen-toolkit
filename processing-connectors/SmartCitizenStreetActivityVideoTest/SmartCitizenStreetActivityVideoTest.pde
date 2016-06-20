import gab.opencv.*;
import processing.video.*;

SmartCitizen mySCK = new SmartCitizen(3470, "XEGwy6BsEybbz3BjYxemxfTQcHjAAJ1s3vJkemhdQ45Cq4hvBM7pNlrY48SUjCfai");

Movie video;
OpenCV opencv;

int activity = 0;
int frames = 0;
long prevTime = 0;

void setup() {
  size(720, 480);
  video = new Movie(this, "street.mov");
  opencv = new OpenCV(this, 720, 480);
  
  opencv.startBackgroundSubtraction(5, 3, 0.5);
  
  video.loop();
  video.play();
}

void draw() {
  image(video, 0, 0);  
  opencv.loadImage(video);
  
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
  
  if (millis() - prevTime > 10000){
    prevTime = millis();
    activity = activity/frames;
    println(activity);
    mySCK.pushSimpleData("activity", 2);
    activity = 0;
    frames = 0;
  }
  
}

void movieEvent(Movie m) {
  m.read();
}