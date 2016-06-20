# SmartCitizen Examples for the Raspberry Pi
# 
# http://smartcitizen.me
# 
# Trigger 2 LEDs depending on the temperature
# For more information on the LEDs connection check: https://learn.sparkfun.com/tutorials/raspberry-gpio
# For more information on the SmartCitizen API check: http://developer.smartcitizen.me
#

import RPi.GPIO as GPIO
import json, requests, time

GPIO.setup(18, GPIO.OUT)
GPIO.setup(23, GPIO.OUT)

while True:
	r = requests.get('https://api.smartcitizen.me/v0/devices/3292') 
	data = json.loads(r.text)
	for sensor in data['data']['sensors']:
		if sensor['description'] == 'Temperature': #CO, NO2...
			print sensor['value']
			if sensor['value'] > 25:
				print 'LED ON'
				GPIO.output(18, GPIO.HIGH)
				GPIO.output(23, GPIO.LOW)
			else:
				print 'LED OFF'
				GPIO.output(18, GPIO.LOW)
				GPIO.output(23, GPIO.HIGH)
	time.sleep(15) #Update every 15 seconds