io.connect('wss://smartcitizen.xyz').on('data-received', function(device) {
  if (device.data.id == 4304) {
    
    var noise = device.data.data.sensors.filter(function(sensor) {
      // ID 29 is the noise microphone      
      // https://api.smartcitizen.me/v0/sensors/29
      return sensor.id === 29; 
    })[0].raw_value;

    $('.block .status').text(tellMe(noise));
    $('.block .data').text(noise + " dB");
    $('.block .datetime').text(moment(device.data.data.last_reading_at).fromNow());
    $('.block .name a').text(device.data.name);
    $('.block .name a').attr("href", "https://smartcitizen.me/kits/" + device.data.id);

    setInterval(function() {
      $('.block .datetime').text(moment(device.data.data.last_reading_at).fromNow());
    }, 1000);

  }
});

function tellMe(value) {
  
  var scales = [
  {
    "speak": "This sounds like the weakest sound heard",
    "value": 0
  },
  {
    "speak": "This sounds like a whisper in a quiet library at",
    "value": 30
  },
  {
    "speak": "This sounds like a normal conversation",
    "value": 65
  },
  {
    "speak": "This sounds like a telephone dial tone",
    "value": 80
  },
  {
    "speak": "This sounds like a city traffic inside a car",
    "value": 85
  },
  {
    "speak": "This sounds like a  truck traffic",
    "value": 90
  },
  {
    "speak": "This sounds like a jackhammer",
    "value": 95
  },
  {
    "speak": "This sounds like a subway train",
    "value": 95
  },
  {
    "speak": "This sounds like a hand drill",
    "value": 98
  },
  {
    "speak": "This sounds like a power mower",
    "value": 107
  },
  {
    "speak": "This sounds like a snowmobile motorcycle",
    "value": 100
  },
  {
    "speak": "This sounds like a loud rock concert",
    "value": 115
  },
  {
    "speak": "This sounds like a pneumatic riveter",
    "value": 125
  },
  {
    "speak": "This sounds like a jet engine",
    "value": 140
  },
  {
    "speak": "This sounds like a shotgun blast",
    "value": 165
  },
  {
    "speak": "This sounds like the loudest sound possible",
    "value": 194
  }
];
  
  var scale = scales.find(function(scale) {
    return value < scale.value;
  });

  return scale.speak;
}