update();

setInterval(function() {
  update();
}, 30000);

function update() {
  $.getJSON("https://api.smartcitizen.me/v0/devices/3411", function(smartcitizen) {
    var noise = smartcitizen.data.sensors.filter(function(sensor) {
      return sensor.unit === "dB";
    })[0];
    $('div').html(Math.round(noise.value).toFixed(1) + " " + noise.unit);
  });
}