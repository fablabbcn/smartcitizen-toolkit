/*
  MSNoiseBox.ino
  _   _       _          
 | \ | | ___ (_)___  ___ 
 |  \| |/ _ \| / __|/ _ \
 | |\  | (_) | \__ \  __/
 |_|_\_|\___/|_|___/\___|
 | __ )  _____  __       
 |  _ \ / _ \ \/ /       
 | |_) | (_) >  <        
 |____/ \___/_/\_\       
                       

  The Smart Citizen Team, 2017
  victor@smartcitizen.me

  Reads sensor data from an SCK 1.5 over the I2C bus
  when a user presses the button display the result on
  a WS2811 addressable LED strip.

  This code was originally created to display reading from
  the noise sensor in dB but it can quickly be changed to
  support any other sensor. It runs on an Arduino UNO but 
  any compatible board can be used.

  You will need to add this on the latest SCK 1.5 firmware 
  SmartCitizenKit.ino to send the data over I2C aux connector 
  every 250 milliseconds:
  
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


  Install the dependencies using the Arduino Library Manager:

  - Adafruit NeoPixel
  - LinkedList
  
*/

#include <Adafruit_NeoPixel.h>
#include <LinkedList.h>
#include <Wire.h>

#define debug

#define TOTAL_LEDS      199		// (600 leds controlled thre by three) We loose the first three!
#define LED_PIN         6

#define BUTTON_PIN      2
#define BUTTON_LED_PIN	3

// Noise

const uint8_t   secondsToShow		= 4;		// seconds to show average before returning to breathing mode
const uint8_t   secondsToStore		= secondsToShow + 2;
const uint16_t  readingRate			= 150;    	// miliseconds
const uint8_t   readingsPerSecond 	= 1000/readingRate;		// readingRate;
const uint16_t	readingsToStore		= readingsPerSecond * secondsToStore;
LinkedList<uint8_t> soundReadings;
bool distortedReadings = false;

// Button
volatile bool changed = false;
bool oldState = HIGH;
float pressTime = millis();
float timeSinceLast = 0;
uint32_t buttonLedTimer = 0;
float buttonDir;
float buttonLight;
uint8_t blinking = 1;
bool stayOn = true;

// I2C feedback
bool internalLedState = false;

// Leds
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(TOTAL_LEDS, LED_PIN, NEO_GRB + NEO_KHZ400);
uint8_t pos = 0;
bool breathing = false;
bool averaging = false;
bool firstTime = true;
uint32_t returnBreath = 0;

// Color definitions
uint32_t AVGcolor	= strip.Color(255, 50, 0);		// ~~Orange 
uint32_t bgColor	= strip.Color(20, 0, 20);		// dimmed Violet

uint32_t breathingColor = strip.Color(0, 0, 50);

								// Red, blue, green
uint32_t red		= strip.Color(255, 0, 0);
uint32_t green		= strip.Color(3, 3, 235);
uint32_t yellow 	= strip.Color(180, 0, 180);
uint32_t orange 	= strip.Color(255, 0, 80);

uint32_t bg = strip.Color(0, 0, 15);
uint32_t fg = strip.Color(0, 3, 30);


// Leds are breathing with some fixed animation to get poeple attention...
// button press: we turn to a background fixed color (smoothly) and the AVGcolor grows from the box to outside and keeps fluctuating with the avg reading.
// after secondsToShow the leds smoothly turn again to the breathing animation...
// In the backgroud we are gone show dB levels with some leds with diferent colo or brigghtnees level


void setup() {

	// Receiving data from kit
	Wire.begin(8);                		// join i2c bus with address #8
	Wire.setClock(100000);

  	Wire.onReceive(receiveNoise); 		// register event
  	pinMode(LED_BUILTIN, OUTPUT);   	// I2C feedback
  
  	// Button
  	pinMode(BUTTON_PIN, INPUT_PULLUP);
  	pinMode(BUTTON_LED_PIN, OUTPUT);
  	digitalWrite(BUTTON_LED_PIN, HIGH);
  	attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), ISR_button, CHANGE);


  	// Leds
  	strip.begin();
  	strip.show(); // Initialize all pixels to 'off'

  	led_showStartLevels();		// Show 35 and 70 dB levels.
  	
  	#ifdef debug
  		Serial.begin(115200);
  		// while (!Serial) {}
  	#endif
}

void loop() {

	// Button Stuff
	if (changed) {
		timeSinceLast = millis() - pressTime;
		changeButton();
	}
	if (millis() - buttonLedTimer > 20) {
		buttonLedTimer = millis();
		buttonLedUpdate();
	}

	if (millis() % 10 == 0) {
		if (breathing) breathingLed();
		else if (averaging && !firstTime) drawAVG();
	}

	if (millis() - returnBreath > 8000) {
		returnBreath = millis();
		breathing = true;
		averaging = false;
	}


}

void drawAVG() {
	uint8_t avvv = map(getAvgNoise(), 25, 90, 1, 100);

	for (uint16_t i=0; i<TOTAL_LEDS; i++){
		strip.setPixelColor(i, bgColor);
		strip.setPixelColor((TOTAL_LEDS-2)- i, bgColor);
	}
	for (uint16_t i=0; i<avvv; i++){
		strip.setPixelColor(i, AVGcolor);
		strip.setPixelColor((TOTAL_LEDS-2)- i, AVGcolor);
	}
	strip.show();
}

// NOISE
void receiveNoise() {

	// First we get the reading
	char noise[8];
	
	for (int i = 0; i < 8; ++i) {
		if (Wire.available()) {
			byte c = Wire.read();
			noise[i] = c;
		} else {
			break;
		}
	}

	uint8_t instantNoise = atoi(noise);

	if (instantNoise > 0 && instantNoise < 150) {

		// Arduino led feedback (heartbeat)
		internalLedState = !internalLedState;
		digitalWrite(LED_BUILTIN, internalLedState);

		#ifdef debug
			// Serial.println(instantNoise);
		#endif

		// Check if button has been pressed recently 
		if (distortedReadings) {
			// If so, remove the last stored and don't record this one reading
			if (soundReadings.size() >= 1)soundReadings.remove(0);
			distortedReadings = false;
		} else {
			// Pop last reading if we need space
			if (soundReadings.size() >= readingsToStore) soundReadings.pop();
			soundReadings.unshift(instantNoise);
		}

		#ifdef debug
			// Serial.print("total: ");
			// Serial.print(soundReadings.size());
			// Serial.print("avg: ");
			// Serial.println(getAvgNoise());
		#endif
	}
}

int getMaxNoise() {
	int max = 0;
	for (uint8_t i=0; i<soundReadings.size(); i++) {
		if (soundReadings.get(i) > max) max = soundReadings.get(i);
	}
	return max;
}

int getAvgNoise() {
	int total = 0;
	for (uint8_t i=0; i<soundReadings.size(); i++) {
		// Serial.println(soundReadings.get(i));
		total += soundReadings.get(i);
	}
	return total / soundReadings.size();
}

// BUTTON
void pressed() {

	if (breathing) {
		returnBreath = millis();
		averaging = true;
		breathing = false;
	} else if (firstTime) {
		breathing = true;
		firstTime = false;
		averaging = false;
	} 

	#ifdef debug
		Serial.println("pressed");
	#endif

	distortedReadings = true;

}

void released() {
}

void ISR_button() {

	changed = true;
}

void changeButton() {

	stayOn = false;

	analogWrite(BUTTON_LED_PIN, 255);
	blinking = 70;
	buttonDir = 10;

	bool state = digitalRead(BUTTON_PIN);

  	// Debouncing
	if (state != oldState && timeSinceLast > 20) {
		if (state == LOW) pressed();
		else released();
		pressTime = millis();
		oldState = state;
	}

	changed = false;
}

void buttonLedUpdate() {

	if (!stayOn) {

		if (blinking > 0) {
			buttonLight = 255 * ((blinking / 10) % 2);
			blinking = blinking -1;
		} else {
			// Sine breathing
			buttonDir += 0.05;
			if (buttonDir >= 6.283) buttonDir = 0;
			buttonLight = sin(buttonDir) * 127.5 + 127.5;
		}

		if (!digitalRead(BUTTON_PIN)) buttonLight = 255;

		analogWrite(BUTTON_LED_PIN, buttonLight);
	}
}

// ------------- Led functions

// Shows 35 dB and 70 dB levels as reference
void led_showStartLevels() {

	// map(value, fromLow, fromHigh, toLow, toHigh)

	int measure35 	= map(35, 25, 90, 1, 100);
	int measure70 	= map(70, 25, 90, 1, 100);

	colorWipe2(red, 20, 100);
	delay(500);
	colorWipe2(orange, 20, measure70);
	delay(500);
	colorWipe2(green, 20, measure35);
}

void colorWipe(uint32_t c, uint8_t wait) {
	for (uint16_t i=0; i<TOTAL_LEDS/2; i++) {
	    strip.setPixelColor(i, c);
	    strip.setPixelColor((TOTAL_LEDS-1) - i, c);
	    strip.show();
	    delay(wait);
	}
}

void colorWipe2(uint32_t c, uint8_t wait, int ledNum) {

	for (uint16_t i=0; i<ledNum; i++) {
	    strip.setPixelColor(i, c);
	    strip.setPixelColor((TOTAL_LEDS-2) - i, c);
	    strip.show();
	    delay(wait);
	}
}

void breathingLed () {


	uint8_t numberWorms = 8;

	for (uint8_t i=0; i<numberWorms; i++) {
		
		uint8_t origin = (pos+(i*TOTAL_LEDS/numberWorms)) % TOTAL_LEDS;

		strip.setPixelColor(origin, fg);
		strip.setPixelColor(origin-1, bg);	
	}
	
	strip.show();
	pos++;
	if (pos > TOTAL_LEDS) pos = 0;
}

void startBreathing() {

	breathing = true;
  	instantFill(bg);
}

void instantFill(uint32_t myColor) {
	for (uint16_t i=0; i<TOTAL_LEDS; i++){
		strip.setPixelColor(i, myColor);
	}
	strip.show();
}

void instantLevel(uint32_t myColor, uint8_t level) {
	for (uint16_t i=0; i<level; i++){
		strip.setPixelColor(i, myColor);
	}
	strip.show();
}
